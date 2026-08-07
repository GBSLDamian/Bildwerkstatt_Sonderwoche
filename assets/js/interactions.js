// Interaktive Übungen – Bildwerkstatt Sonderwoche
// Reines Vanilla JS, kein jQuery, kein Framework.
// Jede initModuleX()-Funktion erwartet die passenden Container-IDs im jeweiligen Modul-HTML.

import { markModuleDone, MODULE_PASS_PERCENT } from "./progress.js";

/* ==========================================================================
   Modul 1 – Urheberrecht: Drag&Drop-Sortierspiel
   ========================================================================== */

const M1_ITEMS = [
  {
    id: "denkmal",
    text: "Ein Denkmal auf dem Marktplatz fotografieren und das Foto posten.",
    zone: "erlaubt",
    explain:
      "Erlaubt: Werke, die dauerhaft an einem öffentlich zugänglichen Ort stehen, dürfen dank der Panoramafreiheit (Art. 27 URG) fotografiert und die Fotos verbreitet werden.",
  },
  {
    id: "zeitung",
    text: "Einen Screenshot einer Zeitungsseite machen und ihn teilen.",
    zone: "nicht_erlaubt",
    explain:
      "Nicht erlaubt: Zeitungsseiten (Texte, Layout, Fotos) sind urheberrechtlich geschützt. Ein Screenshot-Teilen ohne Erlaubnis verletzt dieses Recht.",
  },
  {
    id: "selfie",
    text: "Ein Selfie vor dem Bahnhofsgebäude machen und posten.",
    zone: "erlaubt",
    explain:
      "Erlaubt: Das Bahnhofsgebäude von aussen (öffentlich zugänglicher Ort) darf dank Panoramafreiheit fotografiert werden – und du bist selbst Urheberin deines Selfies.",
  },
  {
    id: "bahnhofshalle",
    text: "Ein Foto aus dem Innern der Bahnhofshalle für Werbezwecke nutzen.",
    zone: "kommt_drauf_an",
    explain:
      "Kommt drauf an: Innenräume gelten in der Regel nicht als „allgemein zugänglicher Grund” im Sinn der Panoramafreiheit. Für eine kommerzielle Nutzung braucht es meist die Erlaubnis der Bahnbetreiberin.",
  },
  {
    id: "streetart",
    text: "Ein Foto von einem Wandbild (Street Art) an einer Hausfassade posten.",
    zone: "erlaubt",
    explain:
      "Erlaubt: Auch Street Art an dauerhaft öffentlich zugänglichen Orten fällt unter die Panoramafreiheit – das Foto darf verbreitet werden (2D-Reproduktion).",
  },
  {
    id: "produktfoto",
    text: "Ein Produktfoto eines Zulieferers 1:1 vom Online-Shop kopieren und für den eigenen Flyer nutzen.",
    zone: "nicht_erlaubt",
    explain:
      "Nicht erlaubt: Produktfotos sind geschützte Werke. Ohne Erlaubnis der Fotografin/des Fotografen dürfen sie nicht für eigene Zwecke übernommen werden.",
  },
  {
    id: "eigenes_foto",
    text: "Ein selbst geschossenes Foto der letzten Bergwanderung posten.",
    zone: "erlaubt",
    explain:
      "Erlaubt: Du bist die Urheberin/der Urheber dieses Fotos und entscheidest selbst, ob und wie du es verwendest (Art. 10 URG).",
  },
  {
    id: "meme",
    text: "Ein virales Meme-Bild (fremdes Foto plus Text) ohne Erlaubnis für Firmenwerbung verwenden.",
    zone: "nicht_erlaubt",
    explain:
      "Nicht erlaubt: Auch ein oft geteiltes „virales” Bild bleibt geschützt. Häufige Verbreitung ersetzt keine Erlaubnis – zusätzlich könnten abgebildete Personen betroffen sein.",
  },
];

const M1_ZONE_LABELS = {
  erlaubt: "Erlaubt",
  nicht_erlaubt: "Nicht erlaubt",
  kommt_drauf_an: "Kommt drauf an",
};

function makeDraggable(cardEl, onDrop) {
  cardEl.addEventListener("pointerdown", (e) => {
    if (cardEl.dataset.locked === "true") return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = cardEl.getBoundingClientRect();
    const clone = cardEl.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = rect.left + "px";
    clone.style.top = rect.top + "px";
    clone.style.width = rect.width + "px";
    clone.style.zIndex = "999";
    clone.style.pointerEvents = "none";
    clone.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    document.body.appendChild(clone);
    cardEl.classList.add("is-dragging");

    function clearZones() {
      document.querySelectorAll(".dnd-zone").forEach((z) => z.classList.remove("is-dragover"));
    }

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      clone.style.transform = `translate(${dx}px, ${dy}px)`;
      clearZones();
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = el && el.closest(".dnd-zone");
      if (zone) zone.classList.add("is-dragover");
    }

    function onUp(ev) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      clone.remove();
      cardEl.classList.remove("is-dragging");
      clearZones();
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = el && el.closest(".dnd-zone");
      if (zone) onDrop(zone.dataset.zone);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  });
}

export function initModule1() {
  const pool = document.getElementById("m1-pool");
  const feedback = document.getElementById("m1-feedback");
  const summary = document.getElementById("m1-summary");
  const completeBtn = document.getElementById("m1-complete-btn");
  if (!pool) return;

  function runAttempt() {
    pool.innerHTML = "";
    document.querySelectorAll(".dnd-zone__items").forEach((z) => (z.innerHTML = ""));
    feedback.className = "exercise-feedback";
    feedback.innerHTML = "";
    summary.className = "exercise-summary";
    summary.innerHTML = "";
    if (completeBtn) completeBtn.disabled = true;

    let placedCount = 0;
    let correctCount = 0;

    M1_ITEMS.forEach((item) => {
      const card = document.createElement("div");
      card.className = "dnd-card";
      card.id = "m1-card-" + item.id;
      card.dataset.locked = "false";
      card.innerHTML = `
        <span>${item.text}</span>
        <span class="dnd-card__buttons">
          <button type="button" class="dnd-card__btn" data-zone="erlaubt" aria-label="Als erlaubt einordnen">✓ erlaubt</button>
          <button type="button" class="dnd-card__btn" data-zone="nicht_erlaubt" aria-label="Als nicht erlaubt einordnen">✗ nicht</button>
          <button type="button" class="dnd-card__btn" data-zone="kommt_drauf_an" aria-label="Als kommt drauf an einordnen">? je nach</button>
        </span>
      `;
      pool.appendChild(card);

      function place(chosenZone) {
        if (card.dataset.locked === "true") return;
        card.dataset.locked = "true";
        const correct = chosenZone === item.zone;
        if (correct) correctCount++;
        placedCount++;

        const targetZone = document.querySelector(`.dnd-zone[data-zone="${chosenZone}"] .dnd-zone__items`);
        card.classList.remove("is-dragging");
        card.style.transform = "";
        card.style.borderColor = correct ? "var(--color-success)" : "var(--color-danger)";
        card.style.background = correct ? "var(--color-success-bg)" : "var(--color-danger-bg)";
        card.querySelectorAll("button").forEach((b) => (b.disabled = true));
        if (targetZone) targetZone.appendChild(card);

        feedback.className = "exercise-feedback is-visible " + (correct ? "is-correct" : "is-incorrect");
        feedback.innerHTML = `<strong>${correct ? "Richtig!" : "Nicht ganz."}</strong> Richtige Einordnung: „${M1_ZONE_LABELS[item.zone]}”. ${item.explain}`;

        if (placedCount === M1_ITEMS.length) {
          const percent = Math.round((correctCount / M1_ITEMS.length) * 100);
          const passed = percent >= MODULE_PASS_PERCENT;
          summary.className = "exercise-summary is-visible";
          if (passed) {
            summary.innerHTML = `<strong>${correctCount} von ${M1_ITEMS.length} richtig (${percent}%).</strong> Damit hast du die nötigen ${MODULE_PASS_PERCENT}% erreicht – du kannst das Modul jetzt abschliessen.`;
            if (completeBtn) completeBtn.disabled = false;
          } else {
            summary.innerHTML = `
              <strong>${correctCount} von ${M1_ITEMS.length} richtig (${percent}%).</strong>
              Für den Abschluss sind mindestens ${MODULE_PASS_PERCENT}% nötig. Schau dir die Begründungen nochmals an und versuch es erneut.
              <div class="btn-row"><button type="button" class="btn btn--secondary" id="m1-retry-btn">Nochmal versuchen</button></div>
            `;
            const retryBtn = document.getElementById("m1-retry-btn");
            if (retryBtn) retryBtn.addEventListener("click", runAttempt);
          }
        }
      }

      card.querySelectorAll(".dnd-card__btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          place(btn.dataset.zone);
        });
      });

      makeDraggable(card, place);
    });
  }

  runAttempt();

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      markModuleDone(1, "bestanden (≥" + MODULE_PASS_PERCENT + "%)");
      window.location.href = "../index.html";
    });
  }
}

/* ==========================================================================
   Modul 2 – Recht am eigenen Bild: Entscheidungsbaum
   ========================================================================== */

const M2_TREE = {
  q: "Ist die Person auf dem Foto erkennbar (Gesicht sichtbar oder eindeutig identifizierbar)?",
  yes: {
    q: "Liegt eine informierte Einwilligung der Person für genau diese Verwendung vor?",
    yes: {
      result: "erlaubt",
      title: "Posten grundsätzlich möglich",
      text: "Mit einer informierten Einwilligung für genau diesen Zweck darfst du das Foto verwenden. Achtung: Die Einwilligung kann jederzeit widerrufen werden – führt der Widerruf zu einem Schaden (z. B. bereits gedruckte Flyer), kann das eine Schadenersatzpflicht auslösen.",
    },
    no: {
      q: "Ist die Person nur zufälliges „Beiwerk” im öffentlichen Raum, ohne dass sie besonders im Fokus steht?",
      yes: {
        result: "eingeschränkt erlaubt",
        title: "Meist unproblematisch – aber Widerspruch respektieren",
        text: "Laut EDÖB wiegt der Eingriff bei Personen, die nur als Beiwerk im öffentlichen Raum erscheinen, weniger schwer. Es reicht, das Bild auf Verlangen zu löschen bzw. nicht zu veröffentlichen – eine aktive Ansprache vorher ist nicht nötig.",
      },
      no: {
        q: "Handelt es sich um eine öffentliche Veranstaltung mit überwiegendem öffentlichen Interesse (z. B. Sportanlass, Berichterstattung)?",
        yes: {
          result: "kommt drauf an",
          title: "Einzelfallprüfung nötig",
          text: "Ein überwiegendes öffentliches Interesse kann eine Persönlichkeitsverletzung ausnahmsweise rechtfertigen (Art. 28 ZGB) – wer sich darauf beruft, muss das aber begründen können. Im Zweifel: vorher Rücksprache halten statt einfach posten.",
        },
        no: {
          result: "nicht erlaubt",
          title: "Erst Einwilligung einholen",
          text: "Ohne Einwilligung, ohne Beiwerk-Situation und ohne überwiegendes öffentliches Interesse ist die Persönlichkeitsverletzung widerrechtlich (Art. 28 ZGB). Vor dem Posten unbedingt zuerst die Einwilligung der Person einholen.",
        },
      },
    },
  },
  no: {
    result: "erlaubt",
    title: "Kein Thema fürs Recht am eigenen Bild",
    text: "Ist niemand erkennbar, ist das Recht am eigenen Bild (Art. 28 ZGB) nicht betroffen. Denk aber daran: Das Urheberrecht am Foto selbst und allfällige Datenschutzfragen können trotzdem relevant sein.",
  },
};

export function initModule2() {
  const container = document.getElementById("m2-tree");
  const pathEl = document.getElementById("m2-path");
  const completeBtn = document.getElementById("m2-complete-btn");
  if (!container) return;

  const path = [];

  function renderNode(node) {
    if (node.result) {
      const cls = node.result === "erlaubt" || node.result === "eingeschränkt erlaubt" ? "is-correct" : node.result === "kommt drauf an" ? "is-neutral" : "is-incorrect";
      container.innerHTML = `
        <div class="tree-result">
          <div class="exercise-feedback is-visible ${cls}">
            <strong>Einschätzung: ${node.title}</strong><br>${node.text}
          </div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn--secondary" id="m2-restart">Nochmals mit anderem Fall probieren</button>
        </div>
      `;
      document.getElementById("m2-restart").addEventListener("click", () => {
        path.length = 0;
        renderNode(M2_TREE);
      });
      if (completeBtn) completeBtn.disabled = false;
      return;
    }
    container.innerHTML = `
      <div class="tree-question">${node.q}</div>
      <div class="tree-options">
        <button type="button" class="tree-option-btn" data-answer="yes">Ja</button>
        <button type="button" class="tree-option-btn" data-answer="no">Nein</button>
      </div>
    `;
    container.querySelectorAll(".tree-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        path.push(node.q.slice(0, 40) + "… → " + (btn.dataset.answer === "yes" ? "Ja" : "Nein"));
        if (pathEl) pathEl.textContent = path.join("  |  ");
        renderNode(node[btn.dataset.answer]);
      });
    });
  }

  renderNode(M2_TREE);

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      markModuleDone(2, "abgeschlossen");
      window.location.href = "../index.html";
    });
  }
}

/* ==========================================================================
   Modul 3 – Datenschutz: Checkliste vor dem Posten
   ========================================================================== */

const M3_ITEMS = [
  {
    id: "informiert",
    text: "Die Person wurde informiert, wofür und wo ihr Bild verwendet wird.",
    required: true,
    explain: "Pflicht nach revDSG: Bei jeder Beschaffung von Personendaten (auch Fotos) muss vorgängig informiert werden, wofür sie verwendet werden.",
  },
  {
    id: "einwilligung",
    text: "Eine informierte, freiwillige Einwilligung liegt vor – am besten schriftlich.",
    required: true,
    explain: "Für Mitarbeiterfotos auf Social Media/Website braucht es grundsätzlich eine informierte, freiwillige Einwilligung.",
  },
  {
    id: "minderjaehrig",
    text: "Falls die Person minderjährig ist: Zustimmung der Erziehungsberechtigten wurde eingeholt.",
    required: true,
    explain: "Bei Lernenden unter 18 Jahren braucht es zusätzlich die Zustimmung der Eltern/Erziehungsberechtigten.",
  },
  {
    id: "dauer",
    text: "Es ist geklärt, wie lange das Bild online bleibt (z. B. bis zum Austritt aus dem Betrieb).",
    required: true,
    explain: "Eine klare zeitliche Begrenzung gehört zu einer informierten Einwilligung und zu „Privacy by Design”.",
  },
  {
    id: "ort",
    text: "Es ist konkret festgehalten, WO das Bild erscheinen darf (z. B. nur LinkedIn, nicht automatisch auch Flyer oder Broschüre).",
    required: true,
    explain: "„Ich habe fürs Intranet unterschrieben” deckt nicht automatisch die Website, den Flyer oder Social Media ab – jede Verwendung braucht eine eigene, konkrete Grundlage.",
  },
  {
    id: "wasserzeichen",
    text: "Das Bild wurde mit einem Wasserzeichen versehen.",
    required: false,
    explain: "Nett fürs Corporate Design, aber datenschutzrechtlich nicht vorgeschrieben.",
  },
  {
    id: "fotograf",
    text: "Es wurde ein professioneller Fotograf engagiert.",
    required: false,
    explain: "Wer das Foto macht, ist für die Einwilligungspflicht nicht entscheidend – auch ein Handyfoto braucht dieselbe Grundlage.",
  },
];

export function initModule3() {
  const list = document.getElementById("m3-checklist");
  const evalBtn = document.getElementById("m3-eval-btn");
  const result = document.getElementById("m3-result");
  const completeBtn = document.getElementById("m3-complete-btn");
  if (!list) return;

  M3_ITEMS.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" id="m3-${item.id}">
      <label for="m3-${item.id}" style="margin:0; font-weight:400;">${item.text}</label>
    `;
    list.appendChild(li);
  });

  evalBtn.addEventListener("click", () => {
    const required = M3_ITEMS.filter((i) => i.required);
    let missed = [];
    required.forEach((item) => {
      const checked = document.getElementById("m3-" + item.id).checked;
      if (!checked) missed.push(item);
    });
    const correctCount = required.length - missed.length;
    const percent = Math.round((correctCount / required.length) * 100);
    const passed = percent >= MODULE_PASS_PERCENT;

    let html = "";
    if (missed.length === 0) {
      html += `<div class="exercise-feedback is-visible is-correct"><strong>Sehr gut (${percent}%)!</strong> Du hast an alle notwendigen Punkte gedacht.</div>`;
    } else {
      html += `<div class="exercise-feedback is-visible ${passed ? "is-correct" : "is-incorrect"}"><strong>${percent}% erfüllt.</strong> Folgendes wurde (noch) vergessen:</div>`;
      html += '<ul style="margin-top:0.8rem;">';
      missed.forEach((item) => {
        html += `<li><strong>${item.text}</strong><br><span class="text-muted">${item.explain}</span></li>`;
      });
      html += "</ul>";
      if (!passed) {
        html += `<p class="text-muted">Für den Abschluss sind mindestens ${MODULE_PASS_PERCENT}% nötig. Passe deine Auswahl an und klicke nochmals auf „Auswerten”.</p>`;
      }
    }
    result.className = "exercise-summary is-visible";
    result.innerHTML = html;
    if (completeBtn) completeBtn.disabled = !passed;
  });

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      markModuleDone(3, "abgeschlossen");
      window.location.href = "../index.html";
    });
  }
}

/* ==========================================================================
   Modul 4 – Lizenzen: Zuordnungsspiel
   ========================================================================== */

const M4_PAIRS = [
  { id: "cc0", card: "CC0", rule: "Freie Nutzung für alle Zwecke, auch kommerziell – ganz ohne Namensnennung." },
  { id: "ccby", card: "CC BY", rule: "Freie Nutzung inkl. Bearbeitung und kommerziell – aber Namensnennung ist Pflicht." },
  { id: "ccbysa", card: "CC BY-SA", rule: "Wie CC BY – zusätzlich müssen Bearbeitungen unter derselben Lizenz weitergegeben werden." },
  { id: "stock", card: "Gekauftes Stockfoto", rule: "Nutzung nur so, wie es die gekaufte Lizenz erlaubt (z. B. nur Social Media, nicht Print)." },
  { id: "ki", card: "KI-generiertes Bild", rule: "Kein eigener Urheberrechtsschutz in der Schweiz – Vorsicht aber bei Ähnlichkeit zu bestehenden geschützten Werken." },
  { id: "fremd", card: "Fremdes Foto ohne Lizenz", rule: "Grundsätzlich geschützt – ohne Erlaubnis der Urheberin/des Urhebers nicht nutzbar, auch nicht mit Quellenangabe." },
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initModule4() {
  const cardsCol = document.getElementById("m4-cards");
  const rulesCol = document.getElementById("m4-rules");
  const feedback = document.getElementById("m4-feedback");
  const completeBtn = document.getElementById("m4-complete-btn");
  if (!cardsCol) return;

  let selectedCard = null;
  let matchedCount = 0;

  const shuffledCards = shuffle(M4_PAIRS);
  const shuffledRules = shuffle(M4_PAIRS);

  shuffledCards.forEach((pair) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "memory-card";
    el.textContent = pair.card;
    el.dataset.id = pair.id;
    el.addEventListener("click", () => {
      if (el.classList.contains("is-matched")) return;
      cardsCol.querySelectorAll(".memory-card").forEach((c) => c.classList.remove("is-flipped"));
      el.classList.add("is-flipped");
      selectedCard = el;
    });
    cardsCol.appendChild(el);
  });

  shuffledRules.forEach((pair) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "memory-card";
    el.textContent = pair.rule;
    el.dataset.id = pair.id;
    el.addEventListener("click", () => {
      if (el.classList.contains("is-matched") || !selectedCard) return;
      const correct = selectedCard.dataset.id === pair.id;
      if (correct) {
        selectedCard.classList.add("is-matched");
        selectedCard.classList.remove("is-flipped");
        el.classList.add("is-matched");
        matchedCount++;
        feedback.className = "exercise-feedback is-visible is-correct";
        feedback.innerHTML = `<strong>Richtig kombiniert:</strong> ${selectedCard.textContent} – ${pair.rule}`;
        selectedCard = null;
        if (matchedCount === M4_PAIRS.length) {
          if (completeBtn) completeBtn.disabled = false;
          feedback.innerHTML += `<br><br><strong>Alle Paare gefunden! Du kannst das Modul jetzt abschliessen.</strong>`;
        }
      } else {
        feedback.className = "exercise-feedback is-visible is-incorrect";
        feedback.innerHTML = `<strong>Das passt noch nicht zusammen.</strong> Versuch es nochmals.`;
        el.style.transition = "none";
        const prevBg = el.style.background;
        el.style.background = "var(--color-danger-bg)";
        setTimeout(() => {
          el.style.background = "";
        }, 500);
        if (selectedCard) selectedCard.classList.remove("is-flipped");
        selectedCard = null;
      }
    });
    rulesCol.appendChild(el);
  });

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      markModuleDone(4, matchedCount + "/" + M4_PAIRS.length);
      window.location.href = "../index.html";
    });
  }
}

/* ==========================================================================
   Modul 5 – Praxis im Betrieb: Post-Freigabe-Simulator
   ========================================================================== */

const M5_SCENARIOS = [
  {
    id: "s1",
    photo: "📸 Nahaufnahme: Eine Kundin lacht in die Kamera, Glas in der Hand, Firmenapéro.",
    text: "Eine Kundin wurde in Grossaufnahme fotografiert, klar erkennbar und im Fokus. Eine Einwilligung wurde nicht eingeholt.",
    options: ["Posten", "Nicht posten", "Erst Einwilligung einholen"],
    correct: "Erst Einwilligung einholen",
    explain: "Die Person steht klar im Fokus und ist erkennbar – ohne Einwilligung braucht es zuerst ihre Zustimmung, bevor das Bild veröffentlicht wird.",
  },
  {
    id: "s2",
    photo: "📸 Weitwinkelfoto der ganzen Event-Halle mit vielen Gästen im Hintergrund.",
    text: "Ein Übersichtsfoto des Firmenanlasses für den Rückblick auf der Website – niemand steht einzeln im Fokus.",
    options: ["Posten", "Nicht posten", "Erst Einwilligung einholen"],
    correct: "Posten",
    explain: "Da niemand einzeln heraussticht, ist der Eingriff ins Recht am eigenen Bild gering (Beiwerk-Situation). Widerspricht später jemand, muss das Bild trotzdem angepasst/gelöscht werden.",
  },
  {
    id: "s3",
    photo: "📸 Team-Foto, im Hintergrund zufällig ein Flipchart mit der neuen Marketingstrategie.",
    text: "Ein Gruppenfoto fürs Intranet, auf dem im Hintergrund vertrauliche Strategie-Notizen lesbar sind.",
    options: ["Posten", "Nicht posten", "Erst Einwilligung einholen"],
    correct: "Nicht posten",
    explain: "Auch scheinbar nebensächliche Hintergrunddetails können Geschäftsgeheimnisse verraten. Vor dem Posten zuschneiden/unkenntlich machen oder gar nicht veröffentlichen.",
  },
  {
    id: "s4",
    photo: "🎨 KI-generiertes, stilisiertes Eventbanner ohne Bezug zu einer bekannten Marke oder Figur.",
    text: "Für die Story wird ein KI-generiertes Banner im eigenen, neutralen Stil verwendet.",
    options: ["Posten", "Nicht posten", "Erst Einwilligung einholen"],
    correct: "Posten",
    explain: "Ein eigenständiges KI-Bild ohne Ähnlichkeit zu geschützten Werken ist unproblematisch. Empfehlenswert: trotzdem kennzeichnen, z. B. „Bild erstellt mit KI”.",
  },
  {
    id: "s5",
    photo: "💬 Foto, das bisher nur im internen Team-Chat für die Dokumentation geteilt wurde.",
    text: "Eine Mitarbeiterin möchte dasselbe Foto jetzt zusätzlich auf ihrem privaten Instagram-Account teilen.",
    options: ["Posten", "Nicht posten", "Erst Einwilligung einholen"],
    correct: "Erst Einwilligung einholen",
    explain: "Die ursprüngliche Zustimmung galt nur für den internen Rahmen. Für eine öffentliche, private Weiterverwendung braucht es eine neue, konkrete Einwilligung aller abgebildeten Personen.",
  },
];

export function initModule5() {
  const container = document.getElementById("m5-scenarios");
  const summary = document.getElementById("m5-summary");
  const completeBtn = document.getElementById("m5-complete-btn");
  if (!container) return;

  function runAttempt() {
    container.innerHTML = "";
    summary.className = "exercise-summary";
    summary.innerHTML = "";
    if (completeBtn) completeBtn.disabled = true;

    let answeredCount = 0;
    let correctCount = 0;

    M5_SCENARIOS.forEach((sc) => {
      const card = document.createElement("div");
      card.className = "sim-card";
      card.innerHTML = `
        <div class="sim-card__photo">${sc.photo}</div>
        <div class="sim-card__body">
          <p>${sc.text}</p>
          <div class="sim-choices">
            ${sc.options.map((o) => `<button type="button" class="btn btn--secondary" data-choice="${o}">${o}</button>`).join("")}
          </div>
          <div class="exercise-feedback" data-role="feedback"></div>
        </div>
      `;
      container.appendChild(card);

      const buttons = card.querySelectorAll("[data-choice]");
      const feedback = card.querySelector("[data-role='feedback']");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          buttons.forEach((b) => (b.disabled = true));
          const correct = btn.dataset.choice === sc.correct;
          answeredCount++;
          if (correct) correctCount++;
          feedback.className = "exercise-feedback is-visible " + (correct ? "is-correct" : "is-incorrect");
          feedback.innerHTML = `<strong>${correct ? "Richtig!" : "Empfehlung: " + sc.correct}</strong><br>${sc.explain}`;

          if (answeredCount === M5_SCENARIOS.length) {
            const percent = Math.round((correctCount / M5_SCENARIOS.length) * 100);
            const passed = percent >= MODULE_PASS_PERCENT;
            summary.className = "exercise-summary is-visible";
            if (passed) {
              summary.innerHTML = `<strong>${correctCount} von ${M5_SCENARIOS.length} Situationen richtig (${percent}%).</strong> Damit hast du die nötigen ${MODULE_PASS_PERCENT}% erreicht – du kannst das Modul jetzt abschliessen.`;
              if (completeBtn) completeBtn.disabled = false;
            } else {
              summary.innerHTML = `
                <strong>${correctCount} von ${M5_SCENARIOS.length} Situationen richtig (${percent}%).</strong>
                Für den Abschluss sind mindestens ${MODULE_PASS_PERCENT}% nötig.
                <div class="btn-row"><button type="button" class="btn btn--secondary" id="m5-retry-btn">Nochmal versuchen</button></div>
              `;
              const retryBtn = document.getElementById("m5-retry-btn");
              if (retryBtn) retryBtn.addEventListener("click", runAttempt);
            }
          }
        });
      });
    });
  }

  runAttempt();

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      markModuleDone(5, "bestanden (≥" + MODULE_PASS_PERCENT + "%)");
      window.location.href = "../index.html";
    });
  }
}
