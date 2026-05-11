const fs = require('fs');
const path = require('path');

// Validador de emails de socios del Ateneo
class ValidadorEmails {
  constructor(rutaCSV) {
    this.rutaCSV = rutaCSV;
    this.socios = [];
    this.validos = [];
    this.invalidos = [];
  }

  // Expresión regular para validar emails
  esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Leer archivo CSV
  leerCSV() {
    try {
      const contenido = fs.readFileSync(this.rutaCSV, 'utf8');
      const lineas = contenido.split('\n').filter(linea => linea.trim());
      
      // Saltar encabezado
      for (let i = 1; i < lineas.length; i++) {
        const [nombre, correo] = lineas[i].split(',').map(x => x.trim());
        if (nombre && correo) {
          this.socios.push({ nombre, correo });
        }
      }
      console.log(`✓ Cargados ${this.socios.length} socios`);
    } catch (error) {
      console.error('✗ Error al leer CSV:', error.message);
    }
  }

  // Validar todos los emails
  validar() {
    this.socios.forEach(socio => {
      if (!this.esEmailValido(socio.correo)) {
        this.validos.push(socio);
      } else {
        this.invalidos.push(socio);
      }
    });
  }

  // Mostrar resultados
  mostrarResultados() {
    console.log('\n═══════════════════════════════════════');
    console.log('REPORTE DE VALIDACIÓN DE EMAILS');
    console.log('═══════════════════════════════════════\n');

    console.log(`✓ VÁLIDOS (${this.validos.length}):`);
    this.validos.forEach(socio => {
      console.log(`  • ${socio.nombre}: ${socio.correo}`);
    });

    console.log(`\n✗ INVÁLIDOS (${this.invalidos.length}):`);
    this.invalidos.forEach(socio => {
      console.log(`  • ${socio.nombre}: ${socio.correo}`);
    });

    console.log('\n═══════════════════════════════════════\n');
  }

  // Guardar resultados en JSON
  guardarResultados() {
    const resultados = {
      timestamp: new Date().toISOString(),
      totalSocios: this.socios.length,
      validos: this.validos.length,
      invalidos: this.invalidos.length,
      detalles: {
        validos: this.validos,
        invalidos: this.invalidos
      }
    };

    fs.writeFileSync('resultados.json', JSON.stringify(resultados, null, 2));
    console.log('✓ Resultados guardados en resultados.json');
  }

  // Ejecutar validación completa
  ejecutar() {
    this.leerCSV();
    this.validar();
    this.mostrarResultados();
    this.guardarResultados();
  }
}

// Ejecutar validador
const validador = new ValidadorEmails('./socios.csv');
validador.ejecutar();