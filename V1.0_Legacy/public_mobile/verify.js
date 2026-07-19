// verify.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const verifyForm = document.getElementById('verifyForm');
    const verificationCodeInput = document.getElementById('verificationCode');

    if (!userId) {
        window.showAlert('Invalid verification link. Please try registering again.', 'error');
        setTimeout(() => window.location.href = 'register.html', 3000);
        return;
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const verificationCode = verificationCodeInput.value.trim();

            if (verificationCode.length !== 6) {
                window.showAlert('Please enter a valid 6-digit code.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, verificationCode })
                });

                const data = await response.json();

                if (response.ok) {
                    window.showAlert(data.message, 'success');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                } else {
                    window.showAlert(data.error || 'Verification failed', 'error');
                }
            } catch (err) {
                window.showAlert('Network error. Please try again.', 'error');
            }
        });
    }

    // Handle resend with timer
    const resendBtn = document.getElementById('resendBtn');
    let cooldown = 60;
    let timerInterval;

    function startResendTimer() {
        resendBtn.style.pointerEvents = 'none';
        resendBtn.style.opacity = '0.5';
        cooldown = 60;
        
        timerInterval = setInterval(() => {
            cooldown--;
            resendBtn.innerText = `Resend in ${cooldown}s`;
            
            if (cooldown <= 0) {
                clearInterval(timerInterval);
                resendBtn.innerText = 'Resend Email';
                resendBtn.style.pointerEvents = 'auto';
                resendBtn.style.opacity = '1';
            }
        }, 1000);
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });

                const data = await response.json();

                if (response.ok) {
                    window.showAlert(data.message, 'success');
                    startResendTimer();
                } else {
                    window.showAlert(data.error || 'Failed to resend code', 'error');
                }
            } catch (err) {
                window.showAlert('Network error. Please try again.', 'error');
            }
        });
    }
});
