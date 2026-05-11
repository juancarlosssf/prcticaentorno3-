# Validador de Emails - Socios Ateneo

## 📋 Descripción
Sistema de validación de emails para socios del Ateneo. Identifica direcciones de correo válidas e inválidas usando expresiones regulares.

## 🚀 Características
- ✓ Validación de emails con regex
- ✓ Lectura de archivos CSV
- ✓ Interfaz web interactiva
- ✓ Generación de reportes JSON
- ✓ Script Node.js para procesamiento por lotes

## 📁 Estructura
```
Proyecto claude/
├── index.html         # Interfaz web
├── validador.js       # Script Node.js
├── socios.csv         # Datos de ejemplo
├── package.json       # Dependencias
└── README.md          # Este archivo
```

## 🛠️ Uso

### Desde Node.js
```bash
npm install
npm start
```

### Desde navegador
Abre `index.html` en tu navegador y carga un archivo CSV.

## 📝 Formato CSV
```
nombre,correo
Juan Perez,juan.perez@example.com
Maria Gomez,mariagomez@example.com
```

## ⚙️ Validación
Se considera email válido si cumple:
- Contiene caracteres antes del @
- Contiene un dominio con punto
- No contiene espacios