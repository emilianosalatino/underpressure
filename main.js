// main.js - Lógica Principal (Guardado, Tabs)

// --- Filtro de periodo compartido entre Historial y Reportes ---
window.getPeriodFilteredData = function (data) {
    const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const sel = document.getElementById('period-select').value;

    if (sel === 'all') return sorted;

    if (sel === 'custom') {
        const from = document.getElementById('period-from').value;
        const to = document.getElementById('period-to').value;
        return sorted.filter(r => {
            const d = String(r.timestamp).slice(0, 10);
            return (!from || d >= from) && (!to || d <= to);
        });
    }

    const days = parseInt(sel, 10);
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    return sorted.filter(r => new Date(r.timestamp) >= cutoff);
};

document.addEventListener('DOMContentLoaded', () => {
    const periodSelect = document.getElementById('period-select');
    const periodCustomRow = document.getElementById('period-custom-row');

    function refreshActiveTab() {
        if (window.loadReports) window.loadReports();
        if (window.renderHistory) window.renderHistory();
    }

    periodSelect.addEventListener('change', () => {
        const isCustom = periodSelect.value === 'custom';
        periodCustomRow.classList.toggle('hidden', !isCustom);
        if (!isCustom) refreshActiveTab();
    });
    document.getElementById('period-from').addEventListener('change', refreshActiveTab);
    document.getElementById('period-to').addEventListener('change', refreshActiveTab);
});

document.addEventListener('DOMContentLoaded', () => {
    // UI de Resultados
    const sysInput = document.getElementById('sys-val');
    const diaInput = document.getElementById('dia-val');
    const pulseInput = document.getElementById('pulse-val');
    const datetimeInput = document.getElementById('datetime-val');

    // Tab Navigation Logic
    const periodBar = document.getElementById('period-bar');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active classes
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Period filter only makes sense for history/reports
            periodBar.classList.toggle('hidden', targetId === 'tab-measure');

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
