document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('csvFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const validateBtn = document.getElementById('validateBtn');
    const resultsSection = document.getElementById('results');
    const validList = document.getElementById('validList');
    const invalidList = document.getElementById('invalidList');
    const validCount = document.getElementById('validCount');
    const invalidCount = document.getElementById('invalidCount');

    let fileContent = '';

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

    validateBtn.addEventListener('click', () => {
        if (!fileContent) return;

        const lineas = fileContent.split('\n');
        const correosValidos = [];
        const correosInvalidos = [];

        // Expresión regular CORRECTA (ya auditada y corregida)
        const regexCorreo = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            const partes = linea.split(',');
            if (partes.length < 2) continue;

            const correo = partes[1].trim();

            if (regexCorreo.test(correo)) {
                correosValidos.push(correo);
            } else {
                correosInvalidos.push(correo);
            }
        }

        // Mostrar resultados en la UI
        validCount.textContent = correosValidos.length;
        invalidCount.textContent = correosInvalidos.length;

        validList.innerHTML = correosValidos.map(c => `<li>${c}</li>`).join('');
        invalidList.innerHTML = correosInvalidos.map(c => `<li>${c}</li>`).join('');

        resultsSection.classList.remove('hidden');
    });
});
