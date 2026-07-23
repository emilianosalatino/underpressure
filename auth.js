// auth.js - Manejo básico de autenticación

const APP_STATE = {
    currentUser: null,  // Nombre del enfermero/usuario
    currentPatient: null // Paciente seleccionado
};

// Utils para el manejo de vistas
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// Event Listeners de Autenticación
document.addEventListener('DOMContentLoaded', () => {

    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

    // Verificar si ya hay una sesión activa
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

        if (username && pin) {
            // Un login simulado, se guarda en localStorage
            localStorage.setItem('underPressureUser', username);
            APP_STATE.currentUser = username;
            switchView('dashboard-view');
            if (window.loadPatients) window.loadPatients();
        } else {
            alert('Por favor inserta un usuario y PIN válidos.');
        }
    });

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('underPressureUser');
        APP_STATE.currentUser = null;
        APP_STATE.currentPatient = null;
        switchView('login-view');
    });

});
