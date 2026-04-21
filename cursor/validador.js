const fs = require("fs");
const path = require("path");
const csvPath = path.join(__dirname, "socios.csv");
// Regex practical para validar formato de email común.
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
try {
  const contenido = fs.readFileSync(csvPath, "utf8");
  const lineas = contenido
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
  const validos = [];
  const invalidos = [];
  for (const email of lineas) {
    if (emailRegex.test(email)) {
      validos.push(email);
    } else {
      invalidos.push(email);
    }
  }
  console.log("=== Emails válidos ===");
  if (validos.length === 0) {
    console.log("(ninguno)");
  } else {
    validos.forEach((email) => console.log(email));
  }
  console.log("=== Emails inválidos ===");
  if (invalidos.length === 0) {
    console.log("(ninguno)");
  } else {
    invalidos.forEach((email) => console.log(email));
  }
} catch (error) {
  console.error("Error al procesar el archivo:", error);
}