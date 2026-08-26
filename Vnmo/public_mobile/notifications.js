// notifications.js
window.showAlert = function(message, type = 'success') {
    const existing = document.getElementById('globalToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = `message ${type}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '10000';
    toast.style.display = 'block';
    toast.style.minWidth = '300px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    toast.style.animation = 'slideIn 0.3s ease-out';
    toast.textContent = message;

    // Apply custom inline styles for info/warning if not fully styled in css
    if (type === 'info') {
        toast.style.background = 'rgba(59, 130, 246, 0.16)';
        toast.style.color = '#1e3a8a';
        toast.style.border = '1px solid rgba(59, 130, 246, 0.35)';
    } else if (type === 'warning') {
        toast.style.background = 'rgba(245, 158, 11, 0.16)';
        toast.style.color = '#78350f';
        toast.style.border = '1px solid rgba(245, 158, 11, 0.35)';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// Override default window.alert
window.alert = function(message) {
    window.showAlert(message, 'info');
};

window.showConfirm = function(message, onConfirm) {
    const existing = document.getElementById('globalConfirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'globalConfirmModal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10001';
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.backdropFilter = 'blur(4px)';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '400px';
    card.style.width = '90%';
    card.style.textAlign = 'center';
    card.style.padding = '2rem';
    card.style.animation = 'modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    card.innerHTML = `
        <h3 style="margin-top: 0; font-size: 1.25rem; font-weight: 700;">Confirmation</h3>
        <p style="color: var(--muted); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5;">${message}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button id="globalConfirmYes" class="btn primary" style="width: 100%;">Yes</button>
            <button id="globalConfirmNo" class="btn outline" style="width: 100%; color: #9ca3af; border-color: #d1d5db; background: transparent;">Cancel</button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('globalConfirmYes').onclick = () => {
        overlay.remove();
        onConfirm();
    };

    document.getElementById('globalConfirmNo').onclick = () => {
        overlay.remove();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
};

// Add animations to document head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes modalPop {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);
