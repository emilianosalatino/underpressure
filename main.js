// main.js - Lógica Principal (Cámara, Tesseract OCR, Guardado, Tabs)

document.addEventListener('DOMContentLoaded', () => {
    const cameraInput = document.getElementById('camera-input');
    const imagePreview = document.getElementById('image-preview');
    const ocrStatus = document.getElementById('ocr-status');

    // UI de Resultados
    const sysInput = document.getElementById('sys-val');
    const diaInput = document.getElementById('dia-val');
    const pulseInput = document.getElementById('pulse-val');
    const datetimeInput = document.getElementById('datetime-val');

    // Tab Navigation Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active classes
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'tab-reports' && window.loadReports) {
                window.loadReports();
            }

            if (targetId === 'tab-history' && window.renderHistory) {
                window.renderHistory();
            }
        });
    });

    // Helper to get current datetime in local format for the input
    function setDateTimeNow() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        datetimeInput.value = now.toISOString().slice(0, 16);
    }

    // Set initial time when app loads
    setDateTimeNow();

    // Guardar Medición
    document.getElementById('btn-save-measurement').addEventListener('click', () => {
        const s = parseInt(sysInput.value);
        const d = parseInt(diaInput.value);
        const p = parseInt(pulseInput.value);
        const dt = datetimeInput.value;

        if (!s || !d || !dt) {
            alert('Por favor completa al menos la sistólica, diastólica y fecha.');
            return;
        }

        const reading = {
            sys: s,
            dia: d,
            pulse: p,
            timestamp: dt
        };

        // Saving logic
        if (!APP_STATE.currentPatient) {
            alert('Error crítico: Ningún paciente seleccionado.');
            return;
        }

        const patients = JSON.parse(localStorage.getItem(`underPressurePatients_${APP_STATE.currentUser}`)) || {};
        const pData = patients[APP_STATE.currentPatient] || [];
        pData.push(reading);

        // Sorting by date just in case
        pData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        patients[APP_STATE.currentPatient] = pData;
        localStorage.setItem(`underPressurePatients_${APP_STATE.currentUser}`, JSON.stringify(patients));

        alert('Medición Guardada Exitosamente');

        // Limpiar para nueva
        sysInput.value = '';
        diaInput.value = '';
        pulseInput.value = '';
        // Setting time back to default
        setDateTimeNow();

        // Ir a reportes
        document.querySelector('.tab-btn[data-target="tab-reports"]').click();
    });

});
