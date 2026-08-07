// Test-Engine – Bildwerkstatt Sonderwoche
// Zieht 8 zufällige Fragen aus dem Pool (mind. 1 pro Modul 1–5), randomisiert
// Szenario-Variablen und wertet den Test aus. Lösungen werden erst nach Abgabe
// eingeblendet, nie vorher im DOM.

import { saveTestResult, isTestCompleted, getTestResult } from "./progress.js";

const QUESTIONS_URL = "../data/questions.json";
const TOTAL_QUESTIONS = 8;
const PASS_THRESHOLD = 6;

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

function fillVariables(text, variablen) {
  return text
    .replace(/\{\{name\}\}/g, () => pick(variablen.name))
    .replace(/\{\{plattform\}\}/g, () => pick(variablen.plattform));
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

  const remaining = shuffle(pool.filter((q) => !usedIds.has(q.id)));
  while (chosen.length < TOTAL_QUESTIONS && remaining.length) {
    chosen.push(remaining.pop());
  }

  return shuffle(chosen);
}

export async function initQuiz(rootEl) {
  if (!rootEl) return;

  if (isTestCompleted()) {
    renderAlreadyDone(rootEl);
    return;
  }

  let data;
  try {
    const res = await fetch(QUESTIONS_URL);
    data = await res.json();
  } catch (e) {
    rootEl.innerHTML = `<div class="exercise-feedback is-visible is-incorrect">Fragenpool konnte nicht geladen werden. Bitte Seite neu laden.</div>`;
    return;
  }

  const selected = selectQuestions(data.fragen).map((q) => ({
    ...q,
    szenario: fillVariables(q.szenario, data.variablen),
    frage: fillVariables(q.frage, data.variablen),
  }));

  renderQuiz(rootEl, selected);
}

function renderAlreadyDone(rootEl) {
  const r = getTestResult();
  rootEl.innerHTML = `
    <div class="box box--info">
      <h3>Test bereits abgeschlossen</h3>
      <p>Du hast den Abschlusstest auf diesem Gerät bereits durchlaufen: <strong>${r.score} / ${r.total}</strong> richtige Antworten.</p>
      <p class="text-muted">Ein erneuter Testdurchlauf ist nur über den kompletten Reset des Fortschritts (Fusszeile) möglich – dabei geht aber der gesamte übrige Fortschritt ebenfalls verloren.</p>
    </div>
  `;
}

function renderQuiz(rootEl, questions) {
  let html = `<form id="quiz-form" novalidate>`;
  questions.forEach((q, i) => {
    html += `
      <div class="exercise-item" data-qid="${q.id}">
        <div class="tag">Frage ${i + 1} von ${questions.length}</div>
        <p><strong>${q.szenario}</strong></p>
        <p>${q.frage}</p>
        <div class="tree-options" role="radiogroup" aria-label="Antwortoptionen">
          ${q.optionen
            .map(
              (opt, idx) => `
            <label class="tree-option-btn" style="display:flex; align-items:flex-start; gap:0.6em; cursor:pointer;">
              <input type="radio" name="mc-${q.id}" value="${idx}" style="margin-top:4px; width:20px; height:20px; flex-shrink:0;" required>
              <span>${opt}</span>
            </label>`
            )
            .join("")}
        </div>
        <label for="txt-${q.id}" style="margin-top:1rem;">Begründe deine Antwort in 1–2 Sätzen</label>
        <textarea id="txt-${q.id}" name="txt-${q.id}" required placeholder="Deine Begründung..."></textarea>
        <p class="text-muted" style="font-size:0.82rem;">Deine Begründung wird nicht automatisch bewertet, hilft der Lehrperson aber zu sehen, ob du das Konzept verstanden hast.</p>
        <div class="exercise-feedback" data-role="q-feedback"></div>
      </div>
    `;
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
    submitQuiz(questions, form, rootEl);
  });
}

function submitQuiz(questions, form, rootEl) {
  const errorEl = document.getElementById("quiz-error");
  const answers = [];
  let allAnswered = true;

  questions.forEach((q) => {
    const mcInput = form.querySelector(`input[name="mc-${q.id}"]:checked`);
    const txtInput = form.querySelector(`#txt-${q.id}`);
    const txtVal = (txtInput.value || "").trim();
    if (!mcInput || txtVal.length < 5) {
      allAnswered = false;
    }
    answers.push({
      id: q.id,
      szenario: q.szenario,
      frage: q.frage,
      gewaehlt: mcInput ? Number(mcInput.value) : null,
      begruendungEigen: txtVal,
      loesung: q.loesung,
      optionen: q.optionen,
      musterbegruendung: q.musterbegruendung,
    });
  });

  if (!allAnswered) {
    errorEl.style.display = "block";
    errorEl.innerHTML = "<strong>Bitte beantworte alle Fragen</strong> (Multiple-Choice-Auswahl und mindestens ein kurzer Begründungssatz) bevor du abgibst.";
    errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errorEl.style.display = "none";

  let score = 0;
  answers.forEach((a) => {
    const correct = a.gewaehlt === a.loesung;
    if (correct) score++;
    const itemEl = form.querySelector(`.exercise-item[data-qid="${a.id}"]`);
    const fb = itemEl.querySelector('[data-role="q-feedback"]');
    fb.className = "exercise-feedback is-visible " + (correct ? "is-correct" : "is-incorrect");
    fb.innerHTML = `
      <strong>${correct ? "Richtig!" : "Nicht ganz."}</strong>
      Richtige Antwort: „${a.optionen[a.loesung]}”<br>
      <span class="text-muted">${a.musterbegruendung}</span>
    `;
    itemEl.querySelectorAll("input, textarea").forEach((el) => (el.disabled = true));
  });

  form.querySelector("button[type=submit]").disabled = true;
  form.querySelector("button[type=submit]").textContent = "Test abgegeben";

  saveTestResult(score, questions.length, answers);
  renderSummary(score, questions.length, answers);
}

function renderSummary(score, total, answers) {
  const summaryEl = document.getElementById("quiz-summary");
  const passed = score >= PASS_THRESHOLD;
  let html = `
    <div class="exercise-summary is-visible no-print">
      <h2>${score} / ${total} richtig</h2>
      <p>${passed ? "Bestanden! Du kannst jetzt deine Bestätigung erstellen." : "Noch nicht bestanden (mind. " + PASS_THRESHOLD + " von " + total + " nötig). Du kannst deine Antworten unten trotzdem nachlesen und ausdrucken."}</p>
      <div class="btn-row">
        ${passed ? '<a class="btn" href="../zertifikat.html">Zur Bestätigung →</a>' : ""}
        <a class="btn btn--secondary" href="../index.html">Zurück zur Übersicht</a>
        <button type="button" class="btn btn--secondary" onclick="window.print()">Drucken / Als PDF speichern</button>
      </div>
    </div>
    <div class="card" style="margin-top:1.5rem;">
      <h3>Deine Antworten im Überblick</h3>
      ${answers
        .map(
          (a, i) => `
        <div class="exercise-item">
          <strong>Frage ${i + 1}:</strong> ${a.frage}<br>
          <span class="text-muted">Deine Antwort: ${a.optionen[a.gewaehlt]} ${a.gewaehlt === a.loesung ? "✅" : "❌"}</span><br>
          <span class="text-muted">Deine Begründung: „${a.begruendungEigen}”</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;
  summaryEl.innerHTML = html;
  summaryEl.scrollIntoView({ behavior: "smooth", block: "start" });
}
