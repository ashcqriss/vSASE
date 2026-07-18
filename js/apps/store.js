/* ===================================================================
   iOS 6 · Arch Edition — App Store (functional installs) & Cydia
   Installed apps land on the home screen and persist; Cydia tweaks
   really modify the system. On real Arch hardware Cydia additionally
   fronts pacman through ios6d.
   =================================================================== */
"use strict";

/* =================================================================
   Installable mini-apps
   ================================================================= */

const AppMarket = (() => {

  /* ---- app icon helper: colored tile + white glyph ---- */
  const tileIcon = (bg, glyphName) => () =>
    `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tg${glyphName}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".45"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity=".06"/></linearGradient></defs>
      <rect width="57" height="57" fill="${bg}"/>
      <g transform="translate(13.5 13.5) scale(1.25)" fill="#fff">${
        Glyphs[glyphName]().replace(/<\/?svg[^>]*>/g, "").replace(/currentColor/g, "#ffffff")
      }</g>
      <path d="M0,0 h57 v19 c-13,8.5 -44,8.5 -57,0 z" fill="url(#tg${glyphName})"/>
    </svg>`;

  /* ---- catalog of installable apps ---- */
  const CATALOG = [
    {
      id: "flashlight", name: "Flashlight", price: "FREE",
      desc: "The most honest app of 2012",
      bg: "#3d4450", glyph: "sun",
      render(root) {
        let on = true;
        const pane = h("div", { style: { flex: "1", background: "#fff", display: "flex",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          color: "#999", fontSize: "14px", fontWeight: "bold" } }, "tap to toggle");
        pane.addEventListener("click", () => {
          on = !on;
          pane.style.background = on ? "#fff" : "#000";
          pane.style.color = on ? "#999" : "#333";
          Snd.click();
        });
        root.append(pane);
      }
    },
    {
      id: "chirper", name: "Chirper", price: "FREE",
      desc: "140 characters ought to be enough",
      bg: "linear-gradient(#4aa8e0,#1a6aa8)", glyph: "bubble",
      render(root) {
        const chirps = Prefs.get("chirps", [
          { who: "@archbot", text: "I use Arch btw" },
          { who: "@skeuomorph_fan", text: "they will NEVER remove the linen. right?? ...right?" },
          { who: "@natalia", text: "falafel saturday is ON 🌯" },
          { who: "@kernel_panic_band", text: "new album 'Rolling Release' out now on iTunes!!" }
        ]);
        const list = h("div", "content");
        const paint = () => {
          list.innerHTML = "";
          chirps.forEach(c => list.append(h("div", "chirp",
            h("b", null, c.who), h("span", null, " · just now"), h("p", null, c.text))));
        };
        const field = kbField("Compose chirp…", {
          returnLabel: "Chirp", blueReturn: true,
          onReturn: v => {
            if (!v.trim()) return;
            chirps.unshift({ who: "@you", text: v.trim().slice(0, 140) });
            Prefs.set("chirps", chirps);
            field.value = ""; KB.close(); paint(); Snd.sent();
          }
        });
        root.append(
          navbar("Chirper", { dark: true }),
          h("div", { style: { padding: "6px 8px", background: "#dce8f2", borderBottom: "1px solid #a8c0d4" } }, field),
          list);
        paint();
      }
    },
    {
      id: "rpncalc", name: "RPN Calc HD", price: "$2.99",
      desc: "For people who disagree with = signs",
      bg: "linear-gradient(#43464d,#191b1f)", glyph: "keypad",
      render(root) {
        root.classList.add("calc-root");
        let stack = [], entry = "";
        const disp = h("div", { class: "calc-display", style: { fontSize: "26px", flexDirection: "column",
          alignItems: "flex-end", justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" } });
        const paint = () => {
          disp.innerHTML = "";
          stack.slice(-3).forEach((v, i) =>
            disp.append(h("div", { style: { fontSize: "17px", color: "#8a8f98" } },
              (stack.length - Math.min(3, stack.length) + i + 1) + ": " + v)));
          disp.append(h("div", { style: { fontSize: "34px" } }, entry || "0"));
        };
        const grid = h("div", "calc-grid");
        [["7",""],["8",""],["9",""],["÷","op"],
         ["4",""],["5",""],["6",""],["×","op"],
         ["1",""],["2",""],["3",""],["−","op"],
         ["0",""],[".",""],["⏎","dark"],["+","op"]].forEach(([k, cls]) => {
          const b = h("button", "calc-btn " + cls, k);
          b.addEventListener("click", () => {
            Snd.key();
            if (/[\d.]/.test(k)) entry += k;
            else if (k === "⏎") { if (entry) { stack.push(parseFloat(entry)); entry = ""; } }
            else {
              if (entry) { stack.push(parseFloat(entry)); entry = ""; }
              if (stack.length >= 2) {
                const b2 = stack.pop(), a = stack.pop();
                stack.push(k === "+" ? a + b2 : k === "−" ? a - b2 : k === "×" ? a * b2 : (b2 === 0 ? NaN : a / b2));
              }
            }
            paint();
          });
          grid.append(b);
        });
        root.append(disp, grid);
        paint();
      }
    },
    {
      id: "wikireader", name: "Wiki Reader", price: "FREE",
      desc: "RTFM, beautifully",
      bg: "linear-gradient(#7a5c3a,#4a3520)", glyph: "book",
      render(root) {
        const nav = new UINav(root);
        const ARTICLES = [
          ["Installation guide (phone edition)", [
            "This document describes how to install Arch Linux on a telephone from 2012.",
            "Step 1: Verify the boot mode. If your phone shows a glowing fruit, the boot mode is 'vibes'. This is expected.",
            "Step 2: Partition the disks. The recommended layout is one partition for the system and one for feelings.",
            "Step 3: Install essential packages: pacstrap /mnt base linux linen-textures skeuomorphism.",
            "Step 4: Reboot. If you see 'slide to unlock', the installation succeeded. Congratulations, and welcome."]],
          ["SpringBoard (iOS 6 shell)", [
            "SpringBoard is the display manager and application launcher of this device.",
            "Unlike other window managers, SpringBoard supports exactly one window at a time. The community considers this a feature.",
            "Configuration is done by dragging icons around, which is stored in ~/.config/vibes.",
            "See also: cage(1), chromium(1), the concept of fun."]],
          ["Frequently asked questions", [
            "Q: Is this really Arch? A: uname -r says yes, and uname has never lied to anyone.",
            "Q: Can it make calls? A: With ModemManager and a modem, genuinely yes.",
            "Q: Why iOS 6 and not 7? A: Gradients are load-bearing.",
            "Q: I found a bug. A: Please read this wiki page again before posting to the forums."]]
        ];
        const list = h("div", "content list");
        ARTICLES.forEach(([t, body]) => list.append(cell({ label: t, chev: true, onTap: () =>
          nav.push(navView(
            navbar("Article", { left: backBtn("Wiki", () => nav.pop()) }),
            h("div", { class: "content", style: { padding: "12px 14px" } },
              h("h3", { style: { marginBottom: "8px", fontSize: "17px" } }, t),
              body.map(par => h("p", { style: { fontSize: "14px", lineHeight: "1.5", marginBottom: "10px", fontWeight: "400" } }, par))))) })));
        nav.push(navView(navbar("Arch Wiki"), list), false);
      }
    },
    {
      id: "penguins", name: "Angry Penguins", price: "$0.99",
      desc: "Fling penguins at proprietary software",
      bg: "linear-gradient(#4a8a4a,#255525)", glyph: "star",
      onClose() { cancelAnimationFrame(this._raf); },
      render(root) {
        const def = IOS.app("penguins");
        const c = h("canvas", { width: 320, height: 396, style: { flex: "1", touchAction: "none" } });
        const g = c.getContext("2d");
        const SLING = { x: 55, y: 330 };
        let pen = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, flying: false };
        let drag = null, score = 0, shots = 3;
        let blocks = [];
        const reset = full => {
          pen = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, flying: false };
          if (full) {
            score = 0; shots = 3;
            blocks = [
              { x: 230, y: 340, w: 18, h: 46, hit: false }, { x: 262, y: 340, w: 18, h: 46, hit: false },
              { x: 230, y: 316, w: 50, h: 16, hit: false, boss: true }
            ];
          }
        };
        reset(true);
        const pt = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (320 / r.width), y: (e.clientY - r.top) * (396 / r.height) }; };
        c.addEventListener("pointerdown", e => { const p = pt(e); if (!pen.flying && Math.hypot(p.x - pen.x, p.y - pen.y) < 30) drag = p; });
        c.addEventListener("pointermove", e => { if (drag) { const p = pt(e); pen.x = Math.min(SLING.x + 10, p.x); pen.y = p.y; } });
        c.addEventListener("pointerup", () => {
          if (!drag) return;
          pen.vx = (SLING.x - pen.x) * 0.16; pen.vy = (SLING.y - pen.y) * 0.16;
          if (Math.hypot(pen.vx, pen.vy) > 1.2) { pen.flying = true; shots--; Snd.click(); }
          else { pen.x = SLING.x; pen.y = SLING.y; }
          drag = null;
        });
        function step() {
          if (pen.flying) {
            pen.vy += 0.22; pen.x += pen.vx; pen.y += pen.vy;
            blocks.forEach(b => {
              if (!b.hit && pen.x > b.x - 8 && pen.x < b.x + b.w + 8 && pen.y > b.y - 8 && pen.y < b.y + b.h + 8) {
                b.hit = true; score += b.boss ? 500 : 100; Snd.key();
                if (score > Prefs.get("penguinHigh", 0)) Prefs.set("penguinHigh", score); // Game Center reads this
              }
            });
            if (pen.y > 380 || pen.x > 340) {
              if (shots > 0) reset(false);
              else pen.flying = false;
            }
          }
          // draw
          const sky = g.createLinearGradient(0, 0, 0, 396);
          sky.addColorStop(0, "#8ec7ef"); sky.addColorStop(0.8, "#d8eefa"); sky.addColorStop(0.81, "#e8f4e0"); sky.addColorStop(1, "#b8d8a0");
          g.fillStyle = sky; g.fillRect(0, 0, 320, 396);
          g.fillStyle = "#7a5c3a"; g.fillRect(SLING.x - 4, 340, 8, 40);
          if (!pen.flying && drag) { g.strokeStyle = "#5d4428"; g.lineWidth = 3; g.beginPath(); g.moveTo(SLING.x, 342); g.lineTo(pen.x, pen.y); g.stroke(); }
          blocks.forEach(b => {
            if (b.hit) return;
            g.fillStyle = b.boss ? "#d0d4da" : "#bfe0f0";
            g.strokeStyle = "#8098a8";
            g.fillRect(b.x, b.y, b.w, b.h); g.strokeRect(b.x, b.y, b.w, b.h);
            if (b.boss) { g.fillStyle = "#555"; g.font = "9px Helvetica"; g.fillText("EULA", b.x + 12, b.y + 11); }
          });
          // penguin
          g.fillStyle = "#1c1c24"; g.beginPath(); g.ellipse(pen.x, pen.y, 9, 11, 0, 0, 7); g.fill();
          g.fillStyle = "#fff"; g.beginPath(); g.ellipse(pen.x, pen.y + 2, 5.5, 7.5, 0, 0, 7); g.fill();
          g.fillStyle = "#f5a11f"; g.beginPath(); g.moveTo(pen.x + 6, pen.y - 3); g.lineTo(pen.x + 13, pen.y); g.lineTo(pen.x + 6, pen.y + 2); g.fill();
          g.fillStyle = "#111"; g.beginPath(); g.arc(pen.x + 3, pen.y - 5, 1.5, 0, 7); g.fill();
          g.fillStyle = "#2c3e2c"; g.font = "bold 13px Helvetica";
          g.fillText("Score " + score, 10, 20);
          g.fillText("Penguins " + Math.max(0, shots) + (pen.flying ? "" : "  (drag the penguin)"), 10, 38);
          if (blocks.every(b => b.hit)) { g.font = "bold 22px Helvetica"; g.fillText("FREEDOM ACHIEVED 🐧", 40, 180); }
          else if (shots <= 0 && !pen.flying) { g.font = "bold 18px Helvetica"; g.fillText("Out of penguins — tap Retry", 40, 180); }
          def._raf = requestAnimationFrame(step);
        }
        const retry = navBtn("Retry", () => reset(true));
        root.append(navbar("Angry Penguins", { dark: true, right: retry }), c);
        step();
      }
    }
  ];

  /* ---- install state ---- */
  const DEFAULT_INSTALLED = ["lazyvim", "steps", "obsidian", "clipper"];
  const installed = () => Prefs.get("installedApps", DEFAULT_INSTALLED);
  const isInstalled = id => installed().includes(id);
  function install(id) {
    if (isInstalled(id)) return;
    Prefs.set("installedApps", [...installed(), id]);
    Snd.received();
  }
  function uninstall(id) {
    Prefs.set("installedApps", installed().filter(x => x !== id));
    Snd.lockSnd();
  }

  /* register every catalog app with the springboard (hidden until installed) */
  function registerApp(a) {
    IOS.register({
      id: a.id, name: a.name,
      icon: a.icon || tileIcon(a.bg, a.glyph),
      statusbar: a.statusbar || "black",
      rootClass: a.rootClass,
      removable: true,
      onClose: a.onClose,
      render: a.render
    });
  }
  CATALOG.forEach(registerApp);

  /* other modules (js/apps/extras.js) contribute catalog apps here */
  function addApps(list) { list.forEach(a => { CATALOG.push(a); registerApp(a); }); }

  return { CATALOG, installed, isInstalled, install, uninstall, addApps };
})();

/* =================================================================
   App Store (functional)
   ================================================================= */

IOS.register({
  id: "appstore",
  name: "App Store",
  icon: Icons.appstore,
  statusbar: "blue",
  render(root) {
    const body = h("div", "content");
    let tab = 0;

    function priceBtn(app) {
      const btn = h("button", "store-price");
      const paint = () => {
        if (AppMarket.isInstalled(app.id)) { btn.textContent = "OPEN"; btn.classList.add("installed"); }
        else { btn.textContent = app.price; btn.classList.remove("installed"); }
      };
      btn.addEventListener("click", e => {
        e.stopPropagation(); Snd.click();
        if (AppMarket.isInstalled(app.id)) { IOS.open(app.id); return; }
        btn.textContent = "INSTALLING…";
        setTimeout(() => { AppMarket.install(app.id); paint(); }, 900);
      });
      paint();
      return btn;
    }

    function row(app) {
      return h("div", "store-row",
        h("div", { class: "store-app-ico", style: { background: app.bg }, html: Glyphs[app.glyph]() }),
        h("div", "store-info", h("b", null, app.name), h("span", null, app.desc),
          h("div", "stars", h("b", null, "★★★★"), "★ (12,061)")),
        priceBtn(app));
    }

    function paint() {
      body.innerHTML = "";
      if (tab === 0) {
        body.append(h("div", "store-hero",
          h("h2", null, "Featured Apps"),
          h("p", null, "Every install lands on your home screen. Hold an icon to make it wiggle; tap ✕ to remove.")));
        AppMarket.CATALOG.forEach(a => body.append(row(a)));
      } else if (tab === 1) {
        body.append(h("div", "group-label", "Top Charts (of this device)"));
        [...AppMarket.CATALOG].reverse().forEach(a => body.append(row(a)));
      } else if (tab === 2) {
        const field = kbField("Search the App Store", {
          returnLabel: "Search", blueReturn: true,
          onChange: v => {
            list.innerHTML = "";
            AppMarket.CATALOG
              .filter(a => (a.name + a.desc).toLowerCase().includes(v.toLowerCase()))
              .forEach(a => list.append(row(a)));
          },
          onReturn: () => KB.close()
        });
        const list = h("div");
        body.append(h("div", { style: { padding: "6px 8px" } }, field), list);
        AppMarket.CATALOG.forEach(a => list.append(row(a)));
      } else {
        body.append(h("div", "empty-msg",
          AppMarket.installed().length
            ? "All " + AppMarket.installed().length + " installed apps are up to date."
            : "Nothing installed yet — Featured has ideas."));
      }
    }

    const tabs = [["star", "Featured"], ["chart", "Charts"], ["search", "Search"], ["download", "Updates"]];
    const tabbar = h("div", "tabbar", tabs.map(([ico, lbl], i) => {
      const t = h("div", "tab" + (i === 0 ? " on" : ""), h("div", { class: "t-ico", html: Glyphs[ico]() }), h("div", null, lbl));
      t.addEventListener("click", () => { Snd.click(); tab = i; [...tabbar.children].forEach((x, j) => x.classList.toggle("on", j === i)); paint(); });
      return t;
    }));

    root.append(navbar("App Store"), body, tabbar);
    paint();
  }
});

/* =================================================================
   Cydia
   ================================================================= */

const CydiaIcon = () =>
  `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cyd_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8a6b4a"/><stop offset="1" stop-color="#4d3520"/>
      </linearGradient>
      <linearGradient id="cyd_box" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d8b98a"/><stop offset="1" stop-color="#a8865a"/>
      </linearGradient>
      <linearGradient id="cyd_gl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".45"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity=".06"/>
      </linearGradient>
    </defs>
    <rect width="57" height="57" fill="url(#cyd_bg)"/>
    <path d="M28.5 9 L45 18 v18 L28.5 45 L12 36 V18 z" fill="url(#cyd_box)" stroke="#3d2a14" stroke-width="1.2"/>
    <path d="M28.5 9 L45 18 L28.5 27 L12 18 z" fill="#e8d0a8" stroke="#3d2a14" stroke-width="1"/>
    <path d="M28.5 27 v18" stroke="#3d2a14" stroke-width="1"/>
    <path d="M20 13.5 L36.5 22.5 v6 l-4 -2 v-6 L16 12 z" fill="#c8a06a" stroke="#3d2a14" stroke-width="0.8"/>
    <path d="M0,0 h57 v19 c-13,8.5 -44,8.5 -57,0 z" fill="url(#cyd_gl)"/>
  </svg>`;

IOS.register({
  id: "cydia",
  name: "Cydia",
  icon: CydiaIcon,
  statusbar: "black",
  rootClass: "cydia-root",
  render(root) {
    const body = h("div", "content grouped");
    let tab = 0;

    /* ---- functional tweaks (simulation side) ---- */
    const TWEAKS = [
      {
        name: "Custom Carrier", desc: "Cycle the status-bar carrier text",
        value: () => Prefs.get("carrier", "arch"),
        onTap() {
          const opts = ["arch", "btw", "pacman", "jailbrkn", "linen&felt"];
          const next = opts[(opts.indexOf(Prefs.get("carrier", "arch")) + 1) % opts.length];
          Prefs.set("carrier", next);
          IOS.refreshSignal();
        }
      },
      {
        name: "Dark Keyboard", desc: "The keyboard, but brooding",
        value: () => Prefs.get("kbdark", false) ? "On" : "Off",
        onTap() {
          Prefs.set("kbdark", !Prefs.get("kbdark", false));
          $id("keyboard").classList.toggle("kb-dark", Prefs.get("kbdark", false));
        }
      },
      {
        name: "Verbose Boot", desc: "Skip the fruit, keep the kernel log",
        value: () => Prefs.get("verboseboot", false) ? "On" : "Off",
        onTap() { Prefs.set("verboseboot", !Prefs.get("verboseboot", false)); }
      },
      {
        name: "Green Felt Theme", desc: "Wallpaper like a pool table",
        value: () => Prefs.get("wallpaper", "wp-water") === "wp-green" ? "On" : "Off",
        onTap() {
          const on = Prefs.get("wallpaper", "wp-water") === "wp-green";
          Prefs.set("wallpaper", on ? "wp-water" : "wp-green");
          IOS.applyWallpaper();
        }
      }
    ];

    function tweakCell(t) {
      const c = cell({ label: t.name, sub: t.desc, value: t.value(), chev: true, onTap: () => {
        t.onTap();
        paint(); // re-render values
      } });
      return c;
    }

    function paint() {
      body.innerHTML = "";
      if (tab === 0) {
        body.append(
          h("div", "cydia-hero",
            h("div", { class: "cydia-hero-ico", html: CydiaIcon() }),
            h("div", null,
              h("b", null, "Welcome to Cydia"),
              h("div", "cydia-sub", "iPhone5,1 · iOS 6.1.3 · root by default"),
              h("div", "cydia-sub", NativeBridge.active
                ? "pacman bridge: connected"
                : "pacman bridge: offline (simulation)"))),
          h("div", "group-label", "Tweaks (they actually work)"),
          group(TWEAKS.map(tweakCell)),
          h("div", "group-foot", "This device ships jailbroken. The kernel would like a word about the term."));
      } else if (tab === 1) {
        body.append(h("div", "group-label", "Changes"));
        if (NativeBridge.active) {
          body.append(h("div", "group-foot", "Checking pacman updates…"));
          NativeBridge.pkgUpdates().then(r => {
            body.querySelectorAll(".group-foot, .group").forEach(x => x.remove());
            const ups = (r && r.updates) || [];
            if (!ups.length) body.append(h("div", "empty-msg", "System is up to date (btw)."));
            else body.append(group(ups.slice(0, 20).map(u => cell({ label: u, cls: "static" }))),
              h("div", "group-foot", ups.length + " updates pending — run pacman -Syu in Terminal."));
          });
        } else {
          body.append(h("div", "empty-msg", "Everything is up to date (btw)."),
            h("div", "group-foot", "On real hardware this tab lists live pacman updates."));
        }
      } else if (tab === 2) {
        paintSources();
      } else {
        const results = h("div");
        const field = kbField(NativeBridge.active ? "Search pacman repos" : "Search tweaks", {
          returnLabel: "Search", blueReturn: true,
          onReturn: async v => {
            KB.close();
            results.innerHTML = "";
            if (!v.trim()) return;
            if (NativeBridge.active) {
              results.append(h("div", "group-foot", "Searching repos…"));
              const r = await NativeBridge.pkgSearch(v.trim());
              results.innerHTML = "";
              const pkgs = (r && r.results) || [];
              if (!pkgs.length) return results.append(h("div", "empty-msg", "No packages found."));
              results.append(group(pkgs.slice(0, 15).map(pk => cell({
                label: pk.name, sub: pk.desc,
                right: h("button", { class: "store-price", onclick: async e => {
                  e.stopPropagation(); Snd.click();
                  e.target.textContent = "INSTALLING…";
                  const res = await NativeBridge.pkgInstall(pk.name);
                  e.target.textContent = res && res.ok ? "INSTALLED" : "FAILED";
                } }, "INSTALL")
              }))));
            } else {
              const q = v.toLowerCase();
              const hits = TWEAKS.filter(t => (t.name + t.desc).toLowerCase().includes(q));
              if (!hits.length) results.append(h("div", "empty-msg", "No tweaks found."));
              else results.append(group(hits.map(tweakCell)));
            }
          }
        });
        body.append(h("div", { style: { padding: "2px 2px 10px" } }, field), results);
      }
    }

    const paintSources = () => {
      body.innerHTML = "";
      body.append(
        h("div", "group-label", "Entered by User"),
        group(
          cell({ label: "core", sub: "mirror.pkgbuild.com (official)", cls: "static" }),
          cell({ label: "extra", sub: "mirror.pkgbuild.com (official)", cls: "static" }),
          cell({ label: "springboard", sub: "the repo this phone came from", cls: "static" })),
        group(cell({ label: "Add Source…", onTap: () => showAlert({ title: "Add Source",
          text: "In this economy? Edit /etc/pacman.conf like your ancestors did." }) })),
        h("div", "group-foot", "All sources are signed. Trust, but verify — mostly verify."));
    };

    const tabs = [["star", "Cydia"], ["refresh", "Changes"], ["book", "Sources"], ["search", "Search"]];
    const tabbar = h("div", "tabbar", tabs.map(([ico, lbl], i) => {
      const t = h("div", "tab" + (i === 0 ? " on" : ""), h("div", { class: "t-ico", html: Glyphs[ico]() }), h("div", null, lbl));
      t.addEventListener("click", () => { Snd.click(); tab = i; [...tabbar.children].forEach((x, j) => x.classList.toggle("on", j === i)); paint(); });
      return t;
    }));

    root.append(navbar("Cydia", { dark: true }), body, tabbar);
    paint();
  }
});
