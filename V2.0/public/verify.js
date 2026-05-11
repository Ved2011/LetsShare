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

    // Handle resend (simplified)
    const resendBtn = document.getElementById('resendBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.showAlert('If you still have trouble, please contact support or try re-registering.');
            // Implementation of actual resend would go here
        });
    }
});
