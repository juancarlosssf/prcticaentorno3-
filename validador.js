const fs = require('fs');

function validarCorreos(rutaArchivo) {
    console.log(`Leyendo el archivo: ${rutaArchivo}...`);
    
    try {
        const data = fs.readFileSync(rutaArchivo, 'utf8');
        const lineas = data.split('\n');
        
        const correosValidos = [];
        const correosInvalidos = [];
        
        // Empezamos desde 1 para saltar la cabecera (nombre,correo)
        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;
            
            const partes = linea.split(',');
            // Asegurarse de que tenemos un nombre y un correo
            if (partes.length < 2) continue;
            
            const correo = partes[1].trim();
            
            // CORRECCIÓN: Expresión regular actualizada para permitir puntos, guiones y guiones bajos
            const regexCorreo = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            
            if (regexCorreo.test(correo)) {
                correosValidos.push(correo);
            } else {
                correosInvalidos.push(correo);
            }
        }
        
        console.log('\n--- RESULTADOS DE VALIDACIÓN ---');
        console.log(`✅ Correos Válidos (${correosValidos.length}):`);
        correosValidos.forEach(c => console.log(`  - ${c}`));
        
        console.log(`\n❌ Correos Inválidos (${correosInvalidos.length}):`);
        correosInvalidos.forEach(c => console.log(`  - ${c}`));
        
    } catch (error) {
        console.error('Error al leer el archivo:', error.message);
    }
}

// Ejecutar el validador
validarCorreos('emails_socios.csv');
