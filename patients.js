// patients.js - Lógica para manejar pacientes

function getPatients() {
    const raw = localStorage.getItem(`underPressurePatients_${APP_STATE.currentUser}`);
    return raw ? JSON.parse(raw) : {};
}

function savePatients(patients) {
    localStorage.setItem(`underPressurePatients_${APP_STATE.currentUser}`, JSON.stringify(patients));
}

window.loadPatients = function () {
    const patientListDiv = document.getElementById('patient-list');
    const patients = getPatients();

    patientListDiv.innerHTML = '';

    const patientNames = Object.keys(patients);

    if (patientNames.length === 0) {
        patientListDiv.innerHTML = '<p style="color: #888;">No hay pacientes registrados aún.</p>';
        return;
    }

    patientNames.forEach(name => {
        const pCard = document.createElement('div');
        pCard.className = 'patient-card';
        pCard.innerHTML = `
            <div style="flex:1" class="clickable-patient">
                <h4>👤 ${name}</h4>
                <small>${patients[name].length} mediciones</small>
            </div>
            <button class="btn-icon delete-patient-btn" data-name="${name}" style="color:var(--secondary-color); font-size:1.2rem;" title="Eliminar Paciente">🗑️</button>
        `;

        // Open patient
        pCard.querySelector('.clickable-patient').addEventListener('click', () => openPatient(name));

        // Delete patient
        pCard.querySelector('.delete-patient-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('¿Estás seguro de eliminar este paciente y todo su historial?')) {
                const p = getPatients();
                delete p[name];
                savePatients(p);
                window.loadPatients();
            }
        });

        patientListDiv.appendChild(pCard);
    });
}

function addPatient() {
    const newNameInput = document.getElementById('new-patient-name');
    const newName = newNameInput.value.trim();

    if (!newName) return;

    const patients = getPatients();
    if (patients[newName]) {
        alert("El paciente ya existe.");
        return;
    }

    patients[newName] = []; // Inicializamos el array de lecturas
    savePatients(patients);

    newNameInput.value = '';
    window.loadPatients();
}

function openPatient(patientName) {
    APP_STATE.currentPatient = patientName;
    document.getElementById('current-patient-name').innerText = `👤 ${patientName}`;
    switchView('patient-detail-view');

    // Abrir por defecto el Tab de "Tomar Medición"
    document.querySelector('.tab-btn[data-target="tab-measure"]').click();
}

window.renderHistory = function () {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (!APP_STATE.currentPatient) return;

    const patients = getPatients();
    const data = patients[APP_STATE.currentPatient] || [];

    // Reverse simple local sort so newest are on top
    const dataReversed = [...data].reverse();

    if (dataReversed.length === 0) {
        historyList.innerHTML = '<p style="color:#888;">No hay registros.</p>';
        return;
    }

    dataReversed.forEach((reading, index) => {
        const item = document.createElement('div');
        item.style.cssText = "background: rgba(255,255,255,0.7); padding: 15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border: 1px solid #dee2e6;";

        const d = new Date(reading.timestamp);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

        item.innerHTML = `
            <div>
                <strong style="font-size:1.1rem; color:var(--primary-color)">${reading.sys} / ${reading.dia}</strong> <small style="color:var(--text-muted)">(Pulso: ${reading.pulse})</small>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">${dateStr}</div>
            </div>
            <button class="btn-icon" style="color:var(--secondary-color); font-size:1.2rem;">❌</button>
        `;

        item.querySelector('button').addEventListener('click', () => {
            if (confirm('¿Borrar esta medición?')) {
                // Find original index in non-reversed array
                const originalIndex = data.length - 1 - index;
                data.splice(originalIndex, 1);
                patients[APP_STATE.currentPatient] = data;
                savePatients(patients);
                window.renderHistory();
            }
        });

        historyList.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-add-patient').addEventListener('click', addPatient);

    document.getElementById('btn-back-dashboard').addEventListener('click', () => {
        APP_STATE.currentPatient = null;
        switchView('dashboard-view');
        window.loadPatients();
    });

    // Export JSON Backup
    document.getElementById('btn-export-json').addEventListener('click', () => {
        const patients = getPatients();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patients));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "underpressure_backup.json");
        document.body.appendChild(dlAnchorElem);
        dlAnchorElem.click();
        document.body.removeChild(dlAnchorElem);
    });

    // Import JSON Backup
    document.getElementById('import-json').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (typeof importedData === 'object') {
                    savePatients(importedData);
                    window.loadPatients();
                    alert("Base de datos importada correctamente.");
                }
            } catch (err) {
                alert("Error al leer el archivo JSON. Formato inválido.");
            }
        };
        reader.readAsText(file);
    });
});
