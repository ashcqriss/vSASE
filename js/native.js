/* ===================================================================
   iOS 6 · Arch Edition — native bridge & kiosk mode

   When the shell runs on a real Arch system, the `ios6d` daemon
   (127.0.0.1:9641) exposes actual system state: kernel, hostname,
   battery from /sys, Wi-Fi via NetworkManager, modem via ModemManager.
   The UI polls it and prefers real data over the simulation. Without
   the daemon (plain browser demo) everything falls back silently.

   Kiosk mode (?kiosk=1): drops the picture-frame bezel and scales the
   320x480 screen to fill the display — this is how the ISO/package
   run it under cage as the system shell.
   =================================================================== */
"use strict";

const NativeBridge = (() => {
  const BASE = "http://127.0.0.1:9641";
  let info = null;          // last /status payload, or null when offline
  let everSeen = false;

  function get(key, fallback) {
    if (!info) return fallback;
    const v = key.split(".").reduce((o, k) => (o == null ? o : o[k]), info);
    return (v === undefined || v === null || v === "") ? fallback : v;
  }

  function applyToStatusBar() {
    const sb = document.getElementById("statusbar");
    if (!sb || !info) return;
    // battery
    if (info.battery && typeof info.battery.pct === "number") {
      const pct = Math.max(0, Math.min(100, info.battery.pct));
      sb.querySelector(".sb-batt-pct").innerHTML =
        pct + "%" + (info.battery.charging ? Glyphs.bolt() : "");
      sb.querySelector(".sb-batt i").style.right = (100 - pct) * 0.2 + "px";
    }
    // carrier / wifi
    if (!Prefs.get("airplane", false)) {
      const carrier = get("modem.operator", null) || get("wifi.ssid", null);
      if (carrier) sb.querySelector(".sb-carrier").textContent = String(carrier).slice(0, 10);
    }
  }

  async function poll() {
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 1500);
      const r = await fetch(BASE + "/status", { signal: ctl.signal });
      clearTimeout(to);
      info = await r.json();
      everSeen = true;
      applyToStatusBar();
    } catch (e) {
      info = null; // daemon not present — stay in simulation mode
    }
  }

  async function post(path, body) {
    try {
      const r = await fetch(BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      return await r.json();
    } catch (e) {
      return { ok: false, error: "daemon unreachable" };
    }
  }

  poll();
  setInterval(poll, 5000);

  return {
    get active() { return info !== null; },
    get everSeen() { return everSeen; },
    get info() { return info; },
    get,
    call: number => post("/call", { number }),
    sms: (number, text) => post("/sms", { number, text }),
    pkgUpdates: () => fetch(BASE + "/pkg/updates").then(r => r.json()).catch(() => null),
    pkgSearch: q => fetch(BASE + "/pkg/search?q=" + encodeURIComponent(q)).then(r => r.json()).catch(() => null),
    pkgInstall: name => post("/pkg/install", { name }),
    pkgUpgrade: () => post("/pkg/upgrade", {})
  };
})();

/* ---------------- kiosk mode ---------------- */

(() => {
  if (!/[?&]kiosk=1/.test(location.search)) return;
  document.body.classList.add("kiosk");

  const HOME_STRIP = 46; // px reserved at the bottom for the home button

  function layout() {
    const scr = document.getElementById("screen");
    const hb = document.getElementById("home-btn");
    const s = Math.min(innerWidth / 320, (innerHeight - HOME_STRIP) / 480);
    scr.style.transformOrigin = "top left";
    scr.style.transform = `scale(${s})`;
    scr.style.left = Math.round((innerWidth - 320 * s) / 2) + "px";
    scr.style.top = Math.max(0, Math.round((innerHeight - HOME_STRIP - 480 * s) / 2)) + "px";
    hb.style.left = "50%";
    hb.style.transform = "translateX(-50%)";
    hb.style.bottom = "3px";
  }
  addEventListener("resize", layout);
  layout();

  // in kiosk mode the machine is the phone — power straight through boot
  addEventListener("load", () => {
    setTimeout(() => document.getElementById("boot").click(), 400);
  });
})();
