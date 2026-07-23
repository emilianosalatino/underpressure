// auth.js - Manejo básico de autenticación

const APP_STATE = {
    currentUser: null,
    currentPatient: null
};

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// PIN is stored per-user. Default is '1234' on first login for any user.
function getStoredPin(username) {
    return localStorage.getItem(`underPressurePin_${username}`) || '1234';
}

document.addEventListener('DOMContentLoaded', () => {

    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

    // Check for active session
    const savedUser = localStorage.getItem('underPressureUser');
    if (savedUser) {
        APP_STATE.currentUser = savedUser;
        switchView('dashboard-view');
        if (window.loadPatients) window.loadPatients();
    } else {
        switchView('login-view');
    }

    btnLogin.addEventListener('click', () => {
        const username = document.getElementById('nurse-username').value.trim();
        const pin = document.getElementById('nurse-pin').value.trim();

        if (!username || !pin) {
            alert('Por favor inserta tu usuario y PIN.');
            return;
        }

        if (pin === getStoredPin(username)) {
            localStorage.setItem('underPressureUser', username);
            APP_STATE.currentUser = username;
            switchView('dashboard-view');
            if (window.loadPatients) window.loadPatients();
        } else {
            alert('PIN incorrecto.');
        }
    });

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('underPressureUser');
        APP_STATE.currentUser = null;
        APP_STATE.currentPatient = null;
        switchView('login-view');
    });

});

// Callable from dashboard button
window.changePin = function () {
    const currentPin = prompt('Ingresa tu PIN actual:');
    if (currentPin === null) return;

    if (currentPin !== getStoredPin(APP_STATE.currentUser)) {
        alert('PIN actual incorrecto.');
        return;
    }

    const newPin = prompt('Ingresa el nuevo PIN (mínimo 4 caracteres):');
    if (!newPin || newPin.length < 4) {
        alert('PIN inválido. Debe tener al menos 4 caracteres.');
        return;
    }

    const confirmPin = prompt('Confirma el nuevo PIN:');
    if (newPin !== confirmPin) {
        alert('Los PINs no coinciden.');
        return;
    }

    localStorage.setItem(`underPressurePin_${APP_STATE.currentUser}`, newPin);
    alert('✅ PIN actualizado exitosamente.');
};

