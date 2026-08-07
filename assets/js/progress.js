// Fortschritts- und Freischaltungslogik – Bildwerkstatt Sonderwoche
// Speichert alles in localStorage, funktioniert komplett offline.

export const MODULES = [
  { num: 1, id: "modul1", title: "Urheberrecht an Fotos", path: "module/01-urheberrecht.html" },
  { num: 2, id: "modul2", title: "Recht am eigenen Bild", path: "module/02-recht-am-bild.html" },
  { num: 3, id: "modul3", title: "Datenschutz (revDSG)", path: "module/03-datenschutz.html" },
  { num: 4, id: "modul4", title: "Lizenzen, Stock & KI", path: "module/04-lizenzen-ki.html" },
  { num: 5, id: "modul5", title: "Praxis im Betrieb", path: "module/05-praxis-betrieb.html" },
];

const TEST_PATH = "test/abschlusstest.html";
const CERT_PATH = "zertifikat.html";

const KEYS = {
  moduleStatus: (num) => `bws_modul${num}_status`,
  moduleScore: (num) => `bws_modul${num}_score`,
  testCompleted: "bws_test_completed",
  testScore: "bws_test_score",
  testTotal: "bws_test_total",
  testPercent: "bws_test_percent",
  testAnswers: "bws_test_answers",
  certName: "bws_cert_name",
  certCode: "bws_cert_code",
  certDate: "bws_cert_date",
};

export { KEYS };

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* localStorage evtl. nicht verfügbar (privater Modus) – Fortschritt geht dann nicht verloren, wird nur nicht gespeichert */
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

export function getModuleStatus(num) {
  return safeGet(KEYS.moduleStatus(num)) || "locked";
}

export function isModuleDone(num) {
  return getModuleStatus(num) === "done";
}

export function isModuleUnlocked(num) {
  if (num === 1) return true;
  return isModuleDone(num - 1);
}

export function markModuleDone(num, score) {
  safeSet(KEYS.moduleStatus(num), "done");
  if (typeof score !== "undefined") {
    safeSet(KEYS.moduleScore(num), String(score));
  }
}

export function isTestUnlocked() {
  return MODULES.every((m) => isModuleDone(m.num));
}

export function isTestCompleted() {
  return safeGet(KEYS.testCompleted) === "true";
}

// Der Abschlusstest kann beliebig oft wiederholt werden. "testCompleted" markiert
// nur, dass mindestens einmal ein Versuch abgeschlossen wurde (für die
// Gesamtfortschrittsanzeige); jeder neue Versuch überschreibt score/percent mit dem
// aktuellsten Ergebnis.
export function saveTestResult(score, total, percent, answers) {
  safeSet(KEYS.testCompleted, "true");
  safeSet(KEYS.testScore, String(score));
  safeSet(KEYS.testTotal, String(total));
  safeSet(KEYS.testPercent, String(percent));
  try {
    safeSet(KEYS.testAnswers, JSON.stringify(answers || []));
  } catch (e) {}
}

export function getTestResult() {
  return {
    completed: isTestCompleted(),
    score: Number(safeGet(KEYS.testScore) || 0),
    total: Number(safeGet(KEYS.testTotal) || 0),
    percent: Number(safeGet(KEYS.testPercent) || 0),
    answers: (() => {
      try {
        return JSON.parse(safeGet(KEYS.testAnswers) || "[]");
      } catch (e) {
        return [];
      }
    })(),
  };
}

export const TEST_PASS_PERCENT = 75;
export const MODULE_PASS_PERCENT = 80;

export function isCertUnlocked() {
  const r = getTestResult();
  return r.completed && r.percent >= TEST_PASS_PERCENT;
}

export function saveCertificate(name, code, date) {
  safeSet(KEYS.certName, name);
  safeSet(KEYS.certCode, code);
  safeSet(KEYS.certDate, date);
}

export function getCertificate() {
  return {
    name: safeGet(KEYS.certName) || "",
    code: safeGet(KEYS.certCode) || "",
    date: safeGet(KEYS.certDate) || "",
  };
}

// Gesamtfortschritt für Fortschrittsbalken: 5 Module + Test + Zertifikat = 7 Schritte
export function getOverallProgress() {
  let done = 0;
  const total = MODULES.length + 2;
  MODULES.forEach((m) => {
    if (isModuleDone(m.num)) done += 1;
  });
  if (isTestCompleted()) done += 1;
  if (getCertificate().code) done += 1;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export function resetAllProgress() {
  MODULES.forEach((m) => {
    safeRemove(KEYS.moduleStatus(m.num));
    safeRemove(KEYS.moduleScore(m.num));
  });
  safeRemove(KEYS.testCompleted);
  safeRemove(KEYS.testScore);
  safeRemove(KEYS.testTotal);
  safeRemove(KEYS.testPercent);
  safeRemove(KEYS.testAnswers);
  safeRemove(KEYS.certName);
  safeRemove(KEYS.certCode);
  safeRemove(KEYS.certDate);
}

// ---------- UI-Helfer ----------

function pathPrefix() {
  // Ermittelt relatives Präfix zur Root je nach Verzeichnistiefe der aktuellen Seite
  const path = window.location.pathname;
  if (path.includes("/module/") || path.includes("/test/")) return "../";
  return "";
}

export function renderProgressBar(container, currentStepLabel) {
  if (!container) return;
  const { done, total, percent } = getOverallProgress();
  container.innerHTML = `
    <div class="progress-wrap__label">
      <span>${currentStepLabel}</span>
      <span>${done} / ${total} abgeschlossen</span>
    </div>
    <div class="progress-bar"><div class="progress-bar__fill" style="width:${percent}%"></div></div>
  `;
}

export function renderModuleList(container) {
  if (!container) return;
  const prefix = pathPrefix();
  let html = "";
  MODULES.forEach((m) => {
    const unlocked = isModuleUnlocked(m.num);
    const done = isModuleDone(m.num);
    const statusIcon = done ? "✅" : unlocked ? "▶" : "🔒";
    const cls = ["module-item"];
    if (done) cls.push("is-done");
    if (!unlocked) cls.push("is-locked");
    const href = unlocked ? prefix + m.path : "#";
    const tag = unlocked ? "a" : "span";
    html += `
      <li>
        <${tag} class="${cls.join(" ")}" ${unlocked ? `href="${href}"` : 'aria-disabled="true"'}>
          <span class="module-item__num">${m.num}</span>
          <span class="module-item__body">
            <span class="module-item__title">${m.title}</span>
            <span class="module-item__meta">${done ? "Abgeschlossen" : unlocked ? "Bereit zum Start" : "Erst nach vorherigem Modul freigeschaltet"}</span>
          </span>
          <span class="module-item__status" aria-hidden="true">${statusIcon}</span>
        </${tag}>
      </li>`;
  });

  const testUnlocked = isTestUnlocked();
  const testDone = isTestCompleted();
  const testIcon = testDone ? "✅" : testUnlocked ? "▶" : "🔒";
  const testCls = ["module-item"];
  if (testDone) testCls.push("is-done");
  if (!testUnlocked) testCls.push("is-locked");
  const testHref = testUnlocked ? prefix + TEST_PATH : "#";
  const testTag = testUnlocked ? "a" : "span";
  html += `
    <li>
      <${testTag} class="${testCls.join(" ")}" ${testUnlocked ? `href="${testHref}"` : 'aria-disabled="true"'}>
        <span class="module-item__num">T</span>
        <span class="module-item__body">
          <span class="module-item__title">Abschlusstest</span>
          <span class="module-item__meta">${testDone ? "Schon versucht – beliebig wiederholbar" : testUnlocked ? "Bereit zum Start" : "Erst nach allen 5 Modulen freigeschaltet"}</span>
        </span>
        <span class="module-item__status" aria-hidden="true">${testIcon}</span>
      </${testTag}>
    </li>`;

  const certUnlocked = isCertUnlocked();
  const hasCert = !!getCertificate().code;
  const certIcon = hasCert ? "✅" : certUnlocked ? "▶" : "🔒";
  const certCls = ["module-item"];
  if (hasCert) certCls.push("is-done");
  if (!certUnlocked) certCls.push("is-locked");
  const certHref = certUnlocked ? prefix + CERT_PATH : "#";
  const certTag = certUnlocked ? "a" : "span";
  html += `
    <li>
      <${certTag} class="${certCls.join(" ")}" ${certUnlocked ? `href="${certHref}"` : 'aria-disabled="true"'}>
        <span class="module-item__num">🎓</span>
        <span class="module-item__body">
          <span class="module-item__title">Bestätigung / Zertifikat</span>
          <span class="module-item__meta">${hasCert ? "Erstellt" : certUnlocked ? "Bereit zum Erstellen" : "Erst nach bestandenem Test (ab " + TEST_PASS_PERCENT + "%)"}</span>
        </span>
        <span class="module-item__status" aria-hidden="true">${certIcon}</span>
      </${certTag}>
    </li>`;

  container.innerHTML = html;
}

export function setupResetButton(button) {
  if (!button) return;
  button.addEventListener("click", () => {
    const ok = window.confirm(
      "Willst du wirklich deinen gesamten Fortschritt löschen? Alle Module, der Test und dein Zertifikat werden zurückgesetzt. Das kann nicht rückgängig gemacht werden."
    );
    if (!ok) return;
    resetAllProgress();
    const prefix = pathPrefix();
    window.location.href = prefix ? prefix + "index.html" : "index.html";
  });
}

// Sperrt eine Modul-/Test-/Zertifikatsseite, falls Voraussetzung nicht erfüllt,
// und leitet mit Hinweis zurück zur Startseite.
export function enforceUnlock(kind, num) {
  const prefix = pathPrefix();
  let unlocked = true;
  if (kind === "module") unlocked = isModuleUnlocked(num);
  if (kind === "test") unlocked = isTestUnlocked();
  if (kind === "cert") unlocked = isCertUnlocked();
  if (!unlocked) {
    window.location.href = prefix + "index.html";
  }
  return unlocked;
}

export function renderModuleNav(container, currentNum) {
  if (!container) return;
  const prefix = pathPrefix();
  const prevM = MODULES.find((m) => m.num === currentNum - 1);
  const nextM = MODULES.find((m) => m.num === currentNum + 1);
  let leftHtml = `<a class="btn btn--secondary" href="${prefix}index.html">← Übersicht</a>`;
  if (prevM) {
    leftHtml = `<a class="btn btn--secondary" href="${prefix}${prevM.path}">← Modul ${prevM.num}</a>`;
  }
  let rightHtml = "";
  if (nextM) {
    const unlocked = isModuleUnlocked(nextM.num);
    rightHtml = unlocked
      ? `<a class="btn" href="${prefix}${nextM.path}">Modul ${nextM.num} →</a>`
      : `<button class="btn is-disabled" disabled>Modul ${nextM.num} 🔒</button>`;
  } else {
    const testUnlocked = isTestUnlocked();
    rightHtml = testUnlocked
      ? `<a class="btn" href="${prefix}${TEST_PATH}">Zum Abschlusstest →</a>`
      : `<button class="btn is-disabled" disabled>Abschlusstest 🔒</button>`;
  }
  container.innerHTML = `${leftHtml}${rightHtml}`;
}
