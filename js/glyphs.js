/* ===================================================================
   iOS 6 · Arch Edition — interface glyphs
   Monochrome SVG symbols in the iOS 6 style (fill: currentColor), used
   in tab bars, toolbars, nav buttons and settings rows instead of emoji.
   =================================================================== */
"use strict";

const Glyphs = (() => {
  const S = body =>
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${body}</svg>`;
  const stroke = (d, w = 2.2, extra = "") =>
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

  /* ---- generic ---- */
  const star = () => S(`<path d="M12 1.8l3.1 6.3 7 1-5.1 5 1.2 6.9L12 17.7 5.8 21l1.2-6.9-5.1-5 7-1z"/>`);
  const clock = () => S(`<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/>` +
    stroke("M12 6.5V12l3.8 2.3", 2));
  const person = () => S(`<circle cx="12" cy="7.3" r="4.3"/><path d="M3.6 21c.5-4.9 4-7.4 8.4-7.4s7.9 2.5 8.4 7.4z"/>`);
  const keypadG = () => {
    let dots = "";
    [5.2, 10.4, 15.6, 20.4].forEach((y, r) => [6, 12, 18].forEach(x => {
      if (r < 3 || x === 12) dots += `<circle cx="${x}" cy="${y}" r="2.1"/>`;
    }));
    return S(dots);
  };
  const voicemail = () => S(
    `<circle cx="6.3" cy="11" r="4" fill="none" stroke="currentColor" stroke-width="2.4"/>` +
    `<circle cx="17.7" cy="11" r="4" fill="none" stroke="currentColor" stroke-width="2.4"/>` +
    `<rect x="6.3" y="13.8" width="11.4" height="2.4"/>`);
  const phone = () => S(`<path d="M6.9 3.1c1.3-1.1 2.7-.9 3.4.4l1.5 2.6c.6 1.1.3 2.3-.7 3.1-.8.6-1 1.2-.4 2.2.8 1.5 2 2.7 3.5 3.5 1 .6 1.6.4 2.2-.4.8-1 2-1.3 3.1-.7l2.6 1.5c1.3.7 1.5 2.1.4 3.4-.9 1.1-2.4 1.9-4 1.6-3.3-.6-6.7-2.6-9.3-5.2S4.7 9 4.1 5.7c-.3-1.6.5-3.1 1.6-4z" transform="rotate(4 12 12)"/>`);
  const globe = () => S(
    `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<ellipse cx="12" cy="12" rx="4.4" ry="9.5" fill="none" stroke="currentColor" stroke-width="1.6"/>` +
    stroke("M2.8 12h18.4M4.2 7h15.6M4.2 17h15.6", 1.6));
  const alarm = () => S(
    `<circle cx="12" cy="13.3" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/>` +
    stroke("M12 8.6v4.7l3.3 2", 1.9) +
    stroke("M5.6 5.2 3 7.7M18.4 5.2 21 7.7", 2.4) +
    stroke("M6.3 20.3 4.9 21.8M17.7 20.3l1.4 1.5", 2));
  const stopwatch = () => S(
    `<rect x="10.2" y="1.2" width="3.6" height="2.4"/><rect x="11.2" y="3" width="1.6" height="2"/>` +
    `<circle cx="12" cy="14" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/>` +
    stroke("M12 14 15.6 9.8", 2) + stroke("M18 4.6l1.8 1.8", 2));
  const timer = () => S(
    `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/>` +
    `<path d="M12 12V3.6A8.4 8.4 0 0 1 19.7 8.8z"/>`);
  const cameraG = () => S(
    `<path fill-rule="evenodd" d="M8.6 5.6 9.9 3.4h4.2l1.3 2.2H19a2.3 2.3 0 0 1 2.3 2.3v10.2A2.3 2.3 0 0 1 19 20.4H5a2.3 2.3 0 0 1-2.3-2.3V7.9A2.3 2.3 0 0 1 5 5.6zM12 17.5a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2z"/>` +
    `<circle cx="12" cy="12.9" r="2.7"/>`);
  const compose = () => S(
    `<path d="M15.5 6H5.4A2.4 2.4 0 0 0 3 8.4v10.2A2.4 2.4 0 0 0 5.4 21h10.2a2.4 2.4 0 0 0 2.4-2.4V10l-2.4 2.4v5.2a1 1 0 0 1-1 1H6.4a1 1 0 0 1-1-1V9.4a1 1 0 0 1 1-1h6.7z"/>` +
    `<path d="M10.8 13.2 19.9 4l-2.4-1.4-8.3 9.2-.6 2.6z"/><path d="M20.8 3.1 22 1.6 20.4.7l-1.2 1.5z"/>`);
  const share = () => S(
    `<path d="M12 1.6 16.8 7h-3.3v7.4h-3V7H7.2z"/>` +
    `<path d="M4.6 10.6h4.6V13H7v6.8h10V13h-2.2v-2.4h4.6V22H4.6z"/>`);
  const refresh = () => S(
    `<path d="M19.6 12A7.6 7.6 0 1 1 12 4.4V1.6l5.2 3.9L12 9.4V6.7a5.3 5.3 0 1 0 5.3 5.3z"/>`);
  const folder = () => S(`<path d="M2.8 5h6.4l2 2.4h10V18.6a2 2 0 0 1-2 2H4.8a2 2 0 0 1-2-2z"/>`);
  const trash = () => S(
    `<path d="M9.2 2.8h5.6l.8 1.8H20v2.2H4V4.6h4.4z"/>` +
    `<path d="M5.4 8.6h13.2l-1 12a1.9 1.9 0 0 1-1.9 1.8H8.3a1.9 1.9 0 0 1-1.9-1.8z"/>`);
  const reply = () => S(`<path d="M10 4.4 2.8 10.8 10 17.2v-4.1c4.9 0 8 1.6 10.4 5.2-.7-6.4-4.6-9.7-10.4-9.9z"/>`);
  const chevL = () => S(stroke("M15.6 3.4 7 12l8.6 8.6", 3));
  const chevR = () => S(stroke("M8.4 3.4 17 12l-8.6 8.6", 3));
  const book = () => S(
    `<path d="M11.2 5.4C9.3 3.8 6.6 3.2 2.8 3.5v14.2c3.8-.3 6.5.3 8.4 1.9z"/>` +
    `<path d="M12.8 5.4c1.9-1.6 4.6-2.2 8.4-1.9v14.2c-3.8-.3-6.5.3-8.4 1.9z"/>`);
  const pages = () => S(
    `<rect x="7.6" y="3" width="13.2" height="13.2" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/>` +
    `<path d="M4.2 7.4A2.2 2.2 0 0 0 3.2 9.2v9.4A2.4 2.4 0 0 0 5.6 21H15a2.2 2.2 0 0 0 1.9-1.1H5.4a1.2 1.2 0 0 1-1.2-1.2z"/>`);
  const locate = () => S(`<path d="M2.6 11.4 21.4 3 13 21.4l-1.7-8z"/>`);
  const directions = () => S(`<path d="M8.6 21.2v-7.4a3.4 3.4 0 0 1 3.4-3.4h3.6V7l5.4 4.8-5.4 4.8v-3.4h-2.8a1 1 0 0 0-1 1v7z"/>`);
  const mute = () => S(
    `<rect x="9.3" y="2.6" width="5.4" height="10.4" rx="2.7"/>` +
    `<path d="M5.8 10.8a6.2 6.2 0 0 0 12.4 0h2.2a8.4 8.4 0 0 1-7.3 7.8v2.8h-2.2v-2.8a8.4 8.4 0 0 1-7.3-7.8z"/>` +
    stroke("M4 3.6 20 20.4", 2.4));
  const speaker = () => S(
    `<path d="M3.6 9v6h4.2l6 5V4l-6 5z"/>` +
    stroke("M16.6 8.6a4.8 4.8 0 0 1 0 6.8M19 6.2a8.2 8.2 0 0 1 0 11.6", 2));
  const plus = () => S(`<path d="M10.5 3.4h3v7.1h7.1v3h-7.1v7.1h-3v-7.1H3.4v-3h7.1z"/>`);
  const video = () => S(
    `<rect x="2.4" y="6" width="13" height="12" rx="2.4"/>` +
    `<path d="M16.6 10.4 21.6 6.8v10.4l-5-3.6z"/>`);
  const gearG = () => {
    let teeth = "";
    for (let i = 0; i < 8; i++)
      teeth += `<rect x="-1.7" y="-11.6" width="3.4" height="4.6" transform="rotate(${i * 45} 0 0)"/>`;
    return S(`<g transform="translate(12 12)">${teeth}<circle r="8.2"/><circle r="3.4" fill="#00000055"/></g>`);
  };
  const bell = () => S(
    `<path d="M12 2.4c3.6 0 6.1 2.7 6.1 6.7 0 4.1 1 5.6 2.6 7.1H3.3C4.9 14.7 5.9 13.2 5.9 9.1c0-4 2.5-6.7 6.1-6.7z"/>` +
    `<path d="M9.4 17.6a2.6 2.6 0 0 0 5.2 0z"/>`);
  const moon = () => S(`<path d="M14.8 2.8a9.4 9.4 0 1 0 6.4 16A10.9 10.9 0 0 1 14.8 2.8z"/>`);
  const plane = () => S(`<path d="M10.4 21.2v-2.1l1.6-1.6v-4.9L2.8 16v-2.7l9.2-5.7V3.2a1.5 1.5 0 0 1 3 0v4.4l9.2 5.7V16l-9.2-3.4v4.9l1.6 1.6v2.1l-3.1-1z"/>`);
  const wifiG = () => S(
    `<path d="M12 19.6 8.4 15.3a5.6 5.6 0 0 1 7.2 0z"/>` +
    `<path d="M5.5 11.9a10.2 10.2 0 0 1 13 0l-2.2 2.2a7.2 7.2 0 0 0-8.6 0z"/>` +
    `<path d="M2.2 8.4a15.4 15.4 0 0 1 19.6 0l-2.2 2.3a12.4 12.4 0 0 0-15.2 0z"/>`);
  const hand = () => S(`<path d="M7.8 12.2V5a1.3 1.3 0 0 1 2.6 0v5.7h.9V3.4a1.3 1.3 0 0 1 2.6 0v7.3h.9V4.6a1.3 1.3 0 0 1 2.6 0v7.6h.9V7.4a1.2 1.2 0 0 1 2.4 0v8c0 4.1-2.8 6.8-6.8 6.8-3.2 0-5-1.4-6.7-4.3l-2.4-4.2c-.6-1-.3-2 .5-2.4.8-.5 1.8-.2 2.5 1z"/>`);
  const cloudG = () => S(`<path d="M7 18.4a4.6 4.6 0 0 1-.4-9.2 6.2 6.2 0 0 1 11.9 1.7 3.9 3.9 0 0 1-.9 7.5z"/>`);
  const bubble = () => S(`<path d="M12 2.8C6.4 2.8 1.8 6.2 1.8 10.5c0 2.4 1.5 4.6 3.8 6-.2 1.4-.8 2.6-1.8 3.5 1.9-.2 3.5-.8 4.8-1.7 1.1.3 2.2.4 3.4.4 5.6 0 10.2-3.5 10.2-7.7S17.6 2.8 12 2.8z"/>`);
  const sunG = () => {
    let rays = "";
    for (let i = 0; i < 8; i++)
      rays += `<rect x="-1.3" y="-11.4" width="2.6" height="4.4" rx="1.3" transform="rotate(${i * 45} 0 0)"/>`;
    return S(`<g transform="translate(12 12)"><circle r="5.2"/>${rays}</g>`);
  };
  const chart = () => S(`<path d="M3.2 16.8 8.8 10.6l3.5 3 5.6-7.6 2.2 1.6-7.5 10.1-3.5-3-4.2 4.7z"/><path d="M3 19.6h18v2.2H3z"/>`);
  const search = () => S(
    `<circle cx="10" cy="10" r="6.4" fill="none" stroke="currentColor" stroke-width="2.6"/>` +
    stroke("M15 15l6 6", 3));
  const download = () => S(
    `<path d="M12 14.8 7.2 9.4h3.3V2.6h3v6.8h3.3z"/>` +
    `<path d="M4.6 12.8v8.6h14.8v-8.6h-2.4v6.2H7v-6.2z"/>`);
  const play = () => S(`<path d="M7 4.2l13.2 7.8L7 19.8z"/>`);
  const pause = () => S(`<rect x="6" y="4.6" width="4.2" height="14.8"/><rect x="13.8" y="4.6" width="4.2" height="14.8"/>`);
  const prev = () => S(`<rect x="4.6" y="5" width="2.6" height="14"/><path d="M20.2 5 9.4 12l10.8 7z"/>`);
  const next = () => S(`<rect x="16.8" y="5" width="2.6" height="14"/><path d="M3.8 5l10.8 7L3.8 19z"/>`);
  const info = () => S(
    `<circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<rect x="10.8" y="10.2" width="2.4" height="6.8"/><circle cx="12" cy="7.2" r="1.5"/>`);
  const bluetooth = () => S(stroke("M6.4 7.2 17.2 16.4 11.6 21V3l5.6 4.6L6.4 16.8", 2.2));
  const compassMini = () => S(
    `<circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<path d="M16.6 7.4l-3.3 5.9-5.9 3.3 3.3-5.9z"/>`);
  const envelope = () => S(
    `<rect x="2.4" y="4.8" width="19.2" height="14.4" rx="2" fill="none" stroke="currentColor" stroke-width="2.1"/>` +
    stroke("M3.6 6.8 12 13.4 20.4 6.8", 2.1));
  const bolt = () => S(`<path d="M13.4 1.8 5.2 13.2h4.6L9 22.2l8.6-11.8h-4.8z"/>`);
  const lock = () => S(
    `<path d="M7.2 10V7.8a4.8 4.8 0 0 1 9.6 0V10h-2.4V7.8a2.4 2.4 0 0 0-4.8 0V10z"/>` +
    `<rect x="4.8" y="10" width="14.4" height="11" rx="2"/>`);
  const arrowUp = () => S(`<path d="M12 2.4 19.2 10h-4.5v11.2H9.3V10H4.8z"/>`);
  const note = () => S(`<path d="M9.2 18.6a2.9 2.5 0 1 1-1-1.9l-.1-11.3L19.5 3v11.6a2.9 2.5 0 1 1-1-1.9V6.5l-9.3 2z"/>`);
  const film = () => S(
    `<rect x="2.6" y="4.4" width="18.8" height="15.2" rx="2"/>` +
    [6.4, 12, 17.6].map(y => `<rect x="4.2" y="${y}" width="2.2" height="2.6" fill="#00000066"/><rect x="17.6" y="${y}" width="2.2" height="2.6" fill="#00000066"/>`).join("") +
    `<path d="M10.4 9.4l4.6 2.6-4.6 2.6z" fill="#00000066"/>`);
  const flip = () => S(
    `<path d="M7.4 8.2H17l-2.6-2.6L16 4l5.4 5.4-5.4 5.4-1.6-1.6 2.6-2.6H7.4z" transform="translate(0 -1.4)"/>` +
    `<path d="M16.6 15.8H7l2.6-2.6L8 11.6 2.6 17 8 22.4l1.6-1.6L7 18.2h9.6z" transform="translate(0 -0.6)"/>`);

  /* ---- weather condition glyphs (small, colored) ---- */
  const W = body => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const wSunBody = (cx = 12, cy = 12, r = 5) => {
    let rays = "";
    for (let i = 0; i < 8; i++)
      rays += `<rect x="-1.1" y="${-r - 5.4}" width="2.2" height="3.8" rx="1.1" transform="rotate(${i * 45} 0 0)" fill="#ffd94a"/>`;
    return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="#ffd94a" stroke="#e8a819" stroke-width=".8"/>${rays}</g>`;
  };
  const wCloudBody = (o = 0) =>
    `<path d="M8 ${19 + o}a4.2 4.2 0 0 1-.4-8.4 5.6 5.6 0 0 1 10.7 1.6 3.5 3.5 0 0 1-.8 6.8z" fill="#f4f6f9" stroke="#b9c2cf" stroke-width=".8"/>`;
  const wsun = () => W(wSunBody());
  const wpartly = () => W(wSunBody(15.5, 8, 4) + wCloudBody(0));
  const wrain = () => W(wCloudBody(-3) +
    [7.5, 12, 16.5].map(x => `<line x1="${x}" y1="18.4" x2="${x - 1.6}" y2="22" stroke="#4a90d9" stroke-width="1.8" stroke-linecap="round"/>`).join(""));
  const wstorm = () => W(wCloudBody(-3) +
    `<path d="M12.8 16.6 9 21.4h2.4l-1 2.8 4-4.8H12z" fill="#ffd94a" stroke="#e8a819" stroke-width=".6"/>`);

  return {
    star, clock, person, keypad: keypadG, voicemail, phone, globe, alarm,
    stopwatch, timer, camera: cameraG, compose, share, refresh, folder, trash,
    reply, chevL, chevR, book, pages, locate, directions, mute, speaker, plus,
    video, gear: gearG, bell, moon, plane, wifi: wifiG, hand, cloud: cloudG,
    bubble, sun: sunG, chart, search, download, play, pause, prev, next, info,
    bluetooth, compassMini, envelope, flip, note, film, bolt, lock, arrowUp,
    wsun, wpartly, wrain, wstorm
  };
})();
