# Bitácora de Presión — App local para Android

App web instalable (PWA), 100% local: sin servidor externo, sin nube, sin cuentas.
Registro manual de fecha/hora, presión y pulso, con gráfica y exportación a PDF.

## Qué hace

- Registra fecha/hora, sistólica, diastólica y pulso.
- Bitácora con lista de registros, categoría (normal/elevada/hipertensión, etc.)
  y opción de eliminar.
- Gráfica de sistólica, diastólica y pulso por fecha (14/30/90 días o todo).
- Exporta un PDF con la gráfica + la lista completa de registros.
- Botón de **respaldo**: descarga un archivo `.json` con todos tus registros,
  y botón de **restaurar** para volver a cargarlos (ver sección de abajo).

Es una referencia personal, no un diagnóstico médico.

## Dónde se guardan tus datos (importante)

Los registros se guardan en el almacenamiento local del navegador (IndexedDB),
**ligado exactamente a la dirección desde la que abriste la app**. Esto tiene
una consecuencia importante:

- Si abres `index.html` con doble clic (dirección tipo `file:///...`), Chrome
  en Android en muchos casos **no conserva ese almacenamiento entre sesiones**
  — cada vez que reabres puede tratarse como un origen nuevo y verás la
  bitácora vacía, aunque hayas guardado registros antes.
- Si la sirves con un servidor local (ver abajo) y abres siempre la misma
  dirección `http://localhost:8080`, el almacenamiento sí persiste igual que
  en cualquier otra página web que visitas normalmente.
- Si algún día limpias los datos de navegación de Chrome ("Borrar datos de
  sitios"), la bitácora se borra también, sin importar cómo la abras.

**Por eso agregué el botón de respaldo.** Usa "Guardar respaldo" seguido y
guarda ese `.json` en Drive, WhatsApp a ti mismo, etc. Si algún día la app se
abre vacía, usa "Restaurar respaldo" con ese mismo archivo y recuperas todo.

## Cómo instalarla en tu Android (recomendado — queda como app con ícono y datos persistentes)

1. Instala **Termux** desde F-Droid (recomendado) o Play Store.
2. Copia la carpeta `bpapp` completa a tu teléfono (por USB, o descomprimiendo
   el .zip directo en el teléfono con cualquier gestor de archivos).
3. En Termux:
   ```
   pkg install python -y
   cd /sdcard/Download/bpapp      # ajusta la ruta a donde quedó la carpeta
   python -m http.server 8080
   ```
4. Abre Chrome en el mismo teléfono y visita: `http://localhost:8080`
5. Menú ⋮ de Chrome → **"Instalar app"** o **"Agregar a pantalla de inicio"**.
6. Vuelve a abrir siempre desde ese ícono. Si reinicias el teléfono, repite el
   paso 3 en Termux antes de abrir la app para que localhost esté disponible.

## Cómo probarla rápido (sin servidor, solo para probar la interfaz)

Abre `index.html` directo con Chrome desde el explorador de archivos. Sirve
para ver cómo luce y probar el flujo, pero **no confíes en que los datos se
queden guardados** en este modo — usa el respaldo `.json` seguido, o mejor,
pasa al modo servidor de arriba en cuanto quieras usarla en serio.

## Estructura

```
bpapp/
├── index.html
├── styles.css
├── app.js
├── manifest.json          (metadatos de instalación)
├── service-worker.js      (caché offline)
├── icons/                 (ícono de la app)
└── assets/
    └── lib/                (Chart.js, jsPDF — copias locales)
```
