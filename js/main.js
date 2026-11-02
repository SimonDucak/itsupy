const root = document.documentElement;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = window.matchMedia("(min-width: 900px)");

const stage = document.querySelector(".stage");
const track = document.querySelector("[data-track]");
const panels = [...stage.querySelectorAll(".panel")];
const slate = document.querySelector("[data-slate]");
const loader = document.querySelector(".loader");
const progress = document.querySelector(".progress");
const toggle = document.querySelector(".menu-btn");
const overlay = document.querySelector("#nav-overlay");
const headerNav = [...document.querySelectorAll(".top-nav a")];

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const arm = () => root.classList.add("is-ready");
if (document.fonts && document.fonts.ready) document.fonts.ready.then(arm);
setTimeout(arm, 1600);

const dropLoader = () => {
  if (!loader) return;
  if (!root.classList.contains("motion")) {
    loader.remove();
    return;
  }
  const lift = () => {
    loader.classList.add("is-gone");
    const done = () => loader.remove();
    loader.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 1200);
  };
  if (root.classList.contains("is-ready")) setTimeout(lift, 880);
  else {
    const wait = new MutationObserver(() => {
      if (!root.classList.contains("is-ready")) return;
      wait.disconnect();
      setTimeout(lift, 880);
    });
    wait.observe(root, { attributes: true, attributeFilter: ["class"] });
  }
};

dropLoader();

const fitType = (el, maxH) => {
  const parent = el.parentElement;
  if (!parent) return;
  const parentStyle = getComputedStyle(parent);
  const ownStyle = getComputedStyle(el);
  const maxW = parent.clientWidth
    - parseFloat(parentStyle.paddingLeft)
    - parseFloat(parentStyle.paddingRight)
    - parseFloat(ownStyle.marginLeft)
    - parseFloat(ownStyle.marginRight);
  if (maxW < 8) return;
  el.style.fontSize = "100px";
  const range = document.createRange();
  range.selectNodeContents(el);
  const rect = range.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const scale = Math.min(maxW / rect.width, maxH / rect.height);
  el.style.fontSize = `${Math.max(22, Math.floor(100 * scale * 0.97))}px`;
};

const fitWords = () => {
  const panelCap = window.innerHeight * (window.innerWidth < 900 ? 0.22 : 0.32);
  document.querySelectorAll(".panel-word").forEach((el) => fitType(el, panelCap));
  document.querySelectorAll(".foot-word").forEach((el) => fitType(el, window.innerHeight * 0.26));
  const loaderWord = document.querySelector(".loader-word");
  if (loaderWord) fitType(loaderWord, window.innerHeight * 0.34);
  const phone = document.querySelector(".phone");
  if (phone) fitType(phone, window.innerHeight * 0.16);
};

const filmOn = () => root.classList.contains("motion");

const setViewport = () => {
  root.style.setProperty("--vh", `${window.innerHeight}px`);
};

const syncFilm = () => {
  setViewport();
  root.classList.toggle("is-film", filmOn());
  if (!filmOn() && track) track.style.transform = "";
  fitWords();
};

syncFilm();
desktop.addEventListener("change", () => {
  syncFilm();
  if (overlay.classList.contains("is-open") && desktop.matches) setNav(false);
});

const setNav = (open) => {
  overlay.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.classList.toggle("nav-open", open);
};

toggle.addEventListener("click", () => setNav(!overlay.classList.contains("is-open")));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNav(false);
});

const panelIndex = (id) => panels.findIndex((panel) => panel.id === id);

const scrollToPanel = (index, instant) => {
  const n = panels.length;
  const travel = stage.offsetHeight - window.innerHeight;
  const p = n <= 1 ? 0 : index / (n - 1);
  window.scrollTo({
    top: stage.offsetTop + travel * p,
    behavior: instant ? "auto" : "smooth",
  });
};

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;
  const id = link.getAttribute("href").slice(1);
  const index = panelIndex(id);
  setNav(false);
  if (!filmOn() || index < 0) return;
  event.preventDefault();
  scrollToPanel(index);
});

let target = 0;
let current = 0;
let raf = 0;

const measure = () => {
  if (!filmOn()) return 0;
  const travel = stage.offsetHeight - window.innerHeight;
  if (travel <= 0) return 0;
  return Math.min(1, Math.max(0, (window.scrollY - stage.offsetTop) / travel));
};

if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);

const paintFilm = (p) => {
  const n = panels.length;
  track.style.transform = `translate3d(${((-p * (n - 1)) / n) * 100}%, 0, 0)`;
  const index = Math.round(p * (n - 1));
  const panel = panels[index];
  if (panel && slate) {
    slate.textContent = `${String(index + 1).padStart(2, "0")} — ${panel.dataset.name || ""}`;
  }
};

const kick = () => {
  if (raf || !filmOn()) return;
  const step = () => {
    target = measure();
    current += (target - current) * 0.16;
    if (Math.abs(target - current) < 0.0004) current = target;
    paintFilm(current);
    raf = Math.abs(target - current) > 0 ? requestAnimationFrame(step) : 0;
  };
  raf = requestAnimationFrame(step);
};

const paintNav = () => {
  const line = window.scrollY + window.innerHeight * 0.35;
  let currentId = "";
  if (filmOn()) {
    const travel = stage.offsetHeight - window.innerHeight;
    const p = travel <= 0 ? 0 : (window.scrollY - stage.offsetTop) / travel;
    if (p >= 0 && p <= 1) {
      const index = Math.round(p * (panels.length - 1));
      currentId = index === 0 ? "uvod" : "pristup";
    }
  }
  document.querySelectorAll("main section[id], .panel[id]").forEach((section) => {
    if (stage.contains(section) && filmOn()) return;
    if (section.offsetTop <= line) currentId = section.id;
  });
  if (currentId === "ai" || currentId === "namieru") currentId = "pristup";
  const href = currentId === "pristup" || currentId === "sluzby" || currentId === "kontakt"
    ? `#${currentId}`
    : "";
  headerNav.forEach((link) => {
    if (href && link.getAttribute("href") === href) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
};

const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  paintNav();
  kick();
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
const onResize = () => {
  syncFilm();
  current = measure();
  if (filmOn()) paintFilm(current);
  onScroll();
};

window.addEventListener("resize", onResize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", onResize);
}


if (filmOn() && location.hash) {
  const index = panelIndex(location.hash.slice(1));
  if (index >= 0) requestAnimationFrame(() => scrollToPanel(index, true));
}

document.addEventListener("keydown", (event) => {
  if (!filmOn()) return;
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  if (event.target.closest("input, textarea, select")) return;
  const rect = stage.getBoundingClientRect();
  if (rect.top > 2 || rect.bottom < window.innerHeight - 2) return;
  event.preventDefault();
  const n = panels.length;
  const travel = stage.offsetHeight - window.innerHeight;
  const p = travel <= 0 ? 0 : (window.scrollY - stage.offsetTop) / travel;
  let index = Math.round(Math.min(1, Math.max(0, p)) * (n - 1));
  index += event.key === "ArrowRight" ? 1 : -1;
  scrollToPanel(Math.max(0, Math.min(n - 1, index)));
});

if (finePointer && !reduceMotion) {
  root.classList.add("has-cursor");
  const cursor = document.querySelector(".cursor");
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let cx = x;
  let cy = y;
  let running = true;

  const loop = () => {
    if (!running) return;
    cx += (x - cx) * 0.35;
    cy += (y - cy) * 0.35;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };

  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    cursor.classList.add("is-on");
    const field = event.target.closest("input, textarea, select");
    const hot = event.target.closest("a, button");
    cursor.classList.toggle("is-hidden", Boolean(field));
    cursor.classList.toggle("is-hot", Boolean(hot) && !field);
  });

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) loop();
  });

  loop();
}

