/* Speicherschicht. Mit Backend: Konto und Datenbank über /api.
   Ohne Backend (z. B. npx serve): Browser-Speicher. */
(function () {
  const KEY = "mappe.v1";
  let mem = { cvs: {}, templates: {}, pages: {} };
  try { mem = { ...mem, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { /* ohne Speicher weiter */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* voll oder gesperrt */ } };

  let server = false, account = { name: "Demo-Konto", cloud: false };

  async function api(method, path, body) {
    const r = await fetch("/api" + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body && JSON.stringify(body) });
    if (r.status === 401 && server) { location.href = "/login.html"; throw new Error("Nicht angemeldet"); }
    if (!r.ok) throw new Error((await r.text()) || r.statusText);
    return r.headers.get("content-type")?.includes("json") ? r.json() : null;
  }

  async function connect() {
    let r;
    try { r = await fetch("/api/me"); } catch (e) { return; }
    if (r.status === 401) {
      server = true;
      if (!/^#cv-/.test(location.hash)) location.href = "/login.html";
      return;
    }
    if (!r.ok) return;
    server = true;
    account = { name: (await r.json()).name, cloud: true };
  }

  async function loadAll() {
    if (!account.cloud) return { cvs: Object.values(mem.cvs), templates: Object.values(mem.templates) };
    const docs = await api("GET", "/docs"), cvs = [], templates = [];
    for (const [id, v] of Object.entries(docs)) (id.startsWith("tpl_") ? templates : cvs).push(v);
    return { cvs, templates };
  }
  const local = (bag, id, v) => { if (account.cloud) return; if (v) mem[bag][id] = v; else delete mem[bag][id]; persist(); };

  async function saveCv(cv) { local("cvs", cv.id, cv); if (account.cloud) await api("PUT", "/docs/cv_" + cv.id, cv); }
  async function deleteCv(id) { local("cvs", id); if (account.cloud) await api("DELETE", "/docs/cv_" + id); }
  async function saveTemplate(t) { local("templates", t.id, t); if (account.cloud) await api("PUT", "/docs/tpl_" + t.id, t); }
  async function deleteTemplate(id) { local("templates", id); if (account.cloud) await api("DELETE", "/docs/tpl_" + id); }
  async function publish(slug, page) { local("pages", slug, page); if (account.cloud) await api("PUT", "/pages/" + slug, page); }
  async function unpublish(slug) { local("pages", slug); if (account.cloud) await api("DELETE", "/pages/" + slug); }
  async function getPage(slug) {
    if (!server) return mem.pages[slug] || null;
    const r = await fetch("/api/pages/" + encodeURIComponent(slug));
    return r.ok ? r.json() : null;
  }
  async function logout() { await fetch("/api/logout", { method: "POST" }); location.href = "/login.html"; }
  async function savePdf(filename, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  window.MappeStore = { connect, loadAll, saveCv, deleteCv, saveTemplate, deleteTemplate, publish, unpublish, getPage, savePdf, logout, get account() { return account; }, get canEdit() { return account.cloud || !server; } };
})();
