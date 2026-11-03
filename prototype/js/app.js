(function () {
  const E = window.MappeEngine, Store = window.MappeStore, T = window.MappeTemplates;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const slugify = s => String(s || "lebenslauf").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "lebenslauf";
  const clone = o => JSON.parse(JSON.stringify(o));

  const S = { cvs: [], imported: [], cvId: null, tab: "daten", view: "a4", open: new Set(["person", "experience"]), importMsg: null, importText: "", promptField: "", confirmDel: false, delTpl: null };

  const allTemplates = () => [...T.builtin, ...S.imported];
  const tplOf = cv => allTemplates().find(t => t.id === cv.templateId) || T.builtin[0];
  const cur = () => S.cvs.find(c => c.id === S.cvId);

  function fromSample(tpl) {
    const d = { ...E.blank(), ...clone(tpl.sample || {}) };
    d.person = { ...E.blank().person, ...d.person };
    return { id: uid(), label: "Beispiel: " + tpl.field, isSample: true, templateId: tpl.id, accent: (tpl.accents || [])[0] || "#333333", data: d, pub: newPub(d), updated: Date.now() };
  }
  function newPub(d) { return { slug: slugify(d.person.name), live: false, publishedAt: 0, hidePhone: true, hideCity: false, hidePhoto: false }; }
  function blankCv(tpl) {
    const d = E.blank();
    return { id: uid(), label: "Neuer Lebenslauf", isSample: false, templateId: tpl.id, accent: tpl.accents[0], data: d, pub: newPub(d), updated: Date.now() };
  }

  /* Speichern */
  let saveTimer;
  function status(text, err) { const el = $("#status"); el.textContent = text; el.classList.toggle("err", !!err); }
  function touched() {
    const cv = cur(); cv.updated = Date.now(); status("Speichert …");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try { await Store.saveCv(cv); status("Gespeichert"); }
      catch (e) { status("Nicht gespeichert: " + (e.message || "Verbindung prüfen"), true); }
    }, 600);
    if (S.tab === "online") { const st = $("#pubState"); if (st) renderPanel(); }
    schedulePreview();
  }

  /* Vorschau */
  let previewTimer, lastKey = "";
  const schedulePreview = () => { clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 160); };
  function updatePreview() {
    const cv = cur(); if (!cv) return;
    const tpl = tplOf(cv), f = $("#preview"), mode = S.view === "a4" ? "a4" : "web";
    const privacy = mode === "web" ? cv.pub : null, key = tpl.id + "|" + mode;
    const doc = f.contentDocument;
    if (key !== lastKey || !doc?.querySelector(".cv")) {
      lastKey = key;
      f.onload = () => { fit(); f.contentDocument?.fonts?.ready.then(fit); };
      f.srcdoc = E.documentHtml(tpl, cv.accent, cv.data, mode, privacy);
    } else {
      doc.getElementById("vars").textContent = `:root{--accent:${cv.accent}}`;
      doc.body.innerHTML = E.bodyHtml(tpl, cv.data, privacy);
      fit();
    }
  }
  function fit() {
    const f = $("#preview"), sheet = $("#sheet"), doc = f.contentDocument, sc = $("#scroller");
    const root = doc?.querySelector(".cv"); if (!root || !sc.clientWidth) return;
    const avail = sc.clientWidth - 8;
    const W = S.view === "a4" ? E.A4_W : S.view === "phone" ? 390 : Math.min(avail, 1000);
    f.style.width = W + "px"; f.style.height = "400px";
    const H = Math.max(Math.ceil(root.getBoundingClientRect().height), S.view === "a4" ? E.A4_H : 500);
    const scale = Math.min(1, avail / W);
    f.style.height = H + "px"; f.style.transform = `scale(${scale})`;
    sheet.style.width = W * scale + "px"; sheet.style.height = H * scale + "px";
    sheet.classList.toggle("phone", S.view === "phone");
    sheet.querySelectorAll(".cut").forEach(c => c.remove());
    if (S.view === "a4") {
      const cuts = E.pageCuts(doc);
      cuts.forEach((y, i) => { const d = document.createElement("div"); d.className = "cut"; d.style.top = y * scale + "px"; d.innerHTML = `<span>Seite ${i + 2}</span>`; sheet.appendChild(d); });
      $("#pages").textContent = (cuts.length + 1) + (cuts.length ? " Seiten" : " Seite") + " A4";
    } else $("#pages").textContent = S.view === "phone" ? "Online-Seite, 390 px breit" : "Online-Seite wie im Browser";
  }

  /* Panels */
  const field = (label, path, value, attrs = "") => `<label for="f-${path}">${label}<input id="f-${path}" data-path="${path}" value="${esc(value)}" ${attrs}></label>`;
  const area = (label, path, value, hint) => `<label for="f-${path}">${label}<textarea id="f-${path}" data-path="${path}" placeholder="${esc(hint || "")}">${esc(value)}</textarea></label>`;
  const det = (k, title, n, body) => `<details data-k="${k}" ${S.open.has(k) ? "open" : ""}><summary>${title}${n != null ? ` <span class="hint">(${n})</span>` : ""}</summary><div class="stack">${body}</div></details>`;
  const moveBtns = (list, i) => `<span><button class="iconbtn" data-move="${list}.${i}.-1" aria-label="Nach oben">↑</button><button class="iconbtn" data-move="${list}.${i}.1" aria-label="Nach unten">↓</button><button class="iconbtn" data-del="${list}.${i}" aria-label="Eintrag entfernen">Entfernen</button></span>`;

  function panelDaten(cv) {
    const d = cv.data, p = d.person;
    return `<div class="stack">
    ${cv.isSample ? `<p class="msg">Dies sind erfundene Beispieldaten. Überschreibe sie, oder lege mit „Neu“ einen leeren Lebenslauf an.</p>` : ""}
    <label for="cvLabel">Name dieser Version<input id="cvLabel" data-label value="${esc(cv.label)}" placeholder="Zum Beispiel: Bewerbung Kita Sonnenblume"></label>
    <div>
    ${det("person", "Person", null, `
      <div class="photo">${p.photo ? `<img src="${esc(p.photo)}" alt="Bewerbungsfoto">` : `<span class="ph">Foto</span>`}
        <label class="btn small" for="photoIn" style="display:inline-block;color:inherit">Foto wählen<input id="photoIn" type="file" accept="image/*" hidden></label>
        ${p.photo ? `<button class="btn small" id="photoDel">Entfernen</button>` : ""}</div>
      <div class="two">${field("Name", "person.name", p.name, 'autocomplete="name"')}${field("Berufsbezeichnung", "person.title", p.title)}</div>
      <div class="two">${field("E-Mail", "person.email", p.email, 'type="email"')}${field("Telefon", "person.phone", p.phone, 'type="tel"')}</div>
      <div class="two">${field("Ort", "person.city", p.city)}${field("Website", "person.website", p.website)}</div>
      ${area("Kurzprofil", "person.summary", p.summary, "Zwei bis drei Sätze über dich")}`)}
    ${det("experience", "Berufserfahrung", d.experience.length, d.experience.map((e, i) => `<div class="item"><div class="itemhead"><span>${esc(e.role || "Neue Station")}</span>${moveBtns("experience", i)}</div>
      <div class="two">${field("Position", `experience.${i}.role`, e.role)}${field("Arbeitgeber", `experience.${i}.org`, e.org)}</div>
      <div class="two">${field("Von", `experience.${i}.from`, e.from, 'placeholder="MM/JJJJ"')}${field("Bis", `experience.${i}.to`, e.to, 'placeholder="heute"')}</div>
      ${field("Ort", `experience.${i}.place`, e.place)}${area("Aufgaben und Erfolge", `experience.${i}.desc`, e.desc, "Ein Punkt pro Zeile")}</div>`).join("") + `<button class="btn small" data-add="experience">Station hinzufügen</button>`)}
    ${det("education", "Ausbildung", d.education.length, d.education.map((e, i) => `<div class="item"><div class="itemhead"><span>${esc(e.degree || "Neuer Abschnitt")}</span>${moveBtns("education", i)}</div>
      <div class="two">${field("Abschluss", `education.${i}.degree`, e.degree)}${field("Einrichtung", `education.${i}.org`, e.org)}</div>
      <div class="two">${field("Von", `education.${i}.from`, e.from)}${field("Bis", `education.${i}.to`, e.to)}</div>
      ${field("Details", `education.${i}.desc`, e.desc)}</div>`).join("") + `<button class="btn small" data-add="education">Ausbildung hinzufügen</button>`)}
    ${det("skills", "Fähigkeiten", d.skills.length, d.skills.map((s, i) => `<div class="row"><input id="f-skills.${i}.name" data-path="skills.${i}.name" value="${esc(s.name)}" aria-label="Fähigkeit">
      <select id="f-skills.${i}.level" data-path="skills.${i}.level" aria-label="Stufe" style="width:100%">${[[1, "Grundlagen"], [3, "Gut"], [4, "Sehr gut"], [5, "Experte"]].map(([v, l]) => `<option value="${v}" ${+s.level === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <button class="iconbtn" data-del="skills.${i}" aria-label="Fähigkeit entfernen">×</button></div>`).join("") + `<button class="btn small" data-add="skills">Fähigkeit hinzufügen</button>`)}
    ${det("languages", "Sprachen", d.languages.length, d.languages.map((s, i) => `<div class="row"><input id="f-languages.${i}.name" data-path="languages.${i}.name" value="${esc(s.name)}" aria-label="Sprache"><input id="f-languages.${i}.level" data-path="languages.${i}.level" value="${esc(s.level)}" aria-label="Niveau" placeholder="B2"><button class="iconbtn" data-del="languages.${i}" aria-label="Sprache entfernen">×</button></div>`).join("") + `<button class="btn small" data-add="languages">Sprache hinzufügen</button>`)}
    ${det("sections", "Weitere Abschnitte", d.sections.length, `<p class="hint">Für Berufstypisches wie Zertifikate, Fortbildungen oder Projekte.</p>` + d.sections.map((s, i) => `<div class="item"><div class="itemhead"><span>${esc(s.title || "Neuer Abschnitt")}</span>${moveBtns("sections", i)}</div>${field("Überschrift", `sections.${i}.title`, s.title)}${area("Einträge", `sections.${i}.items`, (s.items || []).join("\n"), "Ein Eintrag pro Zeile")}</div>`).join("") + `<button class="btn small" data-add="sections">Abschnitt hinzufügen</button>`)}
    </div></div>`;
  }

  function panelVorlagen(cv) {
    const tpl = tplOf(cv), msg = S.importMsg;
    return `<div class="stack">
    <h2>Vorlage wählen</h2><p class="hint">Deine Daten bleiben beim Wechsel erhalten.</p>
    <div class="gal">${allTemplates().map(t => `<div class="tcard" role="button" tabindex="0" data-tpl="${esc(t.id)}" aria-pressed="${t.id === tpl.id}">
      <span class="thumb"><iframe sandbox="allow-same-origin" loading="lazy" title="Vorschau ${esc(t.name)}" data-thumb="${esc(t.id)}"></iframe></span>
      <span class="tmeta"><b>${esc(t.name)}</b><small>${esc(t.field)}</small></span>
      <span class="tacts">${t.sample ? `<button class="btn small" data-sample="${esc(t.id)}">Beispiel öffnen</button>` : ""}
      ${t.imported ? `<button class="btn small danger" data-deltpl="${esc(t.id)}">${S.delTpl === t.id ? "Wirklich?" : "Entfernen"}</button>` : ""}</span></div>`).join("")}</div>
    <div class="stack"><h2>Akzentfarbe</h2><div class="swatches">${(tpl.accents || []).map(a => `<button class="sw" style="background:${esc(a)}" data-accent="${esc(a)}" aria-pressed="${a === cv.accent}" aria-label="Farbe ${esc(a)}"></button>`).join("")}</div></div>
    <details data-k="import" ${S.open.has("import") ? "open" : ""}><summary>Vorlage importieren</summary><div class="stack">
      <p class="hint">Füge ein Paket im Format mappe-template/1 ein oder wähle eine .json- oder .html-Datei. Skripte werden beim Anzeigen entfernt.</p>
      <label class="btn small" for="tplFile" style="justify-self:start;color:inherit;display:inline-block">Datei wählen<input id="tplFile" type="file" accept=".json,.html,.htm,application/json,text/html" hidden></label>
      <label for="tplText">Paket einfügen<textarea id="tplText" rows="5" spellcheck="false" style="font-family:Consolas,monospace;font-size:12.5px">${esc(S.importText)}</textarea></label>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn small primary" id="tplImport">Importieren</button><button class="btn small" id="tplExample">Beispielpaket einfügen</button></div>
      ${msg ? `<p class="msg ${msg.err ? "err" : "okk"}">${esc(msg.text)}</p>` : ""}
    </div></details>
    <details data-k="design" ${S.open.has("design") ? "open" : ""}><summary>Neue Vorlage mit Claude Design</summary><div class="stack">
      <p class="hint">Trage einen Beruf ein und kopiere den Auftrag nach Claude Design. Das fertige Paket fügst du oben beim Import ein.</p>
      <label for="promptField">Berufsbereich<input id="promptField" value="${esc(S.promptField)}" placeholder="Zum Beispiel: Pflegefachkraft"></label>
      <button class="btn small" id="promptCopy" style="justify-self:start">Auftrag kopieren</button>
      <textarea id="promptOut" readonly rows="6" aria-label="Auftrag für Claude Design" style="font-size:12.5px">${esc(E.designPrompt(S.promptField))}</textarea>
    </div></details></div>`;
  }

  function panelOnline(cv) {
    const p = cv.pub, stale = p.live && cv.updated > p.publishedAt;
    return `<div class="stack">
    <h2>Online-Seite</h2>
    <div id="pubState">${p.live ? (stale ? `<span class="state stale">Änderungen noch nicht online</span>` : `<span class="state live">Online</span>`) : `<span class="state off">Nicht veröffentlicht</span>`}</div>
    <p class="hint">Die Seite nutzt deine Vorlage und passt sich an Handys an. Sie ist eine Momentaufnahme: Änderungen erscheinen erst nach erneutem Veröffentlichen.</p>
    <label for="slug">Seitenadresse<input id="slug" value="${esc(p.slug)}" ${p.live ? "disabled" : ""} spellcheck="false"></label>
    <p class="hint">Später im Dienst: <code>mappe.example/${esc(p.slug)}</code>. Im Prototyp: <code>#cv-${esc(p.slug)}</code></p>
    <div class="stack"><h2>Auf der Online-Seite ausblenden</h2>
      <label class="check"><input type="checkbox" id="hidePhone" ${p.hidePhone ? "checked" : ""}>Telefonnummer</label>
      <label class="check"><input type="checkbox" id="hideCity" ${p.hideCity ? "checked" : ""}>Ort</label>
      <label class="check"><input type="checkbox" id="hidePhoto" ${p.hidePhoto ? "checked" : ""}>Foto</label>
      <p class="hint">Die Vorschau „Online“ zeigt, was Besucher sehen. Die PDF bleibt vollständig.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn primary" id="pubBtn">${p.live ? "Änderungen veröffentlichen" : "Veröffentlichen"}</button>
      ${p.live ? `<button class="btn" id="pubOpen">Seite öffnen</button><button class="btn danger" id="pubOff">Offline nehmen</button>` : ""}
    </div></div>`;
  }

  function renderPanel() {
    const cv = cur(), panel = $("#panel"), top = panel.scrollTop;
    panel.innerHTML = S.tab === "daten" ? panelDaten(cv) : S.tab === "vorlagen" ? panelVorlagen(cv) : panelOnline(cv);
    panel.scrollTop = top;
    panel.querySelectorAll("[data-thumb]").forEach(f => {
      const t = allTemplates().find(x => x.id === f.dataset.thumb);
      const data = t.sample ? { ...E.blank(), ...t.sample, person: { ...E.blank().person, ...t.sample.person } } : cv.data;
      f.srcdoc = E.documentHtml(t, t.id === tplOf(cv).id ? cv.accent : t.accents[0], data, "a4");
    });
    document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === S.tab));
  }
  function renderTop() {
    $("#cvSel").innerHTML = S.cvs.map(c => `<option value="${c.id}" ${c.id === S.cvId ? "selected" : ""}>${esc(c.label)}</option>`).join("");
    const d = $("#delCv"); d.textContent = S.confirmDel ? "Wirklich löschen?" : "Löschen";
    d.disabled = S.cvs.length < 2;
    document.querySelectorAll("#viewSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === S.view));
    document.querySelectorAll("#paneSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.pane === $("#app").dataset.pane));
  }
  const renderAll = () => { renderTop(); renderPanel(); lastKey = ""; updatePreview(); };

  let toastT;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3200); }

  function setPath(obj, path, v) { const k = path.split("."); const last = k.pop(); const o = k.reduce((a, x) => a[x], obj); o[last] = v; }
  const NEW = {
    experience: () => ({ role: "", org: "", place: "", from: "", to: "", desc: "" }), education: () => ({ degree: "", org: "", place: "", from: "", to: "", desc: "" }),
    skills: () => ({ name: "", level: 4 }), languages: () => ({ name: "", level: "" }), sections: () => ({ title: "", items: [] })
  };

  async function runImport(text, name) {
    try {
      const { template: t, removed } = E.parseTemplate(text, name);
      S.imported.push(t); await Store.saveTemplate(t);
      const cv = cur(); cv.templateId = t.id; cv.accent = t.accents[0] || "#333333";
      S.importMsg = { text: `„${t.name}“ wurde importiert und ausgewählt.` + (removed ? " Enthaltene Skripte wurden entfernt." : "") };
      S.importText = ""; touched(); renderAll();
    } catch (e) { S.importMsg = { err: true, text: e.message }; renderPanel(); }
  }
  async function copy(text, okMsg, fallbackId) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) { const el = $("#" + fallbackId); el?.select(); toast("Text ist markiert. Kopiere ihn mit Strg+C."); }
  }
  function pubSnapshot(cv) {
    const t = tplOf(cv);
    return { name: cv.data.person.name, accent: cv.accent, data: cv.data, privacy: { hidePhone: cv.pub.hidePhone, hideCity: cv.pub.hideCity, hidePhoto: cv.pub.hidePhoto },
      template: { name: t.name, fonts: t.fonts, accents: t.accents, html: t.html, css: t.css }, publishedAt: Date.now() };
  }

  /* Ereignisse */
  $("#panel").addEventListener("input", e => {
    const t = e.target, cv = cur();
    if (t.dataset.path) {
      const isItems = /^sections\.\d+\.items$/.test(t.dataset.path);
      setPath(cv.data, t.dataset.path, isItems ? t.value.split("\n") : t.value);
      if (cv.isSample) cv.isSample = false, cv.label = cv.label.replace(/^Beispiel: /, "Mein Lebenslauf: "), renderTop();
      touched();
    } else if (t.id === "cvLabel") { cv.label = t.value; renderTop(); touched(); }
    else if (t.id === "tplText") S.importText = t.value;
    else if (t.id === "promptField") { S.promptField = t.value; $("#promptOut").value = E.designPrompt(t.value); }
    else if (t.id === "slug") { cv.pub.slug = slugify(t.value); touched(); }
    else if (["hidePhone", "hideCity", "hidePhoto"].includes(t.id)) { cv.pub[t.id] = t.checked; if (cv.pub.live) cv.updated = Date.now(); touched(); }
  });
  $("#panel").addEventListener("toggle", e => {
    const k = e.target.dataset?.k; if (k) e.target.open ? S.open.add(k) : S.open.delete(k);
  }, true);
  $("#panel").addEventListener("change", async e => {
    const t = e.target;
    if (t.id === "photoIn" && t.files[0]) {
      const url = URL.createObjectURL(t.files[0]), img = new Image();
      img.onload = () => {
        const W = 420, H = 540, c = document.createElement("canvas"); c.width = W; c.height = H;
        const s = Math.max(W / img.width, H / img.height);
        c.getContext("2d").drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
        cur().data.person.photo = c.toDataURL("image/jpeg", .85); URL.revokeObjectURL(url); touched(); renderPanel();
      };
      img.onerror = () => toast("Diese Bilddatei lässt sich nicht öffnen. Versuche ein JPG oder PNG.");
      img.src = url;
    }
    if (t.id === "tplFile" && t.files[0]) runImport(await t.files[0].text(), t.files[0].name);
  });
  $("#panel").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".tcard")) { e.preventDefault(); e.target.click(); } });
  $("#panel").addEventListener("click", async e => {
    const t = e.target.closest("button,.tcard"); if (!t) return;
    const cv = cur(), d = t.dataset;
    if (d.add) { cv.data[d.add].push(NEW[d.add]()); S.open.add(d.add); touched(); renderPanel(); }
    else if (d.del) { const [l, i] = d.del.split("."); cv.data[l].splice(+i, 1); touched(); renderPanel(); }
    else if (d.move) { const [l, i, dir] = d.move.split("."), a = cv.data[l], j = +i + +dir; if (a[j]) { [a[i], a[j]] = [a[j], a[i]]; touched(); renderPanel(); } }
    else if (d.sample) { e.stopPropagation(); const c = fromSample(allTemplates().find(x => x.id === d.sample)); S.cvs.push(c); S.cvId = c.id; touched(); renderAll(); toast("Beispiel als neue Version geöffnet"); }
    else if (d.deltpl) {
      e.stopPropagation();
      if (S.delTpl !== d.deltpl) { S.delTpl = d.deltpl; renderPanel(); return; }
      S.imported = S.imported.filter(x => x.id !== d.deltpl); S.delTpl = null;
      await Store.deleteTemplate(d.deltpl);
      S.cvs.forEach(c => { if (c.templateId === d.deltpl) { c.templateId = T.builtin[0].id; c.accent = T.builtin[0].accents[0]; } });
      touched(); renderAll();
    }
    else if (d.tpl) { const n = allTemplates().find(x => x.id === d.tpl); cv.templateId = n.id; cv.accent = n.accents[0]; touched(); lastKey = ""; renderPanel(); updatePreview(); }
    else if (d.accent) { cv.accent = d.accent; touched(); renderPanel(); }
    else if (t.id === "photoDel") { cv.data.person.photo = ""; touched(); renderPanel(); }
    else if (t.id === "tplImport") runImport($("#tplText").value);
    else if (t.id === "tplExample") { S.importText = JSON.stringify(T.importExample, null, 2); renderPanel(); }
    else if (t.id === "promptCopy") copy(E.designPrompt(S.promptField), "Auftrag kopiert", "promptOut");
    else if (t.id === "pubBtn") {
      if (!cv.data.person.name.trim()) { toast("Trage zuerst einen Namen ein."); return; }
      t.disabled = true;
      try { await Store.publish(cv.pub.slug, pubSnapshot(cv)); cv.pub.live = true; cv.pub.publishedAt = Date.now(); cv.updated = cv.pub.publishedAt; await Store.saveCv(cv); toast("Veröffentlicht"); }
      catch (err) { toast("Veröffentlichen ist fehlgeschlagen. Du brauchst Bearbeitungsrechte für diese Seite."); }
      renderPanel();
    }
    else if (t.id === "pubOff") { await Store.unpublish(cv.pub.slug); cv.pub.live = false; await Store.saveCv(cv); toast("Seite ist offline"); renderPanel(); }
    else if (t.id === "pubOpen") location.hash = "cv-" + cv.pub.slug;
  });
  document.querySelector(".tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) { S.tab = b.dataset.tab; renderPanel(); } });
  $("#viewSeg").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) { S.view = b.dataset.view; renderTop(); updatePreview(); } });
  $("#paneSeg").addEventListener("click", e => { const b = e.target.closest("[data-pane]"); if (b) { $("#app").dataset.pane = b.dataset.pane; renderTop(); fit(); updatePreview(); } });
  $("#cvSel").addEventListener("change", e => { S.cvId = e.target.value; S.confirmDel = false; renderAll(); });
  $("#newCv").addEventListener("click", () => { const c = blankCv(tplOf(cur())); S.cvs.push(c); S.cvId = c.id; S.tab = "daten"; touched(); renderAll(); });
  $("#dupCv").addEventListener("click", () => { const src = cur(), c = clone(src); c.id = uid(); c.label = src.label + " (Kopie)"; c.pub = newPub(c.data); c.pub.slug += "-2"; S.cvs.push(c); S.cvId = c.id; touched(); renderAll(); });
  $("#delCv").addEventListener("click", async () => {
    if (!S.confirmDel) { S.confirmDel = true; renderTop(); return; }
    const c = cur(); S.confirmDel = false;
    if (c.pub.live) await Store.unpublish(c.pub.slug);
    await Store.deleteCv(c.id); S.cvs = S.cvs.filter(x => x !== c); S.cvId = S.cvs[0].id; renderAll(); toast("Lebenslauf gelöscht");
  });
  $("#pdfBtn").addEventListener("click", async e => {
    const btn = e.currentTarget, cv = cur(); btn.disabled = true; btn.textContent = "PDF wird erstellt …";
    try {
      const blob = await E.exportPdf(tplOf(cv), cv.accent, cv.data);
      const name = "Lebenslauf-" + slugify(cv.data.person.name) + ".pdf";
      await Store.savePdf(name, blob); toast("PDF bereit: " + name);
    } catch (err) {
      if (err?.code !== "declined") toast("PDF-Export ist fehlgeschlagen: " + (err?.message || "unbekannter Fehler"));
    }
    btn.disabled = false; btn.textContent = "PDF exportieren";
  });
  new ResizeObserver(() => fit()).observe($("#scroller"));

  /* Öffentliche Seite über #cv-adresse */
  async function route() {
    const m = /^#cv-([a-z0-9-]+)$/.exec(location.hash), pub = $("#public");
    if (!m) { pub.hidden = true; return; }
    pub.hidden = false; pub.textContent = "";
    const page = await Store.getPage(m[1]).catch(() => null);
    const bar = S.cvs.length ? `<div class="pubbar"><span>Das sehen Besucher dieser Seite</span><button id="pubBack">Zurück zum Editor</button></div>` : "";
    if (!page) { pub.innerHTML = bar + `<div class="notfound"><h2>Diese Seite ist nicht online</h2><p>Prüfe die Adresse oder frage die Person nach dem aktuellen Link.</p></div>`; }
    else {
      pub.innerHTML = bar + `<iframe id="pubFrame" title="Lebenslauf von ${esc(page.name)}" sandbox="allow-same-origin"></iframe>`;
      const f = $("#pubFrame"), size = () => { const r = f.contentDocument?.querySelector(".cv"); if (r) f.style.height = Math.ceil(r.getBoundingClientRect().height) + "px"; };
      f.onload = () => { size(); f.contentDocument.fonts.ready.then(size); };
      f.srcdoc = E.documentHtml(page.template, page.accent, page.data, "web", page.privacy);
    }
    const back = $("#pubBack"); if (back) back.onclick = () => { history.replaceState(null, "", location.pathname + location.search); route(); };
  }
  addEventListener("hashchange", route);

  /* Start: sofort mit Beispiel rendern, gespeicherte Daten danach einspielen. */
  S.cvs = [fromSample(T.builtin[0])]; S.cvId = S.cvs[0].id;
  $("#who").textContent = "Demo-Konto";
  renderAll();
  (async () => {
    await Store.connect();
    $("#who").textContent = Store.account.cloud ? Store.account.name : "Demo-Konto (nur dieser Browser)";
    const { cvs, templates } = await Store.loadAll();
    S.imported = templates;
    if (cvs.length) { S.cvs = cvs.sort((a, b) => b.updated - a.updated); S.cvId = S.cvs[0].id; }
    status(cvs.length ? "Gespeichert" : "Beispiel geladen");
    renderAll(); route();
  })().catch(() => { status("Speicher nicht erreichbar", true); route(); });
})();
