/* ===================================================================
   iOS 6 · Arch Edition — Messages, Phone, Contacts, Mail
   =================================================================== */
"use strict";

/* =================================================================
   Shared: in-call screen (used by Phone app & contact pages)
   ================================================================= */

const CallSession = (() => {
  let timerId = null, ringId = null;

  function end(screenEl) {
    clearInterval(timerId); clearTimeout(ringId);
    timerId = ringId = null;
    screenEl.remove();
  }

  function start(parent, { name, number }) {
    const stateEl = h("div", "call-state", "calling mobile…");
    const grid = h("div", "call-grid",
      [["🔇", "mute"], ["🔢", "keypad"], ["🔊", "speaker"],
       ["➕", "add call"], ["📹", "FaceTime"], ["👤", "contacts"]].map(([ico, lbl]) => {
        const d = h("div", null, h("div", "cg-ico", ico), h("div", null, lbl));
        d.addEventListener("click", () => { Snd.click(); d.classList.toggle("active"); });
        return d;
      }));
    const scr = h("div", "call-screen",
      h("div", "call-name", name || number || "Unknown"),
      stateEl, grid,
      h("button", { class: "call-end", onclick: () => { Snd.lockSnd(); end(scr); } }, "End"));
    parent.append(scr);

    Snd.ring(0.3); Snd.ring(2.4);
    let secs = 0;
    ringId = setTimeout(() => {
      stateEl.textContent = "00:00";
      timerId = setInterval(() => {
        secs++;
        stateEl.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
      }, 1000);
    }, 4200);

    PhoneApp.addRecent({ name: name || number, time: fmtTime(new Date()), type: "out" });
    return scr;
  }

  function cleanup() { clearInterval(timerId); clearTimeout(ringId); timerId = ringId = null; }
  return { start, cleanup };
})();

/* =================================================================
   Shared: contact detail view
   ================================================================= */

function contactDetailView(nav, c, appRoot) {
  const initials = (c.first[0] || "") + (c.last[0] || "");
  const view = navView(
    navbar("Info", { left: backBtn("Back", () => nav.pop()) }),
    h("div", "content grouped",
      h("div", "ct-head",
        h("div", "ct-avatar", initials.toUpperCase()),
        h("div", null, h("div", "ct-fullname", contactName(c)),
          c.imessage ? h("div", { style: { fontSize: "12px", color: "#5b74a8" } }, "iMessage") : null)),
      group(
        cell({ label: "mobile", value: c.phone, onTap: () => CallSession.start(appRoot, { name: contactName(c), number: c.phone }) })),
      group(
        cell({ label: "home", value: c.email, onTap: () => IOS.open("mail") })),
      group(
        cell({ label: "Send Message", onTap: () => { IOS.open("messages"); setTimeout(() => MessagesApp.openThreadFor(c.id), 50); } }),
        cell({ label: "FaceTime", right: h("span", { style: { fontSize: "15px" } }, "📹"), onTap: () =>
          showAlert({ title: "FaceTime Unavailable", text: contactName(c) + " is not available for FaceTime." }) }),
        cell({ label: "Share Contact", onTap: () => showSheet([
          { label: "Email Contact", onTap: () => IOS.open("mail") },
          { label: "Message Contact", onTap: () => IOS.open("messages") },
          { label: "Cancel", style: "cancel" }]) }))));
  return view;
}

function contactListInto(nav, contentEl, appRoot, { grouped = false } = {}) {
  const sorted = [...CONTACTS].sort((a, b) => (a.last || a.first).localeCompare(b.last || b.first));
  let letter = "";
  sorted.forEach(c => {
    const l = ((c.last || c.first)[0] || "#").toUpperCase();
    if (l !== letter) { letter = l; contentEl.append(h("div", "ct-sec", l)); }
    const row = cell({
      label: h("span", null, c.first + " ", h("b", null, c.last)),
      onTap: () => nav.push(contactDetailView(nav, c, appRoot))
    });
    contentEl.append(row);
  });
  const idx = h("div", "ct-index", "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => h("div", null, ch)));
  contentEl.append(idx);
}

/* =================================================================
   Messages
   ================================================================= */

const MessagesApp = (() => {
  let nav = null, appRoot = null, replyTimer = null;

  function unreadCount() { return THREADS.filter(t => t.unread).length; }

  function threadCellPreview(t) {
    const last = t.msgs[t.msgs.length - 1];
    return last ? (last.kind === "photo" ? "🖼 Photo" : last.text) : "";
  }

  function listView() {
    const list = h("div", "content list msg-list");
    THREADS.forEach(t => {
      const c = contactById(t.contact);
      const row = h("div", "cell",
        h("div", "msg-unread" + (t.unread ? "" : " off")),
        h("div", "msg-cell-main",
          h("div", "msg-cell-top",
            h("span", "msg-cell-name", contactName(c)),
            h("span", "msg-cell-time", t.time + " ›")),
          h("div", "msg-cell-preview", threadCellPreview(t))));
      row.addEventListener("click", () => { Snd.click(); openThread(t); });
      list.append(row);
    });
    return navView(
      navbar("Messages", {
        left: navBtn("Edit", () => {}),
        right: navBtn("✎", () => composeSheet())
      }),
      list);
  }

  function composeSheet() {
    showSheet([
      ...CONTACTS.slice(0, 3).map(c => ({ label: contactName(c), onTap: () => openThreadFor(c.id) })),
      { label: "Cancel", style: "cancel" }
    ]);
  }

  function bubbleEl(t, m) {
    if (m.kind === "photo") {
      const b = h("div", "bubble " + (m.dir === "in" ? "in" : (t.service === "imessage" ? "out-i" : "out-s")));
      b.append(h("img", { src: PhotoStore.get(m.photo) }));
      return b;
    }
    return h("div", "bubble " + (m.dir === "in" ? "in" : (t.service === "imessage" ? "out-i" : "out-s")), m.text);
  }

  function openThreadFor(contactId) {
    let t = THREADS.find(x => x.contact === contactId);
    if (!t) {
      const c = contactById(contactId);
      t = { id: contactId, contact: contactId, service: c.imessage ? "imessage" : "sms", unread: false, time: "Now", msgs: [], replies: ["👍", "Sounds good!", "Ok!"] };
      THREADS.unshift(t);
    }
    openThread(t);
  }

  function openThread(t) {
    t.unread = false;
    const c = contactById(t.contact);
    const chat = h("div", "chat");
    chat.append(h("div", "chat-daystamp", (t.service === "imessage" ? "iMessage" : "Text Message") + " · Today " + fmtTime(new Date())));
    t.msgs.forEach(m => chat.append(bubbleEl(t, m)));
    const lastOut = [...t.msgs].reverse().find(m => m.dir === "out");
    if (lastOut && lastOut.delivered && t.service === "imessage")
      chat.append(h("div", "chat-status", "Delivered"));

    const isIM = t.service === "imessage";
    const sendBtn = h("button", "msg-send", "Send");
    const field = kbField(isIM ? "iMessage" : "Text Message", {
      returnLabel: "Send", blueReturn: isIM,
      onChange: v => sendBtn.classList.toggle("ready", v.trim().length > 0),
      onReturn: () => doSend()
    });
    if (!isIM) sendBtn.classList.add("sms");

    function scrollDown() { chat.scrollTop = chat.scrollHeight; }

    function appendOut(msg) {
      t.msgs.push(msg);
      chat.querySelectorAll(".chat-status").forEach(x => x.remove());
      chat.append(bubbleEl(t, msg));
      if (isIM) chat.append(h("div", "chat-status", "Delivered"));
      t.time = fmtTime(new Date());
      Snd.sent();
      scrollDown();
      scheduleReply();
    }

    function doSend() {
      const text = field.value.trim();
      if (!text) return;
      field.value = "";
      sendBtn.classList.remove("ready");
      appendOut({ dir: "out", text, delivered: true });
    }

    function scheduleReply() {
      clearTimeout(replyTimer);
      replyTimer = setTimeout(() => {
        const typing = h("div", "bubble in typing", h("i"), h("i"), h("i"));
        chat.append(typing); scrollDown();
        replyTimer = setTimeout(() => {
          typing.remove();
          const pool = t.replies || ["Ok!"];
          const msg = { dir: "in", text: pool[(t._ri = ((t._ri || 0) + 1) % pool.length)] };
          t.msgs.push(msg);
          chat.append(bubbleEl(t, msg));
          Snd.received();
          scrollDown();
        }, 1600 + Math.random() * 1400);
      }, 900 + Math.random() * 900);
    }

    sendBtn.addEventListener("click", doSend);

    const camBtn = h("div", "msg-cam", "📷");
    camBtn.addEventListener("click", () => {
      Snd.click();
      showSheet([
        { label: "Take Photo or Video", onTap: () => IOS.open("camera") },
        { label: "Choose Existing", onTap: () => pickPhoto(url => {
            appendOut({ dir: "out", kind: "photo", photo: PhotoStore.all().indexOf(url) });
          }) },
        { label: "Cancel", style: "cancel" }
      ]);
    });

    const view = navView(
      navbar(contactName(c), {
        left: backBtn("Messages", () => nav.pop()),
        right: navBtn("Edit", () => {})
      }),
      chat,
      h("div", "msg-inputbar", camBtn, field, sendBtn));
    nav.push(view);
    setTimeout(scrollDown, 30);
  }

  function pickPhoto(onPick) {
    const wrap = h("div", { class: "sheet-wrap" });
    const grid = h("div", "photo-grid", PhotoStore.all().map(url => {
      const img = h("img", { src: url });
      img.addEventListener("click", () => { wrap.remove(); onPick(url); });
      return img;
    }));
    const panel = h("div", { class: "sheet", style: { maxHeight: "330px", overflowY: "auto" } },
      h("div", { style: { color: "#fff", fontWeight: "bold", textAlign: "center", padding: "2px 0 6px" } }, "Camera Roll"),
      grid,
      h("button", { class: "cancel", onclick: () => wrap.remove(), style: { marginTop: "8px" } }, "Cancel"));
    wrap.append(panel);
    wrap.addEventListener("click", e => { if (e.target === wrap) wrap.remove(); });
    $id("screen").append(wrap);
  }

  IOS.register({
    id: "messages",
    name: "Messages",
    icon: Icons.messages,
    statusbar: "blue",
    badge: unreadCount,
    onClose() { clearTimeout(replyTimer); },
    render(root) {
      appRoot = root;
      nav = new UINav(root);
      nav.push(listView(), false);
    }
  });

  return { openThreadFor };
})();

/* =================================================================
   Phone
   ================================================================= */

const PhoneApp = (() => {
  const RECENTS = [
    { name: "Mom", time: "9:15 AM", type: "in" },
    { name: "Kate Bell", time: "Yesterday", type: "missed" },
    { name: "Natalia Maric", time: "Yesterday", type: "out" },
    { name: "(555) 284-1103", time: "Tuesday", type: "missed" },
    { name: "Zach Wood", time: "Monday", type: "out" }
  ];
  function addRecent(r) { RECENTS.unshift(r); }

  const KEYS = [
    ["1", ""], ["2", "ABC"], ["3", "DEF"],
    ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
    ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
    ["*", ""], ["0", "+"], ["#", ""]
  ];

  function render(root) {
    const body = h("div", { class: "content", style: { display: "flex", flexDirection: "column", padding: "0" } });
    const tabs = [
      ["★", "Favorites"], ["🕐", "Recents"], ["👤", "Contacts"], ["⠿", "Keypad"], ["✉", "Voicemail"]
    ];
    let active = 3;
    const tabbar = h("div", "tabbar", tabs.map(([ico, lbl], i) => {
      const t = h("div", "tab" + (i === active ? " on" : ""), h("div", "t-ico", ico), h("div", null, lbl));
      t.addEventListener("click", () => { Snd.click(); active = i; [...tabbar.children].forEach((x, j) => x.classList.toggle("on", j === i)); show(i); });
      return t;
    }));

    root.append(body, tabbar);

    function show(i) {
      body.innerHTML = "";
      [favView, recentsView, contactsView, keypadView, vmView][i]();
    }

    /* --- keypad --- */
    function keypadView() {
      let number = "";
      const numEl = h("div", "ph-number");
      const hintEl = h("div", "ph-name-hint");
      const upd = () => {
        numEl.textContent = number;
        const c = contactByNumber(number);
        hintEl.textContent = c ? contactName(c) : "";
      };
      const pad = h("div", "keypad", KEYS.map(([n, l]) => {
        const k = h("div", "kp-key", h("div", "kp-num", n), h("div", "kp-let", l || " "));
        k.addEventListener("click", () => { Snd.dtmf(n); number += n; upd(); });
        return k;
      }));
      const call = h("div", "kp-call", "📞", h("span", null, "Call"));
      call.addEventListener("click", () => {
        if (!number) return;
        const c = contactByNumber(number);
        CallSession.start(root, { name: c ? contactName(c) : null, number });
      });
      const del = h("div", "kp-side", "⌫");
      del.addEventListener("click", () => { Snd.click(); number = number.slice(0, -1); upd(); });
      const addC = h("div", "kp-side", "👤+");
      body.append(
        h("div", "ph-display", numEl, hintEl),
        pad,
        h("div", "kp-actions", addC, call, del));
    }

    /* --- favorites --- */
    function favView() {
      body.append(navbar("Favorites", { right: navBtn("+", () => {}) }));
      const list = h("div", { class: "content list", style: { flex: "1" } });
      CONTACTS.filter(c => c.fav).forEach(c => {
        list.append(cell({
          label: contactName(c),
          right: h("span", "fav-star", "mobile"),
          chev: true,
          onTap: () => CallSession.start(root, { name: contactName(c), number: c.phone })
        }));
      });
      body.append(list);
    }

    /* --- recents --- */
    function recentsView() {
      let filter = 0;
      const list = h("div", { class: "content list", style: { flex: "1" } });
      const paint = () => {
        list.innerHTML = "";
        RECENTS.filter(r => filter === 0 || r.type === "missed").forEach(r => {
          list.append(cell({
            label: h("span", { style: r.type === "missed" ? { color: "#c0392b" } : null }, r.name),
            sub: (r.type === "out" ? "Outgoing Call" : r.type === "in" ? "Incoming Call" : "Missed Call"),
            value: r.time, chev: true,
            onTap: () => CallSession.start(root, { name: r.name })
          }));
        });
        if (!list.children.length) list.append(h("div", "empty-msg", "No Missed Calls"));
      };
      body.append(navbar("", { titleEl: seg(["All", "Missed"], 0, i => { filter = i; paint(); }) }), list);
      paint();
    }

    /* --- contacts tab --- */
    function contactsView() {
      body.append(navbar("All Contacts", { right: navBtn("+", () => {}) }));
      const wrap = h("div", { class: "content list", style: { flex: "1", position: "relative" } });
      // lightweight inline nav: pushing replaces the tab body, popping re-shows the tab
      const localNav = {
        push(v) {
          body.innerHTML = "";
          body.append(v);
        },
        pop() { show(2); }
      };
      contactListInto(localNav, wrap, root);
      body.append(wrap);
    }

    /* --- voicemail --- */
    function vmView() {
      body.append(navbar("Voicemail", { right: navBtn("Greeting", () => {}) }));
      const list = h("div", { class: "content list", style: { flex: "1" } });
      VOICEMAILS.forEach(v => {
        list.append(cell({
          label: v.from, sub: v.time,
          right: h("span", "vm-cell-play", "▶"),
          value: v.dur,
          onTap: () => showAlert({ title: "Voicemail", text: "“Hi, it's " + v.from + " — call me back when you can!”" })
        }));
      });
      list.append(h("div", "group-foot", "Voicemail is simulated. Your carrier is a JavaScript closure."));
      body.append(list);
    }

    show(active);
  }

  IOS.register({
    id: "phone",
    name: "Phone",
    icon: Icons.phone,
    statusbar: "blue",
    badge: () => 1,
    onClose() { CallSession.cleanup(); },
    render
  });

  return { addRecent };
})();

/* =================================================================
   Contacts (standalone)
   ================================================================= */

IOS.register({
  id: "contacts",
  name: "Contacts",
  icon: Icons.contacts,
  statusbar: "blue",
  render(root) {
    const nav = new UINav(root);
    const list = h("div", { class: "content list", style: { position: "relative" } });
    contactListInto(nav, list, root);
    nav.push(navView(
      navbar("All Contacts", { left: navBtn("Groups", () => {}), right: navBtn("+", () => {}) }),
      list), false);
  }
});

/* =================================================================
   Mail
   ================================================================= */

IOS.register({
  id: "mail",
  name: "Mail",
  icon: Icons.mail,
  statusbar: "blue",
  badge: () => MAILBOX.filter(m => m.unread).length,
  render(root) {
    const nav = new UINav(root);

    function inboxView() {
      const list = h("div", "content list msg-list");
      MAILBOX.forEach(m => {
        const row = h("div", "cell",
          h("div", "msg-unread" + (m.unread ? "" : " off")),
          h("div", "msg-cell-main",
            h("div", "msg-cell-top",
              h("span", "mail-from", m.from),
              h("span", "msg-cell-time", m.time + " ›")),
            h("div", "mail-subj", m.subject),
            h("div", "msg-cell-preview", m.body[0] + " " + (m.body[1] || ""))));
        row.addEventListener("click", () => { Snd.click(); m.unread = false; nav.push(messageView(m)); });
        list.append(row);
      });
      const compose = h("span", "tb-ico", "✎");
      compose.addEventListener("click", () => nav.push(composeView()));
      const refresh = h("span", "tb-ico", "↻");
      refresh.addEventListener("click", () => { Snd.click(); showAlert({ title: "Mail", text: "Checking for Mail…\nEverything is up to date (btw)." }); });
      return navView(
        navbar("Inbox" + (MAILBOX.some(m => m.unread) ? " (" + MAILBOX.filter(m => m.unread).length + ")" : ""), {
          left: navBtn("Mailboxes", () => {}, "back"),
          right: navBtn("Edit", () => {})
        }),
        list,
        h("div", "toolbar", refresh, h("span", "tb-ico disabled", "📁"), h("span", "tb-ico disabled", "🗑"), h("span", "tb-ico", "↩"), compose));
    }

    function messageView(m) {
      return navView(
        navbar(m.from, { left: backBtn("Inbox", () => nav.pop()) }),
        h("div", "content",
          h("div", "mail-hdr",
            h("div", "h-row", h("b", null, m.from)),
            h("div", "h-row", m.subject),
            h("div", "h-row", "Today " + m.time)),
          h("div", "mail-body-view", m.body.map(p => h("p", null, p)))));
    }

    function composeView() {
      const to = kbField("To:", { returnLabel: "next" });
      const subj = kbField("Subject", { returnLabel: "next" });
      const bodyF = kbField("", { returnLabel: "return" });
      bodyF.style.minHeight = "120px";
      bodyF.style.whiteSpace = "normal";
      return navView(
        navbar("New Message", {
          left: navBtn("Cancel", () => nav.pop()),
          right: navBtn("Send", () => {
            Snd.sent();
            nav.pop();
            showAlert({ title: "Sent", text: "Your message has been delivered to the outbox of imagination." });
          }, "blue")
        }),
        h("div", { class: "content", style: { padding: "8px", display: "flex", flexDirection: "column", gap: "6px" } },
          to, subj, bodyF));
    }

    nav.push(inboxView(), false);
  }
});
