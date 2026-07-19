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
  onClose() { clearInterval(this._ssTimer); },
  render(root) {
    const nav = new UINav(root);
    const app = this;

    /* albums are live functions returning PhotoStore indices */
    const ALBUMS = [
      ["Camera Roll", () => PhotoStore.all().map((_, i) => i)],
      ["Arch Moments", () => PhotoStore.all().map((_, i) => i).filter(i => i % 2 === 0)],
      ["Favorites", () => PhotoStore.all().map((_, i) => i).slice(0, 3)]
    ];

    function slideshow(idxs) {
      const list = idxs();
      if (!list.length) return;
      const ov = h("div", "slideshow");
      let pos = 0, cur = null;
      function step() {
        const im = h("img", { src: PhotoStore.get(list[pos % list.length]) });
        ov.append(im);
        requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add("show")));
        if (cur) { const old = cur; old.classList.remove("show"); setTimeout(() => old.remove(), 1000); }
        cur = im;
        pos++;
      }
      ov.addEventListener("click", () => { clearInterval(app._ssTimer); ov.remove(); });
      app._ssTimer = setInterval(step, 3200);
      step();
      root.append(ov);
    }

    function rollView(name, idxs) {
      const grid = h("div", "photo-grid");
      function paint() {
        grid.innerHTML = "";
        idxs().forEach((storeIdx, pos) => {
          const img = h("img", { src: PhotoStore.get(storeIdx) });
          img.addEventListener("click", () => viewer(pos));
          grid.append(img);
        });
      }
      function viewer(pos) {
        const list = idxs();
        const img = h("img", { src: PhotoStore.get(list[pos]) });
        const trash = h("div", { class: "pv-trash", html: Glyphs.trash() });
        trash.addEventListener("click", e => {
          e.stopPropagation();
          showSheet([
            { label: "Delete Photo", style: "destructive", onTap: () => {
                PhotoStore.remove(idxs()[pos]);
                v.remove();
                paint();
              } },
            { label: "Cancel", style: "cancel" }]);
        });
        const v = h("div", "photo-viewer", img, trash);
        v.addEventListener("click", e => {
          const r = v.getBoundingClientRect();
          const x = e.clientX - r.left;
          const n = idxs().length;
          if (!n) { v.remove(); return; }
          if (x > r.width * 0.66) pos = (pos + 1) % n;
          else if (x < r.width * 0.33) pos = (pos - 1 + n) % n;
          else { v.remove(); return; }
          img.src = PhotoStore.get(idxs()[pos]);
          Snd.click();
        });
        root.append(v);
      }
      paint();
      return navView(
        navbar(name, {
          left: backBtn("Albums", () => nav.pop()),
          right: navBtn(gl("share", 15), () => showSheet([
            { label: "Email Photo", onTap: () => IOS.open("mail") },
            { label: "Message", onTap: () => IOS.open("messages") },
            { label: "Use as Wallpaper", onTap: () => showAlert({ title: "Wallpaper", text: "This wallpaper is too beautiful. Request denied by the Skeuomorphic Texture Daemon." }) },
            { label: "Cancel", style: "cancel" }])) }),
        h("div", { class: "content", style: { background: "#000" } }, grid,
          h("div", { style: { textAlign: "center", color: "#8a919d", padding: "12px 0 16px", fontSize: "14px", fontWeight: "bold" } },
            idxs().length + (idxs().length === 1 ? " Photo" : " Photos"))),
        h("div", "toolbar",
          h("span", { class: "tb-ico", html: Glyphs.play(), onclick: () => { Snd.click(); slideshow(idxs); } }),
          h("span", { class: "tb-ico disabled", html: Glyphs.trash() })));
    }

    function albumsView() {
      const list = h("div", "content list");
      ALBUMS.forEach(([name, idxs]) => {
        const n = idxs().length;
        const row = h("div", "cell",
          h("img", { class: "album-thumb", src: PhotoStore.get(idxs()[0] || 0) }),
          h("div", "c-label", name, h("span", "c-sub", n + (n === 1 ? " Photo" : " Photos"))),
          h("div", "c-chev", "›"));
        row.addEventListener("click", () => { Snd.click(); nav.push(rollView(name, idxs)); });
        list.append(row);
      });
      return navView(navbar("Albums"), list);
    }

    nav.push(albumsView(), false);
  }
});

/* =================================================================
   Camera — real camera + video recording when hardware allows
   ================================================================= */

/* recorded clips live for the session (blob URLs don't persist) */
const ClipStore = (() => {
  const clips = []; // {name, dur, url, thumb}
  return {
    all: () => clips,
    add: c => { clips.unshift(c); return c; },
    count: () => clips.length
  };
})();

IOS.register({
  id: "camera",
  name: "Camera",
  icon: Icons.camera,
  statusbar: "black",
  onClose() {
    clearInterval(this._iv); clearInterval(this._recIv);
    if (this._rec && this._rec.state === "recording") { try { this._rec.stop(); } catch (e) { /* done */ } }
    if (this._stream) this._stream.getTracks().forEach(t => t.stop());
    this._rec = this._stream = null;
  },
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

    /* ---- try the real camera; the canvas scene is the fallback ---- */
    const videoEl = h("video", { class: "cam-scene", autoplay: "", playsinline: "" });
    videoEl.muted = true;
    let usingReal = false, facing = "environment";
    let recordMode = false, recording = false, recSecs = 0, chunks = [];

    async function openCamera() {
      if (def._stream) def._stream.getTracks().forEach(tr => tr.stop());
      // prefer the requested facing, but accept any camera before giving up —
      // many webcams advertise no facingMode at all
      const attempts = [
        { video: { facingMode: { ideal: facing } }, audio: recordMode },
        { video: true, audio: recordMode },
        { video: true, audio: false }
      ];
      for (const constraints of attempts) {
        try {
          def._stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoEl.srcObject = def._stream;
          usingReal = true;
          scene.style.display = "none";
          videoEl.style.display = "block";
          return;
        } catch (e) { /* try the next constraint set */ }
      }
      usingReal = false;
      videoEl.style.display = "none";
      scene.style.display = "block";
    }

    /* current frame (real camera or scene) as a 320x400 canvas */
    function frameCanvas() {
      const c = document.createElement("canvas");
      c.width = 320; c.height = 400;
      const cg = c.getContext("2d");
      if (usingReal && videoEl.videoWidth) {
        const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
        const s = Math.max(320 / vw, 400 / vh);
        cg.drawImage(videoEl, (320 - vw * s) / 2, (400 - vh * s) / 2, vw * s, vh * s);
      } else cg.drawImage(scene, 0, 0);
      return c;
    }

    const iris = h("div", "cam-iris");
    const thumb = h("div", "cam-thumb");
    thumb.append(h("img", { src: PhotoStore.get(PhotoStore.count() - 1) }));
    thumb.addEventListener("click", () => IOS.open(recordMode ? "videos" : "photos"));

    const recDot = h("div", "cam-recdot hidden", h("i"), h("span", null, "00:00"));
    const shutter = h("div", { class: "cam-shutter", html: Glyphs.camera() });

    const modeSw = h("div", { class: "cam-mode", html:
      `<span class="cm-still">${Glyphs.camera()}</span><span class="cm-vid">${Glyphs.video()}</span>` });
    modeSw.addEventListener("click", () => {
      if (recording) return;
      Snd.click();
      recordMode = !recordMode;
      modeSw.classList.toggle("video", recordMode);
      shutter.classList.toggle("rec", recordMode);
      shutter.innerHTML = recordMode ? '<i class="cam-recbtn"></i>' : Glyphs.camera();
      if (usingReal) openCamera(); // reopen with/without the audio track
    });

    function stopRecording() {
      recording = false;
      clearInterval(def._recIv);
      recDot.classList.add("hidden");
      if (def._rec && def._rec.state === "recording") def._rec.stop();
    }

    function startRecording() {
      const src = usingReal && def._stream ? def._stream : scene.captureStream(20);
      let rec;
      try { rec = new MediaRecorder(src, { mimeType: "video/webm" }); }
      catch (e) {
        try { rec = new MediaRecorder(src); }
        catch (e2) { return showAlert({ title: "Camera", text: "Video recording is not supported in this browser." }); }
      }
      def._rec = rec;
      chunks = []; recSecs = 0; recording = true;
      const thumbUrl = frameCanvas().toDataURL("image/jpeg", 0.7);
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const dur = String(Math.floor(recSecs / 60)).padStart(2, "0") + ":" + String(recSecs % 60).padStart(2, "0");
        const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "video/webm" }));
        ClipStore.add({ name: "Video " + (ClipStore.count() + 1), dur, url, thumb: thumbUrl,
                        source: usingReal ? "camera" : "scene" });
        thumb.innerHTML = ""; thumb.append(h("img", { src: thumbUrl }));
        Snd.received();
      };
      rec.start(250);
      recDot.classList.remove("hidden");
      def._recIv = setInterval(() => {
        recSecs++;
        recDot.querySelector("span").textContent =
          String(Math.floor(recSecs / 60)).padStart(2, "0") + ":" + String(recSecs % 60).padStart(2, "0");
      }, 1000);
    }

    shutter.addEventListener("click", () => {
      Snd.key();
      if (recordMode) { recording ? stopRecording() : startRecording(); return; }
      iris.classList.add("snap");
      setTimeout(() => {
        PhotoStore.add(frameCanvas().toDataURL("image/jpeg", 0.85));
        thumb.innerHTML = "";
        thumb.append(h("img", { src: PhotoStore.get(PhotoStore.count() - 1) }));
        iris.classList.remove("snap");
      }, 300);
    });

    const flip = h("div", { class: "cam-flip", html: Glyphs.flip() });
    flip.addEventListener("click", () => {
      Snd.click();
      if (!usingReal || recording) return;
      facing = facing === "environment" ? "user" : "environment";
      openCamera();
    });

    root.append(
      h("div", "cam-finder", scene, videoEl, h("div", "cam-reticle"), recDot, iris),
      h("div", "cam-bar", thumb, shutter,
        h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" } }, flip, modeSw)));
    openCamera();
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
    const nav = new UINav(root);

    function artFor(tr) {
      const art = h("div", "music-art");
      const c = h("canvas", { width: 232, height: 232, style: { width: "100%", height: "100%" } });
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 232, 232);
      grad.addColorStop(0, tr.hue); grad.addColorStop(1, "#10141c");
      g.fillStyle = grad; g.fillRect(0, 0, 232, 232);
      g.fillStyle = "rgba(255,255,255,.92)";
      g.beginPath(); g.moveTo(116, 40); g.lineTo(176, 150); g.lineTo(146, 150);
      g.lineTo(116, 92); g.lineTo(86, 150); g.lineTo(56, 150); g.closePath(); g.fill();
      g.font = "bold 15px Helvetica"; g.textAlign = "center";
      g.fillText(tr.artist.toUpperCase(), 116, 190);
      g.font = "11px Helvetica"; g.fillText("· " + tr.title + " ·", 116, 208);
      art.append(c);
      return art;
    }

    function nowPlaying(idx) {
      const tr = TRACKS[idx];
      const bar = h("i");
      const elapsed = h("span", null, "0:00");
      const playBtn = h("span", { html: Glyphs.pause() });
      const start = () => MusicPlayer.play(idx,
        p => { bar.style.width = (p.frac * 100) + "%"; elapsed.textContent = p.time; },
        () => { playBtn.innerHTML = Glyphs.play(); });
      playBtn.addEventListener("click", () => {
        Snd.click();
        if (MusicPlayer.playing) { MusicPlayer.stop(); playBtn.innerHTML = Glyphs.play(); }
        else { start(); playBtn.innerHTML = Glyphs.pause(); }
      });
      const jump = d => { nav.pop(); openTrack((idx + d + TRACKS.length) % TRACKS.length); };
      const view = navView(
        navbar("Now Playing", { dark: true, left: backBtn("Library", () => { MusicPlayer.stop(); nav.pop(); }) }),
        h("div", "music-np",
          artFor(tr),
          h("div", "music-track", h("b", null, tr.title), h("span", null, tr.artist + " — " + tr.album)),
          h("div", "music-progress", elapsed, h("div", "bar", bar), h("span", null, "0:16")),
          h("div", "music-ctrls",
            h("span", { onclick: () => { Snd.click(); jump(-1); }, html: Glyphs.prev() }), playBtn,
            h("span", { onclick: () => { Snd.click(); jump(1); }, html: Glyphs.next() }),
          ),
          h("div", "music-vol", slider(70, () => {}))));
      nav.push(view);
      start();
    }
    function openTrack(idx) { nowPlaying(idx); }

    const list = h("div", "content list");
    TRACKS.forEach((tr, i) => list.append(cell({
      label: tr.title, sub: tr.artist + " — " + tr.album, chev: true,
      onTap: () => openTrack(i)
    })));
    list.append(h("div", "group-foot", TRACKS.length + " songs, all synthesized on-device. The loudness war is over; the sine wave won."));
    nav.push(navView(navbar("Music", { dark: true }), list), false);
  }
});

/* a tiny generative chiptune engine — every track is synthesized, original */
const TRACKS = [
  { title: "Daemons in the Initramfs", artist: "Kernel Panic", album: "Rolling Release (2012)",
    base: 220, wave: "square", step: 0.5, hue: "#1793d1",
    pattern: [0, 3, 5, 7, 5, 3, 0, -2, 0, 3, 7, 10, 7, 5, 3, 5] },
  { title: "Slide to Funk", artist: "The Skeuomorphs", album: "Linen Nights (2012)",
    base: 174.6, wave: "sawtooth", step: 0.38, hue: "#d17a17",
    pattern: [0, 0, 7, 0, 5, 3, 5, 7, 0, 0, 10, 8, 7, 5, 3, 0] },
  { title: "Felt & Leather", artist: "Cupertino Sunset", album: "Textures (2012)",
    base: 196, wave: "triangle", step: 0.62, hue: "#7a4dbb",
    pattern: [0, 4, 7, 12, 7, 4, 0, 4, 5, 9, 12, 9, 5, 2, 4, 0] }
];

const MusicPlayer = (() => {
  let ctx = null, nodes = [], timer = null, playing = false, t0 = 0, current = 0;
  const DUR = 16;

  function play(trackIdx, onTick, onEnd) {
    stop();
    current = trackIdx;
    const tr = TRACKS[trackIdx];
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);
    nodes = [master];
    const reps = Math.ceil(DUR / (tr.pattern.length * tr.step));
    tr.pattern.forEach((semi, i) => {
      for (let rep = 0; rep < reps; rep++) {
        const start = t0 + i * tr.step + rep * tr.pattern.length * tr.step;
        if (start - t0 > DUR) continue;
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = rep % 2 ? "triangle" : tr.wave;
        o.frequency.value = tr.base * Math.pow(2, semi / 12) * (rep % 2 ? 1 : 2);
        gn.gain.setValueAtTime(0.9, start);
        gn.gain.exponentialRampToValueAtTime(0.001, start + tr.step * 0.9);
        o.connect(gn).connect(master);
        o.start(start); o.stop(start + tr.step);
        nodes.push(o);
      }
    });
    timer = setInterval(() => {
      const el = ctx.currentTime - t0;
      if (el >= DUR) { stop(); onEnd && onEnd(); return; }
      onTick && onTick({ frac: el / DUR, time: Math.floor(el / 60) + ":" + String(Math.floor(el % 60)).padStart(2, "0") });
    }, 200);
  }
  function stop() {
    playing = false;
    clearInterval(timer); timer = null;
    nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* done */ } });
    nodes = [];
  }
  return { play, stop, get playing() { return playing; }, get current() { return current; } };
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
        h("div", { class: "bookmark-tile", onclick: () => go("apple.com") }, gl("book", 14), " Apple (curated)"),
        h("div", { class: "bookmark-tile", onclick: () => go("archlinux.org") }, gl("book", 14), " Arch Linux (curated)"),
        h("div", { class: "bookmark-tile", onclick: () => go("https://example.com") }, gl("book", 14), " example.com (real)"),
        h("div", { class: "bookmark-tile", onclick: () => go("https://info.cern.ch") }, gl("book", 14), " info.cern.ch (real, the first site)"),
        h("p", { style: { marginTop: "18px", fontSize: "12px" } },
          "Type any address or search: when the device is online, Safari loads the real page. Many big sites (Google, Facebook) refuse to be framed and will show a placeholder — a 2012-era limitation you'll find oddly authentic. The Terminal's curl and ping reach the whole internet regardless."))
    };

    const addr = kbField("Search or enter website", {
      cls: "", returnLabel: "Go", blueReturn: true,
      onReturn: v => { KB.close(); go(v.trim()); }
    });

    /* tabs: each keeps its own history */
    const TABS = [{ hist: [""], hi: 0 }];
    let curTab = 0;
    const tab = () => TABS[curTab];
    function navigate(url) {
      const t = tab();
      t.hist.splice(t.hi + 1);
      t.hist.push(url);
      t.hi = t.hist.length - 1;
      render(url);
    }
    function goBack() { const t = tab(); if (t.hi > 0) { t.hi--; render(t.hist[t.hi]); } }
    function goFwd() { const t = tab(); if (t.hi < t.hist.length - 1) { t.hi++; render(t.hist[t.hi]); } }

    /* the address field doubles as the iOS-blue loading bar */
    function progressStart() {
      addr.classList.add("loading");
      addr.style.setProperty("--p", "12%");
      setTimeout(() => addr.classList.contains("loading") && addr.style.setProperty("--p", "68%"), 350);
      setTimeout(() => addr.classList.contains("loading") && addr.style.setProperty("--p", "84%"), 2200);
    }
    function progressDone() {
      addr.style.setProperty("--p", "100%");
      setTimeout(() => { addr.classList.remove("loading"); addr.style.setProperty("--p", "0%"); }, 350);
    }

    /* on real hardware, hand the URL to the actual browser engine */
    async function openRealBrowser(url) {
      const r = await fetch("http://127.0.0.1:9641/browser", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
        .then(x => x.json()).catch(() => null);
      if (r && r.ok)
        showAlert({ title: "Opening", text: "Launching the full " + (r.engine || "browser") + " engine — close its window to come back to the shell." });
      else
        showAlert({ title: "Real Browser", text: (r && r.error) || "No engine reachable — this works on the installed device." });
    }

    function tabsOverlay() {
      const wrap = h("div", "sheet-wrap");
      const close = () => wrap.remove();
      wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
      const grid = h("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } });
      TABS.forEach((t, i) => {
        const cur = t.hist[t.hi] || "Start page";
        const row = h("div", { class: "saf-tabrow" + (i === curTab ? " on" : "") },
          h("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
            cur.replace("curated:", "") || "Start page"),
          TABS.length > 1 ? h("span", { class: "saf-tabx", onclick: e => {
            e.stopPropagation();
            TABS.splice(i, 1);
            if (curTab >= TABS.length) curTab = TABS.length - 1;
            close(); render(tab().hist[tab().hi]);
          } }, "✕") : null);
        row.addEventListener("click", () => { curTab = i; close(); render(tab().hist[tab().hi]); });
        grid.append(row);
      });
      wrap.append(h("div", "sheet",
        h("div", { style: { color: "#fff", fontWeight: "bold", textAlign: "center", paddingBottom: "6px" } },
          TABS.length + (TABS.length === 1 ? " Tab" : " Tabs")),
        grid,
        h("button", { style: { marginTop: "8px" }, onclick: () => {
          TABS.push({ hist: [""], hi: 0 });
          curTab = TABS.length - 1;
          close(); render("");
        } }, "New Tab"),
        h("button", { class: "cancel", onclick: close }, "Done")));
      $id("screen").append(wrap);
    }

    function go(input) {
      if (!input) return navigate("");
      const bare = input.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
      const key = Object.keys(SITES).find(s => bare.includes(s.split(".")[0]) && s !== "start");
      if (key) return navigate("curated:" + key);
      // looks like a URL -> load it for real; otherwise search the real web
      if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input.replace(/^https?:\/\//, "")))
        return navigate(/^https?:\/\//.test(input) ? input : "https://" + input);
      return navigate("https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(input));
    }

    let navSeq = 0;
    function render(url) {
      const nav = ++navSeq;
      page.innerHTML = "";
      page.scrollTop = 0;
      if (!url) { page.append(SITES.start()); addr.value = ""; return; }
      if (url.startsWith("curated:")) {
        const key = url.slice(8);
        page.append(SITES[key]());
        addr.value = "http://www." + key + "/";
        return;
      }
      /* the real internet, framed — works whenever the device is online
         and the site does not refuse to be embedded */
      addr.value = url;
      progressStart();
      const spin = h("div", { style: { padding: "40px 0", display: "flex", justifyContent: "center" } },
        h("div", "boot-spinner"));
      const frame = h("iframe", { src: url, class: "saf-frame" });
      let settled = false;
      function showFail() {
        if (settled || navSeq !== nav) return;
        settled = true;
        frame.remove(); spin.remove(); progressDone();
        page.append(h("div", "web body-pad",
          h("h2", null, "Cannot Open Page"),
          h("p", null, "Safari could not load “" + url + "”. Either this device is offline, or the site refuses to appear inside other pages (their loss)."),
          NativeBridge.active
            ? h("button", { class: "big-blue-btn", style: { margin: "10px 0" },
                onclick: () => openRealBrowser(url) }, "Open in the Full Browser Engine")
            : h("p", { style: { fontSize: "12px", color: "#79818c" } },
                "On the installed device, one tap here opens the page in the real Firefox engine."),
          h("p", null, "Meanwhile, the curated internet is always up: ",
            h("a", { onclick: () => go("apple.com") }, "apple.com"), " · ",
            h("a", { onclick: () => go("archlinux.org") }, "archlinux.org"))));
      }
      frame.addEventListener("load", () => {
        if (settled || navSeq !== nav) return;
        spin.remove(); progressDone();
      });
      /* the iframe fires `load` even for its own error page, so probe the
         host directly — an unreachable site gets the failure page at once */
      fetch(url, { mode: "no-cors", signal: AbortSignal.timeout(7000) })
        .then(() => { if (navSeq === nav) settled = true; })
        .catch(showFail);
      setTimeout(showFail, 9000);
      page.append(spin, frame);
    }

    root.append(
      h("div", "saf-bars", addr),
      page,
      h("div", "toolbar",
        h("span", { class: "tb-ico", html: Glyphs.chevL(), onclick: () => { Snd.click(); goBack(); } }),
        h("span", { class: "tb-ico", html: Glyphs.chevR(), onclick: () => { Snd.click(); goFwd(); } }),
        h("span", { class: "tb-ico", html: Glyphs.share(), onclick: () => showSheet([
          { label: "Open in Full Browser (Firefox)", onTap: () => {
              const cur = tab().hist[tab().hi];
              const url = cur && !cur.startsWith("curated:") ? cur : "https://example.com";
              if (NativeBridge.active) openRealBrowser(url);
              else showAlert({ title: "Full Browser", text: "On the installed device this opens the page in the real Firefox engine, fullscreen. In the demo, imagine harder." });
            } },
          { label: "Clip to Obsidian", onTap: () => {
              if (typeof AppMarket !== "undefined" && !AppMarket.isInstalled("clipper"))
                return showAlert({ title: "Web Clipper", text: "Install Obsidian Web Clipper from the App Store first." });
              const title = ObsidianVault.addClip(addr.value || "about:blank", page.innerText || "");
              showAlert({ title: "Clipped", text: "Saved to your vault as “" + title + "”." });
            } },
          { label: "Add to Home Screen", onTap: () => showAlert({ title: "Nope", text: "The home screen is full of memories already." }) },
          { label: "Mail Link to this Page", onTap: () => IOS.open("mail") },
          { label: "Cancel", style: "cancel" }]) }),
        h("span", { class: "tb-ico", html: Glyphs.book(), onclick: () => { Snd.click(); go(""); } }),
        h("span", { class: "tb-ico", html: Glyphs.pages(), onclick: () => { Snd.click(); tabsOverlay(); } })));
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
  onClose() { cancelAnimationFrame(this._raf); },
  render(root) {
    const def = IOS.app("videos");
    const nav = new UINav(root);

    /* every "film" is a 20-second procedural canvas animation */
    const FILMS = [
      { name: "Keynote Rewatch (parody)", dur: "0:20", color: "#3d5578",
        draw(g, t) {
          g.fillStyle = "#0c0e14"; g.fillRect(0, 0, 320, 180);
          const slides = ["A phone.", "A taller phone.", "Maps. What could go wrong?", "One more thing…", "It runs Arch now."];
          const idx = Math.min(slides.length - 1, Math.floor(t / 4));
          g.fillStyle = "#fff"; g.font = "bold 20px Helvetica"; g.textAlign = "center";
          g.globalAlpha = Math.min(1, (t % 4) * 1.5);
          g.fillText(slides[idx], 160, 95);
          g.globalAlpha = 1;
        } },
      { name: "Kernel Compilation: The Movie", dur: "0:20", color: "#1793d1",
        draw(g, t) {
          g.fillStyle = "#000"; g.fillRect(0, 0, 320, 180);
          g.font = "9px monospace"; g.textAlign = "left";
          const files = ["init/main.o", "kernel/fork.o", "mm/slub.o", "drivers/gpu/drm/virtio.o",
                        "net/ipv4/tcp.o", "fs/ext4/inode.o", "sound/marimba.o", "arch/arm64/phone.o"];
          for (let i = 0; i < 16; i++) {
            const n = Math.floor(t * 8) + i;
            g.fillStyle = i === 15 ? "#57e389" : "#3f9e4f";
            g.fillText("  CC      " + files[n % files.length], 8, 12 + i * 11);
          }
          if (t > 18) { g.fillStyle = "#57e389"; g.font = "bold 13px monospace"; g.fillText("Kernel: arch/boot/Image is ready", 8, 172); }
        } },
      { name: "Slide to Unlock (Director's Cut)", dur: "0:20", color: "#4a8a4a",
        draw(g, t) {
          const sky = g.createLinearGradient(0, 0, 0, 180);
          sky.addColorStop(0, "#0a1b30"); sky.addColorStop(1, "#103455");
          g.fillStyle = sky; g.fillRect(0, 0, 320, 180);
          g.fillStyle = "rgba(10,12,18,.75)"; g.fillRect(60, 70, 200, 40);
          const x = 66 + ((t * 60) % 160);
          g.fillStyle = "#dfe3ea"; g.fillRect(x, 75, 46, 30);
          g.fillStyle = "#7d84a0"; g.font = "20px Helvetica"; g.textAlign = "center"; g.fillText("→", x + 23, 97);
          g.fillStyle = "rgba(220,225,235,.6)"; g.font = "300 16px Helvetica";
          g.fillText("slide to unlock", 185, 96);
        } }
    ];

    function player(film) {
      const c = h("canvas", { width: 320, height: 180, style: { width: "100%", background: "#000" } });
      const g = c.getContext("2d");
      const bar = h("i");
      const playBtn = h("span", { class: "tb-ico", html: Glyphs.pause() });
      let t = 0, playing = true, last = performance.now();
      function loop(now) {
        if (playing) {
          t += (now - last) / 1000;
          if (t >= 20) { t = 0; playing = false; playBtn.innerHTML = Glyphs.play(); }
        }
        last = now;
        film.draw(g, t);
        bar.style.width = (t / 20 * 100) + "%";
        def._raf = requestAnimationFrame(loop);
      }
      playBtn.addEventListener("click", () => {
        Snd.click(); playing = !playing;
        playBtn.innerHTML = playing ? Glyphs.pause() : Glyphs.play();
      });
      nav.push(navView(
        navbar(film.name, { dark: true, left: backBtn("Videos", () => { cancelAnimationFrame(def._raf); nav.pop(); }) }),
        h("div", { style: { flex: "1", background: "#000", display: "flex", alignItems: "center" } }, c),
        h("div", "toolbar", playBtn,
          h("div", { class: "music-progress", style: { flex: "1", margin: "0 10px" } }, h("div", "bar", bar)))));
      def._raf = requestAnimationFrame(loop);
    }

    /* recorded clips from the Camera play in a real <video> element */
    function clipPlayer(clip) {
      const v = h("video", { src: clip.url, style: { width: "100%", background: "#000" } });
      v.muted = true;
      const bar = h("i");
      const playBtn = h("span", { class: "tb-ico", html: Glyphs.pause() });
      v.addEventListener("timeupdate", () => {
        if (v.duration && isFinite(v.duration)) bar.style.width = (v.currentTime / v.duration * 100) + "%";
      });
      v.addEventListener("ended", () => { playBtn.innerHTML = Glyphs.play(); bar.style.width = "100%"; });
      playBtn.addEventListener("click", () => {
        Snd.click();
        if (v.paused) { v.play(); playBtn.innerHTML = Glyphs.pause(); }
        else { v.pause(); playBtn.innerHTML = Glyphs.play(); }
      });
      nav.push(navView(
        navbar(clip.name, { dark: true, left: backBtn("Videos", () => { v.pause(); nav.pop(); }) }),
        h("div", { style: { flex: "1", background: "#000", display: "flex", alignItems: "center" } }, v),
        h("div", "toolbar", playBtn,
          h("div", { class: "music-progress", style: { flex: "1", margin: "0 10px" } }, h("div", "bar", bar)))));
      v.play().catch(() => { playBtn.innerHTML = Glyphs.play(); });
    }

    const list = h("div", "content list");
    function paintList() {
      list.innerHTML = "";
      if (ClipStore.count()) {
        list.append(h("div", "ct-sec", "Camera Roll"));
        ClipStore.all().forEach(c => list.append(h("div", { class: "store-row", onclick: () => { Snd.click(); clipPlayer(c); } },
          h("img", { src: c.thumb, style: { width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", flex: "0 0 50px" } }),
          h("div", "store-info", h("b", null, c.name),
            h("span", null, c.dur + (c.source === "camera" ? " · recorded with the camera" : " · recorded from the viewfinder"))))));
      }
      list.append(h("div", "ct-sec", "Films"));
      FILMS.forEach(f => list.append(h("div", { class: "store-row", onclick: () => { Snd.click(); player(f); } },
        h("div", { class: "store-app-ico", style: { background: f.color }, html: Glyphs.play() }),
        h("div", "store-info", h("b", null, f.name), h("span", null, f.dur + " · procedurally generated · HD-ish")))));
      if (!ClipStore.count())
        list.append(h("div", "group-foot", "Record your own: Camera → flip the little switch to video mode. Clips live until reboot."));
    }
    nav.push(navView(navbar("Videos"), list), false);
    paintList();
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
      rows.forEach(([glyph, bg, nm, sub, price]) => {
        list.append(h("div", { class: "store-row", onclick: () => Snd.click() },
          h("div", { class: "store-app-ico", style: { background: bg }, html: Glyphs[glyph]() }),
          h("div", "store-info", h("b", null, nm), h("span", null, sub),
            h("div", "stars", h("b", null, "★★★★"), "★ (12,061)")),
          h("div", { class: "store-price", onclick: e => {
            e.stopPropagation(); Snd.click();
            showAlert({ title: nm, text: "Purchased! Charged to: nobody. Downloaded to: nowhere. Rated 5 stars by: you, just now." });
          } }, price)));
      });
      const tabs = [["star", "Featured"], ["chart", "Charts"], ["search", "Search"], ["download", "Updates"]];
      const tabbar = h("div", "tabbar", tabs.map(([ico, lbl], i) =>
        h("div", "tab" + (i === 0 ? " on" : ""), h("div", { class: "t-ico", html: Glyphs[ico]() }), h("div", null, lbl))));
      root.append(navbar(name), list, tabbar);
    }
  });
}

storeApp("itunes", "iTunes", Icons.itunes, "New & Noteworthy", [
  ["note", "linear-gradient(#e05a8a,#a02555)", "Rolling Release", "Kernel Panic — Album", "$9.99"],
  ["note", "linear-gradient(#3a7ad8,#1a4a98)", "Daemons (Single)", "Kernel Panic", "$1.29"],
  ["film", "linear-gradient(#3d4450,#181b21)", "The Linen Documentary", "Textures & Feelings", "$14.99"],
  ["bell", "linear-gradient(#f5871f,#c05a00)", "Marimba Forever", "Various Ringtones", "$0.99"]
], "Music, movies & marimba.");

/* App Store lives in js/apps/store.js now — with working installs. */

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
          h("h2", { style: { fontSize: "16px" } }, "Leaderboards"),
          h("div", { style: { fontSize: "13px", color: "#6a5f45", marginTop: "8px", lineHeight: "1.9" } },
            "Angry Penguins — your best: " +
              (Prefs.get("penguinHigh", 0) || "not played yet") +
              (Prefs.get("penguinHigh", 0) >= 700 ? " 🏆" : ""), h("br"),
            "Chess — Zach is winning (1,240)", h("br"),
            "vimtutor speedrun — record holder"),
          Prefs.get("penguinHigh", 0) === 0 && typeof AppMarket !== "undefined" && !AppMarket.isInstalled("penguins")
            ? h("button", { class: "big-blue-btn", style: { marginTop: "10px" },
                onclick: () => IOS.open("appstore") }, "Get Angry Penguins")
            : null)));
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
    function openPass(p) {
      const full = h("div", { class: "sheet-wrap", style: { alignItems: "center", padding: "16px" } },
        h("div", { class: "pass", style: { background: p.bg, width: "100%", margin: 0, animation: "alertpop .2s ease-out" } },
          h("div", "p-top", h("b", null, p.brand), h("span", { style: { fontSize: "11px", opacity: 0.8 } }, p.sub)),
          h("div", "p-big", p.big),
          h("div", { style: { padding: "0 14px 8px", fontSize: "12px", opacity: 0.85 } },
            "Gate 6 · Boarding group ARCH · Scans anywhere that accepts imaginary barcodes."),
          h("div", { class: "p-barcode", style: { height: "84px" } }),
          h("button", { class: "big-blue-btn", style: { margin: "0 14px 14px", width: "calc(100% - 28px)" },
            onclick: () => { Snd.click(); full.remove(); } }, "Done")));
      full.addEventListener("click", e => { if (e.target === full) full.remove(); });
      $id("screen").append(full);
    }
    root.append(
      navbar("Passbook", { dark: true }),
      h("div", { class: "content", style: { background: "transparent" } },
        passes.map(p => h("div", { class: "pass", style: { background: p.bg }, onclick: () => { Snd.click(); openPass(p); } },
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
    const nav = new UINav(root);
    const ISSUES = {
      "LINEN WEEKLY": ["The texture that held up an era",
        ["This week we ask the question on everyone's lips: is there such a thing as too much linen?",
         "Our panel of designers examined 47 screens and found linen on 46 of them. The 47th was leather.",
         "Next week: felt — friend or floor covering?"]],
      "pacman monthly": ["-Syu and you: a love story",
        ["Readers write in to describe the moment they stopped fearing the partial upgrade and learned to read the news first.",
         "Our centerfold this month: a mirror that is fully synced, photographed at golden hour.",
         "Tip of the month: the wiki knew. The wiki always knew."]],
      "Skeuomorph": ["Stitching: a retrospective",
        ["From calendars bound in leather to shelves of virtual pine, we chart the decade when software wanted to be furniture.",
         "An interview with the shadow under a toggle switch: 'people said I was unnecessary. I kept everything grounded.'"]],
      "Gradient Quarterly": ["From #b2bccc to #6d84a2",
        ["A meditation on the navigation bar: why settle for one blue when you can have four, vertically?",
         "Field notes: gloss is not a highlight, it is a promise."]],
      "TEXTURE": ["Green felt: the gaming issue",
        ["Why did every game table look like a casino in 2012? We visited the fabric district to find out.",
         "Plus: brushed metal — a eulogy, slightly reflective."]]
    };
    function reader(name) {
      const [title, pars] = ISSUES[name];
      nav.push(navView(
        navbar(name, { dark: true, left: backBtn("Shelf", () => nav.pop()) }),
        h("div", { class: "content", style: { padding: "14px" } },
          h("h3", { style: { fontSize: "18px", marginBottom: "8px" } }, title),
          pars.map(par => h("p", { style: { fontSize: "14px", lineHeight: "1.55", marginBottom: "10px", fontWeight: "400" } }, par)),
          h("div", "group-foot", "Issue 6 · 2012 · entirely fictional"))));
    }
    const shelf = (mags) => h("div", "ns-shelf", mags.map(([name, bg]) =>
      h("div", { class: "ns-mag", style: { background: bg }, onclick: () => { Snd.click(); reader(name); } }, name)));
    nav.push(navView(
      navbar("Newsstand", { dark: true, right: navBtn("Store", () => IOS.open("appstore")) }),
      h("div", { class: "content", style: { background: "transparent", paddingBottom: "12px" } },
        shelf([["LINEN WEEKLY", "linear-gradient(#8a8f9a,#5a5f6a)"], ["pacman monthly", "linear-gradient(#1793d1,#0a4a70)"], ["Skeuomorph", "linear-gradient(#7a5c3a,#4a3018)"]]),
        shelf([["Gradient Quarterly", "linear-gradient(#e05a8a,#8a2555)"], ["TEXTURE", "linear-gradient(#4a8a4a,#255525)"]]),
        shelf([]))), false);
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
    const memoList = h("div", { class: "content list", style: { flex: "0 0 120px", background: "#26262a", borderTop: "1px solid #000" } });
    let recording = false, secs = 0;
    let recorder = null, chunks = [];
    if (!def._memos) def._memos = []; // {name, dur, url|null}

    function paintMemos() {
      memoList.innerHTML = "";
      if (!def._memos.length) {
        memoList.append(h("div", { class: "empty-msg", style: { padding: "14px", color: "#8a8a90" } }, "No memos yet — tap record."));
        return;
      }
      def._memos.forEach((m, i) => {
        const row = h("div", { class: "wc-row", style: { padding: "6px 14px" } },
          h("div", "wc-info", h("div", { class: "wc-city", style: { fontSize: "15px" } }, m.name),
            h("div", "wc-sub", m.dur + (m.url ? " · microphone" : " · synth (no mic)"))),
          h("span", { class: "vm-cell-play", style: { color: "#6fd76f" }, html: Glyphs.play(),
            onclick: () => {
              Snd.click();
              if (m.url) new Audio(m.url).play();
              else { Snd.tri(); }
            } }));
        memoList.append(row);
      });
    }

    async function startRec() {
      secs = 0; chunks = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.start();
      } catch (e) {
        recorder = null; // no mic / no permission — memo becomes a synth marker
      }
      def._iv = setInterval(() => {
        secs++;
        time.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
        [...levels.children].forEach(b => b.style.height = (3 + Math.random() * 20) + "px");
      }, 1000);
    }

    function stopRec() {
      clearInterval(def._iv);
      [...levels.children].forEach(b => b.style.height = "4px");
      const name = "New Recording " + (def._memos.length + 1);
      const dur = time.textContent;
      if (recorder && recorder.state === "recording") {
        recorder.onstop = () => {
          recorder.stream.getTracks().forEach(t => t.stop());
          const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
          def._memos.unshift({ name, dur, url });
          paintMemos();
        };
        recorder.stop();
      } else {
        def._memos.unshift({ name, dur, url: null });
        paintMemos();
      }
      time.textContent = "00:00";
    }

    rec.addEventListener("click", () => {
      Snd.click();
      recording = !recording;
      rec.classList.toggle("recording", recording);
      if (recording) startRec(); else stopRec();
    });

    root.append(
      h("div", "vm-mic", h("div", { class: "vm-mic-svg", html: micSvg })),
      h("div", "vm-ctrl", rec, levels, time),
      memoList);
    paintMemos();
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
      ["t-arch", "     /\\   \\       OS: Arch Linux (iOS 6 shell)"],
      ["t-arch", "    /      \\      Host: HOSTNAME"],
      ["t-arch", "   /   ,,   \\     Kernel: KERNEL"],
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

    /* ---- simulated package universe (browser); real pacman via ios6d on hardware ---- */
    const SIM_REPO = {
      cowsay:  "a talking cow for your terminal",
      fortune: "wisdom of questionable provenance",
      sl:      "a steam locomotive for typos",
      figlet:  "letters, but enormous"
    };
    const simPkgs = () => Prefs.get("termPkgs", []);
    const hasPkg = n => simPkgs().includes(n);
    const sleepMs = ms => new Promise(r => setTimeout(r, ms));

    const FORTUNES = [
      "You will read the wiki before posting. — the wiki",
      "A rolling release gathers no moss.",
      "Your uptime is someone else's downtime.",
      "He who controls the AUR controls the universe.",
      "Reboot not into the fruit, but into the log."
    ];

    function cowsay(msg) {
      const m = (msg || "I use Arch btw").slice(0, 34);
      const bar = "-".repeat(m.length + 2);
      lines([[null, " " + bar], [null, "< " + m + " >"], [null, " " + bar],
        [null, "        \\   ^__^"], [null, "         \\  (oo)\\_______"],
        [null, "            (__)\\       )\\/\\"], [null, "                ||----w |"],
        [null, "                ||     ||"]].map(([c, t]) => [c || "", t]));
    }

    async function pacmanCmd(args) {
      const native = NativeBridge.active;
      if (args[0] === "-Syu" || args[0] === "-syu") {
        line(":: Synchronizing package databases...");
        if (native) {
          line(":: Starting full system upgrade (real pacman via ios6d)...");
          const r = await NativeBridge.pkgUpgrade();
          (r && r.log || []).forEach(l => line(" " + l));
          line(r && r.ok ? ":: upgrade complete" : ":: " + ((r && r.error) || "upgrade failed"), r && r.ok ? "t-ok" : "");
        } else {
          for (const [t, d] of [[" core is up to date", 250], [" extra is up to date", 250],
                                [" springboard is up to date", 250], [":: Starting full system upgrade...", 350]]) {
            await sleepMs(d); line(t);
          }
          await sleepMs(350); line(" there is nothing to do", "t-ok");
        }
      } else if (args[0] === "-S" && args[1]) {
        const name = args[1];
        if (native) {
          line("resolving dependencies (real pacman via ios6d)...");
          const r = await NativeBridge.pkgInstall(name);
          (r && r.log || []).forEach(l => line(" " + l));
          line(r && r.ok ? ":: installed " + name : ":: " + ((r && r.error) || "install failed"), r && r.ok ? "t-ok" : "");
        } else if (SIM_REPO[name]) {
          if (hasPkg(name)) return line("warning: " + name + " is up to date -- reinstalling");
          line("resolving dependencies...");
          await sleepMs(300); line("Packages (1) " + name + "-1.0-1");
          await sleepMs(400); line(":: Retrieving packages... [########] 100%");
          await sleepMs(300);
          Prefs.set("termPkgs", [...simPkgs(), name]);
          line(":: installed " + name + " — try running it", "t-ok");
        } else {
          line("error: target not found: " + name + " (sim repo has: " + Object.keys(SIM_REPO).join(", ") + ")");
        }
      } else if (args[0] === "-Ss" && args[1]) {
        if (native) {
          const r = await NativeBridge.pkgSearch(args.slice(1).join(" "));
          const res = (r && r.results) || [];
          if (!res.length) line("no results");
          res.slice(0, 10).forEach(pk => { line("extra/" + pk.name, "t-arch"); line("    " + pk.desc); });
        } else {
          Object.entries(SIM_REPO)
            .filter(([n, d]) => (n + d).includes(args[1].toLowerCase()))
            .forEach(([n, d]) => { line("sim/" + n + " 1.0-1" + (hasPkg(n) ? " [installed]" : ""), "t-arch"); line("    " + d); });
        }
      } else if (args[0] === "-Q") {
        ["base 3-2", "linux-arch 6.9.7-1", "springboard 6.1.3-1", "cage 0.2.0-1",
         ...simPkgs().map(n => n + " 1.0-1")].forEach(l => line(l));
      } else {
        line("usage: pacman <-S pkg | -Ss query | -Syu | -Q>");
      }
    }

    const CMDS = {
      help: () => line("commands: help, neofetch, uname -a, pacman <-S|-Ss|-Syu|-Q>, curl, ping, firefox <url>, sudo, free, df, ps, htop, ls, whoami, uptime, btw, exit, clear" +
        (simPkgs().length ? " · installed: " + simPkgs().join(", ") : "")),
      neofetch: () => {
        const host = String(NativeBridge.get("hostname", "iPhone 5 (ARCH1,6)")).slice(0, 26);
        const kern = String(NativeBridge.get("kernel", "6.9.7-arch1-1")).slice(0, 26);
        lines(NEOFETCH.map(([c, t]) => [c, t
          .replace("root@arch-iphone", ("root@" + NativeBridge.get("hostname", "arch-iphone")).slice(0, 26))
          .replace("HOSTNAME", host)
          .replace("KERNEL", kern)]));
      },
      "uname -a": () => line("Linux " + NativeBridge.get("hostname", "arch-iphone") + " " +
        NativeBridge.get("kernel", "6.9.7-arch1-1") + " #1 SMP PREEMPT_DYNAMIC " +
        NativeBridge.get("arch", "aarch64") + " GNU/Linux"),
      uname: () => line("Linux"),
      whoami: () => line("root (obviously — it's 2012, jailbreaks are cool)"),
      uptime: () => line(" 9:41:00 up 0 min,  1 user,  load average: 0.06, 0.01, 1984"),
      ls: () => line("Desktop  Music  Photos  springboard.plist  wallpapers/  wiki-tabs(47)/"),
      btw: () => line("I use Arch btw. (You had to ask?)"),
      exit: () => { line("logout"); setTimeout(() => IOS.goHome(), 400); },
      clear: () => { out.innerHTML = ""; },
      date: () => line(new Date().toString()),
      history: () => HIST.slice(-15).forEach((c, i) => line("  " + (HIST.length - Math.min(15, HIST.length) + i + 1) + "  " + c)),
      free: async () => {
        const si = await sysinfo();
        if (si && si.free) si.free.split("\n").forEach(l => line(l));
        else lines([["", "               total   used   free"], ["", "Mem:           1024M   512M   512M"],
                    ["", "Swap:             0B     0B     0B  (real numbers on real hardware)"]]);
      },
      df: async () => {
        const si = await sysinfo();
        if (si && si.df) si.df.split("\n").forEach(l => line(l));
        else lines([["", "Filesystem   Size  Used Avail Use% Mounted on"], ["", "/dev/vda      16G  2.1G   14G  14% /"]]);
      },
      ps: async () => {
        const si = await sysinfo();
        if (si && si.ps) si.ps.split("\n").forEach(l => line(l));
        else lines([["", "  PID CMD"], ["", "    1 systemd"], ["", "  128 ios6d"], ["", "  201 cage"],
                    ["", "  202 chromium --kiosk"], ["", "  424 the-concept-of-linen"]]);
      },
      htop: () => {
        const rows = ["cpu0", "cpu1", "mem "];
        const hEls = rows.map(r => line(""));
        let ticks = 0;
        const iv = setInterval(() => {
          ticks++;
          hEls.forEach((el, i) => {
            const p = Math.random() * (i === 2 ? 0.55 : 0.9) + 0.05;
            const bars = Math.round(p * 24);
            el.textContent = rows[i] + " [" + "|".repeat(bars).padEnd(24) + "] " + Math.round(p * 100) + "%";
            el.className = "t-ok";
          });
          if (ticks >= 6) { clearInterval(iv); line("htop: press nothing to quit (it quits itself, phone edition)"); }
        }, 450);
      },
      fortune: () => hasPkg("fortune")
        ? line(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
        : line("bash: fortune: command not found (pacman -S fortune)"),
      sl: () => hasPkg("sl")
        ? lines([["", "      ====        ________ "], ["", "  _D _|  |_______/        \\__I_I_____"],
                 ["", "   |(_)---  |   H\\________/ |   |    "], ["", "   /     |  |   H  |  |     |   |    "],
                 ["", "  |      |  |   H  |__------------- choo choo"]])
        : line("bash: sl: command not found (pacman -S sl)")
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
    const HIST = [];
    let histIdx = -1;

    async function sysinfo() {
      if (!NativeBridge.active) return null;
      try { return await fetch("http://127.0.0.1:9641/sysinfo").then(r => r.json()); }
      catch (e) { return null; }
    }

    async function runCmd(raw, sudoDepth = 0) {
      const c = raw.toLowerCase().replace(/\s+/g, " ");
      const argv = raw.split(/\s+/);
      const cmd0 = argv[0].toLowerCase();
      if (cmd0 === "pacman") {
        const args = argv.slice(1).map(a => a.startsWith("-") ? a : a.toLowerCase());
        await pacmanCmd(args);
      } else if (cmd0 === "sudo") {
        line(sudoDepth ? "sudo: yes, still root" : "[sudo] you are already root. running it anyway, for the ritual:");
        const rest = argv.slice(1).join(" ");
        if (rest && sudoDepth < 2) await runCmd(rest, sudoDepth + 1);
      } else if (cmd0 === "echo") {
        line(argv.slice(1).join(" "));
      } else if (cmd0 === "curl") {
        const url0 = argv.slice(1).find(a => !a.startsWith("-")) || "";
        if (!url0) return line("usage: curl <url>");
        const url = /^https?:\/\//.test(url0) ? url0 : "https://" + url0;
        line("* connecting to " + url + " ...");
        const t0 = performance.now();
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
          const body = await r.text();
          line("* HTTP " + r.status + " · " + Math.round(performance.now() - t0) + "ms · " + body.length + " bytes", "t-ok");
          body.slice(0, 280).split("\n").slice(0, 6).forEach(l => line(l));
          if (body.length > 280) line("… (truncated — it's a phone)");
        } catch (e) {
          try {
            await fetch(url, { mode: "no-cors", signal: AbortSignal.timeout(8000) });
            line("* reachable in " + Math.round(performance.now() - t0) + "ms — but the site sends no CORS headers, so the body is classified", "t-ok");
          } catch (e2) {
            line("curl: (7) couldn't connect — offline, blocked, or the site is having a decade");
          }
        }
      } else if (cmd0 === "ping") {
        const host0 = argv[1];
        if (!host0) return line("usage: ping <host>");
        const url = "https://" + host0.replace(/^https?:\/\//, "").split("/")[0];
        line("PING " + host0 + " (over HTTPS, ICMP is for computers):");
        let ok = 0;
        for (let i = 1; i <= 3; i++) {
          const t0 = performance.now();
          try {
            await fetch(url, { mode: "no-cors", signal: AbortSignal.timeout(5000) });
            line("reply seq=" + i + " time=" + Math.round(performance.now() - t0) + "ms");
            ok++;
          } catch (e) { line("request timeout seq=" + i); }
        }
        line("--- " + host0 + ": " + ok + "/3 received ---", ok ? "t-ok" : "");
      } else if (cmd0 === "firefox") {
        const u0 = argv.slice(1).find(a => !a.startsWith("-")) || "https://example.com";
        const url = /^https?:\/\//.test(u0) ? u0 : "https://" + u0;
        if (!NativeBridge.active)
          return line("firefox: no wayland display (this works on the installed device)");
        const r = await fetch("http://127.0.0.1:9641/browser", { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
          .then(x => x.json()).catch(() => null);
        line(r && r.ok ? "* launching " + (r.engine || "browser") + " on " + url
                       : "firefox: " + ((r && r.error) || "engine unreachable"));
      } else if (cmd0 === "cowsay") {
        if (hasPkg("cowsay")) cowsay(argv.slice(1).join(" "));
        else line("bash: cowsay: command not found (pacman -S cowsay)");
      } else if (cmd0 === "figlet") {
        if (hasPkg("figlet")) {
          const msg = (argv.slice(1).join(" ") || "ARCH").toUpperCase().slice(0, 8);
          lines([["t-arch", "  _  " .repeat(msg.length)],
                 ["t-arch", msg.split("").map(ch => " " + ch + "  ").join(" ")],
                 ["t-arch", " (big letters simulated — it's a phone)"]]);
        } else line("bash: figlet: command not found (pacman -S figlet)");
      } else {
        const fn = CMDS[c] || CMDS[cmd0];
        if (fn) await fn();
        else line("bash: " + raw + ": command not found (have you tried the wiki?)");
      }
      return c;
    }

    async function exec() {
      const raw = cur.trim();
      out.querySelectorAll(".term-caret").forEach(x => x.remove());
      let c = "";
      if (raw) {
        HIST.push(raw);
        histIdx = HIST.length;
        c = await runCmd(raw);
      }
      if (c === "clear") { newPrompt(); return; }
      newPrompt();
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
    const setLine = v => { field.value = v; cur = v; if (cmdSpan) cmdSpan.textContent = v; };
    def._kh = e => {
      if (KB.visible) return; // KB routes hardware keys itself when open
      if (e.key === "Enter") { e.preventDefault(); exec(); field.value = ""; cur = ""; }
      else if (e.key === "Backspace") { e.preventDefault(); setLine(field.value.slice(0, -1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (histIdx > 0) setLine(HIST[--histIdx]); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setLine(histIdx < HIST.length - 1 ? HIST[++histIdx] : (histIdx = HIST.length, "")); }
      else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setLine(field.value + e.key); }
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
