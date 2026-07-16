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
  const GLOSS = `<path d="M0,0 h57 v20 c-14,7 -43,7 -57,0 z" fill="#ffffff" opacity="0.22"/>`;

  function icon(build, { gloss = true } = {}) {
    const p = "i" + (uid++) + "_";
    const { defs, body } = build(p);
    return `<svg viewBox="0 0 57 57" xmlns="http://www.w3.org/2000/svg">
      <defs>${defs}</defs>${body}${gloss ? GLOSS : ""}</svg>`;
  }

  /* ---- individual icons ---- */

  const messages = () => icon(p => ({
    defs: grad(p + "g", [[0, "#8ee968"], [0.5, "#4fc72d"], [1, "#2f9e13"]]),
    body: `<rect width="57" height="57" fill="url(#${p}g)"/>
      <path d="M28.5 12c-10.2 0-18.5 6.4-18.5 14.3 0 4.5 2.7 8.5 6.9 11.1-.3 2.4-1.3 4.7-3.2 6.4 3.4-.3 6.4-1.5 8.7-3.2 1.9.5 4 .8 6.1.8 10.2 0 18.5-6.4 18.5-14.3S38.7 12 28.5 12z"
        fill="#fff" stroke="#1d7a08" stroke-width="1"/>`
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
    let petals = "";
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const colors = ["#f6d54a", "#f2a93b", "#e8712f", "#d8452f", "#b23a8f", "#4a63c8", "#3a9ad8", "#58c04a"];
      petals += `<ellipse cx="${28.5 + Math.cos(a) * 12}" cy="${26 + Math.sin(a) * 12}" rx="7.5" ry="4.6"
        transform="rotate(${a * 180 / Math.PI} ${28.5 + Math.cos(a) * 12} ${26 + Math.sin(a) * 12})"
        fill="${colors[i]}" opacity="0.92"/>`;
    }
    return {
      defs: grad(p + "w", [[0, "#fdfdfd"], [1, "#d8dbe0"]]),
      body: `<rect width="57" height="57" fill="url(#${p}w)"/>${petals}
        <circle cx="28.5" cy="26" r="5" fill="#fff" stroke="#e0c040" stroke-width="1.5"/>`
    };
  });

  const camera = () => icon(p => ({
    defs: grad(p + "g", [[0, "#c3c9d1"], [0.5, "#9aa2ad"], [1, "#7b8391"]]) +
          rgrad(p + "l", [[0, "#9fc3e8"], [0.5, "#33557e"], [1, "#101d30"]]),
    body: `<rect width="57" height="57" fill="url(#${p}g)"/>
      <rect x="6" y="16" width="45" height="28" rx="4" fill="#5b626d" stroke="#3d434c"/>
      <rect x="10" y="12" width="12" height="6" rx="2" fill="#5b626d"/>
      <circle cx="28.5" cy="30" r="10.5" fill="#2c313a"/>
      <circle cx="28.5" cy="30" r="8" fill="url(#${p}l)"/>
      <circle cx="25.5" cy="27" r="2.4" fill="#cfe4f5" opacity="0.8"/>
      <circle cx="44" cy="21" r="2" fill="#f2d24a"/>`
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
      <path d="M28 14 l14 14 M28 28 l14 -14" stroke="#e8624a" stroke-width="0" fill="none"/>
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

  const settings = () => icon(p => ({
    defs: grad(p + "bg", [[0, "#b4b8bf"], [1, "#7f848d"]]) + grad(p + "m", [[0, "#e8eaee"], [1, "#9aa0a8"]]),
    body: `<rect width="57" height="57" fill="url(#${p}bg)"/>
      ${gear(20, 22, 11, "#5d636d", p, 10)}
      ${gear(39, 38, 8, "#6d737d", p, 9)}`
  }));

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
    defs: grad(p + "s", [[0, "#a5c8ec"], [0.55, "#5a93d8"], [1, "#2f6ab8"]]),
    body: `<rect width="57" height="57" fill="url(#${p}s)"/>
      <rect x="7" y="16" width="43" height="26" rx="3" fill="#f2f4f7" stroke="#8b93a1"/>
      <path d="M7 18 L28.5 33 L50 18" fill="none" stroke="#8b93a1" stroke-width="1.6"/>
      <path d="M7 41 L22 29 M50 41 L35 29" stroke="#8b93a1" stroke-width="1.2"/>`
  }));

  const safari = () => icon(p => ({
    defs: rgrad(p + "b", [[0, "#bfe0f7"], [0.45, "#3f8fdd"], [1, "#1244a0"]]),
    body: `<rect width="57" height="57" fill="url(#${p}b)"/>
      <circle cx="28.5" cy="28.5" r="20" fill="#f2f5f8" stroke="#c5ccd6"/>
      <circle cx="28.5" cy="28.5" r="18" fill="url(#${p}b)"/>
      ${Array.from({ length: 24 }, (_, i) => {
        const a = i * Math.PI / 12;
        const long = i % 2 === 0;
        return `<line x1="${28.5 + Math.cos(a) * (long ? 14.5 : 15.8)}" y1="${28.5 + Math.sin(a) * (long ? 14.5 : 15.8)}"
                      x2="${28.5 + Math.cos(a) * 17.3}" y2="${28.5 + Math.sin(a) * 17.3}" stroke="#fff" stroke-width="1"/>`;
      }).join("")}
      <path d="M39 18 L31.5 31.5 L18 39 L25.5 25.5 z" fill="#fff"/>
      <path d="M39 18 L31.5 31.5 L25.5 25.5 z" fill="#e84e3c"/>`
  }));

  const music = () => icon(p => ({
    defs: rgrad(p + "o", [[0, "#fbc370"], [0.5, "#f5872f"], [1, "#e05a12"]]),
    body: `<rect width="57" height="57" fill="url(#${p}o)"/>
      <path d="M22 40.5 a4.5 3.8 0 1 1 -1.6 -3 L20.4 18 L40 14 L40 36.5 a4.5 3.8 0 1 1 -1.6 -3 L38.4 19.5 L22 23 z" fill="#fff"/>`
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
