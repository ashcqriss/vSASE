/* ===================================================================
   iOS 6 · Arch Edition — SpringBoard, window server & UI toolkit
   =================================================================== */
"use strict";

/* ---------------- tiny hyperscript ---------------- */

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (typeof attrs === "string") e.className = attrs;
  else if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") e.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v);
    }
  }
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}
const $id = id => document.getElementById(id);

/* inline glyph element — a sized wrapper around a Glyphs.* SVG */
function gl(name, size = 16) {
  return h("span", { class: "gl", html: Glyphs[name](), style: { width: size + "px", height: size + "px" } });
}

/* ---------------- time helpers ---------------- */

function fmtTime(d, withAmPm = true) {
  let hr = d.getHours() % 12; if (hr === 0) hr = 12;
  const mn = String(d.getMinutes()).padStart(2, "0");
  return hr + ":" + mn + (withAmPm ? " " + (d.getHours() < 12 ? "AM" : "PM") : "");
}
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];

/* ---------------- shared widgets ---------------- */

function navBtn(label, onTap, cls = "") {
  return h("button", { class: "nav-btn " + cls, onclick: e => { e.stopPropagation(); Snd.click(); onTap && onTap(); } }, label);
}
function backBtn(label, onTap) { return navBtn(label, onTap, "back"); }
function navbar(title, { left, right, dark, titleEl } = {}) {
  return h("div", "navbar" + (dark ? " dark" : ""),
    h("div", "nav-title", titleEl || title || ""),
    left ? h("div", "nav-left", left) : null,
    right ? h("div", "nav-right", right) : null);
}

function cell(opts) {
  const { label, value, chev, onTap, ico, icoBg, sub, right, cls } = opts;
  const c = h("div", "cell" + (onTap ? "" : " static") + (cls ? " " + cls : ""),
    ico ? h("div", { class: "c-ico", style: { background: icoBg || "#8b93a1" }, html: ico }) : null,
    h("div", "c-label", label, sub ? h("span", "c-sub", sub) : null),
    value != null ? h("div", "c-value", value) : null,
    right || null,
    chev ? h("div", "c-chev", "›") : null);
  if (onTap) c.addEventListener("click", () => { Snd.click(); onTap(); });
  return c;
}
function group(...cells) { return h("div", "group", cells); }

function toggle(initial, onChange) {
  const t = h("div", "toggle" + (initial ? " on" : ""),
    h("div", "tg-inner",
      h("div", "tg-on", "ON"),
      h("div", "tg-knob"),
      h("div", "tg-off", "OFF")));
  t.addEventListener("click", e => {
    e.stopPropagation();
    Snd.click();
    t.classList.toggle("on");
    onChange && onChange(t.classList.contains("on"));
  });
  return t;
}

function seg(options, initial, onChange) {
  const wrap = h("div", "seg");
  options.forEach((label, i) => {
    const b = h("button", { class: i === initial ? "on" : "" }, label);
    b.addEventListener("click", () => {
      Snd.click();
      [...wrap.children].forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      onChange && onChange(i);
    });
    wrap.append(b);
  });
  return wrap;
}

function slider(value, onInput) {
  const input = h("input", { type: "range", min: 0, max: 100, value });
  input.addEventListener("input", () => onInput && onInput(+input.value));
  return h("div", "ios-slider", input);
}

function showAlert({ title, text, buttons }) {
  const wrap = h("div", "alert-wrap");
  const btns = (buttons || [{ label: "OK" }]).map(b =>
    h("button", { onclick: () => { wrap.remove(); Snd.click(); b.onTap && b.onTap(); } }, b.label));
  wrap.append(h("div", "alert", h("h3", null, title), text ? h("p", null, text) : null, h("div", "alert-btns", btns)));
  $id("screen").append(wrap);
  return wrap;
}

function showSheet(buttons) {
  const wrap = h("div", "sheet-wrap");
  const close = () => wrap.remove();
  wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
  wrap.append(h("div", "sheet", buttons.map(b =>
    h("button", { class: b.style || "", onclick: () => { Snd.click(); close(); b.onTap && b.onTap(); } }, b.label))));
  $id("screen").append(wrap);
  return wrap;
}

/* ---------------- navigation stack ---------------- */

class UINav {
  constructor(parent) {
    this.el = h("div", "nav-stack");
    this.stack = [];
    parent.append(this.el);
  }
  push(viewEl, animated = true) {
    if (animated && this.stack.length) viewEl.classList.add("slide-in");
    this.stack.push(viewEl);
    this.el.append(viewEl);
  }
  pop() {
    if (this.stack.length < 2) return;
    KB.close();
    const top = this.stack.pop();
    top.classList.remove("slide-in");
    top.classList.add("slide-out");
    setTimeout(() => top.remove(), 260);
  }
  popToRoot() { while (this.stack.length > 1) { const t = this.stack.pop(); t.remove(); } }
}
function navView(...kids) { return h("div", "nav-view", kids); }

/* ---------------- on-screen keyboard ---------------- */

const KB = (() => {
  const kb = $id("keyboard");
  let field = null;      // active kb-field element
  let shift = true;
  let mode = "abc";      // abc | num

  const ROWS_ABC = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const ROWS_NUM = ["1234567890", "-/:;()$&@\"", ".,?!'"];

  function insert(ch) {
    if (!field) return;
    setValue(field._value + ch);
    if (shift && mode === "abc") { shift = false; render(); }
  }
  function backspace() { if (field) setValue(field._value.slice(0, -1)); }
  function setValue(v) {
    field._value = v;
    field._renderValue();
    field._onChange && field._onChange(v);
  }

  function key(label, cls, onTap) {
    const k = h("button", "kb-key " + (cls || ""), label);
    k.addEventListener("pointerdown", e => { e.preventDefault(); });
    k.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); Snd.key(); onTap(); });
    return k;
  }

  function render() {
    kb.innerHTML = "";
    const rows = mode === "abc" ? ROWS_ABC : ROWS_NUM;
    rows.forEach((row, ri) => {
      const r = h("div", "kb-row");
      if (ri === 2 && mode === "abc")
        r.append(key("⇧", "wide shift" + (shift ? " on" : ""), () => { shift = !shift; render(); }));
      if (ri === 2 && mode === "num")
        r.append(key("#+=", "wide", () => {}));
      for (const ch of row) {
        const shown = mode === "abc" ? ch.toUpperCase() : ch;
        r.append(key(shown, "", () => insert(mode === "abc" ? (shift ? ch.toUpperCase() : ch) : ch)));
      }
      if (ri === 2) r.append(key("⌫", "wide", backspace));
      kb.append(r);
    });
    const last = h("div", "kb-row");
    last.append(key(mode === "abc" ? "123" : "ABC", "wide", () => { mode = mode === "abc" ? "num" : "abc"; render(); }));
    last.append(key("space", "space", () => insert(" ")));
    const retLabel = (field && field._returnLabel) || "return";
    last.append(key(retLabel, "return" + (field && field._blueReturn ? " blue" : ""), () => {
      if (field && field._onReturn) field._onReturn(field._value);
    }));
    kb.append(last);
  }

  function hwKeys(e) {
    if (kb.classList.contains("hidden") || !field) return;
    if (e.key === "Backspace") { e.preventDefault(); backspace(); }
    else if (e.key === "Enter") { e.preventDefault(); field._onReturn && field._onReturn(field._value); }
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); insert(e.key); }
  }
  document.addEventListener("keydown", hwKeys);

  return {
    open(f) {
      if (field && field !== f) field.classList.remove("focus");
      field = f;
      field.classList.add("focus");
      shift = field._value.length === 0;
      mode = "abc";
      render();
      kb.classList.remove("hidden");
      $id("screen").classList.add("kb-open");
    },
    close() {
      if (field) field.classList.remove("focus");
      field = null;
      kb.classList.add("hidden");
      $id("screen").classList.remove("kb-open");
    },
    get visible() { return !kb.classList.contains("hidden"); },
    get field() { return field; }
  };
})();

/* a fake text field driven by the on-screen keyboard */
function kbField(placeholder, opts = {}) {
  const f = h("div", "kb-field" + (opts.cls ? " " + opts.cls : ""));
  f._value = opts.value || "";
  f._onChange = opts.onChange || null;
  f._onReturn = opts.onReturn || null;
  f._returnLabel = opts.returnLabel || "return";
  f._blueReturn = !!opts.blueReturn;
  f._renderValue = () => {
    f.innerHTML = "";
    if (f._value) f.append(document.createTextNode(f._value));
    else if (!f.classList.contains("focus")) f.append(h("span", "ph", placeholder || ""));
    else f.append(h("span", "ph", ""));
    f.append(h("span", "caret"));
  };
  Object.defineProperty(f, "value", {
    get: () => f._value,
    set: v => { f._value = v; f._renderValue(); }
  });
  f.addEventListener("click", e => { e.stopPropagation(); KB.open(f); f._renderValue(); });
  f._renderValue();
  return f;
}

/* ---------------- the OS ---------------- */

const IOS = (() => {
  const apps = {};
  let currentApp = null;
  let state = "off"; // off | boot | locked | home | app | asleep
  let page = 0;

  const screen = $id("screen"), home = $id("home"), appLayer = $id("app"),
        lock = $id("lock"), statusbar = $id("statusbar"), wallpaper = $id("wallpaper");

  const HOME_PAGES = [
    ["messages", "calendar", "photos", "camera", "videos", "weather", "passbook", "notes",
     "reminders", "clock", "maps", "stocks", "newsstand", "itunes", "appstore", "gamecenter"],
    ["settings", "contacts", "calculator", "compass", "voicememos", "terminal", "cydia"]
  ];
  const DOCK = ["phone", "mail", "safari", "music"];
  let editMode = false; // wiggle mode: long-press an icon, ✕ removes installed apps

  function currentPages() {
    const pages = HOME_PAGES.map(p => [...p]);
    const extra = (typeof AppMarket !== "undefined")
      ? AppMarket.installed().filter(id => apps[id]) : [];
    for (const id of extra) {
      if (pages[pages.length - 1].length >= 16) pages.push([]);
      pages[pages.length - 1].push(id);
    }
    return pages;
  }

  /* ---- status bar ---- */
  function setTint(t) {
    statusbar.classList.remove("sb-black", "sb-blue", "sb-trans");
    statusbar.classList.add("sb-" + (t || "black"));
  }
  function refreshSignal() {
    const airplane = Prefs.get("airplane", false);
    const wifi = Prefs.get("wifi", true);
    const carrier = statusbar.querySelector(".sb-carrier");
    if (airplane) carrier.innerHTML = Glyphs.plane();
    else carrier.textContent = Prefs.get("carrier", "arch");
    statusbar.querySelector(".sb-signal").classList.toggle("off", airplane);
    statusbar.querySelector(".sb-wifi").style.visibility = (wifi && !airplane) ? "visible" : "hidden";
  }
  function tick() {
    const now = new Date();
    statusbar.querySelector(".sb-time").textContent = fmtTime(now);
    lock.querySelector(".lock-time").textContent = fmtTime(now, false);
    lock.querySelector(".lock-date").textContent =
      WEEKDAYS[now.getDay()] + ", " + MONTHS[now.getMonth()] + " " + now.getDate();
  }
  setInterval(tick, 1000);

  /* ---- wallpaper & brightness ---- */
  function applyWallpaper() {
    wallpaper.className = Prefs.get("wallpaper", "wp-water");
  }
  function applyBrightness() {
    $id("dimmer").style.opacity = (1 - Prefs.get("brightness", 100) / 100) * 0.75;
  }

  /* ---- springboard ---- */
  function iconEl(id) {
    const def = apps[id];
    if (!def) return null;
    const badge = def.badge ? def.badge() : 0;
    const glyph = h("div", { class: "glyph", html: def.icon() });
    // artwork override: if icons/<id>.png exists it replaces the built-in SVG
    // (drop real iOS 6 icon art — e.g. from an OldOS checkout — into icons/)
    const art = new Image();
    art.onload = () => { glyph.innerHTML = ""; glyph.append(art); };
    art.src = "icons/" + id + ".png";
    const removable = editMode && def.removable;
    const e = h("div", { class: "sb-icon" + (editMode ? " wiggling" : ""), "data-app": id },
      h("div", "glyph-wrap",
        glyph,
        badge && !editMode ? h("div", "sb-badge", String(badge)) : null,
        removable ? h("div", { class: "sb-remove", onclick: ev => {
          ev.stopPropagation();
          AppMarket.uninstall(id);
          buildHome();
        } }, "✕") : null),
      h("div", "label", def.name));
    e.addEventListener("click", () => { if (!editMode) open(id); });
    // long-press enters wiggle mode
    let lp = null;
    e.addEventListener("pointerdown", () => {
      if (editMode) return;
      lp = setTimeout(() => { editMode = true; Snd.click(); buildHome(); }, 650);
    });
    const cancelLp = () => { if (lp) { clearTimeout(lp); lp = null; } };
    e.addEventListener("pointerup", cancelLp);
    e.addEventListener("pointerleave", cancelLp);
    e.addEventListener("pointermove", cancelLp); // a drag is a swipe, not a hold
    return e;
  }

  function buildHome() {
    const layout = currentPages();
    if (page >= layout.length) page = layout.length - 1;
    const pages = $id("pages");
    pages.innerHTML = "";
    layout.forEach(ids => pages.append(h("div", "page", ids.map(iconEl))));
    pages.classList.toggle("editing", editMode);
    const dock = $id("dock-icons");
    dock.innerHTML = "";
    DOCK.forEach(id => dock.append(iconEl(id)));
    const dots = $id("page-dots");
    dots.innerHTML = "";
    layout.forEach((_, i) => dots.append(h("i", i === page ? "on" : "")));
    snapPage(false);
  }

  function snapPage(animate = true) {
    const pages = $id("pages");
    pages.style.transition = animate ? "" : "none";
    pages.style.transform = `translateX(${-page * 320}px)`;
    if (!animate) requestAnimationFrame(() => { pages.style.transition = ""; });
    [...$id("page-dots").children].forEach((d, i) => d.classList.toggle("on", i === page));
  }

  // swipe pages
  (() => {
    const pages = $id("pages");
    let x0 = null, dx = 0, swiped = false;
    // a swipe must not count as a tap on whatever icon ends up under the pointer
    pages.addEventListener("click", e => {
      if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; }
    }, true);
    pages.addEventListener("pointerdown", e => { x0 = e.clientX; dx = 0; swiped = false; });
    pages.addEventListener("pointermove", e => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      if (Math.abs(dx) > 8) {
        pages.style.transition = "none";
        pages.style.transform = `translateX(${-page * 320 + dx}px)`;
      }
    });
    const end = () => {
      if (x0 === null) return;
      swiped = Math.abs(dx) > 10;
      pages.style.transition = "";
      if (dx < -50 && page < HOME_PAGES.length - 1) page++;
      else if (dx > 50 && page > 0) page--;
      snapPage();
      x0 = null;
    };
    pages.addEventListener("pointerup", end);
    pages.addEventListener("pointerleave", end);
  })();

  /* ---- app lifecycle ---- */
  function open(id) {
    const def = apps[id];
    if (!def) return;
    Snd.click();
    currentApp = def;
    appLayer.innerHTML = "";
    const root = h("div", "app-root" + (def.rootClass ? " " + def.rootClass : ""));
    appLayer.append(root);
    setTint(def.statusbar || "black");
    appLayer.classList.remove("hidden", "closing");
    appLayer.classList.add("opening");
    setTimeout(() => appLayer.classList.remove("opening"), 300);
    home.classList.add("hidden");
    state = "app";
    def.render(root);
    if (def.onOpen) def.onOpen();
  }

  function goHome() {
    if (state === "app") {
      KB.close();
      document.querySelectorAll(".sheet-wrap, .alert-wrap").forEach(x => x.remove());
      if (currentApp && currentApp.onClose) { try { currentApp.onClose(); } catch (e) { /* app cleanup */ } }
      currentApp = null;
      home.classList.remove("hidden");
      buildHome();
      appLayer.classList.add("closing");
      setTimeout(() => { appLayer.classList.add("hidden"); appLayer.classList.remove("closing"); appLayer.innerHTML = ""; }, 220);
      setTint("trans");
      state = "home";
    } else if (state === "home") {
      if (editMode) { editMode = false; buildHome(); }
      else { page = 0; snapPage(); }
    } else if (state === "asleep") {
      wake();
    }
  }

  /* ---- lock / sleep ---- */
  function showLock() {
    tick();
    lock.classList.remove("hidden");
    statusbar.classList.remove("hidden");
    setTint("trans");
    state = "locked";
    resetThumb();
  }
  function unlock() {
    Snd.unlockSnd();
    lock.classList.add("hidden");
    home.classList.remove("hidden");
    buildHome();
    setTint("trans");
    state = "home";
  }
  function sleep() {
    if (state === "off" || state === "boot") return;
    Snd.lockSnd();
    KB.close();
    $id("screen-off").classList.remove("hidden");
    state = "asleep";
  }
  function wake() {
    $id("screen-off").classList.add("hidden");
    // whatever was below stays; if an app/home was up, drop back to lock screen
    if (!appLayer.classList.contains("hidden")) {
      appLayer.classList.add("hidden"); appLayer.innerHTML = ""; currentApp = null;
    }
    home.classList.add("hidden");
    showLock();
  }

  /* ---- slide to unlock ---- */
  const thumb = lock.querySelector(".lock-thumb");
  const MAXX = 190;
  function resetThumb() { thumb.style.transition = ""; thumb.style.transform = "translateX(0)"; }
  (() => {
    let x0 = null, cur = 0;
    thumb.addEventListener("pointerdown", e => {
      x0 = e.clientX; cur = 0;
      thumb.setPointerCapture(e.pointerId);
      thumb.style.transition = "none";
      Snd.unlock();
    });
    thumb.addEventListener("pointermove", e => {
      if (x0 === null) return;
      cur = Math.max(0, Math.min(MAXX, e.clientX - x0));
      thumb.style.transform = `translateX(${cur}px)`;
    });
    thumb.addEventListener("pointerup", () => {
      if (x0 === null) return;
      x0 = null;
      thumb.style.transition = "transform .25s ease-out";
      // route through IOS.unlock so wrappers (passcode lock) can intercept
      if (cur > MAXX - 30) IOS.unlock();
      else thumb.style.transform = "translateX(0)";
    });
  })();

  /* ---- hardware buttons ---- */
  $id("home-btn").addEventListener("click", () => { Snd.unlock(); goHome(); });
  $id("power-btn").addEventListener("click", () => {
    if (state === "off") return;
    if (state === "asleep") wake(); else sleep();
  });
  $id("screen-off").addEventListener("click", wake);

  return {
    register(def) { apps[def.id] = def; },
    app(id) { return apps[id]; },
    open, goHome, showLock, unlock,
    setTint, refreshSignal, applyWallpaper, applyBrightness, buildHome, tick,
    get state() { return state; },
    set state(s) { state = s; }
  };
})();
