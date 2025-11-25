const API_URL = "http://127.0.0.1:8001";

const resultText = document.getElementById('result-text');
const cameraArea = document.getElementById('camera');
const statusMessage = document.getElementById('status');
const cartListArea = document.querySelector('.item.list');
const totalAmountElement = document.querySelector('.total-amount');

let cartList = [];
// 중복 스캔으로 인한 중복 장바구니 추가를 방지하기 위한 타임스탬프 맵
const recentAdds = {};

// 이벤트 위임: 동적으로 생성되는 수량 증가/감소 버튼을 처리
if (cartListArea) {
    cartListArea.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !cartListArea.contains(btn)) return;
        const action = btn.dataset.action;
        const barcode = btn.dataset.barcode;
        if (!action || !barcode) return;
        if (action === 'increase') updateQuantity(barcode, 1);
        if (action === 'decrease') updateQuantity(barcode, -1);
    });
}

/**
 * [핵심 로직] 바코드 처리 함수
 * - 버튼을 누르면 이 함수가 실행됩니다.
 * - 나중에 카메라가 완성되면, 카메라가 이 함수를 호출하게만 연결하면 끝입니다.
 */
async function handleScannedCode(barcode) {
    console.log(`📡 [요청] 서버에 바코드 조회: ${barcode}`);

    if (statusMessage) statusMessage.innerText = "상태: 서버 조회 중...";

    try {
        const response = await fetch(`${API_URL}/product/${barcode}`);
        const result = await response.json();

        console.log("✅ [응답] 서버 데이터:", result);

        if (result.status === "success") {
            const product = result.data;

            console.log(`✅ [성공] 상품 인식: ${product.name}, 주류 여부: ${product.isAlcohol}`);
            
            addToCart({ ...product, barcode });

            // 주류 안내 메시지 렌더 (새로 추가된 함수 호출)
            renderAlcoholNotice(product, barcode);

            if (statusMessage) statusMessage.innerText = "상태: 대기 중";

        } else {
            // 실패 (DB에 없는 상품)
            console.warn("❌ 서버 응답: 등록되지 않은 상품");
            if (resultText) {
                resultText.innerText = "등록되지 않은 상품입니다. (${barcode})";
                resultText.style.color = "red";
            }
            if (statusMessage) statusMessage.innerText = "상태: 오류 (등록되지 않은 상품)";
            setTimeout(() => { if(resultText) resultText.innerText = "" }, 3000);
            // 사용자에게는 조용히 있거나, 필요하면 안내 메시지 표시
            // resultText.innerText = "등록되지 않은 상품입니다.";
        }
    } catch (error) {
        // 서버가 꺼져있거나 인터넷 문제일 때
        console.error("⚠️ 서버 통신 에러:", error);
        alert("서버와 연결할 수 없습니다. (백엔드가 켜져 있나요?)");
    }
}

/**
 * [데이터 관리] 장바구니 배열에 상품 추가
 */
function addToCart(productToAdd) {
    // 중복 감지: 같은 바코드가 아주 짧은 시간 내(800ms)에 들어오면 무시
    try {
        const now = Date.now();
        const last = recentAdds[productToAdd.barcode] || 0;
        if (now - last < 800) {
            console.warn('중복 추가 감지 - 무시:', productToAdd.barcode);
            return;
        }
        recentAdds[productToAdd.barcode] = now;
    } catch (e) {
        // 안전성: productToAdd.barcode가 없으면 그냥 진행
    }
    const existingItem = cartList.find(item => item.barcode === productToAdd.barcode);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartList.push({ ...productToAdd, quantity: 1 });
    }
    // 장바구니 UI 업데이트
    updateCartUI();
}

/**
 * [데이터 관리] 장바구니 상품 수량 변경
 */
function updateQuantity(barcode, change) {
    const item = cartList.find(item => item.barcode === barcode);
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cartList = cartList.filter(item => item.barcode !== barcode);
        }

        updateCartUI();
    }
}

/**
 * [UI 렌더링] 장바구니 화면을 배열 데이터에 맞춰 다시 그리는 함수
 */
function updateCartUI() {
    if (!cartListArea) {
        console.error('cartListArea element not found (.item.list)');
        return;
    }
    cartListArea.innerHTML = '';

    let totalPrice = 0;

    cartList.forEach((item) => {
        const itemTotalPrice = item.price * item.quantity;
        totalPrice += itemTotalPrice;
        
        // HTML 템플릿 생성
        const itemHTML = `
            <div class="item-card" data-barcode="${item.barcode}">
                <div class="item-info">
                    <span class="name">${item.name}</span>
                    <span class="price">₩${item.price.toLocaleString()}</span>
                </div>
                <div class="subtotal-controls">
                    <div class="quantity-controls">
                        <button class="decrease" data-action="decrease" data-barcode="${item.barcode}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase" data-action="increase" data-barcode="${item.barcode}">+</button>
                    </div>
                    <span class="subtotal">₩${itemTotalPrice.toLocaleString()}</span>
                </div>
            </div>
        `;
        // 생성 HTML 목록 영역에 추가 (항목은 추가된 순서대로 아래로 쌓이도록 'beforeend' 사용)
        cartListArea.insertAdjacentHTML('beforeend', itemHTML);
    });

    if (totalAmountElement) {
        totalAmountElement.innerText = `₩${totalPrice.toLocaleString()}`;
    }

    // 새로 추가된 항목이 맨 위에 오므로 스크롤을 맨 위로 이동
    cartListArea.scrollTop = 0;
}

// 주류 안내 메시지 렌더링 함수
function renderAlcoholNotice(product, barcode) {
    try {
        // products.json에서 불러오는 불리언 isAlcohol이 true이면 주류로 판단
        const isAlcohol = !!(product && product.isAlcohol === true);

        if (!isAlcohol) return;

        // 중복 표시 방지
        const existing = document.getElementById('alcohol-notice');
        if (existing) existing.remove();

        const notice = document.createElement('div');
        notice.id = 'alcohol-notice';
        Object.assign(notice.style, {
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px 20px',
            background: '#ffbebeff',
            border: '1px solid #ff8c8cff',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 9999,
            color: '#000000',
            maxWidth: '420px',
            width: '90%',
            fontSize: '15px',
            lineHeight: '1.4',
            textAlign: 'left'
        });

        notice.innerHTML = `
            <div style="font-weight:700;margin-bottom:8px;color:#d80000;">주류 상품 안내</div>
            <div>이 상품은 주류로 분류됩니다. 청소년에게 판매가 제한되며, 필요 시 신분증 확인이 필요합니다.</div>
            <div style="text-align:right;margin-top:10px;">
                <button id="alcohol-notice-close" style="background:#d80000;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">확인</button>
            </div>
        `;

        document.body.appendChild(notice);

        const closeBtn = document.getElementById('alcohol-notice-close');
        if (closeBtn) closeBtn.addEventListener('click', () => notice.remove());

        // 자동으로 일정 시간 후 닫기 (5초)
        setTimeout(() => {
            if (notice.parentNode) notice.remove();
        }, 5000);
    } catch (e) {
        console.error('renderAlcoholNotice error', e);
    }
}

// 카메라 스캐너 설정 (Quagga)
function startScanner() {

    Quagga.init(
        {
            inputStream: {
                name: 'Live',
                type: 'LiveStream',
                target: cameraArea,
            },
            decoder: {
                readers: ['ean_reader', 'code_128_reader', 'ean_8_reader', 'code_39_reader', 'code_39_vin_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader'],
            },
            locate: true,
            frequency: 10
        },

        function (err) {
            if (err) {
                console.error("Quagga initialization error : ",err);
                return;
            }

            console.log("Quagga initialization succeeded");
            Quagga.start();

            const videoElement = cameraArea.querySelector('video');
            if (videoElement) {
                videoElement.style.transform = 'scaleX(-1)';
            }
        }

        
    );
    
    let isScanning = false;
    // 마지막으로 감지된 코드와 시간 (같은 코드를 짧은 시간 내 중복 처리 방지)
    let lastDetectedCode = null;
    let lastDetectedAt = 0;

    Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        const now = Date.now();

        // 동일 코드가 짧은 시간(2500ms) 내에 다시 들어오면 무시
        if (code === lastDetectedCode && (now - lastDetectedAt) < 2500) {
            // console.debug('Quagga: duplicate detection suppressed', code);
            return;
        }
        lastDetectedCode = code;
        lastDetectedAt = now;

        if (isScanning) return; // 중복 스캔 방지

        console.log("Barcode detected: ", code);

        isScanning = true; // 스캔 처리 시작

        handleScannedCode(code).finally(() => {
            setTimeout(() => {
                isScanning = false;
                if (statusMessage) statusMessage.innerText = "상태: 대기 중 (스캔 가능)";
            }, 2500)
        });
    });
}

// 스캐너 시작
startScanner();
