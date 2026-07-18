/* ===================================================================
   iOS 6 · Arch Edition — boot sequence
   The part everyone came for: the Arch kernel bringing up SpringBoard.
   =================================================================== */
"use strict";

const BOOT_LOG = [
  ["arch", ":: Arch Linux (iphone-flavoured) — kernel 6.9.7-arch1-1"],
  ["", "Booting Linux on physical CPU 0x0 [A6 'Swift' rev 1]"],
  ["", "Linux version 6.9.7-arch1-1 (build@archiso) (gcc 14.1.1, GNU ld 2.42) #1 SMP PREEMPT_DYNAMIC"],
  ["", "Machine model: Apple iPhone 5 (ARCH1,6)"],
  ["", "Memory: 1024MB available (912k kernel code, 8188k reserved)"],
  ["", "random: crng init done"],
  ["ok", "Mounted /boot."],
  ["", ":: running early hook [udev]"],
  ["", ":: running hook [udev]"],
  ["", ":: Triggering uevents..."],
  ["", "usbcore: registered new interface driver lightning"],
  ["", "retina: framebuffer at 0x5f700000, 640x1136, 32bpp"],
  ["", "input: home-button as /devices/platform/soc/gpio/input0"],
  ["", "input: multitouch as /devices/platform/soc/spi1/input1"],
  ["ok", "Reached target Local File Systems."],
  ["ok", "Started udev Kernel Device Manager."],
  ["", "baseband: qualcomm mdm9615 up, IMEI redacted (nice try)"],
  ["ok", "Started Network Manager."],
  ["ok", "Reached target Sound Card."],
  ["warn", "systemd[1]: /usr/lib/systemd/system/skeuomorphism.service: unit is deprecated upstream, keeping anyway"],
  ["ok", "Started Skeuomorphic Texture Daemon (linen, felt, leather)."],
  ["ok", "Started CoreAnimation Compositor."],
  ["", "pacman: 0 packages to upgrade — system is btw up to date"],
  ["ok", "Reached target Graphical Interface."],
  ["arch", "Welcome to Arch Linux!"],
  ["", ""],
  ["", "arch-iphone login: springboard (automatic login)"],
  ["", "Starting SpringBoard 6.1.3 ..."]
];

(function bootSystem() {
  const bootEl = $id("boot");
  const logEl = $id("boot-log");
  const appleEl = $id("boot-apple");
  let started = false;

  function runBoot() {
    if (started) return;
    started = true;
    Snd.unlock(); // prime audio context on this user gesture
    IOS.state = "boot";
    let i = 0;
    const next = () => {
      if (i >= BOOT_LOG.length) return finishLog();
      const [cls, text] = BOOT_LOG[i++];
      const line = document.createElement("div");
      if (cls === "ok") {
        line.innerHTML = '<span class="ok">[  OK  ]</span> ' + text;
      } else if (cls === "warn") {
        line.innerHTML = '<span class="warn">[ WARN ]</span> ' + text;
      } else if (cls === "arch") {
        line.className = "arch";
        line.textContent = text;
      } else {
        line.textContent = text;
      }
      logEl.append(line);
      logEl.scrollTop = logEl.scrollHeight;
      setTimeout(next, 40 + Math.random() * 110);
    };
    setTimeout(next, 350);

    function finishLog() {
      const toLock = () => {
        bootEl.classList.add("hidden");
        IOS.applyWallpaper();
        IOS.applyBrightness();
        IOS.refreshSignal();
        IOS.tick();
        $id("keyboard").classList.toggle("kb-dark", Prefs.get("kbdark", false));
        IOS.showLock();
      };
      if (Prefs.get("verboseboot", false)) {
        // Cydia's "Verbose Boot" tweak: no fruit, straight from log to lock
        setTimeout(toLock, 700);
      } else {
        setTimeout(() => {
          appleEl.classList.remove("hidden");
          setTimeout(toLock, 2400);
        }, 500);
      }
    }
  }

  bootEl.addEventListener("click", runBoot);
  // also boot on first click anywhere on the (off) screen
  setTimeout(() => { $id("hint").textContent = "click the screen to power on · drag the slider to unlock · home button returns home"; }, 100);
})();
