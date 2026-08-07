// Test-Engine – Bildwerkstatt Sonderwoche
// Zieht 12 zufällige Fragen aus dem Pool (mind. 1 pro Modul 1–5, mind. 1 K-Prim-
// und 1 Lückentext-Frage), randomisiert Szenario-Variablen und wertet den Test
// in Prozent aus. Richtige Antworten werden nie angezeigt – nur das Gesamtergebnis
// in Prozent. Der Test kann beliebig oft wiederholt werden (jeder Versuch zieht
// neue, zufällige Fragen).

import { saveTestResult, getTestResult, TEST_PASS_PERCENT } from "./progress.js";

const QUESTIONS_URL = "../data/questions.json";
const TOTAL_QUESTIONS = 12;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillText(text, name, plattform) {
  if (typeof text !== "string") return text;
  return text.replace(/\{\{name\}\}/g, name).replace(/\{\{plattform\}\}/g, plattform);
}

// Wählt pro Frage EINEN zufälligen Namen und EINE zufällige Plattform und setzt
// sie überall in der Frage konsistent ein (Szenario, Frage, Optionen, Aussagen) –
// damit nicht in Szenario "Lea" und in einer Antwortoption plötzlich "Noah" steht.
function fillVariables(q, variablen) {
  const name = pick(variablen.name);
  const plattform = pick(variablen.plattform);
  const copy = JSON.parse(JSON.stringify(q));
  if (copy.szenario) copy.szenario = fillText(copy.szenario, name, plattform);
  if (copy.frage) copy.frage = fillText(copy.frage, name, plattform);
  if (copy.optionen) {
    copy.optionen = copy.optionen.map((o) => fillText(o, name, plattform));
  }
  if (copy.aussagen) {
    copy.aussagen = copy.aussagen.map((a) => ({ ...a, text: fillText(a.text, name, plattform) }));
  }
  return copy;
}

function selectQuestions(pool) {
  const byModul = {};
  pool.forEach((q) => {
    byModul[q.modul] = byModul[q.modul] || [];
    byModul[q.modul].push(q);
  });

  const chosen = [];
  const usedIds = new Set();

  [1, 2, 3, 4, 5].forEach((modul) => {
    const options = byModul[modul];
    if (options && options.length) {
      const q = pick(options);
      chosen.push(q);
      usedIds.add(q.id);
    }
  });

  function ensureType(typ) {
    if (chosen.some((q) => q.typ === typ)) return;
    const options = pool.filter((q) => q.typ === typ && !usedIds.has(q.id));
    if (options.length) {
      const q = pick(options);
      chosen.push(q);
      usedIds.add(q.id);
    }
  }
  ensureType("kprim");
  ensureType("luecke");

  const remaining = shuffle(pool.filter((q) => !usedIds.has(q.id)));
  while (chosen.length < TOTAL_QUESTIONS && remaining.length) {
    chosen.push(remaining.pop());
  }

  return shuffle(chosen);
}

function normalizeAnswer(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?"'’]/g, "")
    .replace(/\s+/g, " ");
}

export async function initQuiz(rootEl) {
  if (!rootEl) return;

  let data;
  try {
    const res = await fetch(QUESTIONS_URL);
    data = await res.json();
  } catch (e) {
    rootEl.innerHTML = `<div class="exercise-feedback is-visible is-incorrect">Fragenpool konnte nicht geladen werden. Bitte Seite neu laden.</div>`;
    return;
  }

  startAttempt(rootEl, data);
}

function startAttempt(rootEl, data) {
  const selected = selectQuestions(data.fragen).map((q) => fillVariables(q, data.variablen));
  renderQuiz(rootEl, selected, data);
}

function renderQuiz(rootEl, questions, data) {
  const prev = getTestResult();
  let html = "";

  if (prev.completed) {
    html += `
      <div class="box box--info">
        <strong>Letztes Ergebnis auf diesem Gerät:</strong> ${prev.percent}%
        (${prev.percent >= TEST_PASS_PERCENT ? "bestanden" : "noch nicht bestanden"}).
        Du kannst den Test beliebig oft wiederholen – bei jedem Versuch bekommst du
        neue, zufällig zusammengestellte Fragen.
      </div>
    `;
  }

  html += `<form id="quiz-form" novalidate>`;
  questions.forEach((q, i) => {
    html += `<div class="exercise-item" data-qid="${q.id}" data-typ="${q.typ}">`;
    html += `<div class="tag">Frage ${i + 1} von ${questions.length}</div>`;
    if (q.szenario) html += `<p><strong>${q.szenario}</strong></p>`;

    if (q.typ === "mc") {
      html += `<p>${q.frage}</p>`;
      html += `<div class="tree-options" role="radiogroup" aria-label="Antwortoptionen">`;
      html += q.optionen
        .map(
          (opt, idx) => `
          <label class="tree-option-btn" style="display:flex; align-items:flex-start; gap:0.6em; cursor:pointer;">
            <input type="radio" name="mc-${q.id}" value="${idx}" style="margin-top:4px; width:20px; height:20px; flex-shrink:0;" required>
            <span>${opt}</span>
          </label>`
        )
        .join("");
      html += `</div>`;
      html += `<label for="txt-${q.id}" style="margin-top:1rem;">Begründe deine Antwort in 1–2 Sätzen</label>`;
      html += `<textarea id="txt-${q.id}" name="txt-${q.id}" required placeholder="Deine Begründung..."></textarea>`;
      html += `<p class="text-muted" style="font-size:0.82rem;">Deine Begründung wird nicht automatisch bewertet, hilft der Lehrperson aber zu sehen, ob du das Konzept verstanden hast.</p>`;
    } else if (q.typ === "kprim") {
      html += `<p><strong>${q.frage}</strong></p>`;
      html += `<p class="text-muted" style="font-size:0.85rem;">K-Prim-Frage: Beurteile jede der 4 Aussagen einzeln als richtig oder falsch.</p>`;
      q.aussagen.forEach((a, idx) => {
        html += `
          <div class="exercise-item" style="margin-bottom:0.6rem;">
            <p class="mb-0">${idx + 1}. ${a.text}</p>
            <div class="btn-row" style="margin-top:0.5rem;">
              <label class="tree-option-btn" style="flex:1; text-align:center;">
                <input type="radio" name="kprim-${q.id}-${idx}" value="true" required> Richtig
              </label>
              <label class="tree-option-btn" style="flex:1; text-align:center;">
                <input type="radio" name="kprim-${q.id}-${idx}" value="false" required> Falsch
              </label>
            </div>
          </div>`;
      });
    } else if (q.typ === "luecke") {
      const parts = q.frage.split("___");
      html += `<p><label for="luecke-${q.id}">${parts[0] || ""}
        <input type="text" id="luecke-${q.id}" name="luecke-${q.id}" required style="display:inline-block; width:auto; min-width:140px; margin:0 0.3em;">
        ${parts[1] || ""}</label></p>`;
    }

    html += `<div class="exercise-feedback" data-role="q-feedback"></div>`;
    html += `</div>`;
  });
  html += `
    <div id="quiz-error" class="exercise-feedback is-incorrect" style="display:none;"></div>
    <div class="btn-row">
      <button type="submit" class="btn btn--block">Test abgeben</button>
    </div>
  </form>
  <div id="quiz-summary"></div>
  `;
  rootEl.innerHTML = html;

  const form = document.getElementById("quiz-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitQuiz(questions, form, rootEl, data);
  });
}

function submitQuiz(questions, form, rootEl, data) {
  const errorEl = document.getElementById("quiz-error");
  let allAnswered = true;
  const results = [];

  questions.forEach((q) => {
    if (q.typ === "mc") {
      const mcInput = form.querySelector(`input[name="mc-${q.id}"]:checked`);
      const txtInput = form.querySelector(`#txt-${q.id}`);
      const txtVal = (txtInput.value || "").trim();
      if (!mcInput || txtVal.length < 5) allAnswered = false;
      const gewaehlt = mcInput ? Number(mcInput.value) : null;
      const punkte = gewaehlt === q.loesung ? 1 : 0;
      results.push({
        typ: "mc",
        frage: q.frage,
        eigeneAntwort: gewaehlt !== null ? q.optionen[gewaehlt] : "(keine Antwort)",
        begruendung: txtVal,
        punkte,
        max: 1,
      });
    } else if (q.typ === "kprim") {
      const antworten = [];
      let beantwortet = true;
      q.aussagen.forEach((a, idx) => {
        const checked = form.querySelector(`input[name="kprim-${q.id}-${idx}"]:checked`);
        if (!checked) beantwortet = false;
        antworten.push(checked ? checked.value === "true" : null);
      });
      if (!beantwortet) allAnswered = false;
      let korrekt = 0;
      q.aussagen.forEach((a, idx) => {
        if (antworten[idx] === a.richtig) korrekt++;
      });
      const punkte = korrekt === 4 ? 1 : korrekt === 3 ? 0.5 : 0;
      results.push({
        typ: "kprim",
        frage: q.frage,
        eigeneAntwort: q.aussagen.map((a, idx) => `${idx + 1}) ${antworten[idx] === true ? "richtig" : antworten[idx] === false ? "falsch" : "–"}`).join(", "),
        begruendung: "",
        punkte,
        max: 1,
      });
    } else if (q.typ === "luecke") {
      const input = form.querySelector(`#luecke-${q.id}`);
      const val = (input.value || "").trim();
      if (val.length < 1) allAnswered = false;
      const norm = normalizeAnswer(val);
      const korrekt = (q.antworten || []).some((a) => normalizeAnswer(a) === norm);
      results.push({
        typ: "luecke",
        frage: q.frage,
        eigeneAntwort: val || "(keine Antwort)",
        begruendung: "",
        punkte: korrekt ? 1 : 0,
        max: 1,
      });
    }
  });

  if (!allAnswered) {
    errorEl.style.display = "block";
    errorEl.innerHTML = "<strong>Bitte beantworte alle Fragen vollständig</strong> bevor du abgibst.";
    errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errorEl.style.display = "none";

  form.querySelectorAll("input, textarea, button").forEach((el) => (el.disabled = true));

  const totalPunkte = results.reduce((sum, r) => sum + r.punkte, 0);
  const maxPunkte = results.reduce((sum, r) => sum + r.max, 0);
  const percent = Math.round((totalPunkte / maxPunkte) * 100);

  saveTestResult(totalPunkte, maxPunkte, percent, results);
  renderSummary(percent, results, rootEl, data);
}

function renderSummary(percent, results, rootEl, data) {
  const summaryEl = document.getElementById("quiz-summary");
  const passed = percent >= TEST_PASS_PERCENT;
  let html = `
    <div class="exercise-summary is-visible no-print">
      <h2>${percent}%</h2>
      <p>${passed ? "Bestanden! Du kannst jetzt deine Bestätigung erstellen." : "Noch nicht bestanden (mind. " + TEST_PASS_PERCENT + "% nötig)."} Die richtigen Antworten werden nicht angezeigt – du kannst den Test aber jederzeit mit neuen Fragen wiederholen.</p>
      <div class="btn-row">
        ${passed ? '<a class="btn" href="../zertifikat.html">Zur Bestätigung →</a>' : ""}
        <button type="button" class="btn btn--secondary" id="quiz-retry-btn">Test wiederholen (neue Fragen)</button>
        <a class="btn btn--secondary" href="../index.html">Zurück zur Übersicht</a>
        <button type="button" class="btn btn--secondary" onclick="window.print()">Drucken / Als PDF speichern</button>
      </div>
    </div>
    <div class="card" style="margin-top:1.5rem;">
      <h3>Deine Antworten im Überblick</h3>
      <p class="text-muted" style="font-size:0.85rem;">Zur eigenen Kontrolle und zum Zeigen bei der Lehrperson – ob eine Antwort richtig war, wird hier bewusst nicht angezeigt.</p>
      ${results
        .map(
          (r, i) => `
        <div class="exercise-item">
          <strong>Frage ${i + 1}:</strong> ${r.frage}<br>
          <span class="text-muted">Deine Antwort: ${r.eigeneAntwort}</span>
          ${r.begruendung ? `<br><span class="text-muted">Deine Begründung: „${r.begruendung}”</span>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  `;
  summaryEl.innerHTML = html;

  document.getElementById("quiz-retry-btn").addEventListener("click", () => {
    startAttempt(rootEl, data);
    rootEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  summaryEl.scrollIntoView({ behavior: "smooth", block: "start" });
}
