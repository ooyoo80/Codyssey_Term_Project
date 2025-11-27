document.addEventListener('DOMContentLoaded', () => {
    let isScanningIdMode = false;
    let scannedIdValue = null;

    const API_URL = "http://127.0.0.1:8001";

    const resultText = document.getElementById('result-text');
    const cameraArea = document.getElementById('camera');
    const statusMessage = document.getElementById('status');

    let cartListArea = document.querySelector('.item.list');
    let totalAmountElement = document.querySelector('.total-amount');
    let payButton = document.querySelector('.pay-button');

    const ageModal = document.getElementById('ageModal');
    const ageYesBtn = document.getElementById('btn-age-yes');
    const ageNoBtn = document.getElementById('btn-age-no');

    const legalModal = document.getElementById('legalModal');
    const legalYesBtn = document.getElementById('btn-legal-yes');
    const legalNoBtn = document.getElementById('btn-legal-no');
    
    const finalPaymentModal = document.getElementById('finalPaymentModal');
    const finalPayBtn = document.getElementById('btn-final-pay');
    const finalCancelBtn = document.getElementById('btn-final-cancel');

    let cartList = [];
    // 중복 스캔으로 인한 중복 장바구니 추가를 방지하기 위한 타임스탬프 맵
    const recentAdds = {};

    // [보조 함수] 장바구니 아이템 클릭 핸들러 분리 (재사용 위해)
    function handleCartItemClick(e) {
        const btn = e.target.closest('button');
        if (!btn || !cartListArea.contains(btn)) return;
        const action = btn.dataset.action;
        const barcode = btn.dataset.barcode;
        if (!action || !barcode) return;
        if (action === 'increase') updateQuantity(barcode, 1);
        if (action === 'decrease') updateQuantity(barcode, -1);
    }

    // 이벤트 위임: 동적으로 생성되는 수량 증가/감소 버튼을 처리
    if (cartListArea) {
        cartListArea.addEventListener('click', handleCartItemClick);
    }
    
    // 유틸리티 함수: 토스트 알림 표시
    function showToast(message, type = "info", duration = 3000) {
        let toast = document.getElementById('app-toast-message');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast-message';
            document.body.appendChild(toast);
        }

        toast.className = `toast-${type}`;
        toast.innerText = message;

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }


    async function handleScannedID(barcode) {
        console.log(`🆔 [ID 스캔 성공] 인식된 코드: ${barcode}`);
        
        scannedIdValue = barcode;
        console.log("💾 신분증 데이터 임시 저장 완료:", scannedIdValue);

        if (statusMessage) statusMessage.innerText = "상태: 신분증 인식 완료";

        showToast("신분증 인식이 완료되었습니다.", "success");
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        isScanningIdMode = false;
        console.log("🔄 스캔 모드 복귀: 상품 스캔 모드");

        showFinalPaymentModal();
    }


    // 최종 결제 팝업 표시 함수 (Placeholder)
    function showFinalPaymentModal() {
        console.log("🚀 최종 결제 확인 팝업을 띄웁니다.");
        
        if (finalPaymentModal) {
            finalPaymentModal.classList.add('show');
        } else {
            // 팀원이 아직 HTML에 추가하지 않았을 수도 있으니 경고 로그 출력
            console.error("❌ 오류: 최종 결제 팝업 요소(finalPaymentModal)를 찾을 수 없습니다.");
            showToast("최종 결제 팝업을 띄울 수 없습니다. (HTML 확인 필요)", "error");
        }
    }

    // 결제 완료 후 UI를 초기 상태로 복구하는 함수
    function resetUIAfterPayment() {
        console.log("🔄 UI 초기화: 장바구니 비우기 및 화면 복구");

        // 데이터 초기화
        cartList = [];
        scannedIdValue = null;
        Object.keys(recentAdds).forEach(key => delete recentAdds[key]);

        // 우측 화면 복구
        const paneRight = document.querySelector('.pane.right');

        if (document.querySelector('.id-scan-guide-container')) {
            paneRight.innerHTML = `
                <div class="item title">구매 목록</div>
                <div class="item list"></div>
                <div class="item pay">
                    <div class="total-pay">
                        <div class="item-total">
                            <span class="total-label">총액</span>
                            <span class="total-amount">₩0</span>
                        </div>
                        <div class="action-container">
                            <button id="btn-pay" class="pay-button">결제하기</button>
                        </div>
                    </div>
                </div>
            `;

            // 변수 재연결 및 이벤트 리스너 설정
            cartListArea = document.querySelector('.item.list');
            totalAmountElement = document.querySelector('.total-amount');
            payButton = document.querySelector('.pay-button');

            if (payButton) {
                payButton.addEventListener('click', handlePaymentClick);
            }
            if (cartListArea) {
                cartListArea.addEventListener('click', handleCartItemClick);
            }
        }
        // UI 업데이트
        updateCartUI();
        if (statusMessage) statusMessage.innerText = "상태: 결제 완료 (대기 중)";
    }

    // 최종 결제 팝업 '결제하기' 버튼 클릭 시
    if (finalPayBtn) {
        finalPayBtn.addEventListener('click', async () => {
            console.log("💰 최종 '결제하기' 버튼 클릭!");

            // 전송할 데이터 준비 검증
            if (!cartList || cartList.length === 0) {
                 console.error("❌ 오류: 결제할 상품이 없습니다.");
                 showToast("결제할 상품이 없습니다.", "error");
                 return;
            }

            // 주류 포함 여부 확인
            const hasAlcohol = cartList.some(item => item.isAlcohol === true);
            console.log("🍸 주류 포함 여부:", hasAlcohol);
            
            if (hasAlcohol) {
                // Case 1: 주류 있음 -> 로그 저장 API 호출 필요
                console.log("📡 주류 포함: 로그 저장 시도");

                // 데이터 준비
                const alcoholItem = cartList.find(item => item.isAlcohol);
                const targetBarcode = alcoholItem ? alcoholItem.barcode : cartList[0].barcode; // 주류가 없으면 첫 번째 상품 바코드 사용

                // 신분증 스캔 값 확인 
                const finalScannedId = scannedIdValue || "SIMULATED_ID_NOT_SCANNED";

                showToast("결제 진행 중... (로그 저장)", "info");
                if (statusMessage) statusMessage.innerText = "상태: 결제(로그 저장) 처리 중...";

                try {
                    // 실제 백엔드 API 호출 (POST /log)
                    const response = await fetch(`${API_URL}/log`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            target_barcode: targetBarcode,
                            consent_agreed: true, // 시나리오상 항상 true
                            scanned_id_info: finalScannedId,
                        }),
                    });

                    const result = await response.json();
                    console.log("✅ [응답] 로그 저장 결과:", result);

                    if (response.ok && result.status === "success") {
                        // 성공 시 처리
                        console.log("✅ 로그 저장 및 결제 완료 성공!");
                        
                        if (finalPaymentModal) {
                            finalPaymentModal.classList.remove('show'); // 팝업 닫기
                        }
                        showToast("결제가 완료되었습니다. 감사합니다!", "success");

                        // UI 및 데이터 초기화 함수 호출
                        resetUIAfterPayment();

                    } else {
                        // 실패 시 처리 (서버가 에러 응답을 보낸 경우)
                        console.error("❌ 로그 저장 실패:", result.message || result.detail);
                        throw new Error(result.message || "로그 저장 실패");
                    }
                } catch (error) {
                    console.error("❌ 결제 실패:", error);
                    showToast("결제 실패: " + error.message, "error");
                    if (statusMessage) statusMessage.innerText = "상태: 오류 (결제 실패)";
                }
            } else {
                // Case 2: 주류 없음 -> 즉시 결제 완료 (로그 저장 X)
                console.log("🛒 주류 없음: 즉시 결제 완료 처리");

                showToast("결제 진행 중...", "info");

                await new Promise(resolve => setTimeout(resolve, 500));

                if (finalPaymentModal) finalPaymentModal.classList.remove('show');
                showToast("결제가 완료되었습니다. 감사합니다!", "success");
                resetUIAfterPayment();
            }
        });
    } else {
        console.warn("⚠️ 최종 '결제하기' 버튼 요소를 찾을 수 없어 이벤트를 연결하지 못했습니다. (연동 대기 중)");
    }

    // 최종 결제 '취소' 버튼 클릭 시
    if (finalCancelBtn) {
        finalCancelBtn.addEventListener('click', () => {
            console.log("❌ 최종 '결제 취소' 버튼 클릭 -> 팝업 닫기");
            if (finalPaymentModal) {
                finalPaymentModal.classList.remove('show');
            }
            showToast("결제가 취소되었습니다.", "warning");
            // 이전 단계로 돌아가는 로직
        });
    } else {
        console.warn("⚠️ '최종 결제 취소' 버튼(btn-final-cancel)을 찾을 수 없습니다. (연동 대기 중)");
    }

    
    // 바코드 처리 함수
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


    function showIdScanScreen() {
        console.log("🖥️ 화면 전환: 신분증 스캔 모드 진입");

        const paneRight = document.querySelector('.pane.right');
        if (!paneRight) {
            console.error("❌ 오류: .pane.right 요소를 찾을 수 없습니다.");
            return;
        }

        paneRight.innerHTML = '';
        const guideHTML = `
            <div class="id-scan-guide-container">
                <div class="guide-icon">🆔</div>
                <h2>신분증 바코드를 스캔해주세요</h2>
                <p class="guide-text">
                    성인 인증 및 법적 책임 동의 확인을 위해<br>
                    신분증 뒷면의 바코드를 카메라에 비춰주세요.
                </p>
                <div class="scan-animation">
                    <div class="scan-line"></div>
                </div>
                <p class="sub-text">인식이 완료되면 자동으로 다음 단계로 넘어갑니다.</p>
            </div>
        `;
        paneRight.insertAdjacentHTML('beforeend', guideHTML);

        isScanningIdMode = true;
        console.log("🔄 상태 변경: isScanningIdMode = true");

        const statusMessage = document.getElementById('status');
        if (statusMessage) {
            statusMessage.innerText = "상태: 신분증 스캔 대기 중...";
        }
    }

    // 결제 버튼 클릭 핸들러 (주류 판단 로직)
    function handlePaymentClick() {
        // 장바구니 비었는지 확인
        if (cartList.length === 0) {
            alert("장바구니에 담긴 상품이 없습니다.");
            return;
        }

        // 주류 포함 여부 확인
        const hasAlcohol = cartList.some(item => item.isAlcohol === true);

        if (hasAlcohol) {
            console.log("🚨 결제 시도: 주류 포함됨! -> 성인 인증 팝업 필요");

            if (ageModal) {
                ageModal.classList.add('show');
                console.log("팝업 클래스 'show' 추가 완료. 현재 클래스:", ageModal.className);
            } else {
                console.error("❌ 오류: ageModal 요소를 찾을 수 없습니다.");
            }
        } else {
            // 주류 없음 -> 즉시 결제 완료
            console.log("✅ 결제 시도: 주류 없음 -> 즉시 결제 완료");
            showFinalPaymentModal();
        }
    }

    // 결제 버튼에 이벤트 리스너 연결
    if (payButton) {
        payButton.addEventListener('click', handlePaymentClick);
        console.log("결제 버튼 이벤트 리스너가 연결되었습니다.");
    } else {
        console.warn("결제 버튼 요소를 찾을 수 없습니다 (.pay-button)");
    }

    // 1차 팝업 버튼 이벤트
    if (ageYesBtn && ageModal && legalModal) {
        ageYesBtn.addEventListener('click', () => {
            console.log("1차 '예' 클릭 -> 1차 닫고, 2차 팝업 열기");
            ageModal.classList.remove('show');
            legalModal.classList.add('show');
        });
    }
    if (ageNoBtn && ageModal) {
        ageNoBtn.addEventListener('click', () => {
            console.log("1차 '아니오' 클릭 -> 팝업 닫기 및 주류 제거");
            ageModal.classList.remove('show');
            console.log("팝업 닫힌 후 클래스:", ageModal.className);
        });
    }

    if (legalYesBtn && legalModal) {
        legalYesBtn.addEventListener('click', () => {
            console.log("2차 '예' 클릭 -> 2차 닫고, 다음 단계(신분증 인식)로 이동 예정");
            legalModal.classList.remove('show');
            // 3차 신분증 인식 웹캠 화면 보여주는 로직 호출
            showIdScanScreen();
        });
        
    } else {
        console.warn("⚠️ 2차 '예' 버튼 또는 팝업 요소를 찾을 수 없어 이벤트를 연결하지 못했습니다.");
    }
    
    if (legalNoBtn && legalModal) {
        legalNoBtn.addEventListener('click', () => {
            console.log("🖱️ 2차 '아니오' 클릭 -> 팝업 닫기 및 주류 제거");
            legalModal.classList.remove('show');
            clearAlcoholItems(); // 주류 제거
        });
        console.log("✅ 2차 '아니오' 버튼 이벤트 리스너 연결 완료");
    } else {
        console.warn("⚠️ 2차 '아니오' 버튼 또는 팝업 요소를 찾을 수 없어 이벤트를 연결하지 못했습니다.");
    }

    // 카메라 스캐너 설정 (Quagga)
    function startScanner() {
        const cameraElement = document.getElementById('camera');
        if (!cameraElement) {
            console.error("❌ 오류: 카메라 요소(camera)를 찾을 수 없습니다.");
            return;
        }

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
            let processPromise;
            if (isScanningIdMode) {
                console.log("ℹ️ 현재 신분증 스캔 모드입니다.");
                processPromise = handleScannedID(code);
            } else {
                console.log("ℹ️ 현재 상품 스캔 모드입니다.");
                processPromise = handleScannedCode(code);
            }
            processPromise.finally(() => {
                setTimeout(() => {
                    isScanning = false;
                    if (statusMessage) {
                        // 현재 모드에 따라 적절한 대기 메시지 표시
                        const modeMessage = isScanningIdMode ? "신분증 스캔" : "상품 스캔";
                        statusMessage.innerText = `상태: 대기 중 (${modeMessage} 가능)`;
                    }
                }, 2500)
            });
        });
    }

    // 스캐너 시작
    startScanner();
});