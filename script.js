/* ────────────────────────────────────────────────────────────
   Inside the Prompt — interaction engine
   Vanilla JS · no dependencies · canvas + SVG animations
   ──────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let userPrompt = "";
  let journeyStarted = false;

  /* ══════════════════════════════════════════════════════════
     Ambient starfield
     ══════════════════════════════════════════════════════════ */
  const stars = (() => {
    const canvas = $("#stars");
    const ctx = canvas.getContext("2d");
    let dpr = 1, w = 0, h = 0, particles = [], raf = null;

    const COLORS = [
      "rgba(52, 211, 153, ALPHA)",   // emerald
      "rgba(167, 139, 250, ALPHA)",  // purple
      "rgba(245, 245, 244, ALPHA)",  // white
    ];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduceMotion) drawFrame(0);
    }

    function seed() {
      const count = Math.round(Math.min(140, (w * h) / 11000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.4, 1.7),
        vx: rand(-0.05, 0.05),
        vy: rand(-0.03, 0.03),
        depth: rand(0.15, 1),
        tw: rand(0, Math.PI * 2),
        tws: rand(0.004, 0.014),
        color: pick(COLORS),
      }));
    }

    function drawFrame(t) {
      ctx.clearRect(0, 0, w, h);
      // soft ambient gradients
      const g1 = ctx.createRadialGradient(w * 0.82, h * 0.15, 0, w * 0.82, h * 0.15, w * 0.6);
      g1.addColorStop(0, "rgba(124, 92, 240, 0.055)");
      g1.addColorStop(1, "rgba(124, 92, 240, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w * 0.12, h * 0.85, 0, w * 0.12, h * 0.85, w * 0.55);
      g2.addColorStop(0, "rgba(16, 185, 129, 0.045)");
      g2.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const scrollDrift = (window.scrollY || 0) * 0.02;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.tws;
        if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
        if (p.y < -4) p.y = h + 4; else if (p.y > h + 4) p.y = -4;
        const alpha = (0.25 + 0.55 * Math.abs(Math.sin(p.tw))) * p.depth;
        const y = (p.y - scrollDrift * p.depth + h * 10) % h;
        ctx.beginPath();
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace("ALPHA", alpha.toFixed(3));
        ctx.fill();
      }
    }

    function loop(t) {
      drawFrame(t);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (!reduceMotion && !raf) raf = requestAnimationFrame(loop);
    }
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();
    start();
    return { resize, start, stop };
  })();

  /* ══════════════════════════════════════════════════════════
     Landing — rotating placeholders + prompt capture
     ══════════════════════════════════════════════════════════ */
  const landing = (() => {
    const input = $("#prompt-input");
    const promptText = $("#prompt-text");
    const ghost = $("#ghost");
    const PLACEHOLDERS = [
      "Write a poem...",
      "Explain quantum computing...",
      "Build a startup...",
      "Create a Python API...",
      "Design a spacecraft...",
    ];
    let phIndex = 0, phChar = 0, phMode = "type", phTimer = null;
    let currentPlaceholder = PLACEHOLDERS[0];

    function tickPlaceholder() {
      if (journeyStarted) return;
      if (input.value.length > 0) {           // user typing — hide ghost
        ghost.textContent = "";
        phTimer = setTimeout(tickPlaceholder, 400);
        return;
      }
      currentPlaceholder = PLACEHOLDERS[phIndex];
      let delay = 55;
      if (phMode === "type") {
        phChar++;
        ghost.textContent = currentPlaceholder.slice(0, phChar);
        if (phChar >= currentPlaceholder.length) { phMode = "hold"; delay = 2100; }
      } else if (phMode === "hold") {
        phMode = "erase";
        delay = 30;
      } else {
        phChar--;
        ghost.textContent = currentPlaceholder.slice(0, phChar);
        if (phChar <= 0) {
          phMode = "type";
          phIndex = (phIndex + 1) % PLACEHOLDERS.length;
          delay = 500;
        } else delay = 26;
      }
      phTimer = setTimeout(tickPlaceholder, delay);
    }

    if (reduceMotion) {
      ghost.textContent = PLACEHOLDERS[0];
    } else {
      phTimer = setTimeout(tickPlaceholder, 900);
    }

    // Focus once on load for keyboard users; never trap focus afterwards.
    // (Touch devices skip this so the keyboard doesn't pop unprompted.)
    if (window.matchMedia("(hover: hover)").matches) {
      input.focus({ preventScroll: true });
    }

    input.addEventListener("input", () => {
      promptText.classList.toggle("typing", input.value.length > 0);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || journeyStarted) return;
      e.preventDefault();
      const value = input.value.trim() ||
        currentPlaceholder.replace(/\.{3}$/, "");
      startJourney(value);
    });

    return {
      stop() { clearTimeout(phTimer); },
    };
  })();

  /* ══════════════════════════════════════════════════════════
     Scene framework — activation + per-scene controllers
     ══════════════════════════════════════════════════════════ */
  const controllers = {};   // sceneName -> { enter(), leave() }
  let sceneEls = [];        // populated once the journey starts
  let currentScene = 0;     // index into sceneEls
  const visibleScenes = new Set();   // data-scene names currently on screen

  /* pause state: user toggle OR hidden browser tab stops every JS loop */
  let userPaused = false;
  let tabHidden = document.visibilityState === "hidden";
  const isPaused = () => userPaused || tabHidden;

  function applyPauseState() {
    document.body.classList.toggle("anim-paused", userPaused);
    if (isPaused()) {
      stars.stop();
      for (const name of visibleScenes) controllers[name]?.leave?.();
    } else {
      stars.start();
      for (const name of visibleScenes) controllers[name]?.enter?.();
    }
  }

  document.addEventListener("visibilitychange", () => {
    tabHidden = document.visibilityState === "hidden";
    applyPauseState();
  });

  function setupObserver() {
    sceneEls = $$(".scene");
    const revealIO = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) en.target.classList.add("active");
      }
    }, { threshold: 0.35 });

    const runIO = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const name = en.target.dataset.scene;
        if (en.isIntersecting) {
          visibleScenes.add(name);
          if (!isPaused()) controllers[name]?.enter?.();
        } else {
          visibleScenes.delete(name);
          controllers[name]?.leave?.();
        }
      }
    }, { threshold: 0.25 });

    sceneEls.forEach((s) => { revealIO.observe(s); runIO.observe(s); });

    // dot navigation
    const dots = $("#dots");
    dots.hidden = false;
    const links = sceneEls.map((s, i) => {
      const a = document.createElement("a");
      a.href = `#${s.id}`;
      a.setAttribute("aria-label", s.getAttribute("aria-label") || `Scene ${i + 1}`);
      dots.appendChild(a);
      return a;
    });
    const jcNum = $("#jc-num");
    const dotIO = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const idx = sceneEls.indexOf(en.target);
        if (en.isIntersecting) {
          currentScene = idx;
          links.forEach((l, i) => l.classList.toggle("on", i === idx));
          jcNum.textContent = `${idx + 1} / ${sceneEls.length}`;
        }
      }
    }, { threshold: 0.55 });
    sceneEls.forEach((s) => dotIO.observe(s));
  }

  /* journey controller buttons */
  (() => {
    const pauseBtn = $("#jc-pause");
    pauseBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute("aria-pressed", String(userPaused));
      pauseBtn.setAttribute("aria-label", userPaused ? "Resume animations" : "Pause animations");
      applyPauseState();
    });
    $("#jc-next").addEventListener("click", () => {
      const next = sceneEls[Math.min(currentScene + 1, sceneEls.length - 1)];
      next?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    $("#jc-restart").addEventListener("click", () => {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      window.location.reload();
    });
  })();

  /* progress bar */
  (() => {
    const fill = $("#progress-fill");
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        fill.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ══════════════════════════════════════════════════════════
     Scene 1 — fibre-optic tunnel
     ══════════════════════════════════════════════════════════ */
  controllers.arrival = (() => {
    const canvas = $("#tunnel-canvas");
    const ctx = canvas.getContext("2d");
    let raf = null, w = 0, h = 0, t0 = 0;
    const FIBRES = 46;
    let fibres = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fibres = Array.from({ length: FIBRES }, () => ({
        angle: rand(0, Math.PI * 2),
        hueMix: Math.random(),
        speed: rand(0.4, 1),
        offset: rand(0, 1),
      }));
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    function frame(t) {
      if (!t0) t0 = t;
      const time = (t - t0) / 1000;
      const cx = w / 2, cy = h / 2;
      const maxR = Math.hypot(cx, cy);
      ctx.clearRect(0, 0, w, h);

      // radial fibres converging on the vanishing point
      for (const f of fibres) {
        const prog = (f.offset + time * f.speed * 0.14) % 1;
        const inner = 14 + prog * 40;
        const outer = maxR;
        const x1 = cx + Math.cos(f.angle) * inner;
        const y1 = cy + Math.sin(f.angle) * inner;
        const x2 = cx + Math.cos(f.angle) * outer;
        const y2 = cy + Math.sin(f.angle) * outer;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        const col = f.hueMix < 0.5 ? "52, 211, 153" : "167, 139, 250";
        grad.addColorStop(0, `rgba(${col}, 0.30)`);
        grad.addColorStop(1, `rgba(${col}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // light packet travelling inward along the fibre
        const pr = 1 - ((f.offset + time * f.speed * 0.22) % 1);
        const px = cx + Math.cos(f.angle) * (inner + (outer - inner) * pr);
        const py = cy + Math.sin(f.angle) * (inner + (outer - inner) * pr);
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col}, ${(0.7 * (1 - pr)).toFixed(3)})`;
        ctx.fill();
      }

      // rings racing toward the viewer's vanishing point
      for (let i = 0; i < 6; i++) {
        const prog = ((time * 0.35 + i / 6) % 1);
        const r = 10 + Math.pow(prog, 2.2) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.10 * (1 - prog)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // the prompt pulse accelerating into the distance
      const pulseT = (time * 0.45) % 1.6;
      if (pulseT < 1) {
        const eased = 1 - Math.pow(1 - pulseT, 3);
        const r = 26 * (1 - eased) + 3;
        const px = cx, py = cy + (h * 0.28) * (1 - eased);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
        glow.addColorStop(0, "rgba(52, 211, 153, 0.85)");
        glow.addColorStop(0.4, "rgba(52, 211, 153, 0.25)");
        glow.addColorStop(1, "rgba(52, 211, 153, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(240, 253, 250, 0.95)";
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    return {
      enter() {
        // the canvas is sized while #journey is hidden, so re-measure on entry
        if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
        if (reduceMotion) { frameOnce(); return; }
        if (!raf) { t0 = 0; raf = requestAnimationFrame(frame); }
      },
      leave() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      },
    };

    function frameOnce() {
      t0 = 0;
      frame(performance.now());   // draw one static frame
      cancelAnimationFrame(raf);
      raf = null;
    }
  })();

  /* ══════════════════════════════════════════════════════════
     Scene 2 — tokenisation
     ══════════════════════════════════════════════════════════ */
  function buildTokens(prompt) {
    const field = $("#token-field");
    field.innerHTML = "";
    // naive sub-word chunking to evoke BPE tokenisation
    const pieces = [];
    for (const word of prompt.split(/\s+/).filter(Boolean)) {
      let i = 0;
      while (i < word.length) {
        const len = Math.min(word.length - i, 1 + Math.floor(Math.random() * 3));
        pieces.push(word.slice(i, i + len));
        i += len;
      }
    }
    if (!pieces.length) pieces.push("hello");
    const TOTAL = Math.min(120, Math.max(60, pieces.length * 6));
    const classes = ["t-emerald", "t-purple", "t-white"];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < TOTAL; i++) {
      const chip = document.createElement("span");
      chip.className = `token-chip ${classes[i % 3]}`;
      chip.textContent = pieces[i % pieces.length];
      chip.style.left = `${rand(2, 92)}%`;
      chip.style.top = `${rand(4, 92)}%`;
      chip.style.setProperty("--delay", `${rand(0, 1.6).toFixed(2)}s`);
      chip.style.setProperty("--dur", `${rand(6, 13).toFixed(2)}s`);
      chip.style.setProperty("--phase", `${rand(-6, 0).toFixed(2)}s`);
      chip.style.setProperty("--amp", `${rand(8, 26).toFixed(0)}px`);
      chip.style.setProperty("--op", rand(0.35, 0.95).toFixed(2));
      frag.appendChild(chip);
    }
    field.appendChild(frag);
  }

  /* ══════════════════════════════════════════════════════════
     Scene 3 — neural network
     ══════════════════════════════════════════════════════════ */
  controllers.network = (() => {
    const svg = $("#net-svg");
    const conceptsEl = $("#concepts");
    const NS = "http://www.w3.org/2000/svg";
    const LAYERS = [4, 7, 9, 7, 4];
    const W = 800, H = 420;
    const nodes = [];        // [layer][index] -> {x, y, el}
    const edges = [];        // {a, b, el}
    let fireTimer = null, conceptTimer = null;

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    LAYERS.forEach((count, li) => {
      const layer = [];
      const x = 70 + (li * (W - 140)) / (LAYERS.length - 1);
      for (let ni = 0; ni < count; ni++) {
        const y = H / 2 + (ni - (count - 1) / 2) * (H / (count + 1)) + rand(-8, 8);
        layer.push({ x, y, el: null });
      }
      nodes.push(layer);
    });

    // edges first so nodes draw on top
    for (let li = 0; li < LAYERS.length - 1; li++) {
      for (const a of nodes[li]) {
        for (const b of nodes[li + 1]) {
          if (Math.random() > 0.62) continue;
          const path = document.createElementNS(NS, "path");
          const mx = (a.x + b.x) / 2;
          path.setAttribute("d", `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`);
          path.setAttribute("class", "edge");
          svg.appendChild(path);
          edges.push({ a, b, el: path });
        }
      }
    }
    for (const layer of nodes) {
      for (const n of layer) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", n.x);
        c.setAttribute("cy", n.y);
        c.setAttribute("r", 5);
        c.setAttribute("class", "node");
        svg.appendChild(c);
        n.el = c;
      }
    }

    const CONCEPTS = [
      ["Language", 8, 16], ["Logic", 88, 14], ["Mathematics", 10, 82],
      ["Creativity", 90, 78], ["Coding", 50, 4], ["Planning", 6, 50],
      ["Reasoning", 93, 46],
    ];
    const conceptEls = CONCEPTS.map(([name, x, y]) => {
      const el = document.createElement("span");
      el.className = "concept";
      el.textContent = name;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      conceptsEl.appendChild(el);
      return el;
    });

    function fire() {
      // a signal path across the layers
      const chosen = nodes.map((layer) => pick(layer));
      const alt = Math.random() > 0.5;
      const litEdges = [];
      for (const e of edges) {
        for (let li = 0; li < chosen.length - 1; li++) {
          if (e.a === chosen[li] && e.b === chosen[li + 1]) litEdges.push(e.el);
        }
      }
      chosen.forEach((n, i) => {
        setTimeout(() => {
          n.el.classList.add("fire");
          if (alt) n.el.classList.add("alt");
          setTimeout(() => n.el.classList.remove("fire", "alt"), 650);
        }, i * 130);
      });
      litEdges.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add("fire");
          setTimeout(() => el.classList.remove("fire"), 600);
        }, 60 + i * 130);
      });
    }

    let litIdx = 0;
    function cycleConcepts() {
      conceptEls.forEach((el) => el.classList.remove("lit"));
      conceptEls[litIdx % conceptEls.length].classList.add("lit");
      conceptEls[(litIdx + 3) % conceptEls.length].classList.add("lit");
      litIdx++;
    }

    return {
      enter() {
        if (reduceMotion) {
          conceptEls.forEach((el) => el.classList.add("lit"));
          return;
        }
        if (!fireTimer) {
          fire(); cycleConcepts();
          fireTimer = setInterval(fire, 750);
          conceptTimer = setInterval(cycleConcepts, 1900);
        }
      },
      leave() {
        clearInterval(fireTimer); fireTimer = null;
        clearInterval(conceptTimer); conceptTimer = null;
      },
    };
  })();

  /* ══════════════════════════════════════════════════════════
     Scene 4 — planning pipeline
     ══════════════════════════════════════════════════════════ */
  controllers.planning = (() => {
    const STAGES = [
      ["🧭", "Planner", "Breaks the request into steps"],
      ["🔎", "Research", "Gathers relevant information"],
      ["🧠", "Reasoning", "Weighs approaches and evidence"],
      ["🛠️", "Tool Selection", "Picks only what's needed"],
      ["✍️", "Writer", "Drafts the response"],
      ["✅", "Reviewer", "Checks quality and accuracy"],
      ["✨", "Final Response", "Delivered back to you"],
    ];
    const list = $("#pipe-stages");
    const svg = $("#pipe-svg");
    const NS = "http://www.w3.org/2000/svg";
    const stageEls = STAGES.map(([icon, name, desc], i) => {
      const li = document.createElement("li");
      li.className = "pipe-stage";
      li.style.transitionDelay = `${i * 0.08}s, ${i * 0.08}s, 0s, 0s, 0s, 0s`;
      li.innerHTML = `<span class="pipe-icon" aria-hidden="true">${icon}</span>
        <span><span class="pipe-name">${name}</span><br><span class="pipe-desc">${desc}</span></span>`;
      list.appendChild(li);
      return li;
    });
    const lines = [];
    let loopTimer = null, step = 0;

    function layoutLines() {
      svg.innerHTML = "";
      lines.length = 0;
      const base = svg.getBoundingClientRect();
      for (let i = 0; i < stageEls.length - 1; i++) {
        const a = stageEls[i].getBoundingClientRect();
        const b = stageEls[i + 1].getBoundingClientRect();
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", a.left + a.width / 2 - base.left);
        line.setAttribute("y1", a.bottom - base.top);
        line.setAttribute("x2", b.left + b.width / 2 - base.left);
        line.setAttribute("y2", b.top - base.top);
        line.setAttribute("class", "pipe-line");
        svg.appendChild(line);
        lines.push(line);
      }
    }
    window.addEventListener("resize", () => { if (loopTimer) layoutLines(); }, { passive: true });

    function advance() {
      stageEls.forEach((el, i) => {
        el.classList.toggle("glow", i === step);
        el.classList.toggle("done", i < step);
      });
      lines.forEach((l, i) => l.classList.toggle("flow", i === step - 1));
      step = (step + 1) % (stageEls.length + 2);   // brief pause at end of cycle
    }

    return {
      enter() {
        if (reduceMotion) {
          stageEls.forEach((el) => el.classList.add("done"));
          return;
        }
        if (!loopTimer) {
          // wait for the reveal transition before measuring line anchors
          setTimeout(layoutLines, 850);
          step = 0;
          advance();
          loopTimer = setInterval(advance, 900);
        }
      },
      leave() {
        clearInterval(loopTimer); loopTimer = null;
      },
    };
  })();

  /* ══════════════════════════════════════════════════════════
     Scenes 5 + 6 — context sources & tools
     ══════════════════════════════════════════════════════════ */
  function buildCardGrid(gridEl, items, litNames) {
    gridEl.innerHTML = "";
    items.forEach(([icon, name], i) => {
      const card = document.createElement("div");
      const lit = litNames.includes(name);
      card.className = `src-card ${lit ? "lit" : "dim"}`;
      card.style.setProperty("--delay", `${i * 0.09}s`);
      card.innerHTML = `<span class="src-icon" aria-hidden="true">${icon}</span>
        <span class="src-name">${name}</span>
        <span class="src-tag">${lit ? "active" : "idle"}</span>`;
      gridEl.appendChild(card);
    });
  }

  const CONTEXT_ITEMS = [
    ["💬", "Conversation"], ["🧠", "Memory"], ["📎", "Uploaded Files"],
    ["🌐", "Search"], ["🖼️", "Images"], ["📅", "Calendar"], ["✉️", "Email"],
  ];
  const TOOL_ITEMS = [
    ["🤖", "Model only"], ["🌍", "Search"], ["🧮", "Python"], ["🖼️", "Images"],
    ["📄", "Documents"], ["📅", "Calendar"], ["✉️", "Email"],
  ];

  /* Routing heuristics. Deliberately conservative: a capability only
     activates when the prompt clearly calls for it; otherwise the model
     answers from the conversation alone. */
  const ROUTES = {
    search: /\b(latest|news|today|current(ly)?|recent(ly)?|this (week|month|year)|research|look up|search|find out|who won|what happened|price of|weather|stock|release date)\b/,
    files: /\b(files?|documents?|pdf|docx?|spreadsheet|csv|upload(ed|s)?|attach(ed|ment|ments)?)\b/,
    memory: /\b(remember|earlier|last (time|week|month)|previous(ly)?|we (discussed|talked about)|as i (said|mentioned)|my (name|preferences|usual|project)|again)\b/,
    python: /\b(code|coding|python|javascript|typescript|sql|api|function|script|program(me)?|algorithm|debug|regex|calculate|computation|data analysis|statistics)\b/,
    images: /\b(images?|pictures?|photos?|draw(ing)?|illustrat(e|ion)|logo|diagram|render|sketch)\b/,
    calendar: /\b(calendar|schedule|meeting|appointment|remind(er)?s?|book (a|an|my))\b/,
    email: /\b(emails?|e-mail|inbox|reply to|send (a |an )?(message|mail))\b/,
  };

  function relevantSources(prompt) {
    const p = prompt.toLowerCase();
    // Context: conversation is always in play; everything else must be earned.
    const ctx = new Set(["Conversation"]);
    if (ROUTES.memory.test(p)) ctx.add("Memory");
    if (ROUTES.search.test(p)) ctx.add("Search");
    if (ROUTES.files.test(p)) ctx.add("Uploaded Files");
    if (ROUTES.images.test(p)) ctx.add("Images");
    if (ROUTES.calendar.test(p)) ctx.add("Calendar");
    if (ROUTES.email.test(p)) ctx.add("Email");

    // Tools: none by default — most prompts are answered by the model alone.
    const tools = new Set();
    if (ROUTES.search.test(p)) tools.add("Search");
    if (ROUTES.python.test(p)) tools.add("Python");
    if (ROUTES.images.test(p)) tools.add("Images");
    if (ROUTES.files.test(p)) tools.add("Documents");
    if (ROUTES.calendar.test(p)) tools.add("Calendar");
    if (ROUTES.email.test(p)) tools.add("Email");
    if (tools.size === 0) tools.add("Model only");

    return { ctx: [...ctx], tools: [...tools] };
  }

  /* ══════════════════════════════════════════════════════════
     Scene 7 — safety layers
     ══════════════════════════════════════════════════════════ */
  controllers.safety = (() => {
    const LAYERS = [
      ["Prompt Shield", "input screening"],
      ["Policy", "usage rules"],
      ["Content Safety", "harm checks"],
      ["Grounding", "facts & sources"],
      ["Validation", "output review"],
    ];
    const track = $("#safety-track");
    const pulse = $("#safety-pulse");
    const layerEls = LAYERS.map(([name, sub], i) => {
      const el = document.createElement("div");
      el.className = "safety-layer glass";
      el.style.setProperty("--delay", `${i * 0.1}s`);
      el.innerHTML = `<div class="scanline" aria-hidden="true"></div>
        <span class="safety-name">${name}</span>
        <span class="safety-sub">${sub}</span>
        <span class="safety-check" aria-hidden="true">check complete</span>`;
      track.insertBefore(el, pulse);
      return el;
    });
    let timers = [];

    function run() {
      stop();
      pulse.classList.remove("run");
      void pulse.offsetWidth;                 // restart CSS animation
      pulse.classList.add("run");
      layerEls.forEach((el, i) => {
        el.classList.remove("scanning", "passed");
        timers.push(setTimeout(() => {
          el.classList.add("scanning");
          timers.push(setTimeout(() => {
            el.classList.remove("scanning");
            el.classList.add("passed");
          }, 900));
        }, 500 + i * 850));
      });
    }
    function stop() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    return {
      enter() {
        if (reduceMotion) {
          layerEls.forEach((el) => el.classList.add("passed"));
          return;
        }
        run();
      },
      leave() { stop(); pulse.classList.remove("run"); },
    };
  })();

  /* ══════════════════════════════════════════════════════════
     Scene 8 — branching continuations
     ══════════════════════════════════════════════════════════ */
  (() => {
    const svg = $("#branch-svg");
    const NS = "http://www.w3.org/2000/svg";
    const W = 1000, H = 600;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const ox = 60, oy = H / 2;
    const COUNT = 90;
    const keepIndex = Math.floor(COUNT * 0.5);

    for (let i = 0; i < COUNT; i++) {
      // random-walk bezier from the origin toward the right edge
      let x = ox, y = oy;
      let d = `M ${x} ${y}`;
      const drift = rand(-1, 1);
      for (let seg = 0; seg < 4; seg++) {
        const nx = x + rand(180, 260);
        const ny = Math.max(24, Math.min(H - 24,
          y + drift * rand(20, 70) + rand(-90, 90)));
        const c1x = x + rand(50, 110), c2x = nx - rand(50, 110);
        d += ` C ${c1x.toFixed(0)} ${y.toFixed(0)}, ${c2x.toFixed(0)} ${ny.toFixed(0)}, ${nx.toFixed(0)} ${ny.toFixed(0)}`;
        x = nx; y = ny;
      }
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("class", i === keepIndex ? "branch keep" : "branch");
      path.style.setProperty("--d", `${rand(0, 1.1).toFixed(2)}s`);
      svg.appendChild(path);
    }
    const origin = document.createElementNS(NS, "circle");
    origin.setAttribute("cx", ox);
    origin.setAttribute("cy", oy);
    origin.setAttribute("r", 7);
    origin.setAttribute("class", "origin");
    svg.appendChild(origin);
  })();

  /* ══════════════════════════════════════════════════════════
     Scene 9 — token-by-token generation
     ══════════════════════════════════════════════════════════ */
  /* Local, deterministic response generation. Nothing leaves the page:
     the prompt is classified with fixed keyword rules and rendered into a
     fixed category template. No network, no storage, no analytics. */
  const CATEGORY_RULES = [
    ["creative", /\b(poems?|haiku|stor(y|ies)|songs?|lyrics?|fiction|novel|tale|verse|rap|sonnet|screenplay|creative writing)\b/],
    // explanation outranks code so "What is an API?" reads as a question,
    // not a build task; build-intent prompts don't match the question shapes
    ["explanation", /\b(explain|what (is|are|was|were)|how (does|do|did|is|are)|why (is|are|do|does|did)|teach|understand(ing)?|difference between|meaning of|definition)\b/],
    ["code", /\b(code|coding|python|javascript|typescript|java|c\+\+|rust|sql|api|function|script|program(me)?|algorithm|debug|regex|website|app|software)\b/],
    ["business", /\b(startup|business|market(ing)?|revenue|pitch|monetis|monetiz|compan(y|ies)|saas|strateg(y|ies)|invest(or|ment)?|business plan|product launch)\b/],
    ["visual", /\b(logo|ui|ux|poster|brand(ing)?|layout|palette|typography|icon|mockup|wireframe|colour scheme|color scheme|visual design|graphic)\b/],
  ];

  function classifyPrompt(prompt) {
    const p = prompt.toLowerCase();
    for (const [category, re] of CATEGORY_RULES) {
      if (re.test(p)) return category;
    }
    return "general";
  }

  function extractTopic(prompt) {
    let t = prompt.trim().replace(/[.?!…]+$/, "");
    t = t.replace(
      /^(please\s+)?(can|could|would|will)?\s*(you\s+)?(help me\s+)?(write|create|build|make|design|draft|generate|plan|compose|develop|explain|describe|teach me( about)?|tell me( about)?|show me|give me)\s+(me\s+)?(a|an|the|some)?\s*/i,
      "");
    t = t.trim();
    if (t.length < 3) t = prompt.trim();
    if (t.length > 70) t = t.slice(0, 67).trimEnd() + "…";
    return t;
  }

  /* Topics are always quoted: user text lands mid-sentence, so without
     quotes its capitalisation reads as a typo ("For What is an api, …"). */
  const RESPONSE_TEMPLATES = {
    explanation: (t) =>
      `Here's a way into “${t}”: start with what it does, then how it does it. ` +
      `Break the idea into its smallest moving parts, understand each one on its own, ` +
      `and the whole becomes far less mysterious. A full assistant response would now ` +
      `walk through each part with examples pitched at your level.`,
    creative: (t) =>
      `A first sketch for “${t}”: some ideas arrive like weather, sudden and bright and ` +
      `impossible to ignore. This one waited quietly while the tokens aligned, then ` +
      `stepped onto the page. A full response would carry on in this voice, shaped by ` +
      `the form and tone you asked for.`,
    code: (t) =>
      `For “${t}”, a real answer would sketch the approach before the syntax: define ` +
      `the interface, name the edge cases, then write the smallest version that works. ` +
      `Clear naming and a test beat clever tricks. The full response would include ` +
      `runnable code, commented where intent isn't obvious.`,
    business: (t) =>
      `For “${t}”, the outline builds in stages: the problem worth solving, the people ` +
      `who have it, the smallest product that helps them, and how it earns. A complete ` +
      `answer would pressure-test each assumption and end with the first three concrete ` +
      `steps to take this week.`,
    visual: (t) =>
      `For “${t}”, good design starts with subtraction: one clear focal point, generous ` +
      `space, and a palette with restraint. Hierarchy should guide the eye before any ` +
      `decoration earns its place. A full response would propose specific layouts, type ` +
      `and colour choices you could apply immediately.`,
    general: (t) =>
      `Here's the shape of an answer to “${t}”: understand what's really being asked, ` +
      `gather only the context that matters, and reply in the clearest form available. ` +
      `A full assistant response would follow exactly that path. This demonstration ` +
      `stops at showing you how.`,
  };

  function buildResponse(prompt) {
    const category = classifyPrompt(prompt);
    return RESPONSE_TEMPLATES[category](extractTopic(prompt));
  }

  let responseText = "";   // set when the journey starts

  controllers.generation = (() => {
    const out = $("#stream-text");
    let timers = [], done = false;

    function stream() {
      if (done) return;
      timers.forEach(clearTimeout);
      timers = [];
      out.innerHTML = "";
      const caret = document.createElement("span");
      caret.className = "stream-caret";
      out.appendChild(caret);
      const tokens = responseText.split(/(?<=\s)/);   // keep trailing spaces
      let delay = 300;
      tokens.forEach((tok, i) => {
        delay += rand(45, 130);
        timers.push(setTimeout(() => {
          const span = document.createElement("span");
          span.className = "tok";
          span.textContent = tok;
          out.insertBefore(span, caret);
          if (i === tokens.length - 1) {
            done = true;
            setTimeout(() => caret.remove(), 1500);
          }
        }, delay));
      });
    }

    return {
      enter() {
        if (reduceMotion) { out.textContent = responseText; done = true; return; }
        stream();
      },
      leave() {
        if (!done) { timers.forEach(clearTimeout); timers = []; }
      },
    };
  })();

  /* ══════════════════════════════════════════════════════════
     Scene 10 — completion + replay
     ══════════════════════════════════════════════════════════ */
  function buildCompletion(prompt) {
    $("#chat-prompt").textContent = prompt;
    $("#chat-answer").textContent = responseText;
  }

  $("#replay").addEventListener("click", () => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    window.location.reload();
  });

  /* ══════════════════════════════════════════════════════════
     Journey kickoff
     ══════════════════════════════════════════════════════════ */
  function startJourney(prompt) {
    journeyStarted = true;
    userPrompt = prompt;
    landing.stop();

    responseText = buildResponse(prompt);
    $("#arrival-prompt").textContent = `“${prompt}”`;
    buildTokens(prompt);
    const rel = relevantSources(prompt);
    buildCardGrid($("#context-grid"), CONTEXT_ITEMS, rel.ctx);
    buildCardGrid($("#tool-grid"), TOOL_ITEMS, rel.tools);
    buildCompletion(prompt);

    $("#journey").hidden = false;
    $("#site-footer").hidden = false;
    $("#jc").hidden = false;
    document.body.classList.add("journey-on");
    setupObserver();

    // give the layout a beat, then travel into the first scene
    setTimeout(() => {
      $("#s-arrival").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, reduceMotion ? 50 : 650);
  }
})();
