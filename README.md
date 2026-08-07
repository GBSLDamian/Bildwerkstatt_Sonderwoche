# Bildwerkstatt Sonderwoche

Interaktive, rein statische Website (kein Backend, keine Datenbank) für KV-Lernende
zum Thema Schweizer Medien- und Bildrecht. Gedacht für den Einsatz in einer
Sonderwoche, ca. 90 Minuten Bearbeitungszeit, mobile-first (funktioniert z. B. gut im
Zug bei wechselndem Netzempfang – nach dem ersten Laden sind keine weiteren
Serveranfragen nötig).

## Inhalt

- **Modul 0** (Startseite): Einstiegsszenario
- **Modul 1–5**: Urheberrecht, Recht am eigenen Bild, Datenschutz, Lizenzen & KI,
  Praxis im Betrieb – jeweils mit Praxisfall, kompakter Theorie und interaktiver
  Übung. Module werden sequenziell freigeschaltet, Fortschritt wird lokal im Browser
  gespeichert (`localStorage`).
- **Abschlusstest**: 8 zufällig aus einem Pool von 24 Fragen gezogene,
  szenario-basierte Fragen mit randomisierten Variablen (verschiedene Namen/
  Plattformen), damit keine zwei Lernenden exakt denselben Text erhalten.
- **Bestätigung/Zertifikat**: druckbare Bestätigungsseite mit Name, Datum, Score und
  einem einfachen Bearbeitungscode.

## Technik

Reines HTML5 / CSS3 / Vanilla JavaScript (ES6-Module), kein Framework, kein
Build-Step. Alle Daten liegen client-seitig in `data/questions.json` und werden per
`fetch()` geladen; der Fortschritt wird ausschliesslich in `localStorage` gespeichert.

## Lokal starten

Da ES-Module und `fetch()` verwendet werden, muss die Seite über einen lokalen
Webserver aufgerufen werden (nicht per Doppelklick auf `index.html`):

```bash
npx serve .
```

Danach die angezeigte lokale Adresse (z. B. `http://localhost:3000`) im Browser
öffnen.

## Deployment: GitHub → Netlify (Continuous Deployment)

### 1. GitHub-Repo erstellen und verbinden

```bash
git init
git add .
git commit -m "Initial commit: Bildwerkstatt Sonderwoche"
git branch -M main
git remote add origin https://github.com/<dein-github-name>/Bildwerkstatt_Sonderwoche.git
git push -u origin main
```

Ersetze `<dein-github-name>` mit deinem GitHub-Benutzernamen bzw. -Organisation.
Das Repo `Bildwerkstatt_Sonderwoche` muss vorher leer auf GitHub angelegt worden
sein (ohne README/["Initialize this repository"], sonst gibt es einen
Merge-Konflikt beim ersten Push).

### 2. Mit Netlify verbinden

1. Auf [app.netlify.com](https://app.netlify.com) einloggen.
2. **„Add new site” → „Import an existing project”** wählen.
3. GitHub als Quelle wählen und das Repo `Bildwerkstatt_Sonderwoche` auswählen.
4. Build-Einstellungen werden automatisch aus `netlify.toml` übernommen
   (Publish-Verzeichnis: `.`, kein Build-Command nötig).
5. **„Deploy site”** klicken.

Ab sofort wird bei jedem Push auf den `main`-Branch automatisch ein neues Deployment
ausgelöst (Continuous Deployment). Der Site-Name kann in den Netlify-Einstellungen
auf `bildwerkstatt-sonderwoche` gesetzt werden (Site settings → Change site name).

## Fortschritt zurücksetzen

In der Fusszeile jeder Seite gibt es einen Button „Gesamten Fortschritt
zurücksetzen” (mit Sicherheitsabfrage), der alle `localStorage`-Daten dieser Seite
löscht – Module, Test und Zertifikat.

## Rechtlicher Hinweis

Diese Bildwerkstatt vermittelt eine praxisnahe Einführung in Schweizer Medien- und
Bildrecht für Ausbildungszwecke und ersetzt keine Rechtsberatung.
