const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    nav.classList.toggle('is-open');
  });

  nav.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const yearEl = document.querySelector('[data-year]');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


// === PRODUCT IMAGE TILT ===
const canTilt = window.matchMedia
  ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
  : true;

if (canTilt && !(navigator && navigator.maxTouchPoints > 0)) {
  document.querySelectorAll(".products .card").forEach((card) => {
    const img = card.querySelector("img");
    if (!img) return;

    const maxTilt = 8;
    const scale = 1.05;

    const handleMove = (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
      const ry = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;

      img.style.transform =
        "perspective(900px) rotateX(" +
        rx.toFixed(2) +
        "deg) rotateY(" +
        ry.toFixed(2) +
        "deg) scale(" +
        scale +
        ")";
      card.classList.add("is-tilting");
    };

    const handleLeave = () => {
      img.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
      card.classList.remove("is-tilting");
    };

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseleave", handleLeave);
  });
}

// === AI ASSISTANT ===
const aiToggle = document.querySelector("[data-ai-toggle]");
const aiPanel = document.querySelector("#ai-panel");
const aiBackdrop = document.querySelector("[data-ai-backdrop]");
const aiClose = document.querySelector("[data-ai-close]");

if (aiToggle) {
  const togglePanel = (force) => {
    const shouldOpen =
      typeof force === "boolean"
        ? force
        : !document.body.classList.contains("ai-open");
    document.body.classList.toggle("ai-open", shouldOpen);
    if (aiPanel) {
      aiPanel.setAttribute("aria-hidden", String(!shouldOpen));
    }
    if (aiBackdrop) {
      aiBackdrop.setAttribute("aria-hidden", String(!shouldOpen));
    }
  };

  const prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const noHover = window.matchMedia
    ? window.matchMedia("(hover: none)").matches
    : false;
  const saveData = navigator.connection && navigator.connection.saveData;
  const touchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

  let hoverPlayed = false;
  let audioCtx;

  const playHoverBeep = () => {
    if (prefersReduced || touchDevice) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  };

  aiToggle.addEventListener("pointerenter", () => {
    if (prefersReduced || noHover || touchDevice) return;
    if (hoverPlayed) return;
    hoverPlayed = true;
    playHoverBeep();
  });

  aiToggle.addEventListener("pointerleave", () => {
    hoverPlayed = false;
  });

  aiToggle.addEventListener("click", () => {
    togglePanel();
    if (!prefersReduced) {
      aiToggle.classList.add("is-pressed");
      window.setTimeout(() => {
        aiToggle.classList.remove("is-pressed");
      }, 120);
    }
  });

  if (aiBackdrop) {
    aiBackdrop.addEventListener("click", () => togglePanel(false));
  }
  if (aiClose) {
    aiClose.addEventListener("click", () => togglePanel(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      togglePanel(false);
    }
  });

  if (prefersReduced || noHover || saveData || touchDevice) {
    document.body.classList.add("ai-effects-disabled");
  } else {
    const canvas = document.createElement("canvas");
    canvas.className = "ai-electric-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const traces = [];
    const maxTraces = 10;
    let rafId;
    let isPaused = false;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnTrace = () => {
      const rect = aiToggle.getBoundingClientRect();
      if (!rect.width) return;
      const startX = rect.left + rect.width / 2;
      const startY = rect.bottom + 4;
      const length = 200 + Math.random() * 200;
      const segments = 6;
      const points = [];
      for (let i = 0; i <= segments; i += 1) {
        const progress = i / segments;
        points.push({
          x: startX + (Math.random() - 0.5) * 16,
          y: startY + length * progress,
        });
      }
      traces.push({
        points,
        life: 1,
        drift: Math.random() * Math.PI * 2,
      });
      if (traces.length > maxTraces) {
        traces.shift();
      }
    };

    let lastScrollY = window.scrollY;
    window.addEventListener("scroll", () => {
      const current = window.scrollY;
      if (Math.abs(current - lastScrollY) > 6) {
        spawnTrace();
      }
      lastScrollY = current;
    });

    const animate = (time) => {
      if (isPaused) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nextTraces = [];
      traces.forEach((trace) => {
        const alpha = trace.life * 0.18;
        if (alpha <= 0.01) return;
        ctx.beginPath();
        trace.points.forEach((point, index) => {
          const wobble = Math.sin(time / 1400 + trace.drift + index) * 1.2;
          const x = point.x + wobble;
          const y = point.y + Math.cos(time / 1600 + trace.drift) * 0.6;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.strokeStyle = "rgba(79, 209, 255, " + alpha.toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
        trace.life -= 0.014;
        nextTraces.push(trace);
      });
      traces.length = 0;
      traces.push(...nextTraces);
      rafId = window.requestAnimationFrame(animate);
    };

    document.addEventListener("visibilitychange", () => {
      isPaused = document.hidden;
      if (!isPaused) {
        window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(animate);
      }
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    rafId = window.requestAnimationFrame(animate);
  }
}

// === HERO DISCHARGE ===
const heroDischarge = () => {
  const hero = document.querySelector(".hero-static");
  if (!hero) return;

  const prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const noHover = window.matchMedia
    ? window.matchMedia("(hover: none)").matches
    : false;
  const saveData = navigator.connection && navigator.connection.saveData;
  const touchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
  if (prefersReduced || noHover || touchDevice) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-discharge";
  canvas.setAttribute("aria-hidden", "true");
  hero.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  let lines = [];
  const buildLines = () => {
    const rect = canvas.getBoundingClientRect();
    const originX = rect.width * 0.6;
    const count = 6;
    const segments = 7;
    lines = Array.from({ length: count }, () => {
      const baseX = originX + (Math.random() - 0.5) * 70;
      const points = [];
      for (let i = 0; i <= segments; i += 1) {
        points.push({
          x: baseX + (Math.random() - 0.5) * 14,
          y: (rect.height / segments) * i,
        });
      }
      return { points, drift: Math.random() * Math.PI * 2 };
    });
  };

  resize();
  buildLines();
  window.addEventListener("resize", () => {
    resize();
    buildLines();
  });

  let triggered = false;
  const duration = 1200;

  const animate = (startTime) => {
    const tick = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const alpha = 0.22 * (1 - progress);
      const rect = canvas.getBoundingClientRect();
      const maxY = rect.height * progress;

      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(79, 209, 255, " + alpha.toFixed(3) + ")";

      lines.forEach((line, idx) => {
        ctx.beginPath();
        for (let i = 0; i < line.points.length; i += 1) {
          const point = line.points[i];
          if (point.y > maxY) {
            const prev = line.points[Math.max(i - 1, 0)];
            const span = point.y - prev.y || 1;
            const t = (maxY - prev.y) / span;
            const x = prev.x + (point.x - prev.x) * t;
            const y = prev.y + (point.y - prev.y) * t;
            ctx.lineTo(
              x + Math.sin(time / 1100 + line.drift + idx) * 1.2,
              y
            );
            break;
          }
          const wobble = Math.sin(time / 1100 + line.drift + i) * 1.2;
          if (i === 0) {
            ctx.moveTo(point.x + wobble, point.y);
          } else {
            ctx.lineTo(point.x + wobble, point.y);
          }
        }
        ctx.stroke();
      });

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    };
    window.requestAnimationFrame(tick);
  };

  const onScroll = () => {
    if (triggered) return;
    if (window.scrollY > 8) {
      triggered = true;
      window.removeEventListener("scroll", onScroll);
      animate(performance.now());
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
};

heroDischarge();

// === AI MAGNETIC ===
if (aiToggle) {
  const prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const noHover = window.matchMedia
    ? window.matchMedia("(hover: none)").matches
    : false;
  const saveData = navigator.connection && navigator.connection.saveData;
  const touchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

  if (!(prefersReduced || noHover || saveData || touchDevice)) {
    const aiIcon = aiToggle.querySelector(".ai-icon");
    const maxDistance = 80;
    const maxMove = 10;
    let rafId = null;
    let lastEvent = null;

    const updateMagnet = () => {
      if (!lastEvent || !aiIcon) {
        rafId = null;
        return;
      }
      const rect = aiToggle.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = lastEvent.clientX - centerX;
      const dy = lastEvent.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance < maxDistance) {
        const strength = 0.12;
        const tx = Math.max(-maxMove, Math.min(maxMove, dx * strength));
        const ty = Math.max(-maxMove, Math.min(maxMove, dy * strength));
        aiIcon.style.setProperty("--ai-x", tx.toFixed(2) + "px");
        aiIcon.style.setProperty("--ai-y", ty.toFixed(2) + "px");
      } else {
        aiIcon.style.setProperty("--ai-x", "0px");
        aiIcon.style.setProperty("--ai-y", "0px");
      }
      rafId = null;
    };

    window.addEventListener("pointermove", (event) => {
      lastEvent = event;
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateMagnet);
      }
    });

    window.addEventListener("pointerleave", () => {
      if (aiIcon) {
        aiIcon.style.setProperty("--ai-x", "0px");
        aiIcon.style.setProperty("--ai-y", "0px");
      }
    });
  }
}
