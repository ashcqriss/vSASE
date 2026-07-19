/* ===================================================================
   iOS 6 · Arch Edition — system services, wave two
   Notification Center · banners · app switcher · slide-to-power-off ·
   Siri · passcode lock · Spotlight · auto-lock · firing alarms ·
   incoming calls & texts (simulated locally, ModemManager on hardware)
   Loaded last: may reference IOS, apps, stores and players.
   =================================================================== */
"use strict";

const ShellX = (() => {
  const screen = $id("screen");

  /* =============================================================
     Notifications: banners + the pull-down center
     ============================================================= */
  const NOTIFS = []; // {app, title, text, time}

  /* ---- Do Not Disturb: iOS 6's headline feature, for real ---- */
  const DND = {
    active: () => Prefs.get("dnd", false),
    refresh() {
      const m = document.querySelector(".sb-moon");
      if (m) m.classList.toggle("hidden", !DND.active());
      const pct = document.querySelector(".sb-batt-pct");
      if (pct) pct.classList.toggle("hidden", !Prefs.get("battPct", true));
    }
  };
  window.DND = DND;
  DND.refresh();

  const Notify = {
    push(appId, title, text, { silent = false } = {}) {
      NOTIFS.unshift({ app: appId, title, text, time: fmtTime(new Date()) });
      if (NOTIFS.length > 30) NOTIFS.pop();
      if (DND.active()) { if (IOS.state === "home") IOS.buildHome(); return; } // straight to the NC list, no light, no sound
      if (!silent) Snd.received();
      const def = IOS.app(appId);
      const b = h("div", "nc-banner",
        h("div", { class: "nc-banner-ico", html: def ? def.icon() : "" }),
        h("div", "nc-banner-txt", h("b", null, title), h("span", null, text)));
      b.addEventListener("click", () => { b.remove(); if (def) IOS.open(appId); });
      screen.append(b);
      setTimeout(() => { b.classList.add("out"); setTimeout(() => b.remove(), 400); }, 4200);
      if (IOS.state === "home") IOS.buildHome();
    }
  };

  /* ---- Notification Center panel ---- */
  const nc = h("div", { id: "notif-center", class: "hidden" });
  screen.append(nc);
  let ncOpen = false;

  function paintNC() {
    nc.innerHTML = "";
    nc.append(h("div", "nc-widget",
      h("div", "nc-widget-title", "Weather"),
      h("div", "nc-weather",
        h("span", { class: "w-i", html: Glyphs.wsun() }),
        h("span", null, "Cupertino — 73° sunny, high 75°"))));
    const stk = (typeof STOCKS !== "undefined" ? STOCKS : []).slice(0, 3)
      .map(s => s.sym + " " + (s.chg >= 0 ? "▲" : "▼") + Math.abs(s.chg).toFixed(2)).join("   ");
    nc.append(h("div", "nc-widget", h("div", "nc-widget-title", "Stocks"), h("div", "nc-stocks", stk)));
    if (!NOTIFS.length) {
      nc.append(h("div", "nc-empty", "No New Notifications"));
    } else {
      const list = h("div", "nc-list");
      NOTIFS.forEach(n => {
        const def = IOS.app(n.app);
        const row = h("div", "nc-row",
          h("div", { class: "nc-banner-ico", html: def ? def.icon() : "" }),
          h("div", "nc-banner-txt", h("b", null, n.title), h("span", null, n.text)),
          h("span", "nc-time", n.time));
        row.addEventListener("click", () => { closeNC(); if (def) IOS.open(n.app); });
        list.append(row);
      });
      const clear = h("button", "nc-clear", "Clear");
      clear.addEventListener("click", () => { NOTIFS.length = 0; paintNC(); });
      nc.append(h("div", "nc-widget-title", "Notifications ", clear), list);
    }
    nc.append(h("div", { class: "nc-grab", onclick: closeNC }, h("i")));
  }
  function openNC() {
    if (IOS.state !== "home" && IOS.state !== "app") return;
    ncOpen = true; paintNC();
    nc.classList.remove("hidden");
    requestAnimationFrame(() => nc.classList.add("open"));
  }
  function closeNC() {
    ncOpen = false;
    nc.classList.remove("open");
    setTimeout(() => nc.classList.add("hidden"), 320);
  }
  // pull down from the status bar
  (() => {
    const sb = $id("statusbar");
    let y0 = null;
    sb.addEventListener("pointerdown", e => { y0 = e.clientY; });
    sb.addEventListener("pointerup", e => {
      if (y0 !== null && (e.clientY - y0 > 18 || e.clientY - y0 >= 0)) { ncOpen ? closeNC() : openNC(); }
      y0 = null;
    });
  })();

  /* =============================================================
     App switcher (double-press home) + Siri (long-press home)
     ============================================================= */
  const RECENTS = [];
  const _open = IOS.open.bind(IOS);
  IOS.open = id => {
    const i = RECENTS.indexOf(id);
    if (i >= 0) RECENTS.splice(i, 1);
    RECENTS.unshift(id);
    if (RECENTS.length > 8) RECENTS.pop();
    _open(id);
  };

  const switcher = h("div", { id: "switcher", class: "hidden" });
  screen.append(switcher);
  let swOpen = false;
  function toggleSwitcher() {
    if (swOpen) { switcher.classList.add("hidden"); swOpen = false; return; }
    switcher.innerHTML = "";
    const row = h("div", "sw-row");
    (RECENTS.length ? RECENTS : ["phone", "safari", "music"]).forEach(id => {
      const def = IOS.app(id);
      if (!def) return;
      const ic = h("div", "sw-app",
        h("div", { class: "glyph", html: def.icon() }),
        h("div", "label", def.name));
      ic.addEventListener("click", () => { toggleSwitcher(); IOS.open(id); });
      row.append(ic);
    });
    const ctr = h("div", "sw-music",
      h("span", { html: Glyphs.prev(), onclick: () => Snd.click() }),
      h("span", { html: (typeof MusicPlayer !== "undefined" && MusicPlayer.playing) ? Glyphs.pause() : Glyphs.play(),
        onclick: e => {
          Snd.click();
          if (typeof MusicPlayer === "undefined") return;
          if (MusicPlayer.playing) { MusicPlayer.stop(); e.currentTarget.innerHTML = Glyphs.play(); }
          else { MusicPlayer.play(0, null, () => {}); e.currentTarget.innerHTML = Glyphs.pause(); }
        } }),
      h("span", { html: Glyphs.next(), onclick: () => Snd.click() }));
    switcher.append(ctr, row);
    switcher.classList.remove("hidden");
    swOpen = true;
  }

  /* Siri — hold the home button */
  const siri = h("div", { id: "siri", class: "hidden" });
  screen.append(siri);
  function openSiri() {
    siri.innerHTML = "";
    const answers = h("div", "siri-answers");
    const say = t => { answers.append(h("div", "siri-bubble", t)); answers.scrollTop = 1e6; };
    const RESP = [
      [/weather/i, "It is 73° and sunny in Cupertino. It is always 73° and sunny in Cupertino."],
      [/time/i, () => "It is " + fmtTime(new Date()) + ". Time is a rolling release."],
      [/call (\w+)/i, m => { const c = CONTACTS.find(x => contactName(x).toLowerCase().includes(m[1].toLowerCase())); return c ? "Calling " + contactName(c) + "…" : "I could not find that person."; }],
      [/arch|linux|kernel/i, "This device runs Linux " + NativeBridge.get("kernel", "6.9.7-arch1-1") + ". You were going to mention it eventually."],
      [/joke/i, "A partial upgrade walks into a bar. The bar segfaults."],
      [/love|marry/i, "I am a shell script with self-esteem. Let us keep this professional."],
      [/open (\w+)/i, m => { const id = Object.keys(IOS).length && m[1].toLowerCase(); return "OPEN:" + id; }]
    ];
    const field = kbField("Ask me anything…", {
      returnLabel: "Ask", blueReturn: true,
      onReturn: v => {
        if (!v.trim()) return;
        say("“" + v.trim() + "”");
        field.value = "";
        let out = "I am not sure I understand. Then again, it is 2012.";
        for (const [re, r] of RESP) {
          const m = v.match(re);
          if (m) { out = typeof r === "function" ? r(m) : r; break; }
        }
        if (out.startsWith("OPEN:")) {
          const id = out.slice(5);
          const def = IOS.app(id);
          if (def) { closeSiri(); return IOS.open(id); }
          out = "I do not have an app called “" + id + "”.";
        }
        setTimeout(() => say(out), 450);
        if (/call (\w+)/i.test(v)) {
          const m = v.match(/call (\w+)/i);
          const c = CONTACTS.find(x => contactName(x).toLowerCase().includes(m[1].toLowerCase()));
          if (c) setTimeout(() => { closeSiri(); IncomingCall.outgoing(contactName(c)); }, 1200);
        }
      }
    });
    siri.append(
      h("div", "siri-head", h("div", { class: "siri-mic", html: Glyphs.mute().replace(/M4 3.6 20 20.4/, "M0 0 0 0") }),
        h("div", null, "What can I help you with?")),
      answers,
      h("div", { style: { padding: "8px" } }, field),
      h("div", { class: "nc-grab", onclick: closeSiri }, h("i")));
    siri.classList.remove("hidden");
    Snd.tri();
  }
  function closeSiri() { KB.close(); siri.classList.add("hidden"); }

  // home button: double-press => switcher, long-press => Siri
  (() => {
    const hb = $id("home-btn");
    let lastUp = 0, downAt = 0, longFired = false;
    hb.addEventListener("pointerdown", () => {
      downAt = Date.now(); longFired = false;
      setTimeout(() => {
        if (downAt && Date.now() - downAt >= 700 && !longFired) { longFired = true; openSiri(); }
      }, 720);
    });
    hb.addEventListener("click", e => {
      const held = Date.now() - downAt;
      downAt = 0;
      if (longFired) { e.stopImmediatePropagation(); return; }
      if (ncOpen) closeNC();
      if (!siri.classList.contains("hidden")) closeSiri();
      const now = Date.now();
      if (now - lastUp < 450 && (IOS.state === "home" || IOS.state === "app")) {
        toggleSwitcher();
      } else if (swOpen) toggleSwitcher();
      lastUp = now;
    }, true);
  })();

  /* =============================================================
     Slide to power off (hold the power button)
     ============================================================= */
  const powerUI = h("div", { id: "power-off", class: "hidden" });
  screen.append(powerUI);
  function showPowerOff() {
    powerUI.innerHTML = "";
    const thumb = h("div", "po-thumb", h("span", { class: "gl", style: { width: "20px", height: "20px" }, html: Glyphs.bolt() }));
    const track = h("div", "po-track", thumb, h("div", "po-label", "slide to power off"));
    const cancel = h("button", "po-cancel", "Cancel");
    cancel.addEventListener("click", () => powerUI.classList.add("hidden"));
    powerUI.append(track, cancel);
    powerUI.classList.remove("hidden");
    let x0 = null, cur = 0;
    thumb.addEventListener("pointerdown", e => { x0 = e.clientX; thumb.setPointerCapture(e.pointerId); });
    thumb.addEventListener("pointermove", e => {
      if (x0 === null) return;
      cur = Math.max(0, Math.min(190, e.clientX - x0));
      thumb.style.transform = `translateX(${cur}px)`;
    });
    thumb.addEventListener("pointerup", async () => {
      x0 = null;
      if (cur > 160) {
        powerUI.classList.add("hidden");
        if (NativeBridge.active) {
          const r = await fetch("http://127.0.0.1:9641/power", { method: "POST",
            headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "poweroff" }) })
            .then(x => x.json()).catch(() => null);
          if (r && r.ok) return; // the machine is going away
        }
        // simulated: goodbye spinner then a cold reboot
        const off = h("div", { style: { position: "absolute", inset: 0, background: "#000", zIndex: 400,
          display: "flex", alignItems: "center", justifyContent: "center" } }, h("div", "boot-spinner"));
        screen.append(off);
        setTimeout(() => location.reload(), 1800);
      } else thumb.style.transform = "translateX(0)";
    });
  }
  (() => {
    const pb = $id("power-btn");
    let downAt = 0, longFired = false;
    pb.addEventListener("pointerdown", () => {
      downAt = Date.now(); longFired = false;
      setTimeout(() => {
        if (downAt && Date.now() - downAt >= 900 && !longFired &&
            IOS.state !== "off" && IOS.state !== "boot") { longFired = true; showPowerOff(); }
      }, 920);
    });
    pb.addEventListener("click", e => {
      downAt = 0;
      if (longFired) e.stopImmediatePropagation();
    }, true);
  })();

  /* =============================================================
     Passcode lock
     ============================================================= */
  const _unlock = IOS.unlock.bind(IOS);
  IOS.unlock = () => {
    const code = Prefs.get("passcode", "");
    if (!code) return _unlock();
    askPasscode("Enter Passcode", v => {
      if (v === code) { pcClose(); _unlock(); }
      else { Snd.lockSnd(); pcShake(); }
    });
  };
  let pcEl = null;
  function pcClose() { if (pcEl) { pcEl.remove(); pcEl = null; } }
  function pcShake() {
    const dots = pcEl.querySelector(".pc-dots");
    dots.classList.remove("shake"); void dots.offsetWidth; dots.classList.add("shake");
    pcEl._entry = ""; pcPaint();
  }
  function pcPaint() {
    [...pcEl.querySelectorAll(".pc-dot")].forEach((d, i) => d.classList.toggle("full", i < pcEl._entry.length));
  }
  function askPasscode(title, onDone) {
    pcClose();
    pcEl = h("div", "pc-pad");
    pcEl._entry = "";
    const dots = h("div", "pc-dots", [0, 1, 2, 3].map(() => h("i", "pc-dot")));
    const grid = h("div", "pc-grid");
    "123456789 0⌫".split("").forEach(k => {
      if (k === " ") { grid.append(h("div")); return; }
      const b = h("div", "pc-key", k);
      b.addEventListener("click", () => {
        Snd.key();
        if (k === "⌫") pcEl._entry = pcEl._entry.slice(0, -1);
        else if (pcEl._entry.length < 4) pcEl._entry += k;
        pcPaint();
        if (pcEl._entry.length === 4) setTimeout(() => onDone(pcEl._entry), 120);
      });
      grid.append(b);
    });
    pcEl.append(h("div", "pc-title", title), dots, grid,
      h("button", { class: "po-cancel", onclick: () => { pcClose(); } }, "Cancel"),
      h("button", { class: "pc-emergency", onclick: () => {
        Snd.click();
        showAlert({ title: "Emergency Call", text: "Dial 112 / 911?", buttons: [
          { label: "Cancel" },
          { label: "Call", onTap: () => { pcClose(); IncomingCall.outgoing("Emergency — 112"); } }] });
      } }, "Emergency Call"));
    screen.append(pcEl);
  }
  // Settings hooks into this
  window.PasscodeUI = {
    enable(cb) {
      askPasscode("Set Passcode", first => {
        pcEl._entry = "";
        pcPaint();
        pcEl.querySelector(".pc-title").textContent = "Re-enter Passcode";
        const orig = pcEl;
        askPasscode("Re-enter Passcode", second => {
          if (first === second) { Prefs.set("passcode", first); pcClose(); cb && cb(true); }
          else { pcClose(); showAlert({ title: "Passcodes Did Not Match", text: "Try again." }); cb && cb(false); }
        });
      });
    },
    disable(cb) {
      askPasscode("Enter Passcode to Disable", v => {
        if (v === Prefs.get("passcode", "")) { Prefs.set("passcode", ""); pcClose(); cb && cb(true); }
        else pcShake();
      });
    }
  };

  /* =============================================================
     Spotlight (swipe right from the first page)
     ============================================================= */
  const spot = h("div", { id: "spotlight", class: "hidden" });
  screen.append(spot);
  function openSpotlight() {
    spot.innerHTML = "";
    const results = h("div", "spot-results");
    function search(q) {
      results.innerHTML = "";
      if (!q.trim()) return;
      const ql = q.toLowerCase();
      const add = (ico, label, sub, onTap) => {
        const r = h("div", "spot-row", h("div", { class: "nc-banner-ico", html: ico }),
          h("div", "nc-banner-txt", h("b", null, label), h("span", null, sub)));
        r.addEventListener("click", onTap);
        results.append(r);
      };
      // apps
      ["messages", "phone", "safari", "music", "settings", "notes", "maps", "obsidian", "lazyvim", "steps", "cydia", "terminal",
       "calendar", "photos", "camera", "clock", "calculator", "mail", "weather", "stocks", "appstore"]
        .filter(id => IOS.app(id) && IOS.app(id).name.toLowerCase().includes(ql))
        .forEach(id => add(IOS.app(id).icon(), IOS.app(id).name, "Application", () => { closeSpotlight(); IOS.open(id); }));
      // contacts
      CONTACTS.filter(c => contactName(c).toLowerCase().includes(ql))
        .forEach(c => add(IOS.app("contacts").icon(), contactName(c), c.phone, () => { closeSpotlight(); IOS.open("contacts"); }));
      // notes
      Prefs.get("notes", []).filter(n => (n.title + n.body).toLowerCase().includes(ql))
        .forEach(n => add(IOS.app("notes").icon(), n.title || "Note", "Note", () => { closeSpotlight(); IOS.open("notes"); }));
    }
    const field = kbField("Search iPhone", { returnLabel: "Search", blueReturn: true,
      onChange: search, onReturn: () => KB.close() });
    spot.append(h("div", { class: "searchbar" }, field), results);
    spot.classList.remove("hidden");
    setTimeout(() => KB.open(field), 60);
  }
  function closeSpotlight() { KB.close(); spot.classList.add("hidden"); }
  (() => {
    const home = $id("home");
    let x0 = null;
    home.addEventListener("pointerdown", e => { x0 = e.clientX; });
    home.addEventListener("pointerup", e => {
      const dots = [...document.querySelectorAll("#page-dots i")];
      const onFirst = dots.length && dots[0].classList.contains("on");
      if (x0 !== null && e.clientX - x0 > 70 && onFirst && IOS.state === "home") openSpotlight();
      x0 = null;
    });
    $id("home-btn").addEventListener("click", () => { if (!spot.classList.contains("hidden")) closeSpotlight(); });
  })();

  /* =============================================================
     Alarms that actually fire
     ============================================================= */
  let lastFired = "";
  setInterval(() => {
    const now = fmtTime(new Date());
    if (now === lastFired) return;
    const alarms = Prefs.get("alarms", []);
    const hit = alarms.find(a => a.on && a.time === now);
    if (!hit) return;
    lastFired = now;
    if (IOS.state === "asleep") $id("screen-off").click();
    const ring = setInterval(() => Snd.tri(), 1600);
    Snd.tri();
    const ov = h("div", "alarm-fire",
      h("div", "alarm-time", now),
      h("div", "alarm-label", hit.label || "Alarm"),
      h("button", { class: "big-blue-btn", style: { width: "200px" }, onclick: () => { clearInterval(ring); ov.remove(); } }, "OK"),
      h("button", { class: "po-cancel", onclick: () => {
        clearInterval(ring); ov.remove();
        // snooze: re-arm 9 minutes out
        const d = new Date(Date.now() + 9 * 60000);
        alarms.push({ time: fmtTime(d), label: (hit.label || "Alarm") + " (snoozed)", on: true, ephemeral: true });
        Prefs.set("alarms", alarms);
      } }, "Snooze"));
    screen.append(ov);
    Notify.push("clock", "Alarm", hit.label || now, { silent: true });
  }, 15000);

  /* =============================================================
     Incoming calls & texts
     ============================================================= */
  const IncomingCall = (() => {
    let ringIv = null, ui = null;
    function stop() { clearInterval(ringIv); ringIv = null; if (ui) { ui.remove(); ui = null; } }
    function inCallOverlay(name) {
      const stateEl = h("div", "call-state", "00:00");
      let secs = 0;
      const iv = setInterval(() => {
        secs++;
        stateEl.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
      }, 1000);
      const scr = h("div", { class: "call-screen", style: { zIndex: 320 } },
        h("div", "call-name", name), stateEl,
        h("button", { class: "call-end", style: { marginTop: "60px" }, onclick: () => { clearInterval(iv); scr.remove(); Snd.lockSnd(); } }, "End"));
      screen.append(scr);
    }
    function show(name, number, { native = false, callId = null } = {}) {
      stop();
      if (window.DND && DND.active()) {
        // silenced: straight to the missed-call ledger, screen stays dark
        Notify.push("phone", name || number || "Unknown", "Missed Call · Do Not Disturb");
        typeof PhoneApp !== "undefined" && PhoneApp.addRecent({ name: name || number || "Unknown", time: fmtTime(new Date()), type: "missed" });
        return;
      }
      Snd.ringtone(); ringIv = setInterval(() => Snd.ringtone(), 2600);
      ui = h("div", { class: "call-screen", style: { zIndex: 320 } },
        h("div", "call-name", name || number || "Unknown"),
        h("div", "call-state", native ? "incoming call (modem)" : "incoming call"),
        h("div", { style: { display: "flex", gap: "14px", marginTop: "220px" } },
          h("button", { class: "call-end", style: { width: "126px", margin: 0 }, onclick: () => {
            stop();
            fetchCtl("hangup", callId);
            typeof PhoneApp !== "undefined" && PhoneApp.addRecent({ name: name || number || "Unknown", time: fmtTime(new Date()), type: "missed" });
          } }, "Decline"),
          h("button", { class: "call-end", style: { width: "126px", margin: 0,
            background: "linear-gradient(#b3e389,#529f22)", borderColor: "#2f6b12" }, onclick: () => {
            stop();
            fetchCtl("accept", callId);
            typeof PhoneApp !== "undefined" && PhoneApp.addRecent({ name: name || number || "Unknown", time: fmtTime(new Date()), type: "in" });
            inCallOverlay(name || number);
          } }, "Answer")));
      screen.append(ui);
      Notify.push("phone", "Incoming Call", name || number || "Unknown", { silent: true });
    }
    function fetchCtl(action, callId) {
      if (!callId || !NativeBridge.active) return;
      fetch("http://127.0.0.1:9641/call/" + action, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ call: callId }) }).catch(() => {});
    }
    function outgoing(name) { inCallOverlay(name); }
    return { show, outgoing, stop };
  })();

  function incomingTextSim() {
    const t = THREADS.find(x => x.contact === "zach");
    if (!t) return;
    const msg = { dir: "in", text: "You still owe me a charger btw" };
    t.msgs.push(msg); t.unread = true; t.time = fmtTime(new Date());
    Notify.push("messages", "Zach Wood", msg.text);
  }
  function incomingCallSim() {
    const c = contactById("kate");
    IncomingCall.show(contactName(c), c.phone);
  }
  // one of each per session, when simulating
  setTimeout(() => { if (!NativeBridge.active && IOS.state !== "off" && IOS.state !== "boot") incomingTextSim(); }, 150000);
  setTimeout(() => { if (!NativeBridge.active && IOS.state !== "off" && IOS.state !== "boot") incomingCallSim(); }, 240000);

  // hardware: poll the modem for ringing calls and fresh SMS
  let ringSeen = "";
  setInterval(async () => {
    if (!NativeBridge.active) return;
    const ringing = NativeBridge.get("modem.ringing", null);
    if (ringing && ringing.id !== ringSeen) {
      ringSeen = ringing.id;
      const c = contactByNumber(ringing.number || "");
      IncomingCall.show(c ? contactName(c) : null, ringing.number, { native: true, callId: ringing.id });
    }
    try {
      const r = await fetch("http://127.0.0.1:9641/sms/list").then(x => x.json());
      (r.new || []).forEach(m => {
        const c = contactByNumber(m.number || "");
        const t = c && THREADS.find(x => x.contact === c.id);
        if (t) { t.msgs.push({ dir: "in", text: m.text }); t.unread = true; t.time = fmtTime(new Date()); }
        Notify.push("messages", c ? contactName(c) : (m.number || "Message"), m.text);
      });
    } catch (e) { /* endpoint optional */ }
  }, 8000);

  /* =============================================================
     Auto-lock + battery warnings
     ============================================================= */
  let lastActivity = Date.now();
  ["pointerdown", "keydown"].forEach(ev => screen.addEventListener(ev, () => { lastActivity = Date.now(); }, true));
  setInterval(() => {
    const mins = Prefs.get("autolock", 0);
    if (!mins || IOS.state === "asleep" || IOS.state === "off" || IOS.state === "boot") return;
    if (Date.now() - lastActivity > mins * 60000) $id("power-btn").click();
  }, 20000);

  let battWarned = false;
  setInterval(() => {
    const pct = NativeBridge.get("battery.pct", null);
    if (pct !== null && pct <= 20 && !battWarned) {
      battWarned = true;
      showAlert({ title: "20% Battery Remaining", text: "You can change this warning in no way whatsoever." });
    }
    if (pct !== null && pct > 30) battWarned = false;
  }, 30000);

  /* test hooks (used by the automated test-suite) */
  window.__ios6sim = {
    incomingText: incomingTextSim,
    incomingCall: incomingCallSim,
    notify: (a, t, x) => Notify.push(a, t, x),
    openNC, openSpotlight, toggleSwitcher, showPowerOff, openSiri
  };

  return { Notify, IncomingCall };
})();

const Notify = ShellX.Notify;
const IncomingCall = ShellX.IncomingCall;
