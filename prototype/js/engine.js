/* Render-Kern: Daten + Vorlage ergeben ein HTML-Dokument. Dieselbe Funktion speist
   Vorschau, Online-Seite und PDF, damit alle drei identisch aussehen. */
(function () {
  const A4_W = 794, A4_H = 1123; /* 210 × 297 mm bei 96 dpi */
  const LEVEL = ["", "Grundkenntnisse", "Grundkenntnisse", "Gute Kenntnisse", "Sehr gute Kenntnisse", "Expertenwissen"];
  const FORBIDDEN = ["script", "style", "iframe", "object", "embed", "form", "link", "meta", "base"];
  const FONT_RE = /^[A-Za-z0-9 ]+(:[A-Za-z0-9,;@.]+)?$/;

  const blank = () => ({
    person: { name: "", title: "", email: "", phone: "", city: "", website: "", summary: "", photo: "" },
    experience: [], education: [], skills: [], languages: [], sections: []
  });

  function period(e) { return [e.from, e.to].filter(Boolean).join(" – "); }

  function viewModel(data, privacy) {
    const p = { ...blank().person, ...data.person };
    if (privacy) { if (privacy.hidePhone) p.phone = ""; if (privacy.hideCity) p.city = ""; if (privacy.hidePhoto) p.photo = ""; }
    const lines = s => String(s || "").split("\n").map(l => l.trim()).filter(Boolean);
    const experience = (data.experience || []).map(e => ({ ...e, period: period(e), bullets: lines(e.desc), hasBullets: lines(e.desc).length > 0 }));
    const education = (data.education || []).map(e => ({ ...e, period: period(e) }));
    const skills = (data.skills || []).filter(s => s.name).map(s => {
      const level = Math.min(5, Math.max(1, +s.level || 3));
      return { name: s.name, level, percent: level * 20, levelText: LEVEL[level], dots: [1, 2, 3, 4, 5].map(n => ({ on: n <= level })) };
    });
    const languages = (data.languages || []).filter(l => l.name);
    const sections = (data.sections || []).filter(s => s.title).map(s => ({ title: s.title, items: (s.items || []).filter(Boolean) }));
    const initials = (p.name || "?").split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return { ...p, initials, experience, education, skills, languages, sections,
      hasExperience: experience.length > 0, hasEducation: education.length > 0, hasSkills: skills.length > 0, hasLanguages: languages.length > 0,
      today: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) };
  }

  function cleanCss(css) {
    return String(css || "")
      .replace(/@import[^;]*;?/gi, "")
      .replace(/url\(\s*(['"]?)(?!data:)[^)]*\)/gi, "none")
      .replace(/expression\s*\(/gi, "").replace(/<\/?style/gi, "");
  }
  function bodyHtml(tpl, data, privacy) {
    /* Mustache maskiert Eingaben, DOMPurify entfernt alles Ausführbare aus der Vorlage. */
    const out = Mustache.render(tpl.html, viewModel(data, privacy));
    return DOMPurify.sanitize(out, { FORBID_TAGS: FORBIDDEN });
  }
  function headHtml(tpl, accent, mode) {
    const fams = (tpl.fonts || []).filter(f => FONT_RE.test(f)).map(f => "family=" + f.replace(/ /g, "+")).join("&");
    const link = fams ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fams}&display=swap">` : "";
    const base = `*{box-sizing:border-box}html,body{margin:0;background:#fff}
.cv{position:relative;width:${A4_W}px;min-height:${A4_H}px}
html.web body{background:#fff}html.web .cv{width:100%;max-width:${A4_W}px;min-height:0;margin:0 auto}`;
    return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${link}
<style id="vars">:root{--accent:${/^#[0-9a-f]{3,8}$/i.test(accent) ? accent : "#333"}}</style><style>${base}</style><style id="tpl">${cleanCss(tpl.css)}</style>`;
  }
  function documentHtml(tpl, accent, data, mode, privacy) {
    return `<!doctype html><html lang="de" class="${mode === "web" ? "web" : "a4"}"><head>${headHtml(tpl, accent, mode)}</head><body>${bodyHtml(tpl, data, privacy)}</body></html>`;
  }

  /* Seitenumbrüche: an der A4-Grenze, aber nie mitten durch ein .entry-Element. */
  function pageCuts(doc) {
    const root = doc.querySelector(".cv"); if (!root) return [];
    const top = root.getBoundingClientRect().top, total = root.scrollHeight;
    const boxes = [...root.querySelectorAll(".entry")].map(e => { const r = e.getBoundingClientRect(); return [r.top - top, r.bottom - top]; });
    const cuts = []; let start = 0, guard = 0;
    while (total - start > A4_H && guard++ < 20) {
      let y = start + A4_H - 30, moved = true;
      while (moved) { moved = false; for (const [a, b] of boxes) if (a < y && b > y && a > start + 80) { y = a - 3; moved = true; } }
      cuts.push(Math.round(y)); start = y;
    }
    return cuts;
  }

  /* html2canvas zeichnet auf eine Leinwand im Hauptdokument, die Schriften der Vorlage
     müssen deshalb auch dort geladen sein. */
  async function loadFontsInPage(tpl) {
    const names = (tpl.fonts || []).filter(f => FONT_RE.test(f));
    if (!names.length) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?" + names.map(f => "family=" + f.replace(/ /g, "+")).join("&") + "&display=swap";
    await new Promise(res => { link.onload = link.onerror = res; document.head.appendChild(link); });
    const fams = names.map(f => f.split(":")[0]), jobs = new Set();
    document.fonts.forEach(f => {
      const fam = f.family.replace(/["']/g, "");
      if (fams.includes(fam)) String(f.weight).split(" ").forEach(w => jobs.add(`${w} 16px "${fam}"`));
    });
    await Promise.all([...jobs].map(j => document.fonts.load(j, "AaÄäß–").catch(() => null)));
  }

  /* Prototyp: Seiten werden als Bild in die PDF gelegt. Das Backend erzeugt später
     echte Text-PDFs mit Chromium (Playwright), bei gleichem Layout. */
  async function exportPdf(tpl, accent, data) {
    const frame = document.createElement("iframe");
    frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${A4_W}px;height:${A4_H}px;border:0`;
    frame.srcdoc = documentHtml(tpl, accent, data, "a4");
    const loaded = new Promise(res => frame.onload = res);
    document.body.appendChild(frame);
    try {
      await loaded;
      const doc = frame.contentDocument;
      await doc.fonts.ready;
      await loadFontsInPage(tpl);
      const root = doc.querySelector(".cv");
      const cuts = pageCuts(doc);
      const scale = 2.5;
      const canvas = await html2canvas(root, { scale, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: A4_W });
      const pdf = new jspdf.jsPDF({ unit: "px", format: [A4_W, A4_H], hotfixes: ["px_scaling"], compress: true });
      const edges = [0, ...cuts, canvas.height / scale];
      const margin = 34;
      for (let i = 0; i < edges.length - 1; i++) {
        if (i) pdf.addPage([A4_W, A4_H]);
        const offset = i ? margin : 0, sliceH = edges[i + 1] - edges[i];
        const page = document.createElement("canvas");
        page.width = A4_W * scale; page.height = A4_H * scale;
        const c = page.getContext("2d");
        c.fillStyle = "#fff"; c.fillRect(0, 0, page.width, page.height);
        const sy = edges[i] * scale, sh = sliceH * scale;
        /* Ränder mit der ersten und letzten Pixelzeile füllen, so laufen Seitenleisten durch. */
        if (offset) c.drawImage(canvas, 0, sy, canvas.width, 1, 0, 0, page.width, offset * scale);
        c.drawImage(canvas, 0, sy, canvas.width, sh, 0, offset * scale, canvas.width, sh);
        const used = (offset + sliceH) * scale;
        if (used < page.height) c.drawImage(canvas, 0, Math.max(0, sy + sh - 1), canvas.width, 1, 0, used, page.width, page.height - used);
        pdf.addImage(page.toDataURL("image/jpeg", .93), "JPEG", 0, 0, A4_W, A4_H);
      }
      pdf.setProperties({ title: "Lebenslauf " + (data.person.name || ""), creator: "Mappe" });
      return new Blob([pdf.output("arraybuffer")], { type: "application/pdf" });
    } finally { frame.remove(); }
  }

  /* Import: akzeptiert das JSON-Paket oder eine HTML-Datei mit Platzhaltern. */
  function parseTemplate(text, fileName) {
    text = String(text || "").trim();
    if (!text) throw new Error("Es wurde kein Inhalt gefunden. Füge das Vorlagenpaket ein oder wähle eine Datei.");
    let t;
    if (text[0] === "<") {
      const doc = new DOMParser().parseFromString(text, "text/html");
      const css = [...doc.querySelectorAll("style")].map(s => s.textContent).join("\n");
      const fonts = [...doc.querySelectorAll('link[href*="fonts.googleapis.com"]')].flatMap(l => new URL(l.href).searchParams.getAll("family"));
      const meta = n => doc.querySelector(`meta[name="mappe:${n}"]`)?.content || "";
      doc.querySelectorAll("style,script,link").forEach(e => e.remove());
      t = { format: "mappe-template/1", name: meta("name") || doc.title || (fileName || "Importierte Vorlage").replace(/\.\w+$/, ""), field: meta("field") || "Eigene Vorlage",
        description: meta("description"), fonts, accents: (meta("accents") || "#333333").split(/[ ,]+/), html: doc.body.innerHTML.trim(), css };
    } else {
      try { t = JSON.parse(text.replace(/^```(json)?\s*|\s*```$/g, "")); }
      catch (e) { throw new Error("Das JSON ist ungültig: " + e.message); }
    }
    const miss = ["name", "html", "css"].filter(k => !t[k] || typeof t[k] !== "string");
    if (miss.length) throw new Error("Im Paket fehlt: " + miss.join(", ") + ".");
    if (t.format && t.format !== "mappe-template/1") throw new Error(`Das Format "${t.format}" wird nicht unterstützt. Erwartet wird mappe-template/1.`);
    if (!/class\s*=\s*["'][^"']*\bcv\b/.test(t.html)) throw new Error('Das Wurzelelement braucht die Klasse "cv", zum Beispiel <div class="cv">.');
    if (!/\{\{\s*name\s*\}\}/.test(t.html)) throw new Error("Die Vorlage zeigt den Namen nicht an. Ergänze den Platzhalter {{name}}.");
    Mustache.parse(t.html);
    const removed = /<script|\son\w+\s*=/i.test(t.html);
    return { template: { format: "mappe-template/1", id: "imp-" + Date.now().toString(36), name: t.name.slice(0, 40), field: String(t.field || "Eigene Vorlage").slice(0, 40), description: String(t.description || "").slice(0, 160),
      fonts: (Array.isArray(t.fonts) ? t.fonts : []).filter(f => FONT_RE.test(f)).slice(0, 4), accents: (Array.isArray(t.accents) && t.accents.length ? t.accents : ["#333333"]).filter(a => /^#[0-9a-f]{3,8}$/i.test(a)).slice(0, 6), html: t.html, css: t.css, sample: t.sample, imported: true }, removed };
  }

  function designPrompt(field) {
    return `Erstelle ein Lebenslauf-Design für den Berufsbereich "${field || "Berufsbereich hier eintragen"}".

Liefere das Ergebnis als ein JSON-Objekt im Format mappe-template/1:
{
  "format": "mappe-template/1",
  "name": "kurzer Vorlagenname",
  "field": "${field || "Berufsbereich"}",
  "description": "ein Satz",
  "fonts": ["Google-Font-Name:wght@400;700"],
  "accents": ["#hex", "#hex"],
  "html": "...",
  "css": "...",
  "sample": { "person": {...}, "experience": [...], "education": [...], "skills": [...], "languages": [...], "sections": [...] }
}

Regeln für html (Mustache-Syntax, kein JavaScript):
- Das Wurzelelement hat die Klasse "cv". Die Fläche ist A4: 794 px breit, mindestens 1123 px hoch.
- Einzelfelder: {{name}} {{title}} {{email}} {{phone}} {{city}} {{website}} {{summary}} {{photo}} {{initials}} {{today}}
- Listen: {{#experience}} mit {{role}} {{org}} {{place}} {{period}} und {{#bullets}}{{.}}{{/bullets}}
  {{#education}} mit {{degree}} {{org}} {{place}} {{period}} {{desc}}
  {{#skills}} mit {{name}} {{percent}} {{levelText}} und {{#dots}}{{#on}}...{{/on}}{{/dots}}
  {{#languages}} mit {{name}} {{level}}
  {{#sections}} mit {{title}} und {{#items}}{{.}}{{/items}} für berufstypische Abschnitte
- Bedingungen: {{#hasExperience}} {{#hasEducation}} {{#hasSkills}} {{#hasLanguages}} {{#hasBullets}}, für das Foto {{#photo}}...{{/photo}}{{^photo}}...{{/photo}}
- Gib jedem Eintrag, der nicht über eine Seite umbrochen werden darf, die Klasse "entry".

Regeln für css:
- Die Akzentfarbe steht als var(--accent) bereit.
- Farben nur als Hex oder rgba, keine externen Bilder und kein @import.
- Füge eine Regel @media (max-width: 680px) für die einspaltige Online-Ansicht hinzu.

Lege in "sample" realistische, klar erfundene Beispieldaten für diesen Beruf an, und richte die Abschnitte nach dem aus, was Arbeitgeber in diesem Beruf sehen wollen.`;
  }

  window.MappeEngine = { A4_W, A4_H, blank, viewModel, bodyHtml, documentHtml, cleanCss, pageCuts, exportPdf, parseTemplate, designPrompt };
})();
