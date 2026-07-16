/* ===================================================================
   iOS 6 · Arch Edition — Photos, Camera, Music, Safari, Videos,
   iTunes, App Store, Game Center, Passbook, Newsstand,
   Voice Memos, Compass, Terminal
   =================================================================== */
"use strict";

/* =================================================================
   Photos
   ================================================================= */

IOS.register({
  id: "photos",
  name: "Photos",
  icon: Icons.photos,
  statusbar: "blue",
  render(root) {
    const grid = h("div", "photo-grid");
    PhotoStore.all().forEach((url, i) => {
      const img = h("img", { src: url });
      img.addEventListener("click", () => viewer(i));
      grid.append(img);
    });

    function viewer(i) {
      const img = h("img", { src: PhotoStore.get(i) });
      const v = h("div", "photo-viewer", img);
      let idx = i;
      v.addEventListener("click", e => {
        const r = v.getBoundingClientRect();
        const x = e.clientX - r.left;
        if (x > r.width * 0.66) idx = (idx + 1) % PhotoStore.count();
        else if (x < r.width * 0.33) idx = (idx - 1 + PhotoStore.count()) % PhotoStore.count();
        else { v.remove(); return; }
        img.src = PhotoStore.get(idx);
        Snd.click();
      });
      root.append(v);
    }

    root.append(
      navbar("Camera Roll", {
        left: backBtn("Albums", () => {}),
        right: navBtn("↑", () => showSheet([
          { label: "Email Photo", onTap: () => IOS.open("mail") },
          { label: "Message", onTap: () => IOS.open("messages") },
          { label: "Use as Wallpaper", onTap: () => showAlert({ title: "Wallpaper", text: "This wallpaper is too beautiful. Request denied by the Skeuomorphic Texture Daemon." }) },
          { label: "Cancel", style: "cancel" }])) }),
      h("div", { class: "content", style: { background: "#000" } }, grid),
      h("div", "toolbar", h("span", "tb-ico", "▶"), h("span", "tb-ico disabled", "🗑")));
  }
});

/* =================================================================
   Camera
   ================================================================= */

IOS.register({
  id: "camera",
  name: "Camera",
  icon: Icons.camera,
  statusbar: "black",
  onClose() { clearInterval(this._iv); },
  render(root) {
    const def = IOS.app("camera");
    const scene = h("canvas", { class: "cam-scene", width: 320, height: 400 });
    const g = scene.getContext("2d");
    let t = 0;

    function drawScene() {
      t += 0.02;
      const grad = g.createLinearGradient(0, 0, 0, 400);
      grad.addColorStop(0, "#6fa8d8"); grad.addColorStop(0.55, "#b8d8ee"); grad.addColorStop(0.56, "#4a8a4a"); grad.addColorStop(1, "#2f6b2f");
      g.fillStyle = grad; g.fillRect(0, 0, 320, 400);
      // drifting clouds
      for (let i = 0; i < 3; i++) {
        const x = ((t * 20 + i * 130) % 420) - 60;
        g.fillStyle = "rgba(255,255,255,.85)";
        g.beginPath();
        g.ellipse(x, 60 + i * 34, 38, 14, 0, 0, 7);
        g.ellipse(x + 24, 54 + i * 34, 26, 11, 0, 0, 7);
        g.fill();
      }
      // sun
      const sg = g.createRadialGradient(262, 52, 4, 262, 52, 34);
      sg.addColorStop(0, "#fff8d0"); sg.addColorStop(0.5, "#ffe27a"); sg.addColorStop(1, "rgba(255,220,110,0)");
      g.fillStyle = sg; g.beginPath(); g.arc(262, 52, 34, 0, 7); g.fill();
      // tree waving slightly
      g.fillStyle = "#5d3a1e"; g.fillRect(70, 250, 12, 70);
      g.fillStyle = "#2f7a2f";
      g.beginPath(); g.arc(76 + Math.sin(t * 2) * 2, 235, 34, 0, 7); g.fill();
      g.beginPath(); g.arc(56 + Math.sin(t * 2 + 1) * 2, 252, 24, 0, 7); g.fill();
      g.beginPath(); g.arc(98 + Math.sin(t * 2 + 2) * 2, 254, 22, 0, 7); g.fill();
    }
    def._iv = setInterval(drawScene, 50);
    drawScene();

    const iris = h("div", "cam-iris");
    const thumb = h("div", "cam-thumb");
    const last = PhotoStore.get(PhotoStore.count() - 1);
    thumb.append(h("img", { src: last }));
    thumb.addEventListener("click", () => IOS.open("photos"));

    const shutter = h("div", "cam-shutter", "📷");
    shutter.addEventListener("click", () => {
      Snd.key();
      iris.classList.add("snap");
      setTimeout(() => {
        const url = scene.toDataURL("image/jpeg", 0.85);
        PhotoStore.add(url);
        thumb.innerHTML = "";
        thumb.append(h("img", { src: url }));
        iris.classList.remove("snap");
      }, 300);
    });

    root.append(
      h("div", "cam-finder", scene, h("div", "cam-reticle"), iris),
      h("div", "cam-bar", thumb, shutter, h("div", "cam-flip", "🔄")));
  }
});

/* =================================================================
   Music
   ================================================================= */

IOS.register({
  id: "music",
  name: "Music",
  icon: Icons.music,
  statusbar: "black",
  onClose() { MusicPlayer.stop(); },
  render(root) {
    const art = h("div", "music-art");
    const artCanvas = h("canvas", { width: 232, height: 232, style: { width: "100%", height: "100%" } });
    const ag = artCanvas.getContext("2d");
    const grad = ag.createLinearGradient(0, 0, 232, 232);
    grad.addColorStop(0, "#1793d1"); grad.addColorStop(1, "#0a2a45");
    ag.fillStyle = grad; ag.fillRect(0, 0, 232, 232);
    ag.fillStyle = "rgba(255,255,255,.92)";
    ag.beginPath(); ag.moveTo(116, 40); ag.lineTo(176, 150); ag.lineTo(146, 150);
    ag.lineTo(116, 92); ag.lineTo(86, 150); ag.lineTo(56, 150); ag.closePath(); ag.fill();
    ag.font = "bold 17px Helvetica"; ag.textAlign = "center";
    ag.fillText("KERNEL PANIC", 116, 190);
    ag.font = "11px Helvetica"; ag.fillText("· the daemons ·", 116, 208);
    art.append(artCanvas);

    const bar = h("i");
    const elapsed = h("span", null, "0:00");
    const playBtn = h("span", null, "▶");
    playBtn.addEventListener("click", () => {
      if (MusicPlayer.playing) { MusicPlayer.stop(); playBtn.textContent = "▶"; }
      else { MusicPlayer.play(p => { bar.style.width = (p.frac * 100) + "%"; elapsed.textContent = p.time; }, () => { playBtn.textContent = "▶"; }); playBtn.textContent = "❚❚"; }
      Snd.click();
    });

    root.append(
      navbar("Now Playing", { dark: true, left: backBtn("Library", () => {}), right: navBtn("≣", () => {}) }),
      h("div", "music-np",
        art,
        h("div", "music-track", h("b", null, "Daemons in the Initramfs"), h("span", null, "Kernel Panic — Rolling Release (2012)")),
        h("div", "music-progress", elapsed, h("div", "bar", bar), h("span", null, "0:16")),
        h("div", "music-ctrls", h("span", { onclick: () => Snd.click() }, "⏮"), playBtn, h("span", { onclick: () => Snd.click() }, "⏭")),
        h("div", "music-vol", slider(70, () => {}))));
  }
});

/* a tiny generative chiptune so Play actually plays something */
const MusicPlayer = (() => {
  let ctx = null, nodes = [], timer = null, playing = false, t0 = 0;
  const MELODY = [0, 3, 5, 7, 5, 3, 0, -2, 0, 3, 7, 10, 7, 5, 3, 5];
  const BASE = 220;
  const DUR = 16; // seconds

  function play(onTick, onEnd) {
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);
    nodes = [master];
    MELODY.forEach((semi, i) => {
      for (let rep = 0; rep < 2; rep++) {
        const start = t0 + i * 0.5 + rep * 8;
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = rep ? "triangle" : "square";
        o.frequency.value = BASE * Math.pow(2, semi / 12) * (rep ? 1 : 2);
        gn.gain.setValueAtTime(0.9, start);
        gn.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
        o.connect(gn).connect(master);
        o.start(start); o.stop(start + 0.5);
        nodes.push(o);
      }
    });
    timer = setInterval(() => {
      const el = ctx.currentTime - t0;
      if (el >= DUR) { stop(); onEnd && onEnd(); return; }
      const m = Math.floor(el / 60), s = Math.floor(el % 60);
      onTick && onTick({ frac: el / DUR, time: m + ":" + String(s).padStart(2, "0") });
    }, 200);
  }
  function stop() {
    playing = false;
    clearInterval(timer); timer = null;
    nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* done */ } });
    nodes = [];
  }
  return { play, stop, get playing() { return playing; } };
})();

/* =================================================================
   Safari
   ================================================================= */

IOS.register({
  id: "safari",
  name: "Safari",
  icon: Icons.safari,
  statusbar: "blue",
  render(root) {
    const page = h("div", "saf-page");

    const SITES = {
      "apple.com": () => h("div", "web",
        h("div", { class: "site-hero", style: { background: "linear-gradient(#3d4450,#181b21)" } },
          h("h1", null, "iPhone 5"),
          h("p", { style: { color: "#b8c2d2" } }, "The biggest thing to happen to iPhone since iPhone.")),
        h("div", "body-pad",
          h("h2", null, "iOS 6"),
          h("p", null, "iOS 6 comes with over 200 new features. Maps has been completely redesigned by Apple — what could possibly go wrong?"),
          h("p", null, h("a", { onclick: () => go("archlinux.org") }, "Also check out archlinux.org →")))),
      "archlinux.org": () => h("div", "web",
        h("div", { class: "site-hero", style: { background: "linear-gradient(#1793d1,#0a4a70)" } },
          h("h1", null, "Arch Linux"),
          h("p", { style: { color: "#d0ecfa" } }, "A simple, lightweight distribution")),
        h("div", "body-pad",
          h("h2", null, "Latest News"),
          h("p", null, h("b", null, "2026-07-16: "), "iOS 6 SpringBoard now packaged in [extra]. Runs shockingly well on phones."),
          h("p", null, h("b", null, "2026-07-01: "), "Reminder: read the wiki before asking why your telephone is a rolling release."),
          h("h2", null, "Installation"),
          h("p", null, "pacman -S springboard-6 skeuomorphism linen-textures"),
          h("p", null, h("a", { onclick: () => go("apple.com") }, "← back to apple.com")))),
      "start": () => h("div", "web saf-start",
        h("p", { style: { fontWeight: "bold", marginBottom: "14px" } }, "Bookmarks"),
        h("div", { class: "bookmark-tile", onclick: () => go("apple.com") }, "🍎 Apple"),
        h("div", { class: "bookmark-tile", onclick: () => go("archlinux.org") }, "🐧 Arch Linux"),
        h("p", { style: { marginTop: "18px", fontSize: "12px" } }, "This Safari browses a very small, very curated internet."))
    };

    const addr = kbField("Search or enter website", {
      cls: "", returnLabel: "Go", blueReturn: true,
      onReturn: v => { KB.close(); go(v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")); }
    });

    function go(url) {
      const key = Object.keys(SITES).find(s => url && url.includes(s.split(".")[0]) && s !== "start");
      page.innerHTML = "";
      if (!url) { page.append(SITES.start()); addr.value = ""; return; }
      if (key) { page.append(SITES[key]()); addr.value = "http://www." + key + "/"; }
      else {
        addr.value = url;
        page.append(h("div", "web body-pad",
          h("h2", null, "Cannot Open Page"),
          h("p", null, "Safari cannot open “" + url + "” because this internet contains exactly two websites."),
          h("p", null, h("a", { onclick: () => go("apple.com") }, "apple.com"), " · ",
            h("a", { onclick: () => go("archlinux.org") }, "archlinux.org"))));
      }
      page.scrollTop = 0;
    }

    root.append(
      h("div", "saf-bars", addr),
      page,
      h("div", "toolbar",
        h("span", { class: "tb-ico", onclick: () => { Snd.click(); go("apple.com"); } }, "◀"),
        h("span", { class: "tb-ico", onclick: () => { Snd.click(); go("archlinux.org"); } }, "▶"),
        h("span", { class: "tb-ico", onclick: () => showSheet([
          { label: "Add to Home Screen", onTap: () => showAlert({ title: "Nope", text: "The home screen is full of memories already." }) },
          { label: "Mail Link to this Page", onTap: () => IOS.open("mail") },
          { label: "Cancel", style: "cancel" }]) }, "↑"),
        h("span", { class: "tb-ico", onclick: () => { Snd.click(); go(""); } }, "🔖"),
        h("span", { class: "tb-ico", onclick: () => showAlert({ title: "Tabs", text: "You have 1 tab open. A simpler time." }) }, "▢")));
    go("");
  }
});

/* =================================================================
   Videos
   ================================================================= */

IOS.register({
  id: "videos",
  name: "Videos",
  icon: Icons.videos,
  statusbar: "blue",
  render(root) {
    const vids = [
      ["WWDC 2012 Keynote", "1:56:41", "#3d5578"],
      ["Kernel Compilation: The Movie", "4:20:00", "#1793d1"],
      ["Skeuomorphism — A Retrospective", "42:00", "#7a5c3a"],
      ["Slide to Unlock (Director's Cut)", "0:09", "#4a8a4a"]
    ];
    const list = h("div", "content list");
    vids.forEach(([name, dur, color]) => {
      list.append(h("div", { class: "store-row", onclick: () => {
        Snd.click();
        showAlert({ title: name, text: "▶ Now playing… in your imagination. (Video decoding not included, kernel module missing: imagination.ko loaded instead.)" });
      } },
        h("div", { class: "store-app-ico", style: { background: color } }, "▶"),
        h("div", "store-info", h("b", null, name), h("span", null, dur + " · HD"))));
    });
    root.append(navbar("Videos", { right: navBtn("Edit", () => {}) }), list);
  }
});

/* =================================================================
   iTunes & App Store
   ================================================================= */

function storeApp(id, name, icon, title, rows, footer) {
  IOS.register({
    id, name, icon, statusbar: "blue",
    render(root) {
      const list = h("div", "content");
      list.append(h("div", "store-hero", h("h2", null, title), h("p", null, footer)));
      rows.forEach(([emoji, bg, nm, sub, price]) => {
        list.append(h("div", { class: "store-row", onclick: () => Snd.click() },
          h("div", { class: "store-app-ico", style: { background: bg } }, emoji),
          h("div", "store-info", h("b", null, nm), h("span", null, sub),
            h("div", "stars", h("b", null, "★★★★"), "★ (12,061)")),
          h("div", { class: "store-price", onclick: e => {
            e.stopPropagation(); Snd.click();
            showAlert({ title: nm, text: "Purchased! Charged to: nobody. Downloaded to: nowhere. Rated 5 stars by: you, just now." });
          } }, price)));
      });
      const tabs = [["★", "Featured"], ["📈", "Charts"], ["🔍", "Search"], ["⤓", "Updates"]];
      const tabbar = h("div", "tabbar", tabs.map(([ico, lbl], i) =>
        h("div", "tab" + (i === 0 ? " on" : ""), h("div", "t-ico", ico), h("div", null, lbl))));
      root.append(navbar(name), list, tabbar);
    }
  });
}

storeApp("itunes", "iTunes", Icons.itunes, "New & Noteworthy", [
  ["🎵", "linear-gradient(#e05a8a,#a02555)", "Rolling Release", "Kernel Panic — Album", "$9.99"],
  ["🎵", "linear-gradient(#3a7ad8,#1a4a98)", "Daemons (Single)", "Kernel Panic", "$1.29"],
  ["🎬", "linear-gradient(#3d4450,#181b21)", "The Linen Documentary", "Textures & Feelings", "$14.99"],
  ["🎵", "linear-gradient(#f5871f,#c05a00)", "Marimba Forever", "Various Ringtones", "$0.99"]
], "Music, movies & marimba.");

storeApp("appstore", "App Store", Icons.appstore, "Featured Apps", [
  ["🐧", "linear-gradient(#1793d1,#0a4a70)", "pacman GUI Pro", "Finally, a wrapper for your wrapper", "FREE"],
  ["📖", "linear-gradient(#7a5c3a,#4a3520)", "Wiki Reader", "RTFM, beautifully", "FREE"],
  ["🐦", "linear-gradient(#4aa8e0,#1a6aa8)", "Chirper", "140 characters ought to be enough", "FREE"],
  ["🕹", "linear-gradient(#4a8a4a,#255525)", "Angry Penguins", "Fling penguins at proprietary software", "$0.99"],
  ["🧮", "linear-gradient(#43464d,#191b1f)", "RPN Calculator HD", "For people who disagree with = signs", "$2.99"]
], "All apps reviewed by a shadowy cabal.");

/* =================================================================
   Game Center
   ================================================================= */

IOS.register({
  id: "gamecenter",
  name: "Game Center",
  icon: Icons.gamecenter,
  statusbar: "blue",
  rootClass: "gc-root",
  render(root) {
    root.append(
      navbar("Game Center"),
      h("div", { class: "content", style: { background: "transparent" } },
        h("div", "gc-card",
          h("h2", null, "arch_user"),
          h("div", "gc-nick", "“I use Game Center btw”"),
          h("div", "gc-stats",
            h("div", null, h("b", null, "3"), h("span", null, "Games")),
            h("div", null, h("b", null, "42"), h("span", null, "Achievements")),
            h("div", null, h("b", null, "2"), h("span", null, "Friends")))),
        h("div", "gc-card",
          h("h2", { style: { fontSize: "16px" } }, "Recent Games"),
          h("div", { style: { fontSize: "13px", color: "#6a5f45", marginTop: "8px", lineHeight: "1.9" } },
            "♟ Chess — Zach is winning (1,240)", h("br"),
            "🐧 Angry Penguins — 3 stars", h("br"),
            "⌨ vimtutor speedrun — WR holder"))));
  }
});

/* =================================================================
   Passbook
   ================================================================= */

IOS.register({
  id: "passbook",
  name: "Passbook",
  icon: Icons.passbook,
  statusbar: "black",
  rootClass: "pb-root",
  render(root) {
    const passes = [
      { bg: "linear-gradient(#4aa8e0,#1a5a90)", brand: "arch airlines", big: "SFO → LNX", sub: "Boarding 9:41 AM · Seat 6A" },
      { bg: "linear-gradient(#7a5c3a,#4a3018)", brand: "Daily Grind Coffee", big: "★ 9 of 10 stamps", sub: "Free kernel refill at 10" },
      { bg: "linear-gradient(#8a2a8a,#4a104a)", brand: "CINEMA 6", big: "The Linen Documentary", sub: "Tonight 8:00 PM · Screen 2" }
    ];
    root.append(
      navbar("Passbook", { dark: true }),
      h("div", { class: "content", style: { background: "transparent" } },
        passes.map(p => h("div", { class: "pass", style: { background: p.bg }, onclick: () => Snd.click() },
          h("div", "p-top", h("b", null, p.brand), h("span", { style: { fontSize: "11px", opacity: 0.8 } }, p.sub)),
          h("div", "p-big", p.big),
          h("div", "p-barcode")))));
  }
});

/* =================================================================
   Newsstand
   ================================================================= */

IOS.register({
  id: "newsstand",
  name: "Newsstand",
  icon: Icons.newsstand,
  statusbar: "black",
  rootClass: "ns-root",
  render(root) {
    const shelf = (mags) => h("div", "ns-shelf", mags.map(([name, bg]) =>
      h("div", { class: "ns-mag", style: { background: bg }, onclick: () =>
        showAlert({ title: name, text: "Subscription expired in 2013. Some things are better left unrenewed." }) }, name)));
    root.append(
      navbar("Newsstand", { dark: true, right: navBtn("Store", () => IOS.open("appstore")) }),
      h("div", { class: "content", style: { background: "transparent", paddingBottom: "12px" } },
        shelf([["LINEN WEEKLY", "linear-gradient(#8a8f9a,#5a5f6a)"], ["pacman monthly", "linear-gradient(#1793d1,#0a4a70)"], ["Skeuomorph", "linear-gradient(#7a5c3a,#4a3018)"]]),
        shelf([["Gradient Quarterly", "linear-gradient(#e05a8a,#8a2555)"], ["TEXTURE", "linear-gradient(#4a8a4a,#255525)"]]),
        shelf([])));
  }
});

/* =================================================================
   Voice Memos
   ================================================================= */

IOS.register({
  id: "voicememos",
  name: "Voice Memos",
  icon: Icons.voicememos,
  statusbar: "black",
  rootClass: "vm-root",
  onClose() { clearInterval(this._iv); },
  render(root) {
    const def = IOS.app("voicememos");
    const micSvg = `<svg width="150" height="260" viewBox="0 0 150 260" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="vmm" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6a7079"/><stop offset=".5" stop-color="#c8cdd4"/><stop offset="1" stop-color="#5a6069"/>
      </linearGradient></defs>
      <rect x="35" y="10" width="80" height="150" rx="40" fill="url(#vmm)" stroke="#2a2d33" stroke-width="2"/>
      ${Array.from({ length: 9 }, (_, r) => Array.from({ length: 5 }, (_, c) =>
        `<circle cx="${55 + c * 10}" cy="${40 + r * 12}" r="2.6" fill="#3a3f47"/>`).join("")).join("")}
      <path d="M20 130 a55 55 0 0 0 110 0" fill="none" stroke="#b8bdc4" stroke-width="9" stroke-linecap="round"/>
      <line x1="75" y1="192" x2="75" y2="225" stroke="#b8bdc4" stroke-width="9"/>
      <line x1="45" y1="228" x2="105" y2="228" stroke="#b8bdc4" stroke-width="9" stroke-linecap="round"/>
    </svg>`;

    const levels = h("div", "vm-level", Array.from({ length: 40 }, () => h("i")));
    const time = h("div", "vm-time", "00:00");
    const rec = h("div", "vm-rec", h("i"));
    let recording = false, secs = 0;

    rec.addEventListener("click", () => {
      Snd.click();
      recording = !recording;
      rec.classList.toggle("recording", recording);
      if (recording) {
        secs = 0;
        def._iv = setInterval(() => {
          secs++;
          time.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
          [...levels.children].forEach(b => b.style.height = (3 + Math.random() * 20) + "px");
        }, 250);
      } else {
        clearInterval(def._iv);
        [...levels.children].forEach(b => b.style.height = "4px");
        showAlert({ title: "Memo Saved", text: "“New Recording 1” (" + time.textContent + ") — stored securely in RAM, forever*.\n*until refresh" });
      }
    });

    root.append(
      h("div", "vm-mic", h("div", { class: "vm-mic-svg", html: micSvg })),
      h("div", "vm-ctrl", rec, levels, time));
  }
});

/* =================================================================
   Compass
   ================================================================= */

IOS.register({
  id: "compass",
  name: "Compass",
  icon: Icons.compass,
  statusbar: "black",
  rootClass: "comp-root",
  onClose() { clearInterval(this._iv); window.removeEventListener("deviceorientation", this._doh); },
  render(root) {
    const def = IOS.app("compass");
    const roseSvg = `<svg viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg">
      <circle cx="125" cy="125" r="120" fill="#15161a" stroke="#3c4048" stroke-width="4"/>
      ${Array.from({ length: 72 }, (_, i) => {
        const a = i * Math.PI / 36, big = i % 6 === 0;
        return `<line x1="${125 + Math.cos(a) * 106}" y1="${125 + Math.sin(a) * 106}"
                     x2="${125 + Math.cos(a) * (big ? 96 : 101)}" y2="${125 + Math.sin(a) * (big ? 96 : 101)}"
                     stroke="${big ? "#e8eaee" : "#6a6f78"}" stroke-width="${big ? 3 : 1.5}"/>`;
      }).join("")}
      ${[["N", 0, "#e0574b"], ["E", 90, "#e8eaee"], ["S", 180, "#e8eaee"], ["W", 270, "#e8eaee"]].map(([l, d, c]) => {
        const a = (d - 90) * Math.PI / 180;
        return `<text x="${125 + Math.cos(a) * 80}" y="${125 + Math.sin(a) * 80 + 8}" font-size="24" font-family="Helvetica" font-weight="bold" fill="${c}" text-anchor="middle">${l}</text>`;
      }).join("")}
      <path d="M125 40 L134 125 L125 210 L116 125 z" fill="#c8ccd4"/>
      <path d="M125 40 L134 125 L116 125 z" fill="#e0574b"/>
      <circle cx="125" cy="125" r="7" fill="#0c0d10" stroke="#555"/>
    </svg>`;
    const rose = h("div", { class: "comp-rose", html: roseSvg });
    const heading = h("div", "comp-heading", "0° N");
    const sub = h("div", "comp-sub", "simulated bearing — hold phone flat, trust nothing");

    let deg = 0, target = 0, hasSensor = false;
    def._doh = e => {
      if (e.alpha != null) { hasSensor = true; target = 360 - e.alpha; }
    };
    window.addEventListener("deviceorientation", def._doh);
    def._iv = setInterval(() => {
      if (!hasSensor) target += (Math.random() - 0.5) * 6;
      deg += (target - deg) * 0.1;
      const norm = ((deg % 360) + 360) % 360;
      rose.style.transform = `rotate(${-norm}deg)`;
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      heading.textContent = Math.round(norm) + "° " + dirs[Math.round(norm / 45) % 8];
    }, 120);

    root.append(rose, heading, sub);
  }
});

/* =================================================================
   Terminal — the Arch heart of the machine
   ================================================================= */

IOS.register({
  id: "terminal",
  name: "Terminal",
  icon: Icons.terminal,
  statusbar: "black",
  rootClass: "term-root",
  onClose() { document.removeEventListener("keydown", this._kh); },
  render(root) {
    const def = IOS.app("terminal");
    const out = h("div", "term-out");
    const PROMPT = "[root@arch-iphone ~]# ";

    const NEOFETCH = [
      ["t-arch", "       /\\         root@arch-iphone"],
      ["t-arch", "      /  \\        ----------------"],
      ["t-arch", "     /\\   \\       OS: Arch Linux ARM (iOS 6)"],
      ["t-arch", "    /      \\      Host: iPhone 5 (ARCH1,6)"],
      ["t-arch", "   /   ,,   \\     Kernel: 6.9.7-arch1-1"],
      ["t-arch", "  /   |  |  -\\    Shell: bash 5.2"],
      ["t-arch", " /_-''    ''-_\\   DE: SpringBoard 6.1.3"],
      ["t-arch", "                  WM: linen-wm"],
      ["t-arch", "                  CPU: Apple A6 Swift @1.3GHz"],
      ["t-arch", "                  RAM: 512MiB / 1024MiB"],
      ["t-arch", "                  Uptime: since you clicked"],
      ["t-arch", "                  Packages: 26 (springboard)"],
      ["t-arch", "                  Theme: Skeuomorphic [all]"]
    ];

    function line(text, cls) {
      const d = h("div", cls ? { class: cls } : null);
      if (cls === "prompt-line") {
        d.innerHTML = '<span class="t-prompt">' + PROMPT + '</span><span class="t-cmd"></span>';
      } else d.textContent = text;
      out.append(d);
      out.scrollTop = out.scrollHeight;
      return d;
    }
    function lines(arr) { arr.forEach(([cls, t]) => { const d = h("div", { class: cls }); d.textContent = t; out.append(d); }); out.scrollTop = out.scrollHeight; }

    const CMDS = {
      help: () => line("commands: help, neofetch, uname -a, pacman -Syu, ls, whoami, uptime, btw, exit, clear"),
      neofetch: () => lines(NEOFETCH),
      "uname -a": () => line("Linux arch-iphone 6.9.7-arch1-1 #1 SMP PREEMPT_DYNAMIC aarch64 GNU/Linux"),
      uname: () => line("Linux"),
      whoami: () => line("root (obviously — it's 2012, jailbreaks are cool)"),
      uptime: () => line(" 9:41:00 up 0 min,  1 user,  load average: 0.06, 0.01, 1984"),
      ls: () => line("Desktop  Music  Photos  springboard.plist  wallpapers/  wiki-tabs(47)/"),
      btw: () => line("I use Arch btw. (You had to ask?)"),
      exit: () => { line("logout"); setTimeout(() => IOS.goHome(), 400); },
      clear: () => { out.innerHTML = ""; },
      "pacman -syu": () => {
        line(":: Synchronizing package databases...");
        const steps = [
          [" core is up to date", 300],
          [" extra is up to date", 550],
          [" springboard is up to date", 800],
          [":: Starting full system upgrade...", 1100],
          [" there is nothing to do", 1500]
        ];
        steps.forEach(([t, d]) => setTimeout(() => { line(t, d === 1500 ? "t-ok" : null); }, d));
      }
    };

    let cur = "";
    let cmdSpan = null;
    function newPrompt() {
      const d = line("", "prompt-line");
      cmdSpan = d.querySelector(".t-cmd");
      const caret = h("span", "term-caret");
      d.append(caret);
      cur = "";
    }
    function exec() {
      const c = cur.trim().toLowerCase();
      out.querySelectorAll(".term-caret").forEach(x => x.remove());
      if (c) {
        const fn = CMDS[c] || CMDS[c.replace(/\s+/g, " ")];
        if (fn) fn();
        else line("bash: " + cur.trim() + ": command not found (have you tried the wiki?)");
      }
      if (c === "clear") { newPrompt(); return; }
      setTimeout(newPrompt, c === "pacman -syu" ? 1700 : 30);
    }

    // hardware keys + on-screen keyboard via hidden kb-field
    const field = kbField("", {
      returnLabel: "return",
      onChange: v => { cur = v; if (cmdSpan) cmdSpan.textContent = v; },
      onReturn: () => { exec(); field.value = ""; }
    });
    field.style.position = "absolute"; field.style.left = "-9999px";
    out.addEventListener("click", () => { KB.open(field); });

    // physical keyboard works even with the on-screen keyboard hidden
    def._kh = e => {
      if (KB.visible) return; // KB routes hardware keys itself when open
      if (e.key === "Enter") { e.preventDefault(); exec(); field.value = ""; cur = ""; }
      else if (e.key === "Backspace") { e.preventDefault(); field.value = field.value.slice(0, -1); cur = field.value; if (cmdSpan) cmdSpan.textContent = cur; }
      else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); field.value += e.key; cur = field.value; if (cmdSpan) cmdSpan.textContent = cur; }
    };
    document.addEventListener("keydown", def._kh);

    root.append(out, field);
    line("Arch Linux 6.9.7-arch1-1 (ttyIPHONE0)", "t-arch");
    line("");
    line("Last login: Wed Sep 12 09:41:00 on ttyIPHONE0");
    line("Type 'help' for commands, 'neofetch' for glory.");
    newPrompt();
  }
});
