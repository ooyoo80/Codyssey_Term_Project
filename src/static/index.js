fetch("http://127.0.0.1:8000/product/1234")
    
const alcoholBarcodes = [
    "Alcohol"
];

const API_URL = "http://127.0.01:8001";

const resultText = document.getElementById('result-text');
const cameraArea = document.getElementById('camera');
const statusMessage = document.getElementById('status');


/**
 * [핵심 로직] 바코드 처리 함수
 * - 버튼을 누르면 이 함수가 실행됩니다.
 * - 나중에 카메라가 완성되면, 카메라가 이 함수를 호출하게만 연결하면 끝입니다.
 */
function handleScannedCode(barcode) {
    console.log(`📡 [요청] 서버에 바코드 조회: ${barcode}`);

    try {
        // FastAPI 서버에 GET 요청 보내기
        // const response = await fetch(`${API_URL}/product/${barcode}`);
        fetch(`${API_URL}/product/${barcode}`)
            .then(response => response.json())
            .then(result => {console.log(result);})

        if (result.status === "success") {
            const product = result.data;

            console.log(`✅ [성공] 상품 인식: ${product.name}`);

            if (resultText) {
                resultText.innerText = `인식됨: ${product.name} (${product.price}원)`;
            }

            // 2. 주류 여부에 따른 분기 처리
            if (product.is_alcohol) {
                // 주류일 때
                if(statusMessage) statusMessage.innerText = "상태: 주류 감지 (성인인증 필요)";
                alert(`🍺 주류 감지! [${product.name}]\n-> 팝업을 띄웁니다.`);
                // TODO: 여기서 팝업 띄우는 함수 호출
            } else {
                // 일반 상품일 때
                if(statusMessage) statusMessage.innerText = "상태: 일반 상품";
                alert(`🛒 일반 상품! [${product.name}]\n-> 장바구니에 담습니다.`);
                // TODO: 여기서 장바구니 추가 함수 호출
            }
        } else {
            // 실패 (DB에 없는 상품)
            console.warn("❌ 서버 응답: 등록되지 않은 상품");
            // 사용자에게는 조용히 있거나, 필요하면 안내 메시지 표시
            // resultText.innerText = "등록되지 않은 상품입니다.";
        }
    } catch (error) {
        // 서버가 꺼져있거나 인터넷 문제일 때
        console.error("⚠️ 서버 통신 에러:", error);
        alert("서버와 연결할 수 없습니다. (백엔드가 켜져 있나요?)");
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