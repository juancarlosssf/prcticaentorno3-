/**
 * Validador de correos desde CSV (cliente).
 * Columna de email: se detecta por cabecera (correo, email, e-mail, mail) o por índice si no hay cabecera clara.
 */

const SAMPLE_CSV = `nombre,correo,notas
Ana Pérez,ana@ateneo.org,socia activa
Luis Gómez,luis-mal-email,sin @
María López,maria_lopez@sub.dominio.co,OK
Pedro Ruiz,,vacío
Carmen Díaz,carmen @ateneo.org,espacio
Javier Núñez,"javier@ateneo.org",comillas en CSV
Elena Soto,elena@@ateneo.org,doble arroba
`;

/** @typedef {{ index: number, lineText: string, email: string, valid: boolean, reason: string }} ResultRow */

/** @type {{ rows: ResultRow[] } | null} */
let lastRun = null;

const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
};

function detectDelimiter(firstLine) {
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  return semis > commas ? ";" : ",";
}

function parseCSVLine(line, delimiter) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function stripBOM(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseCSV(text) {
  const raw = stripBOM(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) return { delimiter: ",", lines: [] };

  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const delimiter = detectDelimiter(lines[0]);
  const rows = lines.map((l) => parseCSVLine(l, delimiter));
  return { delimiter, rows };
}

function findEmailColumnIndex(headerCells) {
  const patterns = [/^e-?mail$/i, /^correo$/i, /^mail$/i];
  for (let i = 0; i < headerCells.length; i++) {
    const h = headerCells[i].replace(/^\uFEFF/, "").trim();
    if (patterns.some((re) => re.test(h))) return i;
  }
  return -1;
}

/**
 * Heurística: si la primera fila parece cabecera (no hay @ en celdas), úsala.
 * Si no, asumimos que el correo está en la última columna con @ o en la segunda.
 */
function extractEmailRows(parsed) {
  const { rows } = parsed;
  if (rows.length === 0) return { header: null, dataRows: [], emailCol: 0 };

  const first = rows[0];
  const looksLikeHeader = !first.some((c) => c.includes("@"));

  if (looksLikeHeader) {
    const emailCol = findEmailColumnIndex(first);
    const col = emailCol >= 0 ? emailCol : Math.min(1, first.length - 1);
    return { header: first, dataRows: rows.slice(1), emailCol: col };
  }

  const colWithAt = first.findIndex((c) => c.includes("@"));
  const emailCol = colWithAt >= 0 ? colWithAt : Math.min(1, first.length - 1);
  return { header: null, dataRows: rows, emailCol };
}

/** @param {string} raw */
function validateEmail(raw) {
  const email = String(raw).trim();

  if (!email) {
    return { valid: false, reason: "Correo vacío" };
  }

  const noQuotes = email.replace(/^"+|"+$/g, "");
  if (noQuotes !== email) {
    return validateEmail(noQuotes);
  }

  if (/\s/.test(email)) {
    return { valid: false, reason: "Contiene espacios" };
  }

  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, reason: "Debe haber exactamente un @" };
  }

  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return { valid: false, reason: "Parte local o dominio vacíos" };
  }

  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { valid: false, reason: "Puntos consecutivos o mal colocados en la parte local" };
  }

  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return { valid: false, reason: "Dominio con puntos inválidos" };
  }

  if (!domain.includes(".")) {
    return { valid: false, reason: "El dominio debe incluir un punto (TLD)" };
  }

  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (tld.length < 2 || !/^[a-z0-9-]+$/i.test(tld)) {
    return { valid: false, reason: "TLD inválido o demasiado corto" };
  }

  const re =
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i;
  if (!re.test(email)) {
    return { valid: false, reason: "Formato no reconocido (caracteres o estructura)" };
  }

  if (email.length > 254) {
    return { valid: false, reason: "Longitud excesiva" };
  }

  return { valid: true, reason: "—" };
}

function buildResults(text) {
  const parsed = parseCSV(text);
  const { header, dataRows, emailCol } = extractEmailRows(parsed);

  /** @type {ResultRow[]} */
  const results = [];
  let lineOffset = header ? 2 : 1;

  dataRows.forEach((cells, i) => {
    const emailCell = cells[emailCol] ?? "";
    const v = validateEmail(emailCell);
    const lineText = cells.join(parsed.delimiter === ";" ? ";" : ",");
    results.push({
      index: i + lineOffset,
      lineText,
      email: emailCell,
      valid: v.valid,
      reason: v.reason,
    });
  });

  return { header, emailCol, results };
}

function setStatus(msg) {
  $("statusMsg").textContent = msg;
}

function renderTable(filter) {
  const tbody = $("resultBody");
  const emptyHint = $("emptyHint");
  tbody.replaceChildren();

  if (!lastRun || lastRun.rows.length === 0) {
    emptyHint.hidden = false;
    $("statsPanel").hidden = true;
    $("exportBtn").disabled = true;
    return;
  }

  emptyHint.hidden = true;
  const rows =
    filter === "valid"
      ? lastRun.rows.filter((r) => r.valid)
      : filter === "invalid"
        ? lastRun.rows.filter((r) => !r.valid)
        : lastRun.rows;

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.index}</td>
      <td class="mono">${escapeHtml(r.lineText)}</td>
      <td class="mono">${escapeHtml(r.email || "—")}</td>
      <td>
        <span class="badge ${r.valid ? "badge--ok" : "badge--bad"}">
          ${r.valid ? "Válido" : "Inválido"}
        </span>
      </td>
      <td>${escapeHtml(r.reason)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateStats(rows) {
  const ok = rows.filter((r) => r.valid).length;
  const bad = rows.length - ok;
  $("statTotal").textContent = String(rows.length);
  $("statOk").textContent = String(ok);
  $("statBad").textContent = String(bad);
  $("statsPanel").hidden = rows.length === 0;
  $("exportBtn").disabled = rows.length === 0;
}

function toResultCSV(rows) {
  const header = ["fila_csv", "correo", "valido", "motivo"];
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.index, r.email, r.valid ? "si" : "no", r.reason].map(esc).join(","),
    );
  }
  return lines.join("\n");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function runValidation(sourceLabel) {
  const text = $("pasteArea").value.trim();
  if (!text) {
    setStatus("No hay datos: pega un CSV o carga un archivo.");
    lastRun = null;
    renderTable($("filterSelect").value);
    return;
  }

  const { results } = buildResults(text);
  lastRun = { rows: results };
  updateStats(results);
  setStatus(
    `${sourceLabel}: ${results.length} fila(s) analizada(s). Columna de correo detectada automáticamente.`,
  );
  renderTable($("filterSelect").value);
}

function wireDropzone() {
  const dz = $("dropzone");
  const input = $("fileInput");
  const pick = $("pickFileBtn");

  const activate = () => dz.classList.add("dropzone--active");
  const deactivate = () => dz.classList.remove("dropzone--active");

  pick.addEventListener("click", () => input.click());

  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    activate();
  });
  dz.addEventListener("dragleave", () => deactivate());
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    deactivate();
    const f = e.dataTransfer?.files?.[0];
    if (f) readFile(f);
  });

  dz.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });

  input.addEventListener("change", () => {
    const f = input.files?.[0];
    if (f) readFile(f);
    input.value = "";
  });
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = typeof reader.result === "string" ? reader.result : "";
    $("pasteArea").value = text;
    runValidation(`Archivo «${file.name}»`);
  };
  reader.onerror = () => setStatus("No se pudo leer el archivo.");
  reader.readAsText(file, "UTF-8");
}

$("validateBtn").addEventListener("click", () => runValidation("Entrada manual"));
$("clearBtn").addEventListener("click", () => {
  $("pasteArea").value = "";
  lastRun = null;
  renderTable($("filterSelect").value);
  setStatus("");
  $("statTotal").textContent = "0";
  $("statOk").textContent = "0";
  $("statBad").textContent = "0";
});
$("loadSampleBtn").addEventListener("click", () => {
  $("pasteArea").value = SAMPLE_CSV;
  runValidation("Ejemplo incluido");
});
$("filterSelect").addEventListener("change", (e) => {
  const v = e.target.value;
  renderTable(v);
});
$("exportBtn").addEventListener("click", () => {
  if (!lastRun) return;
  downloadText("correos-validados.csv", toResultCSV(lastRun.rows));
});

wireDropzone();
renderTable("all");
