// Zertifikats-/Bestätigungslogik – Bildwerkstatt Sonderwoche
// Erzeugt einen einfachen, nicht fälschungssicheren Bearbeitungscode als Nachweis.

import { getTestResult, getCertificate, saveCertificate } from "./progress.js";

function generateCode(name, percent, dateObj) {
  const raw = `${name}|${percent}%|${dateObj.toISOString()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  let b64;
  try {
    b64 = btoa(unescape(encodeURIComponent(raw)))
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8);
  } catch (e) {
    b64 = "XXXXXXXX";
  }
  const checksum = hash.toString(36).toUpperCase().slice(0, 4);
  return `BWS-${b64}-${checksum}`;
}

function formatDate(dateObj) {
  const datum = dateObj.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const zeit = dateObj.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  return { datum, zeit };
}

export function initCertificate(rootEl) {
  if (!rootEl) return;

  const existing = getCertificate();
  if (existing.code) {
    renderCertificate(rootEl, existing.name, existing.date, existing.code, getTestResult());
    return;
  }

  const result = getTestResult();
  rootEl.innerHTML = `
    <section class="card">
      <h2>Bestätigung erstellen</h2>
      <p>Du hast den Abschlusstest mit <strong>${result.percent}%</strong>
        bestanden. Gib deinen Namen ein, um deine Bestätigung zu erstellen.</p>
      <form id="cert-form" novalidate>
        <label for="cert-name">Dein vollständiger Name</label>
        <input type="text" id="cert-name" name="cert-name" required placeholder="Vorname Nachname" autocomplete="name">
        <div class="btn-row">
          <button type="submit" class="btn">Bestätigung erstellen</button>
        </div>
      </form>
    </section>
  `;

  const form = document.getElementById("cert-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("cert-name");
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    const now = new Date();
    const code = generateCode(name, result.percent, now);
    saveCertificate(name, code, now.toISOString());
    renderCertificate(rootEl, name, now.toISOString(), code, result);
  });
}

function renderCertificate(rootEl, name, dateISO, code, result) {
  const dateObj = new Date(dateISO);
  const { datum, zeit } = formatDate(dateObj);
  rootEl.innerHTML = `
    <div class="certificate">
      <div class="certificate__title">Bildwerkstatt Sonderwoche – Bestätigung</div>
      <p class="text-muted mb-0">hat die Bildwerkstatt zu Schweizer Medien- und Bildrecht erfolgreich abgeschlossen</p>
      <div class="certificate__name">${escapeHtml(name)}</div>
      <div class="certificate__meta">
        <div><strong>${datum}</strong>Datum</div>
        <div><strong>${zeit}</strong>Uhrzeit</div>
        <div><strong>${result.percent}%</strong>Ergebnis Abschlusstest</div>
      </div>
      <div class="certificate__code">${code}</div>
      <p class="text-muted" style="margin-top:1rem; font-size:0.82rem;">
        Der Bearbeitungscode ist ein einfacher, automatisch generierter Nachweis
        (kein fälschungssicheres Zertifikat) dafür, dass die Bildwerkstatt an diesem
        Datum auf diesem Gerät abgeschlossen wurde.
      </p>
    </div>
    <div class="box box--info no-print">
      <strong>Bitte zeige diese Seite oder einen Ausdruck deiner Lehrperson.</strong>
    </div>
    <div class="btn-row no-print">
      <button type="button" class="btn" onclick="window.print()">Drucken / Als PDF speichern</button>
      <a class="btn btn--secondary" href="index.html">Zurück zur Übersicht</a>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
