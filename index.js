/* Mock product data (temporary) */
const PRODUCTS_MAP = {
    "8801043036068": { name: "참이슬 후레쉬", price: 1950, is_alcohol: true },
    "8801007686561": { name: "새우깡", price: 1500, is_alcohol: false }
};

const resultText = document.getElementById('result-text');
const cameraArea = document.getElementById('camera');

/**
 * [핵심 로직] 바코드 처리 함수
 * - 버튼을 누르면 이 함수가 실행됩니다.
 * - 나중에 카메라가 완성되면, 카메라가 이 함수를 호출하게만 연결하면 끝입니다.
 */
function handleScannedCode(barcode) {
    const product = PRODUCTS_MAP[barcode];

    if (product) {
        // ✅ 성공: 상품 찾음
        console.log(`✅ [성공] 인식됨: ${product.name}`);
        
        // 화면 글씨 바꾸기
        if(resultText) {
            resultText.innerText = `인식됨: ${product.name} (${product.price}원)`;
        }

        if (product.is_alcohol) {
            alert(`🍺 주류 감지! [${product.name}]`);
        } else {
            alert(`🛒 일반 상품! [${product.name}]`);
        }

    } else {
        // ❌ 실패: 없는 상품 (콘솔에만 에러 출력)
        console.error(`⛔ [Error] 등록되지 않은 바코드: ${barcode}`);
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
}

Quagga.onDetected((data) => {
    const code = data.codeResult.code;

    console.log("Barcode detected and processed : [" + code + "]", data);

    handleScannedCode(code);
});

startScanner();