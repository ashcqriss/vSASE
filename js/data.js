/* ===================================================================
   iOS 6 · Arch Edition — shared data & services
   =================================================================== */
"use strict";

/* ---------------- Contacts ---------------- */

const CONTACTS = [
  { id: "mom",    first: "Mom",    last: "",        phone: "(555) 010-1955", email: "mom@example.com",           imessage: true,  fav: true  },
  { id: "natalia",first: "Natalia",last: "Maric",   phone: "(555) 736-1849", email: "natalia@example.com",       imessage: false, fav: true  },
  { id: "zach",   first: "Zach",   last: "Wood",    phone: "(555) 273-9164", email: "zach@example.com",          imessage: true,  fav: false },
  { id: "kate",   first: "Kate",   last: "Bell",    phone: "(555) 564-8583", email: "kate-bell@example.com",     imessage: true,  fav: true  },
  { id: "daniel", first: "Daniel", last: "Higgins", phone: "(555) 478-7672", email: "d-higgins@example.com",     imessage: false, fav: false },
  { id: "john",   first: "John",   last: "Appleseed", phone: "(555) 888-4444", email: "john-appleseed@example.com", imessage: true, fav: false },
  { id: "anna",   first: "Anna",   last: "Haro",    phone: "(555) 522-8243", email: "anna-haro@example.com",     imessage: true,  fav: false },
  { id: "hank",   first: "Hank",   last: "Zakroff", phone: "(555) 766-4823", email: "hank-zakroff@example.com",  imessage: false, fav: false },
  { id: "judy",   first: "Judy",   last: "Torvalds",phone: "(555) 199-1017", email: "judy@example.com",          imessage: true,  fav: false }
];

function contactName(c) { return (c.first + " " + c.last).trim(); }
function contactById(id) { return CONTACTS.find(c => c.id === id); }
function contactByNumber(num) {
  const digits = String(num).replace(/\D/g, "");
  return CONTACTS.find(c => c.phone.replace(/\D/g, "").endsWith(digits.slice(-7)) && digits.length >= 7);
}

/* ---------------- Message threads ---------------- */
/* service: 'imessage' | 'sms'  ·  dir: 'in' | 'out'  ·  kind: 'text' | 'photo' */

const THREADS = [
  {
    id: "mom", contact: "mom", service: "imessage", unread: true, time: "9:12 AM",
    msgs: [
      { dir: "in",  text: "Here's a shot of me with my new friend Jennifer. Sadly, neither of us has a very good sense of direction…" },
      { dir: "in",  kind: "photo", photo: 0 },
      { dir: "in",  text: "Looks like fun! I'm glad you're immersing yourself in the culture." },
      { dir: "out", text: "Yep! Spain is already starting to feel like home.", delivered: true }
    ],
    replies: [
      "That's wonderful, sweetie!",
      "Don't forget to call your grandmother.",
      "Send more photos!! ❤",
      "Are you eating enough? I saw a documentary about tapas."
    ]
  },
  {
    id: "natalia", contact: "natalia", service: "sms", unread: false, time: "Yesterday",
    msgs: [
      { dir: "in",  text: "Remember Tasha from last summer?" },
      { dir: "in",  text: "I haven't heard from her in forever." },
      { dir: "out", text: "Well, she says HI!" },
      { dir: "out", kind: "photo", photo: 1 },
      { dir: "in",  text: "Where are you" },
      { dir: "out", text: "I ran into her at our falafel spot. She's in town for the weekend." }
    ],
    replies: [
      "No way!! Tell her I said hi back!",
      "We should all get dinner while she's here.",
      "Falafel Friday??",
      "Ok I'm officially jealous."
    ]
  },
  {
    id: "zach", contact: "zach", service: "imessage", unread: false, time: "Tuesday",
    msgs: [
      { dir: "out", text: "Your cross street is Ulloa or cabrillo?" },
      { dir: "in",  text: "Cabrillo" },
      { dir: "out", text: "Ok", delivered: true }
    ],
    replies: [
      "Cool, see you soon",
      "Park on the left side, street cleaning tomorrow",
      "Bring the charger you borrowed 😄",
      "👍"
    ]
  },
  {
    id: "kate", contact: "kate", service: "imessage", unread: true, time: "Monday",
    msgs: [
      { dir: "in", text: "Did you seriously install Arch on your iPhone" },
      { dir: "out", text: "uname -a says yes", delivered: true },
      { dir: "in", text: "…I have so many questions" }
    ],
    replies: [
      "Does pacman work on it??",
      "btw, you use Arch. I know. You told everyone.",
      "Ok that's actually kind of amazing",
      "My phone just autocorrected 'kernel' to 'colonel' so I guess we're even"
    ]
  }
];

/* ---------------- Mail ---------------- */

const MAILBOX = [
  {
    from: "Apple", subject: "Welcome to your new iPhone", time: "9:03 AM", unread: true,
    body: [
      "Dear Customer,",
      "Thank you for choosing iPhone. This device is running iOS 6.1.3 — with a twist: the Darwin kernel has been swapped for Linux 6.9.7-arch1-1. We are as surprised as you are.",
      "To get started, slide to unlock, then explore Messages, Maps and the all-new Passbook.",
      "— The Apple Team (probably)"
    ]
  },
  {
    from: "Arch Linux Announce", subject: "[arch-announce] mkinitcpio hook for SpringBoard", time: "8:41 AM", unread: true,
    body: [
      "Hello,",
      "A new mkinitcpio hook `springboard` is now available in [extra]. It launches the iOS 6 home screen as PID 1's favourite child.",
      "As always: read the wiki before posting to the forums.",
      "// The Arch Linux Team"
    ]
  },
  {
    from: "Natalia Maric", subject: "falafel saturday?", time: "Yesterday", unread: false,
    body: [
      "hey!",
      "tasha's in town — falafel place at 1pm saturday? she wants to hear the story about the phone that boots linux.",
      "n."
    ]
  },
  {
    from: "Game Center", subject: "Zach beat your score in Chess", time: "Sunday", unread: false,
    body: [
      "Zach W. just scored 1,240 points in Chess.",
      "Your best: 980. Time to reclaim your throne."
    ]
  }
];

/* ---------------- Calendar events ---------------- */

const CAL_EVENTS = {
  // keyed by day-of-month offsets from "today", resolved at render time
  0:  [{ time: "9:00 AM",  name: "Stand-up (kernel team)" }, { time: "6:30 PM", name: "Dinner with Natalia" }],
  1:  [{ time: "10:00 AM", name: "pacman -Syu maintenance window" }],
  3:  [{ time: "1:00 PM",  name: "Falafel with Tasha & Natalia" }],
  7:  [{ time: "9:41 AM",  name: "Keynote rewatch party" }],
  12: [{ time: "All day",  name: "Mom visiting 🎉" }]
};

/* ---------------- Stocks ---------------- */

const STOCKS = [
  { sym: "AAPL", name: "Apple Inc.",            price: 665.15, chg: +4.28 },
  { sym: "LNX",  name: "Linux Foundation (fict.)", price: 199.10, chg: +6.09 },
  { sym: "GOOG", name: "Google Inc.",           price: 706.60, chg: -2.11 },
  { sym: "YHOO", name: "Yahoo! Inc.",           price: 15.98,  chg: +0.12 },
  { sym: "MSFT", name: "Microsoft Corp.",       price: 30.79,  chg: -0.34 },
  { sym: "ARCH", name: "Arch Holdings (fict.)", price: 61.20,  chg: +1.79 }
];

/* ---------------- Voicemail ---------------- */

const VOICEMAILS = [
  { from: "Mom",           time: "Yesterday", dur: "0:42" },
  { from: "(555) 284-1103", time: "Tuesday",  dur: "0:11" },
  { from: "Kate Bell",     time: "Monday",    dur: "1:05" }
];

/* ---------------- Photo store (canvas-generated "photos") ---------------- */

const PhotoStore = (() => {
  const photos = [];

  function scene(draw) {
    const c = document.createElement("canvas");
    c.width = 320; c.height = 320;
    const g = c.getContext("2d");
    draw(g, c.width, c.height);
    // grain
    g.globalAlpha = 0.05;
    for (let i = 0; i < 400; i++) {
      g.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
      g.fillRect(Math.random() * 320, Math.random() * 320, 1.4, 1.4);
    }
    g.globalAlpha = 1;
    return c.toDataURL("image/jpeg", 0.85);
  }

  function sky(g, w, h, top, mid, bottom, horizon) {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top); gr.addColorStop(horizon, mid); gr.addColorStop(1, bottom);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }

  function sun(g, x, y, r, color) {
    const gr = g.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.4, color); gr.addColorStop(1, "rgba(255,200,80,0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }

  function mountains(g, w, h, base, color, jag) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, base);
    let x = 0;
    while (x < w) {
      x += 24 + Math.random() * 40;
      g.lineTo(x, base - Math.random() * jag);
    }
    g.lineTo(w, base); g.lineTo(w, h); g.lineTo(0, h);
    g.closePath(); g.fill();
  }

  const makers = [
    // 0 sunset beach
    () => scene((g, w, h) => {
      sky(g, w, h, "#2c3e6b", "#e8825a", "#f7c66b", 0.55);
      sun(g, 160, 170, 60, "#ffd27a");
      g.fillStyle = "#1d2c50"; g.fillRect(0, 190, w, h - 190);
      for (let i = 0; i < 12; i++) {
        g.fillStyle = "rgba(255,205,120," + (0.25 - i * 0.018) + ")";
        g.fillRect(120 - i * 6, 196 + i * 10, 80 + i * 12, 4);
      }
    }),
    // 1 friend selfie stand-in: warm bokeh
    () => scene((g, w, h) => {
      sky(g, w, h, "#7a4f35", "#c98850", "#e8b87a", 0.6);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = "rgba(255,230,170," + (Math.random() * 0.35 + 0.08) + ")";
        const r = Math.random() * 26 + 8;
        g.beginPath(); g.arc(Math.random() * w, Math.random() * h, r, 0, 7); g.fill();
      }
      g.fillStyle = "rgba(60,35,20,.85)";
      g.beginPath(); g.arc(120, 250, 62, 0, 7); g.fill();
      g.beginPath(); g.arc(210, 260, 66, 0, 7); g.fill();
      g.beginPath(); g.arc(120, 172, 34, 0, 7); g.fill();
      g.beginPath(); g.arc(212, 180, 36, 0, 7); g.fill();
    }),
    // 2 mountains
    () => scene((g, w, h) => {
      sky(g, w, h, "#7fb2e5", "#cfe4f5", "#f2f7fb", 0.7);
      sun(g, 70, 66, 40, "#fff2c0");
      mountains(g, w, h, 200, "#5d729b", 90);
      mountains(g, w, h, 240, "#3c4f78", 70);
      g.fillStyle = "#2b3a5c"; g.fillRect(0, 285, w, h - 285);
    }),
    // 3 ocean
    () => scene((g, w, h) => {
      sky(g, w, h, "#67a7d8", "#a8d4ee", "#e6f4fb", 0.5);
      g.fillStyle = "#1f6fa8"; g.fillRect(0, 160, w, h - 160);
      for (let i = 0; i < 20; i++) {
        g.fillStyle = "rgba(255,255,255," + Math.random() * 0.35 + ")";
        g.fillRect(Math.random() * w, 165 + Math.random() * 150, 20 + Math.random() * 40, 2);
      }
      g.fillStyle = "#fff";
      g.beginPath(); g.moveTo(60, 120); g.lineTo(70, 90); g.lineTo(78, 120); g.closePath(); g.fill();
    }),
    // 4 forest
    () => scene((g, w, h) => {
      sky(g, w, h, "#bfe3c0", "#8fca94", "#5f9b66", 0.4);
      for (let i = 0; i < 16; i++) {
        const x = Math.random() * w, base = 180 + Math.random() * 130, s = 30 + Math.random() * 50;
        g.fillStyle = "rgba(20," + (70 + Math.random() * 60 | 0) + ",30,.9)";
        g.beginPath(); g.moveTo(x, base - s * 2); g.lineTo(x - s / 2, base); g.lineTo(x + s / 2, base); g.closePath(); g.fill();
      }
    }),
    // 5 city night
    () => scene((g, w, h) => {
      sky(g, w, h, "#0d1330", "#27204e", "#4a2a55", 0.7);
      for (let b = 0; b < 12; b++) {
        const bw = 20 + Math.random() * 30, bx = b * 27, bh = 90 + Math.random() * 140;
        g.fillStyle = "#0a0e1c"; g.fillRect(bx, h - bh, bw, bh);
        g.fillStyle = "#ffd97a";
        for (let wy = h - bh + 8; wy < h - 10; wy += 12)
          for (let wx = bx + 4; wx < bx + bw - 4; wx += 8)
            if (Math.random() > 0.5) g.fillRect(wx, wy, 4, 6);
      }
    }),
    // 6 desert
    () => scene((g, w, h) => {
      sky(g, w, h, "#f3b45c", "#e8975a", "#d97b4a", 0.6);
      sun(g, 240, 90, 46, "#ffe3a0");
      g.fillStyle = "#a85a32"; g.fillRect(0, 210, w, h - 210);
      g.fillStyle = "#8a4526";
      g.beginPath(); g.ellipse(90, 214, 90, 18, 0, 0, 7); g.fill();
      g.fillStyle = "#5e2f18";
      g.fillRect(150, 150, 10, 66); g.fillRect(138, 168, 10, 22); g.fillRect(138, 168, 22, 8);
      g.fillRect(162, 158, 10, 22); g.fillRect(154, 158, 18, 8);
    }),
    // 7 lavender field
    () => scene((g, w, h) => {
      sky(g, w, h, "#b6c9ec", "#e3d3ec", "#f6e6f0", 0.5);
      g.fillStyle = "#6d5aa8"; g.fillRect(0, 170, w, h - 170);
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = "rgba(150,120,220,.8)"; g.lineWidth = 4;
        g.beginPath();
        const y = 180 + i * 6;
        g.moveTo(0, y); g.quadraticCurveTo(w / 2, y + 12, w, y);
        g.stroke();
      }
    }),
    // 8 hot air balloons
    () => scene((g, w, h) => {
      sky(g, w, h, "#8ec7ef", "#c8e5f7", "#eef8fd", 0.75);
      const balloon = (x, y, s, c1, c2) => {
        const gr = g.createLinearGradient(x - s, y, x + s, y);
        gr.addColorStop(0, c1); gr.addColorStop(1, c2);
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, s, Math.PI, 0);
        g.quadraticCurveTo(x + s, y + s * 0.9, x, y + s * 1.35);
        g.quadraticCurveTo(x - s, y + s * 0.9, x - s, y);
        g.fill();
        g.fillStyle = "#7a4a22"; g.fillRect(x - s * 0.22, y + s * 1.5, s * 0.44, s * 0.34);
      };
      balloon(90, 100, 36, "#e5533f", "#f5a63f");
      balloon(210, 170, 26, "#3f7ae5", "#3fd0f5");
      balloon(260, 70, 18, "#7ae53f", "#3ff58f");
      g.fillStyle = "#88b06a"; g.fillRect(0, 286, w, h - 286);
    }),
    // 9 polar bear (zoo)
    () => scene((g, w, h) => {
      sky(g, w, h, "#3a4a52", "#54666e", "#6c7e85", 0.5);
      g.fillStyle = "#e9e5da";
      g.beginPath(); g.ellipse(160, 220, 95, 58, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(238, 178, 34, 0, 7); g.fill();
      g.beginPath(); g.arc(262, 154, 9, 0, 7); g.fill();
      g.fillStyle = "#1c1c1c";
      g.beginPath(); g.arc(246, 172, 3.5, 0, 7); g.fill();
      g.beginPath(); g.arc(266, 182, 5, 0, 7); g.fill();
      g.fillStyle = "#cfc9ba";
      g.beginPath(); g.ellipse(120, 268, 90, 16, 0, 0, 7); g.fill();
    }),
    // 10 aurora
    () => scene((g, w, h) => {
      sky(g, w, h, "#03081a", "#07203a", "#0a2a30", 0.8);
      for (let i = 0; i < 5; i++) {
        g.strokeStyle = "rgba(80,255,180," + (0.25 - i * 0.04) + ")";
        g.lineWidth = 16 - i * 2;
        g.beginPath();
        g.moveTo(-10, 80 + i * 22);
        g.bezierCurveTo(100, 30 + i * 18, 220, 140 + i * 10, 330, 60 + i * 20);
        g.stroke();
      }
      g.fillStyle = "#fff";
      for (let i = 0; i < 60; i++) g.fillRect(Math.random() * w, Math.random() * 200, 1.3, 1.3);
      mountains(g, w, h, 280, "#050a12", 60);
    }),
    // 11 tulips
    () => scene((g, w, h) => {
      sky(g, w, h, "#9fd0f0", "#d5ebf8", "#f4fbff", 0.55);
      g.fillStyle = "#4d8a3a"; g.fillRect(0, 200, w, h - 200);
      const colors = ["#e04a4a", "#f0c04a", "#e07ad0", "#f08a4a"];
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * w, y = 210 + Math.random() * 100, s = 5 + (y - 210) / 18;
        g.strokeStyle = "#2f6b22"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 2.2); g.stroke();
        g.fillStyle = colors[i % 4];
        g.beginPath(); g.ellipse(x, y - s * 2.6, s * 0.8, s, 0, 0, 7); g.fill();
      }
    })
  ];

  function ensure() {
    if (!photos.length) makers.forEach(m => photos.push(m()));
  }

  return {
    all() { ensure(); return photos; },
    get(i) { ensure(); return photos[(i % photos.length + photos.length) % photos.length]; },
    add(dataUrl) { ensure(); photos.push(dataUrl); return photos.length - 1; },
    count() { ensure(); return photos.length; }
  };
})();

/* ---------------- Sound engine (WebAudio, tiny synth) ---------------- */

const Snd = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* audio unavailable */ } }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, { type = "sine", gain = 0.12, when = 0, freq2 = null } = {}) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + when;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const DTMF = {
    "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
    "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
    "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
    "*": [941, 1209], "0": [941, 1336], "#": [941, 1477]
  };
  return {
    unlock() { ac(); },
    click() { tone(1800, 0.03, { type: "square", gain: 0.04 }); },
    key() { tone(1200, 0.035, { type: "square", gain: 0.05 }); },
    dtmf(k) { const p = DTMF[k]; if (p) { tone(p[0], 0.12, { gain: 0.07 }); tone(p[1], 0.12, { gain: 0.07 }); } },
    sent() { tone(880, 0.18, { type: "sine", gain: 0.1, freq2: 1760 }); },
    received() { tone(1318, 0.12, { gain: 0.1 }); tone(1760, 0.22, { gain: 0.08, when: 0.1 }); },
    lockSnd() { tone(320, 0.05, { type: "square", gain: 0.08 }); tone(180, 0.06, { type: "square", gain: 0.08, when: 0.05 }); },
    unlockSnd() { tone(500, 0.05, { type: "square", gain: 0.07 }); tone(900, 0.07, { type: "square", gain: 0.06, when: 0.04 }); },
    ring(when = 0) { tone(440, 0.9, { gain: 0.05, when }); tone(480, 0.9, { gain: 0.05, when }); },
    tri() { [1046, 1318, 1568].forEach((f, i) => tone(f, 0.28, { gain: 0.09, when: i * 0.18 })); }
  };
})();

/* ---------------- Persistent settings ---------------- */

const Prefs = {
  get(k, dflt) {
    try {
      const v = localStorage.getItem("ios6." + k);
      return v === null ? dflt : JSON.parse(v);
    } catch (e) { return dflt; }
  },
  set(k, v) {
    try { localStorage.setItem("ios6." + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }
};
