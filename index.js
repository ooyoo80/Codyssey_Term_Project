const video = document.getElementById('video');

async function setupCamera() {
    try{
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = stream;
    } 
    catch (error) {
        console.error("Error accessing webcam: ", error);
    }
}

setupCamera();