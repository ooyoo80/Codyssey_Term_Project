/* Mock product data (temporary) */
const PRODUCTS_MAP = {
    "8801043036068": { name: "참이슬 후레쉬", price: 1950, is_alcohol: true },
    "8801007686561": { name: "새우깡", price: 1500, is_alcohol: false }
};

// 개발용: 콘솔에서 확인하려면 아래처럼 접근하세요
// console.log(PRODUCTS_MAP["8801043036068"]);

const cameraArea = document.getElementById('camera');
const resultText = document.getElementById('result');
const statusMessage = document.getElementById('status');

const alcoholBarcodes = [
    "Alcohol"
];

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

let isAlcohol = false;

Quagga.onDetected((data) => {
    const code = data.codeResult.code;

    isAlcohol = alcoholBarcodes.includes(code);

    console.log("Barcode detected and processed : [" + code + "]", data);

    resultText.innerText = `Detected Code: ${code}`;
    statusMessage.innerText = `status: ${isAlcohol}`;
    
});

startScanner();