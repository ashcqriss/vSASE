/* ===================================================================
   iOS 6 · Arch Edition — homage apps, 2012 edition
   LazyVim (modal editor), Step Counter (real accelerometer),
   Obsidian (wikilinks + graph), Obsidian Web Clipper (Safari hook).
   All icons and text are original work in the iOS 6 visual style.
   =================================================================== */
"use strict";

/* ---------- shared: obsidian vault store (also used by Safari) ---------- */

const ObsidianVault = (() => {
  const seed = [
    { title: "Start Here", body: "Welcome to your vault.\n\nEverything is a note, and notes link to notes: try [[Arch Phone]] or [[Ideas]].\n\nThe graph tab draws what you have connected." },
    { title: "Arch Phone", body: "A telephone that boots a rolling release.\n\nRelated thoughts live in [[Ideas]]. Clipped pages land in [[Clips]]." },
    { title: "Ideas", body: "- teach the [[Arch Phone]] to make coffee\n- a second brain, but skeuomorphic\n- write everything down before the linen fades" },
    { title: "Clips", body: "Pages clipped from Safari end up linked here." }
  ];
  const notes = () => Prefs.get("obsidianVault", seed);
  const save = list => Prefs.set("obsidianVault", list);
  function get(title) { return notes().find(n => n.title.toLowerCase() === title.toLowerCase()); }
  function upsert(title, body) {
    const list = notes();
    const ex = list.find(n => n.title.toLowerCase() === title.toLowerCase());
    if (ex) ex.body = body; else list.push({ title, body });
    save(list);
  }
  function remove(title) { save(notes().filter(n => n.title !== title)); }
  function linksOf(n) {
    return [...n.body.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].trim());
  }
  function addClip(pageTitle, text) {
    const title = "Clip: " + pageTitle.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 34);
    upsert(title, "Source: " + pageTitle + "\nClipped: " + new Date().toLocaleString() +
      "\n\n" + text.trim().slice(0, 500) + "\n\nFiled under [[Clips]].");
    return title;
  }
  return { notes, get, upsert, remove, linksOf, addClip };
})();

/* ---------- icons (original artwork, iOS 6 finish) ---------- */

const XGLOSS = `<path d="M0,0 h57 v19 c-13,8.5 -44,8.5 -57,0 z" fill="#ffffff" opacity="0.28"/>`;

const iconLazyVim = () => `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lv_bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2c3145"/><stop offset="1" stop-color="#12141f"/></linearGradient>
  <linearGradient id="lv_v" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5ad0b0"/><stop offset="1" stop-color="#3a7ad8"/></linearGradient></defs>
  <rect width="57" height="57" fill="url(#lv_bg)"/>
  <path d="M28.5 8 L46 19 v3 L31 45 h-5 L11 22 v-3 z" fill="url(#lv_v)" stroke="#0e2a3a" stroke-width="1.2"/>
  <path d="M20 24 h9 l-7 9 h7" fill="none" stroke="#0e1a26" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="44" cy="12" r="5" fill="#f2e6a0" opacity="0.9"/>
  <path d="M41.5 10.4 h5 l-5 3.2 h5" fill="none" stroke="#7a6a2a" stroke-width="1.3"/>
  ${XGLOSS}</svg>`;

const iconSteps = () => `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="st_bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8fd06a"/><stop offset="1" stop-color="#3f8a2a"/></linearGradient></defs>
  <rect width="57" height="57" fill="url(#st_bg)"/>
  <g fill="#ffffff" opacity="0.95">
    <path d="M18 34 c-3 -7 -2 -13 2 -15 c4 -2 8 1 9 7 c0.8 5 -0.5 8 -4 9.5 c-3 1.3 -5.6 0.6 -7 -1.5z"/>
    <ellipse cx="20" cy="43" rx="5.5" ry="3.4"/>
    <path d="M35 22 c-3 -7 -2 -13 2 -15 c4 -2 8 1 9 7 c0.8 5 -0.5 8 -4 9.5 c-3 1.3 -5.6 0.6 -7 -1.5z" opacity="0.6"/>
    <ellipse cx="37" cy="31" rx="5.5" ry="3.4" opacity="0.6"/>
  </g>
  ${XGLOSS}</svg>`;

const iconObsidian = () => `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="ob_bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a2a5e"/><stop offset="1" stop-color="#181028"/></linearGradient>
  <linearGradient id="ob_gem" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b8a0f8"/><stop offset="0.55" stop-color="#7a52e0"/><stop offset="1" stop-color="#4a2aa0"/></linearGradient></defs>
  <rect width="57" height="57" fill="url(#ob_bg)"/>
  <path d="M23 8 L40 14 L44 34 L31 49 L17 40 L15 20 z" fill="url(#ob_gem)" stroke="#241448" stroke-width="1.2"/>
  <path d="M23 8 L28 24 L15 20 z" fill="#cdbcfa" opacity="0.75"/>
  <path d="M28 24 L40 14 L44 34 z" fill="#8f6af0" opacity="0.7"/>
  <path d="M28 24 L44 34 L31 49 z" fill="#5c38c0" opacity="0.8"/>
  <path d="M28 24 L31 49 L17 40 L15 20 z" fill="#6f48d8" opacity="0.65"/>
  ${XGLOSS}</svg>`;

const iconClipper = () => `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="cl_bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6a4ad0"/><stop offset="1" stop-color="#2e1a70"/></linearGradient></defs>
  <rect width="57" height="57" fill="url(#cl_bg)"/>
  <rect x="14" y="10" width="26" height="34" rx="3" fill="#f4f2fa" stroke="#b8aee0"/>
  ${[17, 22, 27, 32].map(y => `<rect x="18" y="${y}" width="18" height="2" rx="1" fill="#b0a4d8"/>`).join("")}
  <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none">
    <path d="M30 40 L44 26"/><path d="M30 26 L44 40"/>
  </g>
  <circle cx="28" cy="42" r="4" fill="none" stroke="#ffffff" stroke-width="2.6"/>
  <circle cx="28" cy="24" r="4" fill="none" stroke="#ffffff" stroke-width="2.6"/>
  ${XGLOSS}</svg>`;

/* =================================================================
   LazyVim — a modal editor with a plugin manager, phone edition
   ================================================================= */

const LazyVimApp = {
  id: "lazyvim", name: "LazyVim", price: "FREE",
  desc: "Modal editing for one thumb",
  bg: "#12141f", glyph: "keypad", icon: iconLazyVim,
  rootClass: "lv-root",
  onClose() { document.removeEventListener("keydown", this._kh); },
  render(root) {
    const def = IOS.app("lazyvim");
    let lines = Prefs.get("lvBuffer", [
      "# notes.md — edited with LazyVim (phone edition)",
      "",
      "hjkl move · i insert · Esc normal",
      "x delete char · dd delete line · o new line",
      ":w write · :q dashboard · :Lazy plugins"
    ]);
    let mode = "NORMAL", row = 0, col = 0, cmd = "", pendingKey = "", msg = "";
    let view = "dash"; // dash | edit | lazy

    const screen = h("pre", "lv-screen");
    const status = h("div", "lv-status");
    const body = h("div", { style: { flex: "1", display: "flex", flexDirection: "column", overflow: "hidden" } });

    const PLUGINS = [
      ["lazy.nvim", "loaded", "3.1ms"], ["telescope", "lazy", "—"],
      ["treesitter", "loaded", "8.4ms"], ["which-key", "lazy", "—"],
      ["lualine", "loaded", "1.9ms"], ["gitsigns", "lazy", "—"],
      ["noice", "lazy", "—"], ["mini.pairs", "loaded", "0.6ms"]
    ];

    function clampCursor() {
      row = Math.max(0, Math.min(lines.length - 1, row));
      col = Math.max(0, Math.min(Math.max(0, (lines[row] || "").length - (mode === "NORMAL" ? 1 : 0)), col));
    }

    function paint() {
      body.innerHTML = "";
      if (view === "dash") {
        body.append(h("div", "lv-dash",
          h("pre", "lv-logo",
            "  _              __     ___\n" +
            " | |   __ _ ___ _\\ \\   / (_)_ __ ___\n" +
            " | |  / _` |_  / | \\ \\ / /| | '_ ` _ \\\n" +
            " | |_| (_| |/ /| |_ \\ V / | | | | | | |\n" +
            " |____\\__,_/___|\\__, \\_/  |_|_| |_| |_|\n" +
            "                |___/   phone edition"),
          h("button", { class: "lv-btn", onclick: () => { Snd.click(); view = "edit"; paint(); } }, "e — edit notes.md"),
          h("button", { class: "lv-btn", onclick: () => { Snd.click(); view = "lazy"; paint(); } }, "l — :Lazy plugins"),
          h("button", { class: "lv-btn", onclick: () => { Snd.click(); IOS.goHome(); } }, "q — quit to springboard"),
          h("div", "lv-hint", "startup: 42 plugins, 38 lazy-loaded, 11.2ms")));
        return;
      }
      if (view === "lazy") {
        body.append(h("div", "lv-lazy",
          h("div", "lv-lazy-head", "lazy.nvim — plugin status"),
          ...PLUGINS.map(([n, st, t]) => h("div", "lv-lazy-row",
            h("span", { class: st === "loaded" ? "lv-ok" : "lv-dim" }, st === "loaded" ? "●" : "○"),
            h("span", { style: { flex: "1" } }, " " + n),
            h("span", "lv-dim", st === "loaded" ? t : "lazy"))),
          h("div", "lv-hint", "everything you did not press a key for stays unloaded"),
          h("button", { class: "lv-btn", onclick: () => { Snd.click(); view = "edit"; paint(); } }, "back to buffer")));
        return;
      }
      // editor
      screen.innerHTML = "";
      lines.forEach((ln, r) => {
        const div = h("div");
        if (r === row) {
          const c = Math.min(col, Math.max(0, ln.length));
          div.append(document.createTextNode(ln.slice(0, c)));
          div.append(h("span", "lv-cursor" + (mode === "INSERT" ? " ins" : ""), ln[c] || " "));
          div.append(document.createTextNode(ln.slice(c + 1)));
        } else div.textContent = ln || " ";
        screen.append(div);
      });
      status.textContent = mode === "CMD" ? ":" + cmd
        : "-- " + mode + " --  notes.md  " + (row + 1) + ":" + (col + 1) + (msg ? "  " + msg : "");
      body.append(screen, status);
      screen.scrollTop = Math.max(0, (row - 8) * 15);
    }

    function execCmd() {
      const c = cmd.trim();
      msg = "";
      if (c === "w" || c === "wq") {
        Prefs.set("lvBuffer", lines);
        msg = '"notes.md" ' + lines.length + "L written";
        if (c === "wq") view = "dash";
      } else if (c === "q" || c === "q!") view = "dash";
      else if (c.toLowerCase() === "lazy") view = "lazy";
      else if (c === "help") msg = "you are beyond help. try :w, :q, :Lazy";
      else msg = "E492: not an editor command: " + c;
      cmd = ""; mode = "NORMAL";
      paint();
    }

    function feed(k) {
      if (view !== "edit") {
        if (view === "dash") { if (k === "e") { view = "edit"; } else if (k === "l") view = "lazy"; else if (k === "q") return IOS.goHome(); }
        else if (view === "lazy" && (k === "q" || k === "Escape")) view = "edit";
        paint();
        return;
      }
      msg = "";
      if (mode === "CMD") {
        if (k === "Enter") return execCmd();
        if (k === "Escape") { cmd = ""; mode = "NORMAL"; }
        else if (k === "Backspace") cmd = cmd.slice(0, -1);
        else if (k.length === 1) cmd += k;
        paint();
        return;
      }
      if (mode === "INSERT") {
        if (k === "Escape") { mode = "NORMAL"; col = Math.max(0, col - 1); }
        else if (k === "Enter") {
          const rest = lines[row].slice(col);
          lines[row] = lines[row].slice(0, col);
          lines.splice(row + 1, 0, rest); row++; col = 0;
        } else if (k === "Backspace") {
          if (col > 0) { lines[row] = lines[row].slice(0, col - 1) + lines[row].slice(col); col--; }
          else if (row > 0) { col = lines[row - 1].length; lines[row - 1] += lines[row]; lines.splice(row, 1); row--; }
        } else if (k.length === 1) {
          lines[row] = lines[row].slice(0, col) + k + lines[row].slice(col); col++;
        }
        clampCursor(); paint();
        return;
      }
      // NORMAL
      if (pendingKey === "d") {
        pendingKey = "";
        if (k === "d") { lines.splice(row, 1); if (!lines.length) lines = [""]; clampCursor(); msg = "1 line deleted"; }
      } else if (pendingKey === "g") {
        pendingKey = "";
        if (k === "g") { row = 0; col = 0; }
      } else if (k === "h") col--;
      else if (k === "l") col++;
      else if (k === "j") row++;
      else if (k === "k") row--;
      else if (k === "0") col = 0;
      else if (k === "$") col = Math.max(0, lines[row].length - 1);
      else if (k === "G") { row = lines.length - 1; }
      else if (k === "g") pendingKey = "g";
      else if (k === "d") pendingKey = "d";
      else if (k === "x") { lines[row] = lines[row].slice(0, col) + lines[row].slice(col + 1); }
      else if (k === "i") mode = "INSERT";
      else if (k === "a") { mode = "INSERT"; col++; }
      else if (k === "o") { lines.splice(row + 1, 0, ""); row++; col = 0; mode = "INSERT"; }
      else if (k === ":") { mode = "CMD"; cmd = ""; }
      clampCursor(); paint();
    }

    // hardware keys
    def._kh = e => {
      if (KB.visible) return;
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      e.preventDefault();
      feed(e.key);
    };
    document.addEventListener("keydown", def._kh);

    // on-screen keyboard routes through a hidden field
    const field = kbField("", {
      onChange: v => { if (v.length) { feed(v[v.length - 1]); field._value = ""; field._renderValue(); } },
      onReturn: () => feed("Enter")
    });
    field.style.position = "absolute"; field.style.left = "-9999px";
    body.addEventListener("click", () => { if (view === "edit") KB.open(field); });

    const escBtn = navBtn("Esc", () => feed("Escape"));
    root.append(navbar("LazyVim", { dark: true, left: escBtn,
      right: navBtn("⌫", () => feed("Backspace")) }), body, field);
    paint();
  }
};

/* =================================================================
   Step Counter — real accelerometer when the hardware has one
   ================================================================= */

const StepsApp = {
  id: "steps", name: "Steps", price: "FREE",
  desc: "Count steps with the real accelerometer",
  bg: "#3f8a2a", glyph: "person", icon: iconSteps,
  onClose() {
    window.removeEventListener("devicemotion", this._mh);
    clearInterval(this._iv);
  },
  render(root) {
    const def = IOS.app("steps");
    const GOAL = 10000;
    const today = new Date().toISOString().slice(0, 10);
    const hist = () => Prefs.get("stepsHist", {});
    const setToday = n => { const hh = hist(); hh[today] = n; Prefs.set("stepsHist", hh); };
    let steps = hist()[today] || 0;
    let tracking = false, lastStep = 0, gotMotion = false;

    const big = h("div", "steps-big", String(steps));
    const bar = h("i");
    const sub = h("div", "steps-sub");
    const shoe = h("div", { class: "steps-shoe", html: iconSteps() });
    const toggle = h("button", "big-blue-btn", "Start Tracking");

    function paint() {
      big.textContent = steps.toLocaleString();
      bar.style.width = Math.min(100, steps / GOAL * 100) + "%";
      sub.textContent = steps >= GOAL
        ? "Goal reached. The couch has lost this round."
        : (GOAL - steps).toLocaleString() + " steps to your " + GOAL.toLocaleString() + " goal";
    }

    function onStep() {
      steps++; setToday(steps); paint();
      if (steps % 100 === 0) Snd.click();
    }

    def._mh = e => {
      if (!tracking) return;
      gotMotion = true;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      const now = Date.now();
      if (Math.abs(mag - 9.81) > 2.4 && now - lastStep > 340) { lastStep = now; onStep(); }
    };
    window.addEventListener("devicemotion", def._mh);

    toggle.addEventListener("click", async () => {
      Snd.click();
      tracking = !tracking;
      toggle.textContent = tracking ? "Stop Tracking" : "Start Tracking";
      if (tracking) {
        // iOS 13+ Safari gates motion events behind a permission prompt
        // that must be requested from a user gesture — this click is one
        if (typeof DeviceMotionEvent !== "undefined" &&
            typeof DeviceMotionEvent.requestPermission === "function") {
          try { await DeviceMotionEvent.requestPermission(); } catch (e) { /* denied → tap mode */ }
        }
        gotMotion = false;
        def._iv = setTimeout(() => {
          if (!gotMotion) sub.textContent = "No accelerometer here — tap the shoe to take steps.";
        }, 2500);
      }
    });
    shoe.addEventListener("click", () => { Snd.key(); onStep(); });

    // last 7 days chart
    const chart = h("div", "steps-chart");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const v = d === today ? steps : (hist()[d] || 0);
      chart.append(h("div", "steps-col",
        h("div", { class: "steps-colbar", style: { height: Math.min(56, v / GOAL * 56) + "px" } }),
        h("div", "steps-collbl", d.slice(8))));
    }

    root.append(
      navbar("Steps"),
      h("div", { class: "content grouped", style: { textAlign: "center" } },
        shoe, big,
        h("div", "steps-track", bar), sub,
        h("div", { style: { padding: "10px 4px" } }, toggle),
        h("div", "group-label", "Last 7 days"),
        h("div", "group", chart),
        h("div", "group-foot", "On a phone this reads the real accelerometer. On a desktop it reads your finger.")));
    paint();
  }
};

/* =================================================================
   Obsidian — linked notes and a graph, dressed for 2012
   ================================================================= */

const ObsidianApp = {
  id: "obsidian", name: "Obsidian", price: "FREE",
  desc: "A second brain with [[links]] and a graph",
  bg: "#181028", glyph: "book", icon: iconObsidian,
  rootClass: "ob-root",
  render(root) {
    const nav = new UINav(root);

    function editor(title) {
      let note = ObsidianVault.get(title);
      if (!note) { ObsidianVault.upsert(title, "New note.\n\nLink things with [[Start Here]]."); note = ObsidianVault.get(title); }
      const paper = h("div", { class: "ob-paper", contenteditable: "plaintext-only", spellcheck: "false" });
      paper.textContent = note.body;
      paper.addEventListener("input", () => ObsidianVault.upsert(title, paper.textContent));
      const linkBar = h("div", "ob-links");
      function paintLinks() {
        linkBar.innerHTML = "";
        const ls = ObsidianVault.linksOf({ body: paper.textContent });
        if (!ls.length) linkBar.append(h("span", "ob-dim", "no [[links]] yet"));
        ls.forEach(l => linkBar.append(h("span", { class: "ob-chip", onclick: () => { Snd.click(); editor(l); } }, l)));
      }
      paper.addEventListener("input", paintLinks);
      nav.push(navView(
        navbar(title, { dark: true, left: backBtn("Vault", () => nav.pop()),
          right: navBtn(gl("trash", 14), () => showSheet([
            { label: "Delete “" + title + "”", style: "destructive", onTap: () => { ObsidianVault.remove(title); nav.pop(); refreshList(); } },
            { label: "Cancel", style: "cancel" }])) }),
        paper, linkBar));
      paintLinks();
    }

    function graphView() {
      const c = h("canvas", { width: 320, height: 340, style: { width: "100%", flex: "1", background: "#141020" } });
      const g = c.getContext("2d");
      const ns = ObsidianVault.notes();
      const idx = Object.fromEntries(ns.map((n, i) => [n.title.toLowerCase(), i]));
      const pos = ns.map((_, i) => {
        const a = i * 2 * Math.PI / ns.length - Math.PI / 2;
        return { x: 160 + Math.cos(a) * 100, y: 165 + Math.sin(a) * 110 };
      });
      // light spring relaxation so linked notes drift together
      for (let it = 0; it < 80; it++) {
        ns.forEach((n, i) => ObsidianVault.linksOf(n).forEach(l => {
          const j = idx[l.toLowerCase()];
          if (j === undefined) return;
          const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y;
          pos[i].x += dx * 0.01; pos[i].y += dy * 0.01;
          pos[j].x -= dx * 0.01; pos[j].y -= dy * 0.01;
        }));
        for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
          const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 70) { const f = (70 - d) / d * 0.06; pos[i].x -= dx * f; pos[i].y -= dy * f; pos[j].x += dx * f; pos[j].y += dy * f; }
        }
      }
      g.strokeStyle = "rgba(150,120,240,.45)"; g.lineWidth = 1.4;
      ns.forEach((n, i) => ObsidianVault.linksOf(n).forEach(l => {
        const j = idx[l.toLowerCase()];
        if (j === undefined) return;
        g.beginPath(); g.moveTo(pos[i].x, pos[i].y); g.lineTo(pos[j].x, pos[j].y); g.stroke();
      }));
      ns.forEach((n, i) => {
        const r = 6 + Math.min(6, ObsidianVault.linksOf(n).length * 2);
        const grad = g.createRadialGradient(pos[i].x - 2, pos[i].y - 2, 1, pos[i].x, pos[i].y, r);
        grad.addColorStop(0, "#c8b4fa"); grad.addColorStop(1, "#6a42d8");
        g.fillStyle = grad;
        g.beginPath(); g.arc(pos[i].x, pos[i].y, r, 0, 7); g.fill();
        g.fillStyle = "#cfc4ee"; g.font = "10px Helvetica"; g.textAlign = "center";
        g.fillText(n.title.slice(0, 16), pos[i].x, pos[i].y + r + 11);
      });
      c.addEventListener("click", e => {
        const rct = c.getBoundingClientRect();
        const x = (e.clientX - rct.left) * (320 / rct.width), y = (e.clientY - rct.top) * (340 / rct.height);
        const i = ns.findIndex((_, k) => Math.hypot(pos[k].x - x, pos[k].y - y) < 16);
        if (i >= 0) { Snd.click(); editor(ns[i].title); }
      });
      nav.push(navView(
        navbar("Graph", { dark: true, left: backBtn("Vault", () => nav.pop()) }),
        c,
        h("div", { class: "ob-links", style: { justifyContent: "center" } },
          h("span", "ob-dim", "tap a node to open the note"))));
    }

    let listEl;
    function refreshList() {
      listEl.innerHTML = "";
      ObsidianVault.notes().forEach(n => listEl.append(cell({
        label: n.title,
        sub: n.body.split("\n")[0].slice(0, 44),
        chev: true, onTap: () => editor(n.title)
      })));
    }
    listEl = h("div", "content list ob-list");
    nav.push(navView(
      navbar("Obsidian", { dark: true,
        left: navBtn(gl("share", 14), () => graphView()),
        right: navBtn("+", () => {
          const name = "Note " + (ObsidianVault.notes().length + 1);
          ObsidianVault.upsert(name, "");
          refreshList(); editor(name);
        }) }),
      listEl,
      h("div", { class: "ob-links", style: { justifyContent: "center" } },
        h("span", "ob-dim", "◈ graph is top-left · [[double brackets]] make links"))), false);
    refreshList();
  }
};

/* =================================================================
   Obsidian Web Clipper — lives in Safari's share sheet
   ================================================================= */

const ClipperApp = {
  id: "clipper", name: "Web Clipper", price: "FREE",
  desc: "Clip Safari pages into your vault",
  bg: "#2e1a70", glyph: "compose", icon: iconClipper,
  rootClass: "ob-root",
  render(root) {
    const list = h("div", "content list ob-list");
    function paint() {
      list.innerHTML = "";
      const clips = ObsidianVault.notes().filter(n => n.title.startsWith("Clip: "));
      if (!clips.length) list.append(h("div", "empty-msg",
        "No clips yet.\nOpen Safari, browse to a page, tap the share button and choose “Clip to Obsidian”."));
      clips.forEach(n => list.append(cell({
        label: n.title.slice(6), sub: n.body.split("\n")[0],
        chev: true,
        onTap: () => { IOS.open("obsidian"); }
      })));
    }
    root.append(
      navbar("Web Clipper", { dark: true, right: navBtn("Safari", () => IOS.open("safari")) }),
      h("div", "cydia-hero",
        h("div", { class: "cydia-hero-ico", html: iconClipper() }),
        h("div", null, h("b", { style: { color: "#e8e2fa" } }, "Highlight the web"),
          h("div", { class: "cydia-sub", style: { color: "#b0a4d8" } }, "Anything you clip in Safari lands in the Obsidian vault, linked under [[Clips]]."))),
      list);
    paint();
  }
};

/* register everything with the App Store */
AppMarket.addApps([LazyVimApp, StepsApp, ObsidianApp, ClipperApp]);
