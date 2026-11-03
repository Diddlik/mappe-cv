/* Speicherschicht. In der veröffentlichten Seite: Konto und Datenbank der Plattform.
   Lokal geöffnet: Browser-Speicher. Das spätere Backend ersetzt nur diese Datei. */
(function () {
  const KEY = "mappe.v1";
  let mem = { cvs: {}, templates: {}, pages: {} };
  try { mem = { ...mem, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { /* ohne Speicher weiter */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* voll oder gesperrt */ } };

  let db = null, uid = null, account = { name: "Demo-Konto", cloud: false };

  async function connect() {
    if (!window.claude?.use) return;
    db = await window.claude.use("db");
    const user = await window.claude.use("user");
    if (!db || !user) { db = null; return; }
    const me = await user.me();
    uid = me.id;
    if (!uid) { db = null; return; }
    account = { name: me.name || "Angemeldet", cloud: true };
  }
  const col = () => db.collection("data/users/" + uid);

  async function loadAll() {
    if (!db) return { cvs: Object.values(mem.cvs), templates: Object.values(mem.templates) };
    const snap = await col().get();
    const cvs = [], templates = [];
    snap.docs.forEach(d => { const v = d.data(); (d.id.startsWith("tpl_") ? templates : cvs).push(v); });
    return { cvs, templates };
  }
  async function saveCv(cv) {
    mem.cvs[cv.id] = cv; persist();
    if (db) await col().doc("cv_" + cv.id).set(JSON.parse(JSON.stringify(cv)));
  }
  async function deleteCv(id) {
    delete mem.cvs[id]; persist();
    if (db) await col().doc("cv_" + id).delete();
  }
  async function saveTemplate(t) {
    mem.templates[t.id] = t; persist();
    if (db) await col().doc("tpl_" + t.id).set(JSON.parse(JSON.stringify(t)));
  }
  async function deleteTemplate(id) {
    delete mem.templates[id]; persist();
    if (db) await col().doc("tpl_" + id).delete();
  }
  async function publish(slug, page) {
    mem.pages[slug] = page; persist();
    if (db) await db.doc("pages/" + slug).set(JSON.parse(JSON.stringify(page)));
  }
  async function unpublish(slug) {
    delete mem.pages[slug]; persist();
    if (db) await db.doc("pages/" + slug).delete();
  }
  async function getPage(slug) {
    if (db) { const d = await db.doc("pages/" + slug).get(); if (d.exists) return d.data(); return null; }
    return mem.pages[slug] || null;
  }
  async function savePdf(filename, blob) {
    const dl = window.claude?.use ? await window.claude.use("downloads") : null;
    if (dl) { await dl.save({ filename, data: blob }); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  window.MappeStore = { connect, loadAll, saveCv, deleteCv, saveTemplate, deleteTemplate, publish, unpublish, getPage, savePdf, get account() { return account; } };
})();
