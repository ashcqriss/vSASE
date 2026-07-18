/* ===================================================================
   iOS 6 · Arch Edition — home-screen icon set (inline SVG)
   =================================================================== */
"use strict";

const Icons = (() => {
  let uid = 0;

  function grad(id, stops, x2 = 0, y2 = 1) {
    const s = stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");
    return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${s}</linearGradient>`;
  }
  function rgrad(id, stops, cx = 0.5, cy = 0.35, r = 0.8) {
    const s = stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");
    return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${s}</radialGradient>`;
  }
  function icon(build, { gloss = true } = {}) {
    const p = "i" + (uid++) + "_";
    const { defs, body } = build(p);
    // the iOS 6 sheen: a bright band across the top with a convex lower edge
    const glossDefs = `<linearGradient id="${p}gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.08"/></linearGradient>`;
    const glossBody = `<path d="M0,0 h57 v19 c-13,8.5 -44,8.5 -57,0 z" fill="url(#${p}gloss)"/>`;
    return `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
      <defs>${defs}${gloss ? glossDefs : ""}</defs>${body}${gloss ? glossBody : ""}</svg>`;
  }

  /* ---- individual icons ---- */

  const messages = () => icon(p => ({
    defs: grad(p + "g", [[0, "#96ec6d"], [0.45, "#54ca30"], [0.55, "#3cb31c"], [1, "#2f9e13"]]) +
          grad(p + "b", [[0, "#ffffff"], [1, "#e8ece8"]]),
    body: `<rect width="57" height="57" fill="url(#${p}g)"/>
      <path d="M28.5 11.5c-10.6 0-19 6.5-19 14.6 0 4.7 2.9 8.9 7.4 11.6-.4 2.6-1.5 5-3.6 6.9 3.7-.4 6.9-1.7 9.4-3.6 1.8.4 3.8.7 5.8.7 10.6 0 19-6.5 19-14.6s-8.4-15.6-19-15.6z"
        fill="url(#${p}b)" stroke="#1d7a08" stroke-width="0.8"/>`
  }));

  const calendar = () => {
    const now = new Date();
    const wd = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    return icon(p => ({
      defs: grad(p + "r", [[0, "#f77e6e"], [0.48, "#e0402f"], [0.52, "#c53222"], [1, "#d2402e"]]) +
            grad(p + "w", [[0, "#ffffff"], [1, "#dfe2e6"]]),
      body: `<rect width="57" height="57" fill="url(#${p}w)"/>
        <rect width="57" height="16" fill="url(#${p}r)"/>
        <text x="28.5" y="12" text-anchor="middle" font-family="Helvetica,Arial" font-size="9" fill="#fff" font-weight="bold">${wd}</text>
        <text x="28.5" y="46" text-anchor="middle" font-family="Helvetica,Arial" font-size="30" fill="#333" font-weight="300">${now.getDate()}</text>`
    }), { gloss: false });
  };

  const photos = () => icon(p => {
    const colors = ["#f9d949", "#f5a833", "#ef6e2b", "#e0382b", "#c03a92", "#5a4ac8", "#3a86d8", "#4fb848"];
    let petals = "";
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + (ring ? Math.PI / 8 : 0);
        const d = ring ? 9 : 12.5, rx = ring ? 6.2 : 8, ry = ring ? 3.6 : 4.6;
        petals += `<ellipse cx="${28.5 + Math.cos(a) * d}" cy="${27 + Math.sin(a) * d}" rx="${rx}" ry="${ry}"
          transform="rotate(${a * 180 / Math.PI} ${28.5 + Math.cos(a) * d} ${27 + Math.sin(a) * d})"
          fill="${colors[i]}" opacity="${ring ? 0.65 : 0.94}"/>`;
      }
    }
    return {
      defs: grad(p + "w", [[0, "#ffffff"], [1, "#d4d8de"]]) +
            rgrad(p + "c", [[0, "#ffffff"], [0.7, "#fbf6e2"], [1, "#efe2b0"]]),
      body: `<rect width="57" height="57" fill="url(#${p}w)"/>${petals}
        <circle cx="28.5" cy="27" r="5.2" fill="url(#${p}c)" stroke="#dcc36a" stroke-width="1"/>`
    };
  });

  const camera = () => icon(p => ({
    defs: grad(p + "g", [[0, "#d6dae1"], [0.48, "#aeb4bd"], [0.52, "#99a0aa"], [1, "#848b96"]]) +
          rgrad(p + "l", [[0, "#b8d8f2"], [0.35, "#4a7ab8"], [0.7, "#1e3a66"], [1, "#0a1526"]], 0.38, 0.32, 0.95) +
          rgrad(p + "ring", [[0, "#5a616c"], [1, "#23272e"]]),
    body: `<rect width="57" height="57" fill="url(#${p}g)"/>
      <rect x="5" y="15" width="47" height="29" rx="3.5" fill="#646b76" stroke="#3d434c" stroke-width="0.8"/>
      <rect x="9" y="11" width="13" height="6.5" rx="2" fill="#646b76" stroke="#3d434c" stroke-width="0.7"/>
      <circle cx="28.5" cy="29.5" r="12" fill="url(#${p}ring)"/>
      <circle cx="28.5" cy="29.5" r="9.4" fill="url(#${p}l)" stroke="#0d1420" stroke-width="0.6"/>
      <circle cx="28.5" cy="29.5" r="4" fill="#16294a" opacity="0.85"/>
      <ellipse cx="24.8" cy="25.6" rx="3" ry="2" fill="#dceafa" opacity="0.75" transform="rotate(-30 24.8 25.6)"/>
      <circle cx="44.5" cy="20.5" r="2.2" fill="#f2d24a" stroke="#a8862a" stroke-width="0.5"/>`
  }));

  const videos = () => icon(p => ({
    defs: grad(p + "b", [[0, "#8a97ab"], [1, "#4e5a6e"]]),
    body: `<rect width="57" height="57" fill="url(#${p}b)"/>
      <rect x="7" y="18" width="43" height="28" rx="3" fill="#2b303b" stroke="#171b22"/>
      <path d="M7 18 L50 18 L46 8 L11 8 Z" fill="#e8eaee" stroke="#a9adb5"/>
      ${[14, 22, 30, 38].map(x => `<path d="M${x} 9 l6 8" stroke="#6b7280" stroke-width="3"/>`).join("")}
      <path d="M24 25 l12 7 -12 7 z" fill="#fff"/>`
  }));

  const weather = () => icon(p => ({
    defs: grad(p + "b", [[0, "#63b1f2"], [1, "#1e60c8"]]) + rgrad(p + "s", [[0, "#fff8d0"], [0.55, "#ffd94a"], [1, "#f5a11f"]]),
    body: `<rect width="57" height="57" fill="url(#${p}b)"/>
      <circle cx="28.5" cy="27" r="12" fill="url(#${p}s)"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const a = i * Math.PI / 4 + 0.4;
        return `<rect x="-2" y="-1.6" width="7" height="3.2" rx="1.6" fill="#ffd94a"
          transform="translate(${28.5 + Math.cos(a) * 17} ${27 + Math.sin(a) * 17}) rotate(${a * 180 / Math.PI})"/>`;
      }).join("")}`
  }));

  const passbook = () => icon(p => ({
    defs: grad(p + "bg", [[0, "#4d5464"], [1, "#2c3140"]]),
    body: `<rect width="57" height="57" fill="url(#${p}bg)"/>
      <rect x="9" y="8" width="39" height="14" rx="4" fill="#e2574c"/>
      <rect x="9" y="17" width="39" height="14" rx="4" fill="#f2b63c"/>
      <rect x="9" y="26" width="39" height="14" rx="4" fill="#4aa8e0"/>
      <rect x="9" y="35" width="39" height="15" rx="4" fill="#e8eaee"/>
      <circle cx="28.5" cy="10" r="4.5" fill="#3d4450"/>`
  }));

  const notes = () => icon(p => ({
    defs: grad(p + "y", [[0, "#fdf7c9"], [1, "#f0e5a0"]]) + grad(p + "l", [[0, "#8a7a5a"], [1, "#5d4f36"]]),
    body: `<rect width="57" height="57" fill="url(#${p}y)"/>
      <rect width="57" height="15" fill="url(#${p}l)"/>
      ${[10, 20, 30, 40, 47].map(x => `<circle cx="${x}" cy="12.5" r="1.6" fill="#e8dfb5"/>`).join("")}
      ${[24, 32, 40, 48].map(y => `<line x1="4" y1="${y}" x2="53" y2="${y}" stroke="#d9c98f" stroke-width="1"/>`).join("")}
      <line x1="4" y1="28" x2="42" y2="28" stroke="#9aa4b5" stroke-width="1.6" opacity="0.7"/>
      <line x1="4" y1="36" x2="47" y2="36" stroke="#9aa4b5" stroke-width="1.6" opacity="0.7"/>`
  }), { gloss: false });

  const reminders = () => icon(p => ({
    defs: grad(p + "w", [[0, "#fdfdfd"], [1, "#e3e6ea"]]),
    body: `<rect width="57" height="57" fill="url(#${p}w)"/>
      ${[16, 28, 40].map((y, i) => `
        <circle cx="12" cy="${y}" r="4" fill="none" stroke="${["#e0a03a", "#58a83a", "#4a7ad0"][i]}" stroke-width="2"/>
        ${i < 2 ? `<path d="M9.7 ${y} l1.8 1.9 3-3.6" stroke="${["#e0a03a", "#58a83a"][i]}" stroke-width="1.8" fill="none"/>` : ""}
        <line x1="22" y1="${y}" x2="49" y2="${y}" stroke="#aeb3bb" stroke-width="2.4"/>`).join("")}`
  }), { gloss: false });

  const clockIcon = () => {
    const now = new Date();
    const hA = ((now.getHours() % 12) + now.getMinutes() / 60) * 30 - 90;
    const mA = now.getMinutes() * 6 - 90;
    return icon(p => ({
      defs: grad(p + "k", [[0, "#3a3d44"], [1, "#101114"]]),
      body: `<rect width="57" height="57" fill="url(#${p}k)"/>
        <circle cx="28.5" cy="28.5" r="21" fill="#f4f5f7" stroke="#0a0a0a" stroke-width="2"/>
        ${Array.from({ length: 12 }, (_, i) => {
          const a = i * Math.PI / 6;
          return `<line x1="${28.5 + Math.cos(a) * 17}" y1="${28.5 + Math.sin(a) * 17}"
                        x2="${28.5 + Math.cos(a) * 19.5}" y2="${28.5 + Math.sin(a) * 19.5}"
                        stroke="#222" stroke-width="${i % 3 ? 1 : 2}"/>`;
        }).join("")}
        <line x1="28.5" y1="28.5" x2="${28.5 + Math.cos(hA * Math.PI / 180) * 10}" y2="${28.5 + Math.sin(hA * Math.PI / 180) * 10}" stroke="#111" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="28.5" y1="28.5" x2="${28.5 + Math.cos(mA * Math.PI / 180) * 15}" y2="${28.5 + Math.sin(mA * Math.PI / 180) * 15}" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="28.5" cy="28.5" r="1.8" fill="#d33"/>`
    }), { gloss: false });
  };

  const maps = () => icon(p => ({
    defs: grad(p + "c", [[0, "#f4eeda"], [1, "#e5dcc0"]]),
    body: `<rect width="57" height="57" fill="url(#${p}c)"/>
      <path d="M0 40 Q20 34 30 20 T57 6" stroke="#f2c94c" stroke-width="7" fill="none"/>
      <path d="M-2 22 L59 30" stroke="#fff" stroke-width="5"/>
      <path d="M14 -2 L20 59" stroke="#fff" stroke-width="5"/>
      <path d="M38 -2 L46 59" stroke="#fff" stroke-width="4"/>
      <rect x="2" y="44" width="16" height="11" fill="#b5d98a"/>
      <rect x="44" y="38" width="13" height="12" fill="#b5d98a"/>
      <g transform="translate(13 40)">
        <path d="M0 -6 C0 -8 2 -9 6 -9 C10 -9 12 -8 12 -6 L12 0 C12 4 9 7 6 8 C3 7 0 4 0 0 z"
          fill="#2a5cb8" stroke="#fff" stroke-width="1.2"/>
        <path d="M0 -6 C0 -8 2 -9 6 -9 C10 -9 12 -8 12 -6 L12 -4 L0 -4 z" fill="#c8382a"/>
        <text x="6" y="4.5" text-anchor="middle" font-family="Helvetica,Arial" font-size="6" font-weight="bold" fill="#fff">280</text>
      </g>
      <g transform="translate(33 20)">
        <path d="M0 -9 C5 -9 8 -5.5 8 -1.5 C8 3 3 8 0 12 C-3 8 -8 3 -8 -1.5 C-8 -5.5 -5 -9 0 -9 z" fill="#d2402e" stroke="#8e2417"/>
        <circle cx="0" cy="-1.5" r="3" fill="#f0b0a5"/>
      </g>`
  }));

  const stocks = () => icon(p => ({
    defs: grad(p + "k", [[0, "#3c3f46"], [1, "#0e0f12"]]),
    body: `<rect width="57" height="57" fill="url(#${p}k)"/>
      ${[14, 24, 34, 44].map(y => `<line x1="4" y1="${y}" x2="53" y2="${y}" stroke="#2c2f36" stroke-width="1"/>`).join("")}
      <path d="M5 42 L16 30 L24 35 L34 20 L42 26 L52 12" stroke="#57c93f" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <circle cx="52" cy="12" r="2.4" fill="#8af06f"/>`
  }));

  const newsstand = () => icon(p => ({
    defs: grad(p + "wd", [[0, "#a8815c"], [1, "#6b4e30"]]),
    body: `<rect width="57" height="57" fill="url(#${p}wd)"/>
      <rect x="4" y="34" width="49" height="5" fill="#4d3520"/>
      <rect x="8" y="12" width="13" height="22" fill="#d84a3a"/>
      <rect x="23" y="10" width="13" height="24" fill="#3a7ad8"/>
      <rect x="38" y="13" width="13" height="21" fill="#4aa84a"/>
      <rect x="8" y="12" width="13" height="5" fill="#fff" opacity=".85"/>
      <rect x="23" y="10" width="13" height="5" fill="#fff" opacity=".85"/>
      <rect x="38" y="13" width="13" height="5" fill="#fff" opacity=".85"/>
      <rect x="4" y="44" width="49" height="5" fill="#4d3520"/>`
  }));

  const itunes = () => icon(p => ({
    defs: rgrad(p + "b", [[0, "#8fd0f8"], [0.5, "#2f8de0"], [1, "#1550b8"]]),
    body: `<rect width="57" height="57" fill="url(#${p}b)"/>
      <circle cx="28.5" cy="28.5" r="19" fill="#fff" opacity="0.16"/>
      <path d="M24 38.5 a4 3.4 0 1 1 -1.5 -2.7 L22.5 20 L39 16.5 L39 34.5 a4 3.4 0 1 1 -1.5 -2.7 L37.5 21.5 L24 24.5 z" fill="#fff"/>`
  }));

  const appstore = () => icon(p => ({
    defs: rgrad(p + "b", [[0, "#7cc4f4"], [0.55, "#2b7ad8"], [1, "#1244a8"]]),
    body: `<rect width="57" height="57" fill="url(#${p}b)"/>
      <circle cx="28.5" cy="28.5" r="18.5" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.9"/>
      <g stroke="#fff" stroke-width="3" stroke-linecap="round">
        <line x1="21" y1="37" x2="30" y2="18"/>
        <line x1="36" y1="37" x2="27" y2="18"/>
        <line x1="20" y1="30" x2="37" y2="30"/>
      </g>`
  }));

  const gamecenter = () => icon(p => ({
    defs: grad(p + "s", [[0, "#f3ecd8"], [1, "#d9cfae"]]),
    body: `<rect width="57" height="57" fill="url(#${p}s)"/>
      <circle cx="17" cy="18" r="10" fill="#e5493c" opacity="0.92"/>
      <circle cx="38" cy="14" r="8" fill="#f2c53c" opacity="0.92"/>
      <circle cx="41" cy="34" r="11" fill="#42a83c" opacity="0.92"/>
      <circle cx="18" cy="40" r="9" fill="#3c7ae5" opacity="0.92"/>
      <circle cx="14" cy="15" r="3" fill="#fff" opacity="0.5"/>
      <circle cx="36" cy="11.5" r="2.4" fill="#fff" opacity="0.5"/>
      <circle cx="38" cy="30" r="3.2" fill="#fff" opacity="0.5"/>
      <circle cx="15.5" cy="37" r="2.6" fill="#fff" opacity="0.5"/>`
  }));

  const gear = (cx, cy, r, fill, p, n) => {
    let teeth = "";
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n;
      teeth += `<rect x="-1.8" y="${-r - 3}" width="3.6" height="5"
        transform="translate(${cx} ${cy}) rotate(${a * 180 / Math.PI})" fill="${fill}"/>`;
    }
    return `${teeth}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="url(#${p}bg)"/>`;
  };

  const settings = () => icon(p => {
    const metalGear = (cx, cy, r, n, g1, g2) => {
      let teeth = "";
      for (let i = 0; i < n; i++) {
        const a = i * 360 / n;
        teeth += `<path d="M-2.6 ${-r - 3.6} L2.6 ${-r - 3.6} L3.4 ${-r + 1} L-3.4 ${-r + 1} z"
          transform="translate(${cx} ${cy}) rotate(${a})" fill="url(#${g1})"/>`;
      }
      return `${teeth}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g1})" stroke="#40454d" stroke-width="0.7"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="url(#${g2})"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="url(#${p}bg)" stroke="#4a4f57" stroke-width="0.8"/>`;
    };
    return {
      defs: grad(p + "bg", [[0, "#c2c6cd"], [0.5, "#9298a2"], [1, "#6f747e"]]) +
            grad(p + "m1", [[0, "#f0f2f5"], [0.5, "#aab0ba"], [1, "#787e88"]]) +
            grad(p + "m2", [[0, "#666c76"], [1, "#b9bfc8"]]),
      body: `<rect width="57" height="57" fill="url(#${p}bg)"/>
        ${metalGear(21, 23, 12.5, 12, p + "m1", p + "m2")}
        ${metalGear(41, 40, 8.5, 10, p + "m1", p + "m2")}`
    };
  });

  const contacts = () => icon(p => ({
    defs: grad(p + "t", [[0, "#f6f2e8"], [1, "#dcd4c0"]]),
    body: `<rect width="57" height="57" fill="url(#${p}t)"/>
      <rect x="0" y="0" width="9" height="57" fill="#9a6a3a"/>
      ${[10, 22, 34, 46].map(y => `<circle cx="4.5" cy="${y}" r="2" fill="#e8dcc8"/>`).join("")}
      <circle cx="32" cy="21" r="7.5" fill="#8b93a1"/>
      <path d="M18 44 c0 -9 6.5 -13.5 14 -13.5 s14 4.5 14 13.5 z" fill="#8b93a1"/>`
  }));

  const calculator = () => icon(p => ({
    defs: grad(p + "k", [[0, "#43464d"], [1, "#191b1f"]]),
    body: `<rect width="57" height="57" fill="url(#${p}k)"/>
      <rect x="7" y="7" width="43" height="11" rx="2" fill="#cfd6cc"/>
      ${[[7, 23, "#f5871f", "+"], [19, 23, "#f5871f", "−"], [31, 23, "#f5871f", "×"], [43, 23, "#f5871f", "÷"],
         [7, 35, "#9aa0a8", "7"], [19, 35, "#9aa0a8", "8"], [31, 35, "#9aa0a8", "9"], [43, 35, "#9aa0a8", ""],
         [7, 47, "#9aa0a8", "4"], [19, 47, "#9aa0a8", "5"], [31, 47, "#9aa0a8", "6"], [43, 47, "#9aa0a8", ""]]
        .map(([x, y, c, t]) => `<rect x="${x}" y="${y}" width="10" height="9" rx="2" fill="${c}"/>
          ${t ? `<text x="${x + 5}" y="${y + 7}" text-anchor="middle" font-size="7" fill="#fff" font-family="Helvetica">${t}</text>` : ""}`).join("")}`
  }));

  const compass = () => icon(p => ({
    defs: grad(p + "k", [[0, "#3c4048"], [1, "#101114"]]) + rgrad(p + "f", [[0, "#f2f3f5"], [1, "#c5cad2"]]),
    body: `<rect width="57" height="57" fill="url(#${p}k)"/>
      <circle cx="28.5" cy="28.5" r="21" fill="url(#${p}f)" stroke="#0a0a0a" stroke-width="2"/>
      ${Array.from({ length: 16 }, (_, i) => {
        const a = i * Math.PI / 8;
        return `<line x1="${28.5 + Math.cos(a) * 17.5}" y1="${28.5 + Math.sin(a) * 17.5}" x2="${28.5 + Math.cos(a) * 19.5}" y2="${28.5 + Math.sin(a) * 19.5}" stroke="#555" stroke-width="1"/>`;
      }).join("")}
      <path d="M28.5 12 L32.5 28.5 L28.5 45 L24.5 28.5 z" fill="#d33a2c"/>
      <path d="M28.5 12 L32.5 28.5 L28.5 28.5 z" fill="#f06a5a"/>
      <path d="M28.5 45 L24.5 28.5 L28.5 28.5 z" fill="#e8eaee"/>
      <circle cx="28.5" cy="28.5" r="2" fill="#222"/>`
  }));

  const voicememos = () => icon(p => ({
    defs: grad(p + "k", [[0, "#40444c"], [1, "#16181c"]]) + grad(p + "m", [[0, "#e8eaee"], [0.5, "#9aa2ad"], [1, "#6b7280"]]),
    body: `<rect width="57" height="57" fill="url(#${p}k)"/>
      <rect x="21" y="8" width="15" height="26" rx="7.5" fill="url(#${p}m)" stroke="#0c0d0f"/>
      ${[13, 18, 23, 28].map(y => `<line x1="23.5" y1="${y}" x2="33.5" y2="${y}" stroke="#565c66" stroke-width="1.2"/>`).join("")}
      <path d="M15 26 a13.5 13.5 0 0 0 27 0" fill="none" stroke="#cfd4dc" stroke-width="3" stroke-linecap="round"/>
      <line x1="28.5" y1="40" x2="28.5" y2="47" stroke="#cfd4dc" stroke-width="3"/>
      <line x1="21" y1="47" x2="36" y2="47" stroke="#cfd4dc" stroke-width="3" stroke-linecap="round"/>`
  }));

  const terminal = () => icon(p => ({
    defs: grad(p + "k", [[0, "#20242a"], [1, "#07080a"]]),
    body: `<rect width="57" height="57" fill="url(#${p}k)"/>
      <rect x="4" y="4" width="49" height="8" rx="2" fill="#3a3f47"/>
      <circle cx="9" cy="8" r="1.8" fill="#e0574b"/><circle cx="15" cy="8" r="1.8" fill="#f2c53c"/><circle cx="21" cy="8" r="1.8" fill="#57c93f"/>
      <path d="M28.5 16 L38 33 L33.5 33 L28.5 24 L23.5 33 L19 33 z" fill="#1793d1"/>
      <text x="8" y="46" font-family="Menlo,monospace" font-size="8" fill="#57e389" font-weight="bold">$ pacman</text>`
  }));

  /* ---- dock icons ---- */

  const phone = () => icon(p => ({
    defs: grad(p + "g", [[0, "#9be36f"], [0.5, "#4fbb2f"], [1, "#2f8f13"]]),
    body: `<rect width="57" height="57" fill="url(#${p}g)"/>
      <path d="M17 12 c3 -2.5 6 -2 7.5 0.5 l3 5 c1.3 2.2 0.4 4.4 -1.6 5.8 c-1.6 1.1 -1.9 2.2 -0.8 4.2 c1.6 3 4 5.4 7 7 c2 1.1 3.1 0.8 4.2 -0.8 c1.4 -2 3.6 -2.9 5.8 -1.6 l5 3 c2.5 1.5 3 4.5 0.5 7.5 c-1.7 2 -4.3 3.5 -7.5 2.9 c-6.3 -1.2 -12.9 -5 -17.9 -10 c-5 -5 -8.8 -11.6 -10 -17.9 c-0.6 -3.2 0.9 -5.8 2.9 -7.5 z" fill="#fff" transform="rotate(3 28 28)"/>`
  }));

  const mail = () => icon(p => ({
    defs: grad(p + "s", [[0, "#bcd9f2"], [0.5, "#6ba2de"], [1, "#3572bc"]]) +
          grad(p + "e", [[0, "#ffffff"], [1, "#dde2e8"]]),
    body: `<rect width="57" height="57" fill="url(#${p}s)"/>
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="10" cy="49" rx="12" ry="5"/><ellipse cx="20" cy="46" rx="9" ry="4.5"/>
        <ellipse cx="46" cy="50" rx="13" ry="6"/><ellipse cx="37" cy="48" rx="8" ry="4"/>
      </g>
      <rect x="7.5" y="16" width="42" height="26" rx="2.5" fill="url(#${p}e)" stroke="#8b93a1" stroke-width="0.9"/>
      <path d="M8 17.5 L28.5 32.5 L49 17.5" fill="none" stroke="#9aa2ad" stroke-width="1.5"/>
      <path d="M8 40.5 L23 29.5 M49 40.5 L34 29.5" stroke="#9aa2ad" stroke-width="1.1"/>`
  }));

  const safari = () => icon(p => ({
    defs: rgrad(p + "b", [[0, "#c8e6fa"], [0.4, "#4795e2"], [1, "#0e3f9e"]], 0.5, 0.3, 0.9) +
          grad(p + "ring", [[0, "#ffffff"], [1, "#c8d0da"]]),
    body: `<rect width="57" height="57" fill="url(#${p}b)"/>
      <circle cx="28.5" cy="28.5" r="21" fill="url(#${p}ring)" stroke="#9ea8b5" stroke-width="0.8"/>
      <circle cx="28.5" cy="28.5" r="18.2" fill="url(#${p}b)"/>
      <g stroke="#ffffff" stroke-width="0.9" fill="none" opacity="0.85">
        <ellipse cx="28.5" cy="28.5" rx="6.5" ry="18.2"/>
        <ellipse cx="28.5" cy="28.5" rx="13" ry="18.2"/>
        <line x1="10.3" y1="28.5" x2="46.7" y2="28.5"/>
        <path d="M12.8 19.5 a24 24 0 0 1 31.4 0 M12.8 37.5 a24 24 0 0 0 31.4 0"/>
      </g>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        return `<line x1="${28.5 + Math.cos(a) * 19.2}" y1="${28.5 + Math.sin(a) * 19.2}"
                      x2="${28.5 + Math.cos(a) * 20.6}" y2="${28.5 + Math.sin(a) * 20.6}" stroke="#6b7686" stroke-width="1"/>`;
      }).join("")}
      <path d="M40.5 16.5 L31.8 31.2 L16.5 40.5 L25.2 25.8 z" fill="#f4f6f8"/>
      <path d="M40.5 16.5 L31.8 31.2 L25.2 25.8 z" fill="#e8493a"/>
      <circle cx="28.5" cy="28.5" r="1.6" fill="#dfe4ea"/>`
  }));

  const music = () => icon(p => ({
    defs: rgrad(p + "o", [[0, "#fcd08a"], [0.45, "#f78d2f"], [1, "#dd5510"]], 0.5, 0.25, 0.95),
    body: `<rect width="57" height="57" fill="url(#${p}o)"/>
      <g fill="#ffffff">
        <ellipse cx="19.5" cy="41.5" rx="5" ry="3.8" transform="rotate(-18 19.5 41.5)"/>
        <ellipse cx="37.5" cy="38" rx="5" ry="3.8" transform="rotate(-18 37.5 38)"/>
        <path d="M22.6 41 V19.4 l19.8 -3.8 V37.4 h-2.6 V22.4 l-14.6 2.8 V41 z"/>
        <path d="M22.6 15.6 L42.4 11.8 v5.2 L22.6 20.8 z"/>
      </g>`
  }));

  const facetime = () => icon(p => ({
    defs: grad(p + "g", [[0, "#9be36f"], [0.5, "#4fbb2f"], [1, "#2f8f13"]]),
    body: `<rect width="57" height="57" fill="url(#${p}g)"/>
      <rect x="10" y="18" width="26" height="21" rx="4" fill="#fff"/>
      <path d="M38 24 L47 18.5 L47 38.5 L38 33 z" fill="#fff"/>`
  }));

  return {
    messages, calendar, photos, camera, videos, weather, passbook, notes,
    reminders, clock: clockIcon, maps, stocks, newsstand, itunes, appstore,
    gamecenter, settings, contacts, calculator, compass, voicememos, terminal,
    phone, mail, safari, music, facetime
  };
})();
