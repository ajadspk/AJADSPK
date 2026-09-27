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
  .ajads-ai-launcher{position:fixed;right:26px;bottom:26px;width:66px;height:66px;border:0;border-radius:50%;background:linear-gradient(145deg,#fff,#d9d9d9);color:#090909;cursor:pointer;z-index:2147483000;box-shadow:0 18px 55px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.35) inset;display:flex;align-items:center;justify-content:center;transition:.25s ease}
  .ajads-ai-launcher:hover{transform:translateY(-4px) scale(1.04)}
  .ajads-ai-launcher:before{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(255,255,255,.22);animation:ajPulse 2.6s infinite}
  .ajads-ai-icon{font-size:27px;line-height:1;font-weight:900}
  @keyframes ajPulse{0%,100%{opacity:.2;transform:scale(.98)}50%{opacity:.75;transform:scale(1.06)}}

  .ajads-ai-panel{position:fixed;right:24px;bottom:104px;width:min(480px,calc(100vw - 28px));height:min(740px,calc(100vh - 128px));min-height:520px;background:#efeae2;color:#111;border:1px solid rgba(255,255,255,.2);border-radius:26px;overflow:hidden;z-index:2147482999;box-shadow:0 30px 100px rgba(0,0,0,.48);display:none;flex-direction:column}
  .ajads-ai-panel.open{display:flex;animation:ajIn .24s ease}
  @keyframes ajIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}

  .ajads-ai-head{height:76px;flex:0 0 76px;padding:12px 16px;background:#111;color:#fff;display:flex;align-items:center;gap:12px;box-shadow:0 2px 10px rgba(0,0,0,.2);position:relative;z-index:2}
  .ajads-ai-mark{width:45px;height:45px;flex:0 0 45px;border-radius:50%;background:linear-gradient(145deg,#fff,#d7d7d7);color:#111;display:grid;place-items:center;font-weight:950;font-size:12px;letter-spacing:-.5px;box-shadow:0 0 0 3px rgba(255,255,255,.08)}
  .ajads-ai-title{font-size:15px;font-weight:850;letter-spacing:.2px}
  .ajads-ai-status{font-size:11px;color:#b9b9b9;margin-top:3px;display:flex;align-items:center;gap:6px}
  .ajads-ai-status:before{content:"";width:7px;height:7px;border-radius:50%;background:#6ee7a2;box-shadow:0 0 9px rgba(110,231,162,.7)}
  .ajads-ai-close{margin-left:auto;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);color:#ddd;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer;display:grid;place-items:center;transition:.2s}
  .ajads-ai-close:hover{background:#fff;color:#111}

  .ajads-ai-messages{flex:1;overflow:auto;padding:22px 17px 16px;scroll-behavior:smooth;background-color:#efeae2;background-image:radial-gradient(rgba(0,0,0,.035) .7px,transparent .7px);background-size:9px 9px}
  .ajads-ai-messages::-webkit-scrollbar{width:7px}.ajads-ai-messages::-webkit-scrollbar-thumb{background:rgba(0,0,0,.18);border-radius:10px}
  .ajads-ai-msg{display:flex;margin:0 0 15px;animation:ajMsg .18s ease}
  .ajads-ai-msg.user{justify-content:flex-end}
  @keyframes ajMsg{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  .ajads-ai-msg>div{max-width:84%}
  .ajads-ai-bubble{padding:12px 14px 10px;border-radius:6px 18px 18px 18px;background:#fff;color:#151515;font-size:14px;line-height:1.58;border:1px solid rgba(0,0,0,.055);white-space:pre-wrap;box-shadow:0 2px 4px rgba(0,0,0,.07);position:relative}
  .ajads-ai-bubble:after{content:"";position:absolute;left:-5px;top:0;border-style:solid;border-width:0 6px 6px 0;border-color:transparent #fff transparent transparent}
  .ajads-ai-msg.user .ajads-ai-bubble{background:#dcf8c6;color:#101010;border-radius:18px 6px 18px 18px;border-color:rgba(0,0,0,.04)}
  .ajads-ai-msg.user .ajads-ai-bubble:after{left:auto;right:-5px;border-width:0 0 6px 6px;border-color:transparent transparent transparent #dcf8c6}
  .ajads-ai-time{font-size:9px;color:#7b7b7b;margin-top:5px;padding:0 4px}
  .ajads-ai-msg.user .ajads-ai-time{text-align:right}

  .ajads-ai-quick{display:flex;gap:7px;overflow-x:auto;padding:10px 13px 11px;background:rgba(255,255,255,.72);border-top:1px solid rgba(0,0,0,.06);scrollbar-width:none}
  .ajads-ai-quick::-webkit-scrollbar{display:none}
  .ajads-ai-chip{flex:0 0 auto;border:1px solid #cfcfcf;background:#fff;color:#202020;border-radius:999px;padding:9px 13px;font-size:11px;font-weight:700;cursor:pointer;transition:.18s;box-shadow:0 2px 5px rgba(0,0,0,.04)}
  .ajads-ai-chip:hover{background:#111;color:#fff;border-color:#111;transform:translateY(-1px)}

  .ajads-ai-compose{padding:10px 12px 13px;background:#f5f1eb;border-top:1px solid rgba(0,0,0,.08)}
  .ajads-ai-form{display:flex;gap:7px;background:#fff;border:1px solid #d3d0ca;border-radius:24px;padding:5px 5px 5px 8px;box-shadow:0 3px 12px rgba(0,0,0,.06)}
  .ajads-ai-input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#111;padding:9px 8px;font-size:13px}
  .ajads-ai-input::placeholder{color:#888}
  .ajads-ai-send{width:42px;height:42px;border:0;border-radius:50%;background:#111;color:#fff;cursor:pointer;font-weight:900;font-size:17px;display:grid;place-items:center;transition:.2s}
  .ajads-ai-send:hover{transform:scale(1.05);background:#000}
  .ajads-ai-note{font-size:9px;color:#8a8a8a;text-align:center;margin-top:7px;letter-spacing:.1px}
  .ajads-ai-lead{margin-top:9px;padding:12px;border:1px solid rgba(0,0,0,.1);border-radius:15px;background:#fff}
  .ajads-ai-lead input{width:100%;margin:4px 0;padding:9px 10px;background:#fafafa;border:1px solid #ddd;border-radius:9px;color:#111;outline:none;font-size:12px}
  .ajads-ai-lead button{width:100%;padding:10px;border:0;border-radius:9px;background:#111;color:#fff;font-weight:800;cursor:pointer;margin-top:4px}
  @media(max-width:520px){.ajads-ai-launcher{right:15px;bottom:15px;width:58px;height:58px}.ajads-ai-panel{inset:0;width:100%;height:100%;min-height:0;border-radius:0}.ajads-ai-head{height:72px;flex-basis:72px}.ajads-ai-messages{padding:18px 11px 12px}.ajads-ai-msg>div{max-width:88%}.ajads-ai-bubble{font-size:14px}.ajads-ai-compose{padding-bottom:max(11px,env(safe-area-inset-bottom))}}
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
          <div class="ajads-ai-status">Online • Creative project assistant</div>
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
