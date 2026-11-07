/* DALLA NOSTRA PARTE · comportamento condiviso.
   Tutto il contenuto resta leggibile senza JS: qui c'è solo ciò che migliora l'esperienza. */
(() => {
  "use strict";

  // ── Configurazione unica ────────────────────────────────────────
  const CONFIG = {
    instagramHandle: "dallanostraparte.cd",
    // Se in futuro esiste un modulo (es. Google Form) incollare qui l'URL:
    // la pagina /segnala porterà lì invece di usare il messaggio Instagram.
    reportFormUrl: "",
    shareText: "Dalla Nostra Parte · Un modo più concreto di rappresentare gli studenti. Guarda le proposte:"
  };
  const IG_URL = `https://www.instagram.com/${CONFIG.instagramHandle}/`;
  const IG_DM_URL = `https://ig.me/m/${CONFIG.instagramHandle}`;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };

  // ── Vecchi QR: ?to=ig | proposte | segnala ──────────────────────
  const params = new URLSearchParams(location.search);
  const to = (params.get("to") || params.get("qr") || "").toLowerCase();
  const ROUTES = { proposte: "/proposte", programma: "/proposte", segnala: "/segnala", segnalazioni: "/segnala", registro: "/registro" };
  if (to === "ig" || to === "instagram") { location.replace(IG_URL); return; }
  if (ROUTES[to]) { location.replace(ROUTES[to]); return; }
  if (to === "cantiere" || to === "comitato") { location.replace("/#priorita"); return; }

  // ── Toast ───────────────────────────────────────────────────────
  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  async function copy(msg) {
    try { await navigator.clipboard.writeText(msg); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = msg; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {}
      ta.remove(); return ok;
    }
  }

  // ── Barra di lettura + dock che si nasconde scorrendo verso il basso
  const bar = $(".progress");
  const dock = $(".dock");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(3) : 0);
    if (dock) {
      const nearEnd = max - y < 160;
      if (y > lastY + 6 && y > 160 && !nearEnd) dock.classList.add("hide");
      else if (y < lastY - 6 || nearEnd || y < 160) dock.classList.remove("hide");
    }
    lastY = y; ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ── Entrata morbida ─────────────────────────────────────────────
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: .08 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add("in"));

  // ── Condividi (Web Share su telefono, copia link altrove) ───────
  $$("[data-share]").forEach(b => b.addEventListener("click", async () => {
    const hash = b.dataset.hash ? `#${b.dataset.hash}` : "";
    const url = location.origin + (b.dataset.hash ? "/proposte" : "/") + hash;
    if (navigator.share) {
      try { await navigator.share({ title: "Dalla Nostra Parte", text: CONFIG.shareText, url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    toast((await copy(url)) ? "Link copiato ✓" : "Copia il link dalla barra");
  }));

  // ── Stampa la scheda ────────────────────────────────────────────
  const openAll = () => $$("details.more").forEach(d => { d.dataset.was = d.open ? "1" : "0"; d.open = true; });
  const restore = () => $$("details.more").forEach(d => { d.open = d.dataset.was === "1"; });
  addEventListener("beforeprint", openAll);
  addEventListener("afterprint", restore);
  $$("[data-print]").forEach(b => b.addEventListener("click", () => window.print()));

  // ── Pagina Proposte: filtro per categoria + deep link ───────────
  const list = $("#cards-list");
  if (list) {
    const EXPLAIN = {
      all: "<b>Tutte le proposte.</b> Ognuna dice subito se dipende da noi, se servono risorse o permessi, o se decide un altro organo.",
      dirette: "<b>Realizzabili direttamente.</b> Dipendono dalla rappresentanza: agiamo noi e rendiamo conto del lavoro svolto.",
      risorse: "<b>Con risorse o autorizzazioni.</b> Prepariamo una richiesta concreta, verifichiamo costi e permessi, seguiamo l'esito.",
      organi: "<b>Di altri organi.</b> Decidono docenti, dirigenza o Consiglio d'Istituto: noi raccogliamo, presentiamo e riferiamo la risposta."
    };
    const cards = $$(".prop", list);
    const chips = $$(".chip[data-cat]");
    const explain = $("#filter-explain");
    const empty = $("#empty");

    chips.forEach(c => {
      const cat = c.dataset.cat;
      const n = cat === "all" ? cards.length : cards.filter(p => p.dataset.cat === cat).length;
      const badge = $(".n", c); if (badge) badge.textContent = n;
    });

    function applyFilter(cat, { updateUrl = true } = {}) {
      if (!EXPLAIN[cat]) cat = "all";
      chips.forEach(c => c.setAttribute("aria-pressed", String(c.dataset.cat === cat)));
      explain.innerHTML = EXPLAIN[cat];
      let shown = 0;
      cards.forEach(p => { const ok = cat === "all" || p.dataset.cat === cat; p.hidden = !ok; if (ok) shown++; });
      empty.style.display = shown ? "none" : "block";
      if (updateUrl) {
        const u = new URL(location.href);
        cat === "all" ? u.searchParams.delete("cat") : u.searchParams.set("cat", cat);
        history.replaceState(null, "", u);
      }
    }
    chips.forEach(c => c.addEventListener("click", () => {
      applyFilter(c.dataset.cat);
      c.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }));

    applyFilter(params.get("cat") || "all", { updateUrl: false });

    // #p3 → apre la scheda e ci arriva
    function openHash() {
      const id = location.hash.slice(1);
      const el = id && document.getElementById(id);
      if (el && el.classList.contains("prop")) {
        if (el.hidden) applyFilter("all");
        const d = $("details.more", el); if (d) d.open = true;
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    }
    openHash();
    addEventListener("hashchange", openHash);
  }

  // ── Pagina Registro: legge assets/registro.json ─────────────────
  const regList = $("#reg-list");
  if (regList) {
    const STATI = [
      ["da-esaminare", "Da esaminare"], ["in-preparazione", "In preparazione"], ["presentata", "Presentata"],
      ["in-valutazione", "In valutazione"], ["approvata", "Approvata"], ["realizzata", "Realizzata"], ["non-accolta", "Non accolta"]
    ];
    const LABEL = Object.fromEntries(STATI);
    const STEP = Object.fromEntries(STATI.map(([k], i) => [k, i]));
    const CAT = { dirette: ["Dipende da noi", "dirette"], risorse: ["Con permessi", "risorse"], organi: ["Altri organi", "organi"] };
    const fmtDate = d => { if (!d) return null; const t = new Date(d + "T12:00:00"); return isNaN(t) ? d : t.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }); };
    const empty = $("#reg-empty");
    let items = [], filter = "all";

    function card(p) {
      const idx = Math.min(STEP[p.stato] ?? 0, 5);
      const bars = Array.from({ length: 6 }, (_, i) => `<i class="${i < idx ? "on" : i === idx ? "now" : ""}"></i>`).join("");
      const [catLabel, catCls] = CAT[p.categoria] || ["", "organi"];
      const dd = (v, none) => v ? `<dd>${esc(v)}</dd>` : `<dd class="none">${none}</dd>`;
      return `<article class="card reg reveal in" id="${esc(p.id)}">
        <div class="reg-top"><h3>${esc(p.titolo)}</h3><span class="pill s-${esc(p.stato)}">${esc(LABEL[p.stato] || p.stato)}</span></div>
        <div><div class="bar" aria-hidden="true">${bars}</div><div class="bar-cap"><span>Da esaminare</span><span>Realizzata</span></div></div>
        <dl>
          <div><dt>Problema</dt>${dd(p.problema, "—")}</div>
          <div><dt>Intervento proposto</dt>${dd(p.intervento, "—")}</div>
          <div class="reg-grid">
            <div><dt>Competenza</dt>${dd(p.competenza, "—")}</div>
            <div><dt>Categoria</dt><dd><span class="tag ${catCls}">${esc(catLabel)}</span></dd></div>
          </div>
          <div class="reg-grid">
            <div><dt>Presentata il</dt>${dd(fmtDate(p.presentata), "Non ancora")}</div>
            <div><dt>Risposta</dt>${dd(p.risposta, "Nessuna ancora")}</div>
          </div>
          <div><dt>Prossimo passaggio</dt>${dd(p.prossimo, "—")}</div>
        </dl>
        <div class="reg-foot"><a href="/proposte#${esc(p.id)}">Leggi la proposta →</a></div>
      </article>`;
    }

    function render() {
      const shown = items.filter(p => filter === "all" || p.stato === filter);
      regList.innerHTML = shown.map(card).join("");
      empty.style.display = shown.length ? "none" : "block";
      $$("#reg-chips .chip").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.stato === filter)));
    }

    function build(data) {
      items = data.proposte || [];
      const presentate = items.filter(p => (STEP[p.stato] ?? 0) >= 2).length;
      const realizzate = items.filter(p => p.stato === "realizzata").length;
      $("#tiles").innerHTML =
        `<div class="card tile"><b>${items.length}</b><span>nel registro</span></div>` +
        `<div class="card tile"><b>${presentate}</b><span>presentate</span></div>` +
        `<div class="card tile g"><b>${realizzate}</b><span>realizzate</span></div>`;
      const up = fmtDate(data.aggiornato);
      $("#updated").textContent = up ? `Aggiornato al ${up}` : "";
      const present = STATI.filter(([k]) => items.some(p => p.stato === k));
      $("#reg-chips").innerHTML =
        `<button class="chip plain" type="button" data-stato="all" aria-pressed="true">Tutte <span class="n">${items.length}</span></button>` +
        present.map(([k, l]) => `<button class="chip plain" type="button" data-stato="${k}" aria-pressed="false">${l} <span class="n">${items.filter(p => p.stato === k).length}</span></button>`).join("");
      $$("#reg-chips .chip").forEach(c => c.addEventListener("click", () => { filter = c.dataset.stato; render(); c.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }));
      render();
      const id = location.hash.slice(1), el = id && document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }

    fetch("/assets/registro.json", { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(build)
      .catch(() => { regList.innerHTML = `<p class="note light"><strong>Registro non raggiungibile</strong>Riprova tra poco. Intanto le proposte sono nella pagina <a href="/proposte">Proposte</a>.</p>`; });
  }

  // ── Pagina Segnala ──────────────────────────────────────────────
  const form = $("#report-form");
  if (form) {
    const text = $("#r-text"), where = $("#r-where"), counter = $("#r-count"), sent = $("#sent"), note = $("#draft-note");
    const MAX = 800, KEY = "dnp-bozza";
    const upd = () => { counter.textContent = `${text.value.length}/${MAX}`; };

    // Bozza salvata sul telefono: se si esce per aprire Instagram non si perde nulla
    try {
      const d = JSON.parse(store.get(KEY) || "null");
      if (d) {
        text.value = d.text || ""; where.value = d.where || "";
        const r = d.cat && $$("input[name=cat]", form).find(i => i.value === d.cat); if (r) r.checked = true;
        upd();
      }
    } catch {}
    let t;
    const save = () => {
      const cat = (form.querySelector("input[name=cat]:checked") || {}).value || "";
      if (!text.value.trim() && !where.value.trim()) { store.del(KEY); note.classList.remove("show"); return; }
      store.set(KEY, JSON.stringify({ cat, where: where.value, text: text.value }));
      clearTimeout(t); note.classList.add("show"); t = setTimeout(() => note.classList.remove("show"), 1800);
    };
    text.addEventListener("input", () => { upd(); save(); });
    where.addEventListener("input", save);
    form.addEventListener("change", save);

    function buildMessage() {
      const cat = (form.querySelector("input[name=cat]:checked") || {}).value || "Altro";
      const w = where.value.trim();
      return [`SEGNALAZIONE · ${cat}`, w ? `Dove / classe: ${w}` : null, "", text.value.trim(), "", "(Inviata dal sito Dalla Nostra Parte)"]
        .filter(v => v !== null).join("\n");
    }

    if (CONFIG.reportFormUrl) { const go = $("#go-dm"); if (go) go.href = CONFIG.reportFormUrl; }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (text.value.trim().length < 10) { text.focus(); toast("Scrivi almeno una frase"); return; }
      if (CONFIG.reportFormUrl) { location.href = CONFIG.reportFormUrl; return; }
      const msg = buildMessage();
      const ok = await copy(msg);
      sent.classList.add("show");
      $("#sent-text").textContent = ok
        ? "Messaggio copiato. Apri Instagram, incollalo nella chat e invialo."
        : "Non sono riuscito a copiarlo in automatico: tieni premuto sul testo qui sotto per copiarlo.";
      $("#fallback-text").hidden = ok;
      $("#fallback-text").value = msg;
      sent.scrollIntoView({ behavior: "smooth", block: "center" });
      if (ok) toast("Copiato ✓");
    });

    // Il pulsante Instagram chiude il giro: la bozza non serve più
    const dm = $("#go-dm");
    if (dm && !CONFIG.reportFormUrl) dm.href = IG_DM_URL;
    if (dm) dm.addEventListener("click", () => { store.del(KEY); });
  }
})();
