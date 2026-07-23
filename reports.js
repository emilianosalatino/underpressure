// reports.js - Lógica para gráficos

let chartInstance = null;

window.loadReports = function () {
    if (!APP_STATE.currentPatient) return;

    const patients = JSON.parse(localStorage.getItem('underPressurePatients')) || {};
    const data = patients[APP_STATE.currentPatient] || [];

    const statsSys = document.getElementById('avg-sys');
    const statsDia = document.getElementById('avg-dia');

    if (data.length === 0) {
        statsSys.innerText = '--';
        statsDia.innerText = '--';
        if (chartInstance) chartInstance.destroy();
        return;
    }

    // Calcular promedios
    let sumS = 0; let sumD = 0;
    data.forEach(m => {
        sumS += m.sys;
        sumD += m.dia;
    });

    const avgS = (sumS / data.length).toFixed(0);
    const avgD = (sumD / data.length).toFixed(0);

    statsSys.innerText = avgS;
    statsDia.innerText = avgD;

    // Highlight Si hay hipertensión
    if (avgS > 120 || avgD > 80) {
        statsSys.classList.add('warning');
        statsDia.classList.add('warning');
    } else {
        statsSys.classList.remove('warning');
        statsDia.classList.remove('warning');
    }

    // Render Chart
    const ctx = document.getElementById('bp-chart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Preparar labels (fechas cortas)
    const labels = data.map(m => {
        const d = new Date(m.timestamp);
        return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    const sysData = data.map(m => m.sys);
    const diaData = data.map(m => m.dia);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sistólica',
                    data: sysData,
                    borderColor: '#f03e3e',
                    backgroundColor: 'rgba(240, 62, 62, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Diastólica',
                    data: diaData,
                    borderColor: '#0b7285',
                    backgroundColor: 'rgba(11, 114, 133, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 50,
                    max: 200
                }
            },
            plugins: {
                annotation: {
                    // Aquí podríamos meter líneas de referencia usando chartjs-plugin-annotation si se desea.
                }
            }
        }
    });

};

// CSV Export
document.getElementById('btn-export-csv').addEventListener('click', () => {
    if (!APP_STATE.currentPatient) return;
    const patients = JSON.parse(localStorage.getItem('underPressurePatients')) || {};
    const data = patients[APP_STATE.currentPatient] || [];

    if (data.length === 0) {
        alert("No hay datos para exportar");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Sistolica,Diastolica,Pulso\n"; // Header

    data.forEach(function (rowArray) {
        let row = `${rowArray.timestamp},${rowArray.sys},${rowArray.dia},${rowArray.pulse || ''}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_BP_${APP_STATE.currentPatient}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
