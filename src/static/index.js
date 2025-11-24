const alcoholBarcodes = [
    "Alcohol"
];

const API_URL = "http://127.0.0.1:8001";

const resultText = document.getElementById('result-text');
const cameraArea = document.getElementById('camera');
const statusMessage = document.getElementById('status');
const cartListArea = document.getElementById('.item.list');
const totalAmountElement = document.querySelector('.total-amount');

let cartList = [];

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

            console.log(`✅ [성공] 상품 인식: ${product.name}`);
            
            addToCart(product);
            // cartList.push(product);
            // renderCartList(cartList);

            if (statusMessage) statusMessage.innerText = "상태: 대기 중";

        } else {
            // 실패 (DB에 없는 상품)
            console.warn("❌ 서버 응답: 등록되지 않은 상품");
            if (resultText) {
                resultText.innerText = "등록되지 않은 상품입니다. (${barcode})";
                resultText.style.color = "red";
            }
            if (statusMessage) statusMessage.innerText = "상태: 오류";
            // setTimeout(() => { if(resultText) resultText.innerText = "" }, 3000);
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
    const existingProduct = cartList.find(item => item.barcode === productToAdd.barcode);

    if (existingProduct) {
        existingProduct.quantity += 1;
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
    const product = cartList.find(item => item.barcode === barcode);
    if (product) {
        product.quantity += change;
        
        if (product.quantity < = 0) {
            cartList = cartList.filter(item => item.barcode !== barcode);
        }

        updateCartUI();
    }
}

/**
 * [UI 렌더링] 장바구니 화면을 배열 데이터에 맞춰 다시 그리는 함수
 */
function updateCartUI() {
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
                        <button class="decrease" onclick="updateQuantity('${item.barcode}', -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase" onclick="updateQuantity('${item.barcode}', 1)">+</button>
                    </div>
                    <span class="subtotal">₩${itemTotalPrice.toLocaleString()}</span>
                </div>
            </div>
        `;
        // 생성 HTML 목록 영역에 추가
        cartListArea.insertAdjacentHTML('beforeend', itemHTML);
    });

    if (totalAmountElement) {
        totalAmountElement.innerText = `₩${totalPrice.toLocaleString()}`;
    }

    cartListArea.scrollTop = cartListArea.scrollHeight;
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
                readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'code_39_reader', 'code_39_vin_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader'],
            }
        },

        function (err) {
            if (err) {
                console.error("Quagga initialization error : ",err);
                return;
            }

            console.log("Quagga initialization succeeded");
            Quagga.start();
        }

        
    );
    Quagga.onDetected((data) => {
    const code = data.codeResult.code;

    isAlcohol = alcoholBarcodes.includes(code);

    console.log("Barcode detected: ", code);

    handleScannedCode(code);
});

}

let isAlcohol = false;


startScanner();