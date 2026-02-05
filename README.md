# Mobile Decision Helper

Small responsive HTML5 page for phone users to perform step-by-step decision making based on a CSV data table.

Usage
- Open `index.html` in a mobile browser or desktop browser (responsive).
- The app will try to load `data.csv` (included). You may also click "Load CSV" and upload your own file.
- CSV must have category columns and a final column with the decision (header named `decision` or `result` is recognized; otherwise the last column is treated as the decision column).
- Tap an option card to select it and advance through steps. After finishing, the matching decision(s) will be shown.

Files
- `index.html` — main page
- `styles.css` — responsive mobile styles
- `app.js` — app logic
- `data.csv` — sample dataset

Try it
1. Open `index.html` in the browser.
2. Tap "Start" and choose options.
