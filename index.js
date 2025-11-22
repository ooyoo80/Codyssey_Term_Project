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