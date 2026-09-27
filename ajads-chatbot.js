/*
 * AJADS AI — Drop-in Website Chatbot
 * -----------------------------------
 * INSTALL:
 * 1. Put this file beside index.html.
 * 2. Add this one line before </body>:
 *      <script src="ajads-chatbot.js"></script>
 *
 * It works immediately with a built-in AJADS project assistant.
 * For real LLM responses later, set:
 *      window.AJADS_CHAT_ENDPOINT = "/api/chat";
 * The endpoint should accept POST {message, history, lead}
 * and return JSON: { reply: "..." }.
 *
 * IMPORTANT: Never put an AI API secret/key in this public JS file.
 */

(() => {
  "use strict";

  if (window.__AJADS_CHATBOT_LOADED__) return;
  window.__AJADS_CHATBOT_LOADED__ = true;

  const ENDPOINT = window.AJADS_CHAT_ENDPOINT || "";
  const STORAGE_KEY = "ajads_ai_chat_v1";

  const css = `
  #ajads-ai-root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  #ajads-ai-root *{box-sizing:border-box}
  .ajads-ai-launcher{
    position:fixed;right:24px;bottom:24px;width:64px;height:64px;border:0;border-radius:50%;
    background:#111;color:#fff;cursor:pointer;z-index:2147483000;
    box-shadow:0 14px 45px rgba(0,0,0,.28),0 0 0 1px rgba(255,255,255,.12) inset;
    display:flex;align-items:center;justify-content:center;transition:.25s ease;
  }
  .ajads-ai-launcher:hover{transform:translateY(-3px) scale(1.03)}
  .ajads-ai-launcher:before{content:"";position:absolute;inset:-6px;border-radius:50%;
    border:1px solid rgba(255,255,255,.15);animation:ajPulse 2.5s infinite}
  .ajads-ai-icon{font-size:25px;line-height:1}
  @keyframes ajPulse{0%,100%{opacity:.25;transform:scale(.98)}50%{opacity:.8;transform:scale(1.05)}}

  .ajads-ai-panel{
    position:fixed;right:24px;bottom:98px;width:min(390px,calc(100vw - 28px));height:min(650px,calc(100vh - 120px));
    background:#0d0d0d;color:#fff;border:1px solid rgba(255,255,255,.13);border-radius:24px;
    overflow:hidden;z-index:2147482999;box-shadow:0 30px 90px rgba(0,0,0,.45);
    display:none;flex-direction:column;backdrop-filter:blur(18px);
  }
  .ajads-ai-panel.open{display:flex;animation:ajIn .24s ease}
  @keyframes ajIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
  .ajads-ai-head{padding:17px 18px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:center;gap:11px}
  .ajads-ai-mark{width:38px;height:38px;border-radius:13px;background:#fff;color:#111;display:grid;place-items:center;font-weight:900;font-size:13px}
  .ajads-ai-title{font-size:14px;font-weight:800;letter-spacing:.2px}
  .ajads-ai-status{font-size:11px;color:#9d9d9d;margin-top:2px}
  .ajads-ai-close{margin-left:auto;background:none;border:0;color:#aaa;font-size:24px;cursor:pointer;padding:3px 6px}
  .ajads-ai-messages{flex:1;overflow:auto;padding:18px 14px 12px;scroll-behavior:smooth}
  .ajads-ai-msg{display:flex;margin:0 0 12px}
  .ajads-ai-msg.user{justify-content:flex-end}
  .ajads-ai-bubble{max-width:86%;padding:11px 13px;border-radius:16px;background:#181818;color:#f4f4f4;
    font-size:13px;line-height:1.5;border:1px solid rgba(255,255,255,.06);white-space:pre-wrap}
  .ajads-ai-msg.user .ajads-ai-bubble{background:#fff;color:#111;border-radius:16px 16px 5px 16px}
  .ajads-ai-msg.bot .ajads-ai-bubble{border-radius:5px 16px 16px 16px}
  .ajads-ai-time{font-size:9px;color:#777;margin-top:5px}
  .ajads-ai-quick{display:flex;gap:7px;overflow-x:auto;padding:0 14px 10px;scrollbar-width:none}
  .ajads-ai-quick::-webkit-scrollbar{display:none}
  .ajads-ai-chip{flex:0 0 auto;border:1px solid rgba(255,255,255,.14);background:#141414;color:#ddd;border-radius:999px;
    padding:8px 11px;font-size:11px;cursor:pointer;transition:.18s}
  .ajads-ai-chip:hover{background:#fff;color:#111}
  .ajads-ai-compose{padding:10px 12px 13px;border-top:1px solid rgba(255,255,255,.09)}
  .ajads-ai-form{display:flex;gap:7px;background:#151515;border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:6px}
  .ajads-ai-input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;padding:8px;font-size:13px}
  .ajads-ai-input::placeholder{color:#777}
  .ajads-ai-send{width:38px;height:38px;border:0;border-radius:12px;background:#fff;color:#111;cursor:pointer;font-weight:900}
  .ajads-ai-note{font-size:9px;color:#666;text-align:center;margin-top:7px}
  .ajads-ai-lead{margin-top:9px;padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:#121212}
  .ajads-ai-lead input{width:100%;margin:4px 0;padding:9px 10px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:9px;color:#fff;outline:none;font-size:12px}
  .ajads-ai-lead button{width:100%;padding:10px;border:0;border-radius:9px;background:#fff;color:#111;font-weight:800;cursor:pointer;margin-top:4px}
  @media(max-width:520px){
    .ajads-ai-launcher{right:15px;bottom:15px;width:58px;height:58px}
    .ajads-ai-panel{right:10px;bottom:82px;width:calc(100vw - 20px);height:calc(100vh - 105px);border-radius:20px}
  }
  `;

  const style = document.createElement("style");
  style.id = "ajads-ai-style";
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "ajads-ai-root";
  root.innerHTML = `
    <button class="ajads-ai-launcher" aria-label="Open AJADS AI">
      <span class="ajads-ai-icon">✦</span>
    </button>
    <section class="ajads-ai-panel" aria-label="AJADS AI chat">
      <header class="ajads-ai-head">
        <div class="ajads-ai-mark">AI</div>
        <div>
          <div class="ajads-ai-title">AJADS AI</div>
          <div class="ajads-ai-status">Creative project assistant</div>
        </div>
        <button class="ajads-ai-close" aria-label="Close">×</button>
      </header>
      <div class="ajads-ai-messages"></div>
      <div class="ajads-ai-quick"></div>
      <div class="ajads-ai-compose">
        <form class="ajads-ai-form">
          <input class="ajads-ai-input" autocomplete="off" placeholder="Tell me what you want to create..." />
          <button class="ajads-ai-send" aria-label="Send">↑</button>
        </form>
        <div class="ajads-ai-note">AJADS AI • Turn your idea into a project brief</div>
      </div>
    </section>
  `;
  document.body.appendChild(root);

  const launcher = root.querySelector(".ajads-ai-launcher");
  const panel = root.querySelector(".ajads-ai-panel");
  const close = root.querySelector(".ajads-ai-close");
  const messages = root.querySelector(".ajads-ai-messages");
  const quick = root.querySelector(".ajads-ai-quick");
  const form = root.querySelector(".ajads-ai-form");
  const input = root.querySelector(".ajads-ai-input");

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {
    history: [],
    lead: {},
    stage: "start",
    service: ""
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const now = () => new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function addMessage(text, who="bot", persist=true) {
    const row = document.createElement("div");
    row.className = `ajads-ai-msg ${who}`;
    row.innerHTML = `<div><div class="ajads-ai-bubble">${esc(text)}</div><div class="ajads-ai-time">${now()}</div></div>`;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    if (persist) {
      state.history.push({role: who === "user" ? "user" : "assistant", content:text});
      state.history = state.history.slice(-30);
      save();
    }
  }

  function setQuick(items) {
    quick.innerHTML = "";
    items.forEach(label => {
      const b = document.createElement("button");
      b.className = "ajads-ai-chip";
      b.textContent = label;
      b.onclick = () => handleUser(label);
      quick.appendChild(b);
    });
  }

  function openChat() {
    panel.classList.add("open");
    launcher.style.display = "none";
    if (!messages.children.length) {
      addMessage("Hey! I’m AJADS AI. 👋\n\nTell me what you want to create — an advertisement, AI video, product shoot, branding, or just an idea you have in mind.");
      setQuick(["Advertisement","AI Video","Product Shoot","Branding","I have an idea"]);
    } else {
      setQuick(["Start Project","Our Services","I have an idea"]);
    }
    setTimeout(() => input.focus(), 100);
  }

  function closeChat() {
    panel.classList.remove("open");
    launcher.style.display = "flex";
  }

  function normalize(s) { return s.toLowerCase().trim(); }

  async function handleUser(text) {
    text = String(text).trim();
    if (!text) return;
    addMessage(text, "user");
    setQuick([]);

    if (ENDPOINT) {
      try {
        const r = await fetch(ENDPOINT, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({message:text, history:state.history, lead:state.lead})
        });
        if (!r.ok) throw new Error("AI endpoint error");
        const data = await r.json();
        addMessage(data.reply || "I’m ready. Tell me more about your project.");
        setQuick(["Start Project","Get a concept","Our Services"]);
        return;
      } catch(e) {
        addMessage("I’m temporarily using AJADS quick-assist mode. I can still help you build your project brief.");
      }
    }

    const x = normalize(text);

    if (x.includes("start project") || x.includes("send project") || x === "project") {
      state.stage = "name";
      save();
      addMessage("Great. Let’s turn your idea into a project brief.\n\nFirst, what’s your name?");
      return;
    }

    if (state.stage === "name") {
      state.lead.name = text; state.stage = "email"; save();
      addMessage("Nice to meet you, " + text + ". What’s the best email for your project?");
      return;
    }

    if (state.stage === "email") {
      state.lead.email = text; state.stage = "phone"; save();
      addMessage("Got it. What’s your WhatsApp or phone number?");
      return;
    }

    if (state.stage === "phone") {
      state.lead.phone = text; state.stage = "brief"; save();
      addMessage("Perfect. Now describe your project in your own words — even a rough idea is fine.");
      return;
    }

    if (state.stage === "brief") {
      state.lead.brief = text; state.stage = "done"; save();
      addMessage("Excellent. I’ve captured your project brief. 🚀\n\nName: " + state.lead.name +
        "\nEmail: " + state.lead.email +
        "\nPhone: " + state.lead.phone +
        "\n\nProject: " + state.lead.brief +
        "\n\nUse the Start Project button on the website to submit the full inquiry, or keep chatting and I’ll help shape the idea.");
      setQuick(["Get an ad concept","Our Services","Start Again"]);
      return;
    }

    if (x === "start again") {
      state.stage="start"; state.lead={}; save();
      addMessage("No problem. What are we creating?");
      setQuick(["Advertisement","AI Video","Product Shoot","Branding"]);
      return;
    }

    if (x.includes("service") || x.includes("what do you do")) {
      addMessage("AJADS can help with:\n\n• Creative advertisements\n• AI-generated commercial videos\n• Product-focused visual content\n• Branding and visual identity\n• Social media creative concepts\n\nTell me what you’re selling or promoting and I’ll help shape the direction.");
      setQuick(["Advertisement","AI Video","Product Shoot","Branding","Start Project"]);
      return;
    }

    if (x.includes("advertisement") || x.includes("ad") || x.includes("commercial")) {
      state.service="Advertisement"; save();
      addMessage("Great choice. What are you advertising?\n\nTell me the product/brand, platform, and the style you want — cinematic, luxury, energetic, minimal, realistic, AI-generated, etc.");
      setQuick(["Luxury","Cinematic","AI Generated","Product-focused","Start Project"]);
      return;
    }

    if (x.includes("ai video") || x.includes("ai") || x.includes("video")) {
      state.service="AI Video"; save();
      addMessage("For an AI video, send me the product and the feeling you want.\n\nExample: “Leather jacket, premium dark studio, fast cinematic transitions, 10-second Instagram ad.”");
      setQuick(["10 sec Instagram Ad","Cinematic","Luxury","Start Project"]);
      return;
    }

    if (x.includes("product shoot") || x.includes("photography") || x.includes("product")) {
      state.service="Product Shoot"; save();
      addMessage("Perfect. What product are we shooting?\n\nIf you already have a product photo, describe the look you want around it. AJADS AI can help turn that into a professional visual direction.");
      setQuick(["Luxury Studio","Minimal Studio","Social Media","Start Project"]);
      return;
    }

    if (x.includes("branding") || x.includes("logo")) {
      state.service="Branding"; save();
      addMessage("Tell me about the brand: what it sells, who it targets, and the visual personality you want. I can help structure the creative direction.");
      setQuick(["Modern","Luxury","Minimal","Start Project"]);
      return;
    }

    if (x.includes("concept") || x.includes("idea")) {
      addMessage("Absolutely. Give me just three things:\n\n1. What is the product?\n2. Where will the ad be used?\n3. What feeling should it create?\n\nI’ll turn that into a concise creative direction.");
      return;
    }

    if (x.includes("price") || x.includes("cost") || x.includes("budget")) {
      addMessage("Project pricing depends on the production scope, content requirements, duration, and final deliverables. Tell me what you want to create and AJADS can review the brief before giving you a project quote.");
      setQuick(["Start Project","Advertisement","AI Video"]);
      return;
    }

    addMessage("Got it. Tell me a little more about what you’re trying to create, and I’ll help turn it into a clear AJADS project brief.");
    setQuick(["Advertisement","AI Video","Product Shoot","Branding","Start Project"]);
  }

  launcher.addEventListener("click", openChat);
  close.addEventListener("click", closeChat);
  form.addEventListener("submit", e => { e.preventDefault(); const v=input.value; input.value=""; handleUser(v); });
  document.addEventListener("keydown", e => { if(e.key==="Escape" && panel.classList.contains("open")) closeChat(); });

  // Optional bridge to an existing AJADS "Start Project" button.
  // If your button uses href="#start-project", the chatbot can still be used independently.
  window.AJADS_AI = {
    open: openChat,
    close: closeChat,
    send: handleUser,
    getLead: () => ({...state.lead}),
    reset: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); }
  };
})();
