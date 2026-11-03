/* Mitgelieferte Vorlagen. Jede Vorlage ist ein Paket im Format "mappe-template/1".
   Dasselbe Format nutzt der Import, Vorlagen lassen sich also extern erzeugen. */
(function () {
  const contact = `{{#email}}<li>{{email}}</li>{{/email}}{{#phone}}<li>{{phone}}</li>{{/phone}}{{#city}}<li>{{city}}</li>{{/city}}{{#website}}<li>{{website}}</li>{{/website}}`;

  const commit = {
    format: "mappe-template/1", id: "commit", name: "Commit", field: "Softwareentwicklung",
    description: "Berufsweg als Commit-Verlauf, Technologien mit Erfahrungsstufe.",
    fonts: ["JetBrains Mono:wght@400;500;700", "IBM Plex Sans:wght@400;500;600"],
    accents: ["#0f6b5c", "#3b3fb6", "#b3261e", "#1f2933"],
    html: `<div class="cv">
<header>
  <p class="path">~/lebenslauf $ whoami</p>
  <h1>{{name}}</h1>
  <p class="role">{{title}}</p>
  <ul class="contact">${contact}</ul>
</header>
<div class="cols">
<main>
  {{#summary}}<section class="entry"><h2>README</h2><p>{{summary}}</p></section>{{/summary}}
  {{#hasExperience}}<section><h2>Berufserfahrung</h2><div class="log">
  {{#experience}}<article class="entry"><p class="when">{{period}}</p><h3>{{role}}</h3><p class="org">{{org}}{{#place}} · {{place}}{{/place}}</p>
  {{#hasBullets}}<ul>{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>{{/hasBullets}}</article>{{/experience}}
  </div></section>{{/hasExperience}}
  {{#hasEducation}}<section><h2>Ausbildung</h2><div class="log">
  {{#education}}<article class="entry"><p class="when">{{period}}</p><h3>{{degree}}</h3><p class="org">{{org}}{{#place}} · {{place}}{{/place}}</p>{{#desc}}<p>{{desc}}</p>{{/desc}}</article>{{/education}}
  </div></section>{{/hasEducation}}
</main>
<aside>
  {{#hasSkills}}<section class="entry"><h2>Stack</h2>{{#skills}}<div class="skill"><span>{{name}}</span><span class="dots">{{#dots}}<i class="{{#on}}on{{/on}}"></i>{{/dots}}</span></div>{{/skills}}</section>{{/hasSkills}}
  {{#hasLanguages}}<section class="entry"><h2>Sprachen</h2>{{#languages}}<p class="lang"><b>{{name}}</b> {{level}}</p>{{/languages}}</section>{{/hasLanguages}}
  {{#sections}}<section class="entry"><h2>{{title}}</h2><ul>{{#items}}<li>{{.}}</li>{{/items}}</ul></section>{{/sections}}
</aside>
</div></div>`,
    css: `.cv{font:400 10pt/1.5 "IBM Plex Sans",Arial,sans-serif;color:#1c2526;padding:15mm 15mm 12mm;background:#fff}
header{border-bottom:2px solid #1c2526;padding-bottom:6mm;margin-bottom:6mm}
.path{font:500 8.5pt "JetBrains Mono",Consolas,monospace;color:var(--accent);margin:0 0 3mm}
h1{font:700 27pt/1.1 "JetBrains Mono",Consolas,monospace;letter-spacing:-.04em;margin:0}
.role{font-size:12.5pt;margin:1.5mm 0 3mm}
.contact{display:flex;flex-wrap:wrap;gap:1mm 6mm;list-style:none;margin:0;padding:0;font:400 8.5pt "JetBrains Mono",Consolas,monospace}
.cols{display:grid;grid-template-columns:1fr 56mm;gap:9mm}
h2{font:700 9pt "JetBrains Mono",Consolas,monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin:0 0 3mm}
section{margin-bottom:6mm}p{margin:0}
.log{border-left:1.5px solid #c9d3d2;padding-left:5mm}
.log article{position:relative;padding-bottom:4.5mm}
.log article:before{content:"";position:absolute;left:calc(-5mm - 4.5px);top:4px;width:8px;height:8px;border-radius:50%;background:#fff;border:2px solid var(--accent);box-sizing:border-box}
.when{font:500 8pt "JetBrains Mono",Consolas,monospace;color:#5a6968}
h3{font-size:11pt;font-weight:600;margin:.5mm 0 0}
.org{color:#435150}
article ul,aside ul{margin:1.5mm 0 0;padding-left:4mm}
.skill{display:flex;justify-content:space-between;align-items:center;gap:2mm;padding:.7mm 0}
.dots{display:flex;gap:1mm;flex:none}.dots i{width:7px;height:7px;background:#dbe2e1;display:block}.dots i.on{background:var(--accent)}
.lang b{font-weight:600}
@media(max-width:680px){.cv{padding:24px 20px}.cols{grid-template-columns:1fr;gap:0}h1{font-size:30px}}`,
    sample: {
      person: { name: "Jonas Keller", title: "Senior Softwareentwickler .NET", email: "jonas.keller@example.de", phone: "030 5550123", city: "Berlin", website: "github.com/jonas-keller-beispiel",
        summary: "Softwareentwickler mit zehn Jahren Erfahrung in verteilten Backend-Systemen. Ich baue wartbare Dienste, führe Code-Reviews mit Sorgfalt und bringe Teams zu verlässlichen Releases." },
      experience: [
        { role: "Senior Softwareentwickler", org: "Nordlicht Logistik GmbH", place: "Berlin", from: "04/2021", to: "heute", desc: "Routenplanung auf ASP.NET Core und PostgreSQL migriert, 40 % kürzere Antwortzeiten\nCI/CD mit GitHub Actions eingeführt, Release-Takt von Monaten auf Tage verkürzt\nDrei Entwicklerinnen und Entwickler als Mentor begleitet" },
        { role: "Softwareentwickler", org: "Beispielsoft AG", place: "Potsdam", from: "09/2016", to: "03/2021", desc: "Desktop-Anwendung für Lagerverwaltung in C# und WPF weiterentwickelt\nSchnittstellen zu SAP und mehreren Versanddienstleistern umgesetzt" }
      ],
      education: [{ degree: "M.Sc. Informatik", org: "Technische Universität Berlin", place: "", from: "2013", to: "2016", desc: "" }],
      skills: [{ name: "C# / .NET", level: 5 }, { name: "ASP.NET Core", level: 5 }, { name: "PostgreSQL", level: 4 }, { name: "Docker", level: 4 }, { name: "TypeScript", level: 3 }],
      languages: [{ name: "Deutsch", level: "Muttersprache" }, { name: "Englisch", level: "C1" }],
      sections: [{ title: "Open Source", items: ["Maintainer einer NuGet-Bibliothek für Retry-Strategien", "Vorträge bei der .NET User Group Berlin"] }]
    }
  };

  const schaltplan = {
    format: "mappe-template/1", id: "schaltplan", name: "Schaltplan", field: "IT & Systemadministration",
    description: "Dunkle Infospalte für Zertifikate und Systeme, rechts der Berufsweg.",
    fonts: ["Barlow Condensed:wght@500;600;700", "Barlow:wght@400;500;600"],
    accents: ["#2f9fd8", "#26a57a", "#e08a1e", "#8b7fe8"],
    html: `<div class="cv">
<aside>
  <div class="photo">{{#photo}}<img src="{{photo}}" alt="">{{/photo}}{{^photo}}<span>{{initials}}</span>{{/photo}}</div>
  <h2>Kontakt</h2><ul class="plain">${contact}</ul>
  {{#hasSkills}}<div class="entry"><h2>Systeme</h2>{{#skills}}<div class="skill"><span>{{name}}</span><div class="bar"><b style="width:{{percent}}%"></b></div></div>{{/skills}}</div>{{/hasSkills}}
  {{#hasLanguages}}<div class="entry"><h2>Sprachen</h2>{{#languages}}<p>{{name}} <em>{{level}}</em></p>{{/languages}}</div>{{/hasLanguages}}
  {{#sections}}<div class="entry"><h2>{{title}}</h2><ul class="plain">{{#items}}<li>{{.}}</li>{{/items}}</ul></div>{{/sections}}
</aside>
<main>
  <h1>{{name}}</h1><p class="role">{{title}}</p>
  {{#summary}}<p class="lead entry">{{summary}}</p>{{/summary}}
  {{#hasExperience}}<h2 class="m">Berufserfahrung</h2>
  {{#experience}}<article class="entry"><div class="head"><h3>{{role}}</h3><span>{{period}}</span></div><p class="org">{{org}}{{#place}}, {{place}}{{/place}}</p>{{#hasBullets}}<ul>{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>{{/hasBullets}}</article>{{/experience}}{{/hasExperience}}
  {{#hasEducation}}<h2 class="m">Ausbildung</h2>
  {{#education}}<article class="entry"><div class="head"><h3>{{degree}}</h3><span>{{period}}</span></div><p class="org">{{org}}{{#place}}, {{place}}{{/place}}</p>{{#desc}}<p>{{desc}}</p>{{/desc}}</article>{{/education}}{{/hasEducation}}
</main></div>`,
    css: `.cv{display:grid;grid-template-columns:68mm 1fr;font:400 10pt/1.45 Barlow,Arial,sans-serif;color:#17222e;background:#fff}
aside{background:#14283a;color:#dbe6ef;padding:13mm 8mm}main{padding:14mm 13mm 12mm 11mm;min-width:0}
.photo{width:34mm;height:34mm;background:#21405a;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font:700 26pt "Barlow Condensed",Arial,sans-serif;color:#fff;margin-bottom:8mm;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover}
h1{font:700 32pt/1 "Barlow Condensed",Arial,sans-serif;text-transform:uppercase;letter-spacing:.01em;margin:0}
.role{font-size:12.5pt;font-weight:500;margin:1.5mm 0 5mm}
.lead{margin:0 0 3mm}
h2{font:600 11pt "Barlow Condensed",Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);margin:6mm 0 2mm}
h2.m{color:#17222e;display:flex;align-items:center;gap:2.5mm;margin-top:6mm}
h2.m:before{content:"";width:3mm;height:3mm;background:var(--accent);flex:none}
aside p{margin:0 0 1mm}aside em{font-style:normal;opacity:.72}
ul.plain{list-style:none;margin:0;padding:0;overflow-wrap:anywhere}ul.plain li{padding:.5mm 0}
.skill{margin-bottom:1.6mm}.bar{height:3px;background:#2d4a62;margin-top:.6mm}.bar b{display:block;height:100%;background:var(--accent)}
article{margin-bottom:4mm}.head{display:flex;justify-content:space-between;gap:3mm;align-items:baseline}
h3{font-size:11pt;font-weight:600;margin:0}.head span{white-space:nowrap;font-size:9pt;color:#4d5e6e;font-variant-numeric:tabular-nums}
.org{margin:0;color:#4d5e6e}main p{margin-top:0}article ul{margin:1mm 0 0;padding-left:4mm}
@media(max-width:680px){.cv{display:block}aside{padding:24px 20px}main{padding:24px 20px}h1{font-size:34px}}`,
    sample: {
      person: { name: "Aylin Demir", title: "Systemadministratorin Linux & Cloud", email: "aylin.demir@example.de", phone: "0221 5550147", city: "Köln", website: "",
        summary: "Ich betreibe stabile Infrastruktur für mittelständische Unternehmen und automatisiere wiederkehrende Aufgaben. Mein Schwerpunkt liegt auf Linux, Virtualisierung und Sicherheitsupdates ohne Ausfallzeit." },
      experience: [
        { role: "Systemadministratorin", org: "Rheinhost Rechenzentrum GmbH", place: "Köln", from: "01/2020", to: "heute", desc: "Rund 300 virtuelle Server mit Proxmox und Ansible betreut\nMonitoring auf Prometheus und Grafana umgestellt\nNotfallplan erstellt und jährliche Wiederherstellungstests eingeführt" },
        { role: "IT-Support (2nd Level)", org: "Stadtwerke Beispielstadt", place: "Bonn", from: "08/2016", to: "12/2019", desc: "Rund 400 Arbeitsplätze und Active Directory betreut\nWindows-11-Rollout vorbereitet und durchgeführt" }
      ],
      education: [{ degree: "Fachinformatikerin Systemintegration", org: "IHK Köln", place: "", from: "2013", to: "2016", desc: "" }],
      skills: [{ name: "Linux", level: 5 }, { name: "Proxmox / VMware", level: 4 }, { name: "Ansible", level: 4 }, { name: "Netzwerk & Firewall", level: 4 }, { name: "Azure", level: 3 }],
      languages: [{ name: "Deutsch", level: "Muttersprache" }, { name: "Türkisch", level: "Muttersprache" }, { name: "Englisch", level: "B2" }],
      sections: [{ title: "Zertifikate", items: ["RHCSA", "LPIC-2", "ITIL Foundation"] }]
    }
  };

  const morgenkreis = {
    format: "mappe-template/1", id: "morgenkreis", name: "Morgenkreis", field: "Erziehung & Pädagogik",
    description: "Freundlich und klar, mit Foto und Platz für pädagogische Schwerpunkte.",
    fonts: ["Baloo 2:wght@500;600;700", "Nunito:wght@400;600;700"],
    accents: ["#d9583b", "#2f8f6f", "#3a78c2", "#b05a9c"],
    html: `<div class="cv">
<i class="c c1"></i><i class="c c2"></i><i class="c c3"></i>
<header>
  <div class="photo">{{#photo}}<img src="{{photo}}" alt="">{{/photo}}{{^photo}}<span>{{initials}}</span>{{/photo}}</div>
  <div><h1>{{name}}</h1><p class="role">{{title}}</p><ul class="contact">${contact}</ul></div>
</header>
{{#summary}}<p class="lead entry">{{summary}}</p>{{/summary}}
<div class="cols"><main>
  {{#hasExperience}}<h2>Berufserfahrung</h2>{{#experience}}<article class="entry"><p class="when">{{period}}</p><h3>{{role}}</h3><p class="org">{{org}}{{#place}}, {{place}}{{/place}}</p>{{#hasBullets}}<ul>{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>{{/hasBullets}}</article>{{/experience}}{{/hasExperience}}
  {{#hasEducation}}<h2>Ausbildung</h2>{{#education}}<article class="entry"><p class="when">{{period}}</p><h3>{{degree}}</h3><p class="org">{{org}}{{#place}}, {{place}}{{/place}}</p>{{#desc}}<p>{{desc}}</p>{{/desc}}</article>{{/education}}{{/hasEducation}}
</main><aside>
  {{#hasSkills}}<div class="box entry"><h2>Stärken</h2><div class="tags">{{#skills}}<span>{{name}}</span>{{/skills}}</div></div>{{/hasSkills}}
  {{#sections}}<div class="box entry"><h2>{{title}}</h2><ul>{{#items}}<li>{{.}}</li>{{/items}}</ul></div>{{/sections}}
  {{#hasLanguages}}<div class="box entry"><h2>Sprachen</h2>{{#languages}}<p>{{name}}: {{level}}</p>{{/languages}}</div>{{/hasLanguages}}
</aside></div></div>`,
    css: `.cv{font:400 10.3pt/1.5 Nunito,Arial,sans-serif;color:#2c2a33;padding:15mm 15mm 12mm;background:#fff;overflow:hidden}
.c{position:absolute;border-radius:50%;background:var(--accent)}
.c1{width:64mm;height:64mm;right:-20mm;top:-26mm;opacity:.16}.c2{width:26mm;height:26mm;right:38mm;top:-11mm;opacity:.3}.c3{width:12mm;height:12mm;right:15mm;top:37mm;opacity:.5}
header{position:relative;display:flex;gap:7mm;align-items:center;margin-bottom:6mm}
.photo{width:36mm;height:36mm;border-radius:50%;flex:none;background:var(--accent);color:#fff;font:700 28pt "Baloo 2",Arial,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover}
h1{font:700 29pt/1.05 "Baloo 2",Arial,sans-serif;margin:0}
.role{font-size:12.5pt;font-weight:700;color:var(--accent);margin:0 0 1.5mm}
.contact{display:flex;flex-wrap:wrap;gap:0 5mm;list-style:none;margin:0;padding:0;font-size:9.3pt}
.lead{margin:0 0 5mm;font-size:11pt;max-width:165mm}
.cols{display:grid;grid-template-columns:1fr 62mm;gap:8mm}
h2{font:600 14pt "Baloo 2",Arial,sans-serif;color:var(--accent);margin:0 0 1.5mm}
main h2:not(:first-child){margin-top:4mm}p{margin:0}
article{margin-bottom:3.5mm}.when{font-size:8.8pt;font-weight:700;color:#6d6975}
h3{font-size:11pt;font-weight:700;margin:0}.org{color:#55515e}
ul{margin:1mm 0 0;padding-left:4mm}
.box{background:#f6f3f2;border-radius:6mm;padding:4mm 5mm;margin-bottom:4mm}
.tags{display:flex;flex-wrap:wrap;gap:1.5mm}.tags span{background:#fff;border-radius:4mm;padding:.4mm 3mm;font-size:9.3pt;font-weight:600}
@media(max-width:680px){.cv{padding:24px 20px}.cols{grid-template-columns:1fr;gap:12px}header{flex-direction:column;align-items:flex-start;gap:14px}h1{font-size:32px}}`,
    sample: {
      person: { name: "Marie Hoffmann", title: "Staatlich anerkannte Erzieherin", email: "marie.hoffmann@example.de", phone: "0761 5550189", city: "Freiburg", website: "",
        summary: "Ich begleite Kinder von einem bis sechs Jahren liebevoll und verlässlich in ihrer Entwicklung. Besonders wichtig sind mir eine sanfte Eingewöhnung, Sprachförderung im Alltag und ein offenes Gespräch mit den Eltern." },
      experience: [
        { role: "Gruppenleitung Krippe", org: "Kita Sonnenblume", place: "Freiburg", from: "09/2020", to: "heute", desc: "Leitung einer Gruppe mit zwölf Kindern im Alter von 1 bis 3 Jahren\nEingewöhnung nach dem Berliner Modell und regelmäßige Elterngespräche\nAnleitung von zwei Praktikantinnen" },
        { role: "Erzieherin", org: "Evangelischer Kindergarten Regenbogen", place: "Emmendingen", from: "08/2017", to: "08/2020", desc: "Sprachförderung für Kinder mit Deutsch als Zweitsprache\nProjekte zu Natur und Bewegung geplant und dokumentiert" }
      ],
      education: [{ degree: "Ausbildung zur Erzieherin", org: "Fachschule für Sozialpädagogik", place: "Freiburg", from: "2014", to: "2017", desc: "Abschluss mit staatlicher Anerkennung" }],
      skills: [{ name: "Eingewöhnung", level: 5 }, { name: "Sprachförderung", level: 5 }, { name: "Elternarbeit", level: 4 }, { name: "Beobachtung & Dokumentation", level: 4 }, { name: "Musik & Bewegung", level: 4 }],
      languages: [{ name: "Deutsch", level: "Muttersprache" }, { name: "Französisch", level: "B1" }],
      sections: [{ title: "Fortbildungen", items: ["Erste Hilfe am Kind (jährlich)", "Kinderschutz nach § 8a SGB VIII", "Musikalische Früherziehung"] }]
    }
  };

  const ablage = {
    format: "mappe-template/1", id: "ablage", name: "Ablage", field: "Büro & Verwaltung",
    description: "Klassischer tabellarischer Lebenslauf mit Foto und Unterschriftszeile.",
    fonts: ["Source Serif 4:wght@400;600;700", "Source Sans 3:wght@400;600"],
    accents: ["#1d3a5f", "#5a2a3e", "#2f4f3f", "#303030"],
    html: `<div class="cv">
<header><div><p class="kicker">Tabellarischer Lebenslauf</p><h1>{{name}}</h1><p class="role">{{title}}</p>
<ul class="contact">${contact}</ul></div>
<div class="photo">{{#photo}}<img src="{{photo}}" alt="">{{/photo}}{{^photo}}<span>Foto</span>{{/photo}}</div></header>
{{#summary}}<section class="entry"><h2>Profil</h2><div class="row"><span></span><p>{{summary}}</p></div></section>{{/summary}}
{{#hasExperience}}<section><h2>Berufserfahrung</h2>{{#experience}}<div class="row entry"><span>{{period}}</span><div><h3>{{role}}</h3><p class="org">{{org}}{{#place}}, {{place}}{{/place}}</p>{{#hasBullets}}<ul>{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>{{/hasBullets}}</div></div>{{/experience}}</section>{{/hasExperience}}
{{#hasEducation}}<section><h2>Ausbildung</h2>{{#education}}<div class="row entry"><span>{{period}}</span><div><h3>{{degree}}</h3><p class="org">{{org}}{{#place}}, {{place}}{{/place}}</p>{{#desc}}<p>{{desc}}</p>{{/desc}}</div></div>{{/education}}</section>{{/hasEducation}}
{{#hasSkills}}<section class="entry"><h2>Kenntnisse</h2>{{#skills}}<div class="row"><span>{{name}}</span><p>{{levelText}}</p></div>{{/skills}}</section>{{/hasSkills}}
{{#hasLanguages}}<section class="entry"><h2>Sprachen</h2>{{#languages}}<div class="row"><span>{{name}}</span><p>{{level}}</p></div>{{/languages}}</section>{{/hasLanguages}}
{{#sections}}<section class="entry"><h2>{{title}}</h2><div class="row"><span></span><ul>{{#items}}<li>{{.}}</li>{{/items}}</ul></div></section>{{/sections}}
<p class="sign entry">{{#city}}{{city}}, {{/city}}{{today}}</p></div>`,
    css: `.cv{font:400 10.5pt/1.45 "Source Sans 3",Arial,sans-serif;color:#222;padding:18mm 20mm 14mm 22mm;background:#fff}
header{display:flex;justify-content:space-between;gap:8mm;margin-bottom:7mm}
.kicker{font-size:9pt;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin:0 0 2mm}
h1{font:700 25pt/1.1 "Source Serif 4",Georgia,serif;margin:0}
.role{font:400 12.5pt "Source Serif 4",Georgia,serif;margin:1mm 0 3mm}
.contact{list-style:none;margin:0;padding:0}
.photo{width:35mm;height:45mm;flex:none;background:#eef0f2;color:#737a82;display:flex;align-items:center;justify-content:center;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover}
h2{font:600 12pt "Source Serif 4",Georgia,serif;color:var(--accent);border-bottom:1px solid var(--accent);padding-bottom:.8mm;margin:0 0 2.5mm}
section{margin-bottom:5mm}p{margin:0}
.row{display:grid;grid-template-columns:40mm 1fr;gap:4mm;margin-bottom:2mm}.row>span{font-variant-numeric:tabular-nums;color:#444}
h3{font-size:10.5pt;font-weight:600;margin:0}.org{color:#444}
ul{margin:.7mm 0 0;padding-left:4mm}
.sign{margin-top:12mm;padding-top:1.5mm;border-top:1px solid #222;width:70mm;font-size:9pt}
@media(max-width:680px){.cv{padding:24px 20px}.row{grid-template-columns:1fr;gap:0}header{flex-direction:column-reverse;align-items:flex-start}.row>span:empty{display:none}}`,
    sample: {
      person: { name: "Sabine Krüger", title: "Kauffrau für Büromanagement", email: "sabine.krueger@example.de", phone: "0511 5550162", city: "Hannover", website: "",
        summary: "Organisationsstarke Bürokauffrau mit zwölf Jahren Erfahrung in Assistenz und Sachbearbeitung. Ich halte Abläufe zuverlässig am Laufen und bin die erste Ansprechperson für Kundschaft und Kollegium." },
      experience: [
        { role: "Teamassistenz der Geschäftsführung", org: "Weser Handelsgesellschaft mbH", place: "Hannover", from: "02/2018", to: "heute", desc: "Terminkoordination, Reiseplanung und Protokolle für die Geschäftsführung\nVorbereitende Buchhaltung mit DATEV Unternehmen online\nEinführung einer digitalen Ablage für rund 20.000 Dokumente" },
        { role: "Sachbearbeiterin Auftragsabwicklung", org: "Leinetal Bürobedarf KG", place: "Laatzen", from: "08/2012", to: "01/2018", desc: "Angebote und Rechnungen in SAP Business One erstellt\nReklamationen bearbeitet und Kundenanfragen beantwortet" }
      ],
      education: [{ degree: "Ausbildung Kauffrau für Büromanagement", org: "Berufsbildende Schule Hannover", place: "", from: "2009", to: "2012", desc: "Abschlussnote: gut" }],
      skills: [{ name: "Microsoft 365", level: 5 }, { name: "DATEV", level: 4 }, { name: "SAP Business One", level: 3 }, { name: "Korrespondenz", level: 5 }],
      languages: [{ name: "Deutsch", level: "Muttersprache" }, { name: "Englisch", level: "gute Kenntnisse (B2)" }],
      sections: []
    }
  };

  /* Beispiel für den Import, gehört bewusst nicht zur Galerie. */
  const stationsblatt = {
    format: "mappe-template/1", id: "stationsblatt", name: "Stationsblatt", field: "Pflege & Gesundheit",
    description: "Importiertes Beispiel: klare Einspaltenvorlage mit Farbband.",
    fonts: ["Source Sans 3:wght@400;600"],
    accents: ["#00707a", "#7a3e9d"],
    html: `<div class="cv"><header><h1>{{name}}</h1><p>{{title}}</p><p class="c">{{email}}{{#phone}} · {{phone}}{{/phone}}{{#city}} · {{city}}{{/city}}</p></header><main>
{{#summary}}<p class="entry">{{summary}}</p>{{/summary}}
{{#hasExperience}}<h2>Berufserfahrung</h2>{{#experience}}<article class="entry"><h3>{{role}}, {{org}}</h3><small>{{period}}</small>{{#hasBullets}}<ul>{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>{{/hasBullets}}</article>{{/experience}}{{/hasExperience}}
{{#hasEducation}}<h2>Ausbildung</h2>{{#education}}<article class="entry"><h3>{{degree}}, {{org}}</h3><small>{{period}}</small></article>{{/education}}{{/hasEducation}}
{{#hasSkills}}<h2>Kenntnisse</h2><p class="entry">{{#skills}}{{name}} &nbsp; {{/skills}}</p>{{/hasSkills}}
{{#sections}}<h2>{{title}}</h2><ul class="entry">{{#items}}<li>{{.}}</li>{{/items}}</ul>{{/sections}}
</main></div>`,
    css: `.cv{font:400 10.5pt/1.5 "Source Sans 3",Arial,sans-serif;color:#1d2b2e;background:#fff}
header{background:var(--accent);color:#fff;padding:14mm 18mm 9mm}h1{font-size:27pt;line-height:1.1;font-weight:600;margin:0}header p{margin:1mm 0 0}.c{font-size:9.5pt}
main{padding:8mm 18mm}h2{font-size:12pt;color:var(--accent);margin:5mm 0 2mm}h3{font-size:10.5pt;font-weight:600;margin:0}article{margin-bottom:3mm}ul{margin:1mm 0 0;padding-left:4mm}
@media(max-width:680px){header,main{padding:22px 20px}}`
  };

  window.MappeTemplates = { builtin: [commit, schaltplan, morgenkreis, ablage], importExample: stationsblatt };
})();
