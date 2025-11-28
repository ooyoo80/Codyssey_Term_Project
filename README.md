# Self-Check Kiosk
> **웹캠을 이용한 바코드 스캔과 미성년자 주류 구매 방지를 위한 성인 인증과 법적 책임 동 프로세스가 탑재된 기반 셀프 계산대 시스템입니다.**

## 📋 프로젝트 소개

**Self-Check Kiosk**는 주류 판매 시 직원이 겪는 고객과의 실랑이와 막대한 법적 책임 리스크를 해소하는 데 집중합니다. 
기존 셀프 계산대는 주류 구매 시 직원의 신분 확인이 필수로 요구되어, 직원은 위조 신분증 식별에 대한 부담, 미성년자 판매 시의 법적 책임 등의 위험을 떠안아야 했습니다. 이 과정에서 고객과의 마찰도 빈번합니다. 
또한, 최근 매장 직원의 업무가 '매장 관리' 중심으로 변화함에 따라, 직원의 개입이 필요한 성인 인증 절차는 업무 효율을 저해하는 주된 요인입니다. 

본 프로젝트는 기존 결제 시스템에서의 직원의 어려움과 고충을 해결하고 변화하는 업무 환경에 맞춰 효율성을 극대화하고자 합니다. 
일본의 선진 성인 인증 자동화 시스템을 벤치마킹하여 국내 환경에서의 적용을 시뮬레이션 하는 것을 목표로 하여, 직원의 개입과 법적 리스크를 최소화하고 안전하고 완전한 **비대면 셀프 결제 경험**을 제시합니다.

## ✨ 주요 기능

### 1. 📷 바코드 스캔 기능
* **실시간 바코드 인식**: 웹캠을 통한 실시간 바코드 스캔
* **상품 정보 조회**: 스캔한 바코드를 통해 상품 정보를 서버에서 조회

### 2. 🛒 장바구니 관리 기능
* **상품 추가/제거**: 스캔한 상품을 장바구니에 추가하고 수량 조절
* **실시간 총액 계산**: 장바구니에 담긴 상품의 총액을 실시간으로 계산
* **주류 상품 안내**: 주류 상품 스캔 시 안내 메시지 표시

### 3. 🆔 주류 구매 신분증 인증 기능
* **성인 인증 팝업**: 주류가 포함된 경우 만 19세 이상 확인 팝업 표시
* **법적 책임 안내**: 주류 구매 시 법적 책임에 대한 안내
* **신분증 바코드 스캔**: 신분증 뒷면 바코드를 스캔하여 인증
* **인증 로그 저장**: 주류 구매 시 인증 정보를 로그로 저장

### 4. 💳 결제 기능
* **결제 확인 팝업**: 최종 결제 전 구매 목록 확인
* **주류 구매 로그 저장**: 주류 구매 시 신분증 정보와 함께 로그 저장
* **결제 완료 처리**: 결제 완료 후 장바구니 초기화

## 🛠 기술 스택

### Frontend
* **HTML5/CSS3/JavaScript**: Vanilla JS (프레임워크 없이 순수 JavaScript 사용)
* **Quagga2**: 바코드 스캐너 라이브러리
* **HTTP Server**: Python http.server (개발용 정적 파일 서빙)

### Backend
* **FastAPI**: 고성능 Python 웹 프레임워크
* **Python 3.13.7**: 백엔드 개발 언어
* **Uvicorn**: ASGI 서버
* **Pydantic**: 데이터 검증 및 설정 관리

### Data Storage
* **JSON 파일**: 상품 정보(products.json) 및 로그(logs.json) 저장
* **파일 기반 저장**: 데이터베이스 없이 JSON 파일로 데이터 관리

### Architecture
* **Frontend-Backend Separation**: 프론트엔드와 백엔드 완전 분리
* **REST API**: RESTful API 통신
* **CORS**: Cross-Origin Resource Sharing 지원

## 🚀 빠른 시작

### 사전 요구사항

* Python 3.13.7 이상
* pip (Python 패키지 관리자)

### 설치 및 실행

1. **프로젝트 클론**

```bash
git clone https://github.com/ooyoo80/Codyssey_Term_Project.git
cd Codyssey_Term_Project
```

2. **서비스 실행**

프로젝트는 실행 스크립트를 통해 **자동으로 가상 환경 생성 및 의존성 설치**를 처리합니다.

**터미널 1 - 백엔드 서버 실행:**
```bash
./run-backend.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
```bash
#!/bin/bash
cd backend
python -m venv .venv              # 가상 환경 생성
source .venv/bin/activate         # 가상 환경 활성화
pip install -r requirements.txt   # 의존성 설치
uvicorn main:app --reload --port 8001  # 서버 실행
```

**터미널 2 - 프론트엔드 서버 실행:**
```bash
./run-frontend.sh
```

이 스크립트는 다음 작업을 수행합니다:
```bash
#!/bin/bash
# 프론트엔드 정적 파일 서빙 (개발용)
cd frontend
python -m http.server 8000
```

> **참고**: Windows 환경에서는 Git Bash나 WSL을 사용하거나, 스크립트 내용을 수동으로 실행하세요.

3. **서비스 접속**
* Frontend: http://localhost:8000/
* Backend API: http://localhost:8001/
* API Documentation: http://localhost:8001/docs

## 📁 프로젝트 구조

```
Codyssey_Term_Project/
├── backend/              # 백엔드 서버
│   ├── main.py          # FastAPI 애플리케이션
│   ├── products.json     # 상품 데이터
│   ├── logs.json        # 인증 로그
│   └── requirements.txt # Python 의존성
├── frontend/            # 프론트엔드
│   ├── index.html       # 메인 HTML
│   └── static/         # 정적 파일
│       ├── index.css    # 스타일시트
│       └── index.js     # JavaScript
├── docs/                # 문서
│   ├── ERD.mmd         # ERD 다이어그램
│   └── Sequence_Diagram.mmd  # 시퀀스 다이어그램
├── run-backend.sh       # 백엔드 실행 스크립트
├── run-frontend.sh      # 프론트엔드 실행 스크립트
└── README.md           # 프로젝트 문서
```


## 📱 사용 방법

### 1. 상품 스캔 및 장바구니 추가

1. 웹캠을 통해 상품 바코드를 스캔합니다
2. 스캔한 상품 정보가 자동으로 조회되어 장바구니에 추가됩니다
3. 주류 상품인 경우 안내 메시지가 표시됩니다
4. 장바구니에서 수량을 조절할 수 있습니다

### 2. 주류 구매 시 신분증 인증

1. 주류가 포함된 장바구니에서 "결제하기" 버튼을 클릭합니다
2. 만 19세 이상 확인 팝업에서 "예"를 선택합니다
3. 법적 책임 안내 팝업에서 동의합니다
4. 신분증 뒷면 바코드를 웹캠에 비춥니다
5. 인증이 완료되면 결제 확인 팝업이 표시됩니다

### 3. 결제 완료

1. 결제 확인 팝업에서 구매 목록을 확인합니다
2. "결제" 버튼을 클릭하여 결제를 완료합니다
3. 주류 구매 시 인증 정보가 로그로 저장됩니다
4. 결제 완료 후 장바구니가 초기화됩니다

## 🎨 와이어프레임 및 프로토타입

![와이어프레임](docs/Figma_final.png)

## 📊 시퀀스 다이어그램

![시퀀스 다이어그램](docs/SequenceDiagram_final.png)

## 🗂️ ERD (Entity Relationship Diagram)

![ERD](docs/ERDiagram_final.png)


## 📋 API 문서

### 주요 엔드포인트

#### 상품 조회
* GET /product/{barcode} - 바코드로 상품 정보 조회
  * Response: { "status": "success", "data": { "name": "...", "price": ..., "isAlcohol": ... } }

#### 로그 저장
* POST /log - 주류 구매 인증 로그 저장
  * Request Body: { "target_barcode": "...", "consent_agreed": true, "scanned_id_info": "..." }
  * Response: { "status": "success", "message": "Log saved", "log_id": "..." }

자세한 API 문서는 서버 실행 후 `http://localhost:8001/docs`에서 확인할 수 있습니다.


## 🏗 시스템 아키텍처

```
Self-Check Kiosk 시스템 구조

📱 프론트엔드 (Vanilla JS)
├── 바코드 스캐너 (Quagga2)
├── 장바구니 관리
├── 신분증 인증 UI
└── 결제 확인 UI

⚙️ 백엔드 (FastAPI)
├── REST API (상품 조회, 로그 저장)
├── CORS 미들웨어
└── JSON 파일 기반 데이터 저장

📦 데이터 저장
├── products.json (상품 정보)
└── logs.json (주류 구매 인증 로그)
```


## 👥 팀

### 팀 '어른이'

코디세이 텀 프로젝트를 진행하는 팀입니다.

| 유채영 | 김시연 |
| :---: | :---: |
| <a href="https://github.com/ooyoo80"><img src="https://github.com/ooyoo80.png" width="100px" alt="유채영"></a> | <a href="https://github.com/si-yeon-12"><img src="https://github.com/si-yeon-12.png" width="100px" alt="김시연"></a> |
| **Project Lead & Full Stack Dev**<br>프로젝트 총괄 및 기획, FastAPI 백엔드 구축, 프론트엔드 핵심 로직(JS) 구현 | **UI/UX Designer & Frontend Dev**<br>UI/UX 와이어프레임 설계, 웹 표준 퍼블리싱(HTML/CSS) 및 UI 스타일링 전담 |
| [ooyoo80](https://github.com/ooyoo80) | [si-yeon-12](https://github.com/si-yeon-12) |
---

## 📄 라이선스

이 프로젝트는 코디세이 텀 프로젝트용으로 개발되었습니다.


