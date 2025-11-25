from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from datetime import datetime
import uuid
from pydantic import BaseModel

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name = "static")

PRODUCTS_FILE = 'products.json'
LOG_FILE_PATH = os.path.join("static", "logs.json")


class LogRequest(BaseModel) :
    target_barcode: str
    consent_agreed: bool
    scanned_id_info: str

def get_product_from_db(barcode: str) :
    '''
    바코드에 부합하는 상품 정보를 return 하는 함수
    '''
    # 있으면 데이터, 없으면 None 반환

    if not os.path.exists(PRODUCTS_FILE):
        return None
    
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get(barcode)
    

# =======================
# API 엔드포인트 (기능 구현)
# =======================    

@app.get("/")
def read_root():
    return FileResponse("templates/index.html")

@app.get("/product/{barcode}")
def scan_product(barcode: str):
    print(f"🔎 [요청 받음] 바코드 조회: {barcode}")

    product = get_product_from_db(barcode)

    if product:
        print(f"✅ [성공] 상품 찾음: {product['name']}")
        return {
            "status": "success",
            "data": product
        }
    else:
        print(f"❌ [실패] 상품 없음")
        return {
            "status": "fail",
            "message": "등록되지 않은 상품입니다."
        }
    
# =======================
# 로그 저장 API 엔드포인트 (POST /log)
# =======================    
@app.post("/log")
async def save_log(log_data: LogRequest):
    """
    프론트엔드에서 인증 완료 정보(주류 바코드, 동의 여부, 신분증 정보)를 받아 
    logs.json 파일에 저장 (DB 없음)
    """
    print(f"📝 [로그 저장 요청] 바코드: {log_data.target_barcode}, 신분증ID: {log_data.scanned_id_info}")

    try:
        # 저장할 최종 로그 데이터 생성 (서버 측 정보 추가)
        final_log_entry = {
            "log_id": str(uuid.uuid4()),                     # 고유 ID 생성
            "timestamp": datetime.now().isoformat(),         # 현재 시간 기록
            "target_barcode": log_data.target_barcode,       # 요청받은 주류 바코드
            "consent_agreed": log_data.consent_agreed,       # 요청받은 동의 여부
            "scanned_id_info": log_data.scanned_id_info      # 저장할 신분증 정보
        }

        # 기존 logs.json 파일 읽기
        logs = []
        if os.path.exists(LOG_FILE_PATH):
            try:
                with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
                    file_content = f.read()
                    # 파일이 비어있지 않으면 로드
                    if file_content.strip():
                        logs = json.loads(file_content)
            except json.JSONDecodeError:
                # 파일이 깨져있거나 비어있으면 빈 리스트로 시작
                print("⚠️ logs.json 파일이 비어있거나 깨져있어 새로 작성합니다.")
                logs = []
        
        # 새 로그 추가
        logs.append(final_log_entry)

        # 파일에 다시 쓰기
        with open(LOG_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)

        print(f"✅ [로그 저장 성공] ID: {final_log_entry['log_id']}")
        return {"status": "success", "message": "Log saved", "log_id": final_log_entry["log_id"]}

    except Exception as e:
        print(f"❌ [로그 저장 실패] 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save log: {str(e)}")