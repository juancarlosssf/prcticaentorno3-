// Expresión regular para validar correos
const REGEX_CORREO = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Valida si un texto tiene formato de correo electrónico
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    return REGEX_CORREO.test(email);
}

/**
 * Procesa el contenido del CSV y extrae los correos válidos e inválidos
 * @param {string} content - Contenido del archivo CSV
 * @returns {Object} Objeto con arrays 'validos' e 'invalidos'
 */
function procesarCSV(content) {
    const lineas = content.split('\n');
    const validos = [];
    const invalidos = [];

    // Empezamos desde 1 para saltar la cabecera
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;

        const partes = linea.split(',');
        if (partes.length < 2) continue;

        const correo = partes[1].trim();

        if (isValidEmail(correo)) {
            validos.push(correo);
        } else {
            invalidos.push(correo);
        }
    }

    return { validos, invalidos };
}

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const fileInput = document.getElementById('csvFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const validateBtn = document.getElementById('validateBtn');
    const resultsSection = document.getElementById('results');
    const validList = document.getElementById('validList');
    const invalidList = document.getElementById('invalidList');
    const validCount = document.getElementById('validCount');
    const invalidCount = document.getElementById('invalidCount');

    let fileContent = '';

    // Evento al seleccionar un archivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (file) {
            fileNameDisplay.textContent = file.name;
            validateBtn.disabled = false;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                fileContent = event.target.result;
            };
            reader.readAsText(file);
        } else {
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            validateBtn.disabled = true;
            fileContent = '';
        }
    });

    // Evento al hacer clic en Validar
    validateBtn.addEventListener('click', () => {
        if (!fileContent) return;

        // Procesar el contenido
        const { validos, invalidos } = procesarCSV(fileContent);

        // Mostrar resultados en la interfaz
        validCount.textContent = validos.length;
        invalidCount.textContent = invalidos.length;

        validList.innerHTML = validos.map(c => `<li>${c}</li>`).join('');
        invalidList.innerHTML = invalidos.map(c => `<li>${c}</li>`).join('');

        resultsSection.classList.remove('hidden');
    });
});
