/* ===================================================================
   iOS 6 · Arch Edition — Calendar, Notes, Reminders, Clock,
   Calculator, Settings, Weather, Stocks, Maps
   =================================================================== */
"use strict";

/* =================================================================
   Calendar
   ================================================================= */

IOS.register({
  id: "calendar",
  name: "Calendar",
  icon: Icons.calendar,
  statusbar: "blue",
  render(root) {
    const today = new Date();
    let ym = { y: today.getFullYear(), m: today.getMonth() };
    let selected = today.getDate();

    const titleB = h("b");
    const gridEl = h("div", "cal-grid");
    const evEl = h("div", "cal-events");

    function eventsFor(date) {
      const diff = Math.round((date - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
      return CAL_EVENTS[diff] || [];
    }

    function paint() {
      titleB.textContent = MONTHS[ym.m] + " " + ym.y;
      gridEl.innerHTML = "";
      const first = new Date(ym.y, ym.m, 1);
      const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
      const daysPrev = new Date(ym.y, ym.m, 0).getDate();
      const lead = first.getDay();
      const cells = [];
      for (let i = lead - 1; i >= 0; i--) cells.push({ d: daysPrev - i, dim: true });
      for (let d = 1; d <= daysIn; d++) cells.push({ d, dim: false });
      while (cells.length % 7) cells.push({ d: cells.length % 7, dim: true, trail: true });
      let trail = 0;
      cells.forEach((c, i) => {
        if (c.trail) { trail++; c.d = trail; }
        const date = new Date(ym.y, ym.m, c.dim ? (c.trail ? daysIn + c.d : -(lead - i - 1)) : c.d);
        const isToday = !c.dim && ym.y === today.getFullYear() && ym.m === today.getMonth() && c.d === today.getDate();
        const el = h("div", "cal-day" + (c.dim ? " dim" : "") + (isToday ? " today" : "") +
          (!c.dim && c.d === selected && ym.m === today.getMonth() && ym.y === today.getFullYear() ? "" : ""),
          String(c.d),
          !c.dim && eventsFor(date).length ? h("div", "dot") : null);
        if (!c.dim) el.addEventListener("click", () => {
          Snd.click();
          selected = c.d;
          gridEl.querySelectorAll(".sel").forEach(x => x.classList.remove("sel"));
          el.classList.add("sel");
          paintEvents();
        });
        gridEl.append(el);
      });
      paintEvents();
    }

    function paintEvents() {
      evEl.innerHTML = "";
      const evs = eventsFor(new Date(ym.y, ym.m, selected));
      if (!evs.length) evEl.append(h("div", "empty-msg", "No Events"));
      evs.forEach(e => evEl.append(h("div", "cal-ev",
        h("div", "cal-ev-time", e.time),
        h("div", "cal-ev-name", e.name))));
    }

    const prev = h("span", "cal-arrow", "◀");
    const next = h("span", "cal-arrow", "▶");
    prev.addEventListener("click", () => { Snd.click(); ym.m--; if (ym.m < 0) { ym.m = 11; ym.y--; } paint(); });
    next.addEventListener("click", () => { Snd.click(); ym.m++; if (ym.m > 11) { ym.m = 0; ym.y++; } paint(); });

    root.append(
      navbar("", {
        titleEl: h("div", "cal-month-title", prev, titleB, next),
        left: navBtn("Today", () => { ym = { y: today.getFullYear(), m: today.getMonth() }; selected = today.getDate(); paint(); }),
        right: navBtn("+", () => showAlert({ title: "New Event", text: "Event editing is above this simulation's pay grade." }))
      }),
      h("div", "cal-weekdays", ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => h("div", null, d))),
      gridEl, evEl);
    paint();
  }
});

/* =================================================================
   Notes
   ================================================================= */

IOS.register({
  id: "notes",
  name: "Notes",
  icon: Icons.notes,
  statusbar: "blue",
  rootClass: "notes-root",
  render(root) {
    const nav = new UINav(root);
    let notes = Prefs.get("notes", [
      { title: "shopping", body: "shopping\n- linen texture\n- felt (green)\n- corinthian leather\n- more gradients" },
      { title: "arch on iphone — notes", body: "arch on iphone — notes\n1. boots fine\n2. pacman works\n3. mom unimpressed\n4. worth it" }
    ]);
    const save = () => Prefs.set("notes", notes);

    function listView() {
      const list = h("div", "content list notes-list-paper");
      notes.forEach((n, i) => list.append(cell({
        label: n.title || "New Note",
        chev: true,
        onTap: () => nav.push(noteView(i))
      })));
      if (!notes.length) list.append(h("div", "empty-msg", "No Notes"));
      return navView(
        navbar("Notes", { right: navBtn("+", () => { notes.unshift({ title: "", body: "" }); save(); nav.push(noteView(0)); }) }),
        list);
    }

    function noteView(i) {
      const paper = h("div", { class: "note-paper", contenteditable: "plaintext-only", spellcheck: "false" });
      paper.textContent = notes[i].body;
      const commit = () => {
        notes[i].body = paper.textContent;
        notes[i].title = (paper.textContent.split("\n")[0] || "").slice(0, 30);
        save();
      };
      paper.addEventListener("input", commit);
      return navView(
        navbar(notes[i].title || "New Note", {
          left: backBtn("Notes", () => { commit(); nav.popToRoot(); nav.el.innerHTML = ""; nav.stack = []; nav.push(listView(), false); }),
          right: navBtn("🗑", () => { notes.splice(i, 1); save(); nav.el.innerHTML = ""; nav.stack = []; nav.push(listView(), false); })
        }),
        paper);
    }

    nav.push(listView(), false);
  }
});

/* =================================================================
   Reminders
   ================================================================= */

IOS.register({
  id: "reminders",
  name: "Reminders",
  icon: Icons.reminders,
  statusbar: "blue",
  render(root) {
    let items = Prefs.get("reminders", [
      { text: "Update mirrors (reflector)", done: false },
      { text: "Reply to Natalia about Saturday", done: false },
      { text: "Read the wiki BEFORE posting", done: true },
      { text: "Backup before pacman -Syu", done: false }
    ]);
    const save = () => Prefs.set("reminders", items);

    const paper = h("div", "rem-paper");
    function paint() {
      paper.innerHTML = "";
      items.forEach((it, i) => {
        const chk = h("div", "rem-check", it.done ? "✓" : "");
        chk.addEventListener("click", () => { Snd.click(); it.done = !it.done; save(); paint(); });
        paper.append(h("div", "rem-row", chk, h("div", "rem-text" + (it.done ? " done" : ""), it.text)));
      });
    }
    const field = kbField("New reminder…", {
      returnLabel: "Done", blueReturn: true,
      onReturn: v => {
        if (v.trim()) { items.unshift({ text: v.trim(), done: false }); save(); paint(); }
        KB.close();
      }
    });
    root.append(
      navbar("Reminders", { right: navBtn("Edit", () => {}) }),
      h("div", { style: { padding: "6px 8px", background: "#e8eaee", borderBottom: "1px solid #c5c9d0" } }, field),
      paper);
    paint();
  }
});

/* =================================================================
   Clock
   ================================================================= */

IOS.register({
  id: "clock",
  name: "Clock",
  icon: Icons.clock,
  statusbar: "black",
  rootClass: "clock-root",
  onClose() { this._ivals && this._ivals.forEach(clearInterval); this._ivals = []; },
  render(root) {
    const def = IOS.app("clock");
    def._ivals = def._ivals || [];
    const body = h("div", { class: "content", style: { background: "#26262a", display: "flex", flexDirection: "column" } });
    let active = 0;
    const tabs = [["🌐", "World Clock"], ["⏰", "Alarm"], ["⏱", "Stopwatch"], ["⏳", "Timer"]];
    const tabbar = h("div", "tabbar", tabs.map(([ico, lbl], i) => {
      const t = h("div", "tab" + (i === active ? " on" : ""), h("div", "t-ico", ico), h("div", null, lbl));
      t.addEventListener("click", () => { Snd.click(); active = i; [...tabbar.children].forEach((x, j) => x.classList.toggle("on", j === i)); show(i); });
      return t;
    }));
    root.append(body, tabbar);

    function analogClock(offsetHours, size = 60) {
      const c = h("canvas", { width: size * 2, height: size * 2, style: { width: size + "px", height: size + "px" } });
      const g = c.getContext("2d");
      function draw() {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const d = new Date(utc + offsetHours * 3600000);
        const R = size;
        g.clearRect(0, 0, R * 2, R * 2);
        const night = d.getHours() < 6 || d.getHours() >= 18;
        g.fillStyle = night ? "#111" : "#f4f5f7";
        g.beginPath(); g.arc(R, R, R - 3, 0, 7); g.fill();
        g.strokeStyle = "#666"; g.lineWidth = 3; g.stroke();
        g.strokeStyle = night ? "#fff" : "#111";
        const hand = (frac, len, w) => {
          const a = frac * 2 * Math.PI - Math.PI / 2;
          g.lineWidth = w; g.beginPath(); g.moveTo(R, R);
          g.lineTo(R + Math.cos(a) * len, R + Math.sin(a) * len); g.stroke();
        };
        hand(((d.getHours() % 12) + d.getMinutes() / 60) / 12, R * 0.45, 5);
        hand(d.getMinutes() / 60, R * 0.7, 3);
        g.strokeStyle = "#d33"; hand(d.getSeconds() / 60, R * 0.75, 1.5);
      }
      draw();
      def._ivals.push(setInterval(draw, 1000));
      return c;
    }

    function worldView() {
      const cities = [["Cupertino", -7], ["New York", -4], ["London", 1], ["Berlin", 2], ["Tokyo", 9]];
      cities.forEach(([name, off]) => {
        const dig = h("div", "wc-digital");
        const sub = h("div", "wc-sub");
        function upd() {
          const now = new Date();
          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
          const d = new Date(utc + off * 3600000);
          dig.textContent = fmtTime(d, false);
          const dayDiff = d.getDate() - now.getDate();
          sub.textContent = (dayDiff === 0 ? "Today" : dayDiff > 0 ? "Tomorrow" : "Yesterday") +
            ", " + (off >= 0 ? "+" : "") + off + " HRS (UTC)";
        }
        upd();
        def._ivals.push(setInterval(upd, 1000));
        body.append(h("div", "wc-row", analogClock(off), h("div", "wc-info", h("div", "wc-city", name), sub), dig));
      });
    }

    function alarmView() {
      const alarms = Prefs.get("alarms", [{ time: "6:00 AM", label: "pacman -Syu", on: false }, { time: "9:41 AM", label: "Keynote", on: true }]);
      alarms.forEach((a, i) => {
        body.append(h("div", "wc-row",
          h("div", "wc-info", h("div", "wc-city", a.time), h("div", "wc-sub", a.label)),
          toggle(a.on, v => { alarms[i].on = v; Prefs.set("alarms", alarms); })));
      });
      body.append(h("div", { class: "wc-sub", style: { padding: "14px 16px", color: "#8a8a90" } },
        "Alarms are decorative. The kernel never sleeps anyway."));
    }

    function stopwatchView() {
      let t0 = null, acc = 0, iv = null;
      const face = h("div", "sw-face", "00:00.0");
      const laps = h("div", "sw-laps");
      const fmt = ms => {
        const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, d = Math.floor(ms / 100) % 10;
        return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + "." + d;
      };
      const startBtn = h("button", "sw-btn green", "Start");
      const lapBtn = h("button", "sw-btn", "Lap");
      startBtn.addEventListener("click", () => {
        Snd.click();
        if (iv) {
          acc += Date.now() - t0; clearInterval(iv); iv = null;
          startBtn.textContent = "Start"; startBtn.className = "sw-btn green";
        } else {
          t0 = Date.now();
          iv = setInterval(() => { face.textContent = fmt(acc + Date.now() - t0); }, 100);
          def._ivals.push(iv);
          startBtn.textContent = "Stop"; startBtn.className = "sw-btn red";
        }
      });
      lapBtn.addEventListener("click", () => {
        Snd.click();
        if (iv) laps.prepend(h("div", "wc-row", h("div", "wc-info", "Lap"), h("div", null, face.textContent)));
        else { acc = 0; face.textContent = "00:00.0"; laps.innerHTML = ""; }
      });
      body.append(face, h("div", "sw-btns", lapBtn, startBtn), laps);
    }

    function timerView() {
      let remain = 0, iv = null;
      const face = h("div", "timer-face", "00:00");
      const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      const mins = h("select", null, Array.from({ length: 61 }, (_, i) => h("option", { value: i }, i + " min")));
      mins.value = "5";
      const secs = h("select", null, Array.from({ length: 60 }, (_, i) => h("option", { value: i }, i + " sec")));
      const startBtn = h("button", "sw-btn green", "Start");
      startBtn.addEventListener("click", () => {
        Snd.click();
        if (iv) { clearInterval(iv); iv = null; startBtn.textContent = "Start"; startBtn.className = "sw-btn green"; return; }
        remain = (+mins.value) * 60 + (+secs.value);
        if (!remain) return;
        face.textContent = fmt(remain);
        startBtn.textContent = "Cancel"; startBtn.className = "sw-btn red";
        iv = setInterval(() => {
          remain--;
          face.textContent = fmt(Math.max(0, remain));
          if (remain <= 0) {
            clearInterval(iv); iv = null;
            startBtn.textContent = "Start"; startBtn.className = "sw-btn green";
            Snd.tri();
            showAlert({ title: "Timer Done", text: "Ding! (marimba unavailable, tri-tone provided)" });
          }
        }, 1000);
        def._ivals.push(iv);
      });
      body.append(face, h("div", "timer-set", mins, secs), h("div", "sw-btns", h("div"), startBtn));
    }

    function show(i) {
      def._ivals.forEach(clearInterval); def._ivals = [];
      body.innerHTML = "";
      [worldView, alarmView, stopwatchView, timerView][i]();
    }
    show(0);
  }
});

/* =================================================================
   Calculator
   ================================================================= */

IOS.register({
  id: "calculator",
  name: "Calculator",
  icon: Icons.calculator,
  statusbar: "black",
  rootClass: "calc-root",
  render(root) {
    let display = "0", acc = null, op = null, fresh = true;
    const disp = h("div", "calc-display", "0");
    const upd = () => {
      let out = display;
      if (out.replace(/[-.]/g, "").length > 9) out = parseFloat(out).toExponential(4);
      disp.textContent = out;
      disp.style.fontSize = out.length > 7 ? (out.length > 10 ? "30px" : "40px") : "52px";
    };
    const calc = () => {
      const b = parseFloat(display), a = acc;
      if (op === "+") return a + b;
      if (op === "−") return a - b;
      if (op === "×") return a * b;
      if (op === "÷") return b === 0 ? NaN : a / b;
      return b;
    };
    const grid = h("div", "calc-grid");
    const keys = [
      ["C", "dark"], ["±", "dark"], ["%", "dark"], ["÷", "op"],
      ["7", ""], ["8", ""], ["9", ""], ["×", "op"],
      ["4", ""], ["5", ""], ["6", ""], ["−", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["+", "op"],
      ["0", "zero"], [".", ""], ["=", "op"]
    ];
    keys.forEach(([k, cls]) => {
      const b = h("button", "calc-btn " + cls, k);
      b.addEventListener("click", () => {
        Snd.key();
        if (/\d/.test(k)) {
          display = fresh || display === "0" ? k : display + k;
          fresh = false;
        } else if (k === ".") {
          if (fresh) { display = "0."; fresh = false; }
          else if (!display.includes(".")) display += ".";
        } else if (k === "C") {
          display = "0"; acc = null; op = null; fresh = true;
          grid.querySelectorAll(".hl").forEach(x => x.classList.remove("hl"));
        } else if (k === "±") {
          display = display.startsWith("-") ? display.slice(1) : (display === "0" ? display : "-" + display);
        } else if (k === "%") {
          display = String(parseFloat(display) / 100);
        } else if (k === "=") {
          if (op !== null) { display = String(calc()); acc = null; op = null; }
          fresh = true;
          grid.querySelectorAll(".hl").forEach(x => x.classList.remove("hl"));
        } else { // operator
          if (op !== null && !fresh) { display = String(calc()); }
          acc = parseFloat(display);
          op = k; fresh = true;
          grid.querySelectorAll(".hl").forEach(x => x.classList.remove("hl"));
          b.classList.add("hl");
        }
        upd();
      });
      grid.append(b);
    });
    root.append(disp, grid);
  }
});

/* =================================================================
   Settings
   ================================================================= */

IOS.register({
  id: "settings",
  name: "Settings",
  icon: Icons.settings,
  statusbar: "blue",
  render(root) {
    const nav = new UINav(root);

    const sub = (title, builder) => () => {
      const view = navView(
        navbar(title, { left: backBtn("Settings", () => nav.pop()) }),
        builder());
      nav.push(view);
    };

    const aboutView = sub("About", () => h("div", "content grouped",
      h("div", "about-logo", ""),
      group(
        cell({ label: "Name", value: "arch-iphone", cls: "static" }),
        cell({ label: "Songs", value: "1", cls: "static" }),
        cell({ label: "Photos", value: String(PhotoStore.count()), cls: "static" }),
        cell({ label: "Applications", value: "26", cls: "static" })),
      group(
        cell({ label: "Version", value: "iOS 6.1.3 (10B329)", cls: "static" }),
        cell({ label: "Kernel", value: "Linux 6.9.7-arch1-1", cls: "static" }),
        cell({ label: "Init", value: "systemd 255 (sorry)", cls: "static" }),
        cell({ label: "Package Manager", value: "pacman 6.1", cls: "static" }),
        cell({ label: "Model", value: "ARCH1,6", cls: "static" }),
        cell({ label: "Serial Number", value: "BTW1USEARCH2", cls: "static" })),
      group(
        cell({ label: "Legal", chev: true, onTap: () => showAlert({ title: "Legal", text: "This is a loving fan recreation. Apple, iOS and iPhone are trademarks of Apple Inc. Arch Linux is a trademark of the Arch Linux project. No kernels were harmed." }) })),
      h("div", "group-foot", "Darwin was politely asked to leave.")));

    const softwareUpdate = sub("Software Update", () => h("div", "content grouped",
      group(cell({ label: "iOS 6.1.3", sub: "Your software is up to date.", cls: "static" })),
      h("div", "group-foot", "pacman -Syu reports: nothing to do")));

    const generalView = sub("General", () => h("div", "content grouped",
      group(
        cell({ label: "About", chev: true, onTap: aboutView }),
        cell({ label: "Software Update", chev: true, onTap: softwareUpdate })),
      group(
        cell({ label: "Auto-Lock", value: "Never", chev: true, onTap: () => {} }),
        cell({ label: "Passcode Lock", value: "Off", chev: true, onTap: () => {} }),
        cell({ label: "Keyboard", chev: true, onTap: () => showAlert({ title: "Keyboard", text: "Layout: on-screen QWERTY.\nYour physical keyboard also works — the future is now." }) })),
      group(
        cell({ label: "Reset", chev: true, onTap: () => showSheet([
          { label: "Erase All Content and Settings", style: "destructive", onTap: () => {
              try { Object.keys(localStorage).filter(k => k.startsWith("ios6.")).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
              showAlert({ title: "Reset Complete", text: "Notes, reminders and settings have been wiped. The Arch install survives everything." });
            } },
          { label: "Cancel", style: "cancel" }]) }))));

    const wifiView = sub("Wi-Fi", () => {
      const nets = [["archnet-5G", true], ["Linksys", false], ["FBI Surveillance Van 4", false], ["eduroam (traumatic)", false]];
      return h("div", "content grouped",
        group(cell({ label: "Wi-Fi", right: toggle(Prefs.get("wifi", true), v => { Prefs.set("wifi", v); IOS.refreshSignal(); }), cls: "static" })),
        h("div", "group-label", "Choose a Network…"),
        group(nets.map(([name, sel]) => cell({
          label: name,
          value: sel ? "✓" : "",
          right: h("span", { style: { fontSize: "13px" } }, "🔒 📶"),
          onTap: () => showAlert({ title: name, text: "Connected. (All networks lead to localhost.)" })
        }))));
    });

    const wallpaperView = sub("Brightness & Wallpaper", () => {
      const cur = Prefs.get("wallpaper", "wp-water");
      const thumbs = [["wp-water", "Water"], ["wp-linen", "Linen"], ["wp-rays", "Purple"], ["wp-green", "Felt"]];
      return h("div", "content grouped",
        h("div", "group-label", "Brightness"),
        group(h("div", { class: "cell static", style: { padding: "8px 12px" } },
          slider(Prefs.get("brightness", 100), v => { Prefs.set("brightness", v); IOS.applyBrightness(); }))),
        h("div", "group-label", "Wallpaper"),
        group(h("div", "wp-row", thumbs.map(([cls, label]) => {
          const t = h("div", { class: "wp-thumb " + cls + (cur === cls ? " sel" : ""), title: label });
          t.addEventListener("click", () => {
            Snd.click();
            Prefs.set("wallpaper", cls);
            IOS.applyWallpaper();
            t.parentElement.querySelectorAll(".sel").forEach(x => x.classList.remove("sel"));
            t.classList.add("sel");
          });
          return t;
        }))));
    });

    const soundsView = sub("Sounds", () => h("div", "content grouped",
      group(
        cell({ label: "Ringtone", value: "Marimba", chev: true, onTap: () => Snd.tri() }),
        cell({ label: "Text Tone", value: "Tri-tone", chev: true, onTap: () => Snd.received() }),
        cell({ label: "Keyboard Clicks", right: toggle(true, () => {}), cls: "static" }))));

    const messagesView = sub("Messages", () => h("div", "content grouped",
      group(cell({ label: "iMessage", right: toggle(true, () => {}), cls: "static" })),
      h("div", "group-foot", "iMessages can be sent between iPhone, iPad, iPod touch and, apparently, Arch Linux."),
      group(
        cell({ label: "Send Read Receipts", right: toggle(false, () => {}), cls: "static" }),
        cell({ label: "Send as SMS", right: toggle(true, () => {}), cls: "static" }))));

    const main = navView(
      navbar("Settings"),
      h("div", "content grouped",
        group(
          cell({ label: "Airplane Mode", ico: "✈", icoBg: "#f5871f",
                 right: toggle(Prefs.get("airplane", false), v => { Prefs.set("airplane", v); IOS.refreshSignal(); }), cls: "static" }),
          cell({ label: "Wi-Fi", ico: "📶", icoBg: "#3a7ad8", value: Prefs.get("wifi", true) ? "archnet-5G" : "Off", chev: true, onTap: wifiView }),
          cell({ label: "Bluetooth", ico: "ᛒ", icoBg: "#2255c8", value: "Off", chev: true, onTap: () => {} }),
          cell({ label: "Do Not Disturb", ico: "🌙", icoBg: "#5a3aa8", right: toggle(false, () => {}), cls: "static" })),
        group(
          cell({ label: "Notifications", ico: "🔔", icoBg: "#d0342a", chev: true, onTap: () => {} }),
          cell({ label: "General", ico: "⚙", icoBg: "#8b93a1", chev: true, onTap: generalView }),
          cell({ label: "Sounds", ico: "🔊", icoBg: "#d63a7e", chev: true, onTap: soundsView }),
          cell({ label: "Brightness & Wallpaper", ico: "☀", icoBg: "#3a7ad8", chev: true, onTap: wallpaperView }),
          cell({ label: "Privacy", ico: "✋", icoBg: "#3a5ad8", chev: true, onTap: () => showAlert({ title: "Privacy", text: "This phone runs entirely in your browser tab. Nothing leaves it. Even the NSA is bored." }) })),
        group(
          cell({ label: "iCloud", ico: "☁", icoBg: "#4aa8e0", value: "off (self-hosted)", chev: true, onTap: () => {} }),
          cell({ label: "Messages", ico: "💬", icoBg: "#4fc72d", chev: true, onTap: messagesView }),
          cell({ label: "Phone", ico: "📞", icoBg: "#4fbb2f", value: "(555) 019-4141", chev: true, onTap: () => {} }),
          cell({ label: "Safari", ico: "🧭", icoBg: "#3f8fdd", chev: true, onTap: () => {} })),
        h("div", "group-foot", "iOS 6.1.3 · Linux 6.9.7-arch1-1 · btw")));
    nav.push(main, false);
  }
});

/* =================================================================
   Weather
   ================================================================= */

IOS.register({
  id: "weather",
  name: "Weather",
  icon: Icons.weather,
  statusbar: "black",
  rootClass: "weather-root",
  render(root) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date().getDay();
    const fx = [["☀", 75, 58], ["⛅", 72, 57], ["☀", 78, 60], ["🌧", 66, 55], ["⛈", 64, 54], ["⛅", 70, 56]];
    root.classList.add("weather-root");
    root.append(
      h("div", "wx-city", "Cupertino"),
      h("div", "wx-cond", "Sunny"),
      h("div", "wx-now", h("span", "wx-icon-big", "☀"), h("span", "wx-big", "73°")),
      h("div", "wx-hl", "H: 75°  L: 58°"),
      h("div", "wx-week", fx.map(([ico, hi, lo], i) =>
        h("div", "wx-row",
          h("span", "d", i === 0 ? "Today" : days[(today + i) % 7]),
          h("span", null, ico),
          h("span", null, hi + "°"),
          h("span", "lo", lo + "°")))),
      h("div", "wx-foot", "Updated " + fmtTime(new Date()) + " — forecast lovingly hard-coded"));
  }
});

/* =================================================================
   Stocks
   ================================================================= */

IOS.register({
  id: "stocks",
  name: "Stocks",
  icon: Icons.stocks,
  statusbar: "black",
  rootClass: "stocks-root",
  onClose() { clearInterval(this._iv); },
  render(root) {
    const def = IOS.app("stocks");
    const rows = h("div", { class: "content", style: { background: "transparent", flex: "0 0 auto" } });
    const canvas = h("canvas", { width: 600, height: 220 });
    let selected = 0;

    function paintRows() {
      rows.innerHTML = "";
      STOCKS.forEach((s, i) => {
        const r = h("div", "stk-row",
          h("div", "stk-sym", h("b", null, s.sym), h("span", null, s.name)),
          h("div", "stk-price", s.price.toFixed(2)),
          h("div", "stk-chg " + (s.chg >= 0 ? "up" : "down"), (s.chg >= 0 ? "+" : "") + s.chg.toFixed(2)));
        r.addEventListener("click", () => { Snd.click(); selected = i; paintChart(); });
        rows.append(r);
      });
    }

    function paintChart() {
      const g = canvas.getContext("2d");
      const s = STOCKS[selected];
      g.clearRect(0, 0, 600, 220);
      g.strokeStyle = "#2c2c34";
      for (let y = 30; y < 220; y += 45) { g.beginPath(); g.moveTo(0, y); g.lineTo(600, y); g.stroke(); }
      let seed = s.sym.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      const pts = [];
      let v = 110;
      for (let i = 0; i <= 60; i++) { v += (rnd() - (s.chg >= 0 ? 0.42 : 0.58)) * 14; v = Math.max(30, Math.min(190, v)); pts.push(v); }
      g.beginPath();
      pts.forEach((p, i) => { const x = i * 10, y = p; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.strokeStyle = s.chg >= 0 ? "#57c93f" : "#e0574b";
      g.lineWidth = 3; g.stroke();
      g.lineTo(600, 220); g.lineTo(0, 220); g.closePath();
      g.fillStyle = s.chg >= 0 ? "rgba(87,201,63,.13)" : "rgba(224,87,75,.13)";
      g.fill();
      g.fillStyle = "#9aa"; g.font = "bold 22px Helvetica";
      g.fillText(s.sym + "  ·  1d", 12, 26);
    }

    def._iv = setInterval(() => {
      STOCKS.forEach(s => {
        const d = (Math.random() - 0.5) * 0.6;
        s.price = Math.max(1, s.price + d);
        s.chg += d;
      });
      paintRows();
    }, 4000);

    root.append(
      navbar("Stocks", { dark: true, right: navBtn("ⓘ", () => showAlert({ title: "Stocks", text: "Quotes are randomly generated and 20 minutes into the future." })) }),
      rows,
      h("div", "stk-chart-wrap", canvas),
      h("div", "stk-foot", "Market data may be fictional. LNX up forever."));
    paintRows();
    paintChart();
  }
});

/* =================================================================
   Maps
   ================================================================= */

IOS.register({
  id: "maps",
  name: "Maps",
  icon: Icons.maps,
  statusbar: "black",
  rootClass: "maps-root",
  render(root) {
    const W = 320, H = 380;

    // stylised street grid, gently rotated — very 2012
    let streets = "";
    const names = ["E 26TH ST", "E 23RD ST", "E 22ND ST", "E 20TH ST", "E 19TH ST", "E 14TH ST"];
    for (let i = 0; i < 12; i++) {
      const y = -40 + i * 46;
      streets += `<g transform="rotate(-18 160 240)">
        <line x1="-80" y1="${y}" x2="420" y2="${y}" stroke="#ffffff" stroke-width="${i % 3 === 0 ? 13 : 8}"/>
        ${i % 2 === 0 && names[i / 2] ? `<text x="30" y="${y - 6}" font-size="11" fill="#8d8672" font-family="Helvetica" font-weight="bold" letter-spacing="1">${names[i / 2]}</text>` : ""}
      </g>`;
    }
    for (let i = 0; i < 8; i++) {
      const x = -40 + i * 62;
      streets += `<g transform="rotate(-18 160 240)">
        <line x1="${x}" y1="-80" x2="${x}" y2="520" stroke="#ffffff" stroke-width="${i === 3 ? 14 : 7}"/>
      </g>`;
    }
    const svg = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#f2ecdb"/>
        <g transform="rotate(-18 160 240)">
          <rect x="60" y="40" width="90" height="70" fill="#b5d98a"/>
          <rect x="200" y="200" width="70" height="55" fill="#b5d98a"/>
          <rect x="30" y="280" width="80" height="60" fill="#b5d98a"/>
          <rect x="230" y="90" width="50" height="40" fill="#e8c9d8"/>
        </g>
        ${streets}
        <g transform="rotate(-18 160 240)">
          <text x="40" y="330" font-size="14" fill="#b9b29b" font-family="Helvetica" letter-spacing="4">UNION SQAURE</text>
          <text x="205" y="150" font-size="12" fill="#b9b29b" font-family="Helvetica" letter-spacing="3">GRAMERCY</text>
        </g>
        <g transform="rotate(72 175 205)">
          <text x="150" y="210" font-size="11" fill="#8d8672" font-family="Helvetica" font-weight="bold" letter-spacing="1">PARK AVE</text>
        </g>`;
    const pinSvg = `<svg viewBox="0 0 20 30" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 1 C15 1 18 4.5 18 8.5 C18 13 12 18 10 28 C8 18 2 13 2 8.5 C2 4.5 5 1 10 1 z" fill="#d2402e" stroke="#7e1d12"/>
        <circle cx="10" cy="8" r="3" fill="#f0b0a5"/></svg>`;

    const map = h("div", "maps-canvas", h("div", { html: svg + "</svg>" }));
    const dot = h("div", { class: "maps-dot", style: { left: "175px", top: "205px" } });
    map.append(dot, h("div", "maps-curl"));

    let banner = null;
    const dirBtn = h("span", "tb-ico", "⤴");
    dirBtn.addEventListener("click", () => {
      Snd.click();
      if (banner) { banner.remove(); banner = null; return; }
      banner = h("div", "maps-banner",
        h("div", "mb-arrow", "⬆"),
        h("div", null,
          h("div", "mb-dist", "0.3 miles"),
          h("div", "mb-instr", "TURN RIGHT ONTO 5TH AVE")));
      map.append(banner);
    });

    const locBtn = h("button", "maps-loc-btn", "➤");
    locBtn.addEventListener("click", () => { Snd.click(); dot.style.left = "175px"; dot.style.top = "205px"; });

    map.addEventListener("click", e => {
      if (e.target.closest(".maps-loc-btn") || e.target.closest(".maps-banner")) return;
      const r = map.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      map.querySelectorAll(".maps-pin").forEach(p => p.remove());
      const pin = h("div", { class: "maps-pin", style: { left: x + "px", top: y + "px" }, html: pinSvg });
      map.append(pin);
      Snd.click();
    });
    map.append(locBtn);

    const search = kbField("Search or Address", {
      returnLabel: "Search", blueReturn: true,
      onReturn: v => {
        KB.close();
        if (!v.trim()) return;
        map.querySelectorAll(".maps-pin").forEach(p => p.remove());
        const x = 60 + Math.random() * 200, y = 60 + Math.random() * 240;
        map.append(h("div", { class: "maps-pin", style: { left: x + "px", top: y + "px" }, html: pinSvg }));
        showAlert({ title: v.trim(), text: "Found it! Confidence: iOS 6 Maps levels." });
      }
    });

    root.append(
      h("div", { class: "searchbar", style: { display: "flex", gap: "6px" } },
        h("span", { style: { color: "#fff", fontSize: "18px", alignSelf: "center" } }, "↱"), search),
      map,
      h("div", "toolbar",
        h("span", "tb-ico", "➤"), dirBtn, h("span", "tb-ico", "🔖"), h("span", "tb-ico", "📄")));
  }
});
