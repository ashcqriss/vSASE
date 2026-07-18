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
      let idx = i;
      const trash = h("div", { class: "pv-trash", html: Glyphs.trash() });
      trash.addEventListener("click", e => {
        e.stopPropagation();
        showSheet([
          { label: "Delete Photo", style: "destructive", onTap: () => {
              PhotoStore.remove(idx);
              v.remove();
              grid.innerHTML = "";
              PhotoStore.all().forEach((url, k) => {
                const im = h("img", { src: url });
                im.addEventListener("click", () => viewer(k));
                grid.append(im);
              });
            } },
          { label: "Cancel", style: "cancel" }]);
      });
      const v = h("div", "photo-viewer", img, trash);
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
        right: navBtn(gl("share", 15), () => showSheet([
          { label: "Email Photo", onTap: () => IOS.open("mail") },
          { label: "Message", onTap: () => IOS.open("messages") },
          { label: "Use as Wallpaper", onTap: () => showAlert({ title: "Wallpaper", text: "This wallpaper is too beautiful. Request denied by the Skeuomorphic Texture Daemon." }) },
          { label: "Cancel", style: "cancel" }])) }),
      h("div", { class: "content", style: { background: "#000" } }, grid),
      h("div", "toolbar",
        h("span", { class: "tb-ico", html: Glyphs.play() }),
        h("span", { class: "tb-ico disabled", html: Glyphs.trash() })));
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
        h("div", { class: "bookmark-tile", onclick: () => go("apple.com") }, gl("book", 14), " Apple"),
        h("div", { class: "bookmark-tile", onclick: () => go("archlinux.org") }, gl("book", 14), " Arch Linux"),
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
        h("span", { class: "tb-ico", html: Glyphs.chevL(), onclick: () => { Snd.click(); go("apple.com"); } }),
        h("span", { class: "tb-ico", html: Glyphs.chevR(), onclick: () => { Snd.click(); go("archlinux.org"); } }),
        h("span", { class: "tb-ico", html: Glyphs.share(), onclick: () => showSheet([
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
        h("span", { class: "tb-ico", html: Glyphs.pages(), onclick: () => showAlert({ title: "Tabs", text: "You have 1 tab open. A simpler time." }) })));
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
      help: () => line("commands: help, neofetch, uname -a, pacman <-S|-Ss|-Syu|-Q>, ls, whoami, uptime, btw, exit, clear" +
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
    async function exec() {
      const raw = cur.trim();
      const c = raw.toLowerCase().replace(/\s+/g, " ");
      out.querySelectorAll(".term-caret").forEach(x => x.remove());
      if (c) {
        const argv = raw.split(/\s+/);
        const cmd0 = argv[0].toLowerCase();
        if (cmd0 === "pacman") {
          // preserve flag case (-S vs -Ss), lowercase package names
          const args = argv.slice(1).map((a, i) => a.startsWith("-") ? a : a.toLowerCase());
          await pacmanCmd(args);
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
