from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

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

PRODUCTS_FILE = 'products.json'


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
    return {"message": "Self-Check Kiosk Server is Running!"}

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