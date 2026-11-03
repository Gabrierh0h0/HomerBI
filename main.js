const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const scenes = [...document.querySelectorAll(".scene")];

// Puntos de navegación
const dots = document.querySelector(".dots");
scenes.forEach((s, i) => {
  const a = document.createElement("a");
  a.href = `#${s.id}`;
  a.setAttribute("aria-label", `Escena ${i}`);
  dots.append(a);
});
const dotEls = [...dots.children];

// Teclado: ← → / PageUp PageDown para avanzar por escenas (modo presentación)
const current = () => {
  const mid = scrollY + innerHeight / 2;
  return Math.max(0, scenes.findIndex((s) => s.offsetTop + s.offsetHeight > mid));
};
addEventListener("keydown", (e) => {
  const next = ["ArrowRight", "ArrowDown", "PageDown"].includes(e.key);
  const prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault();
  const i = Math.min(scenes.length - 1, Math.max(0, current() + (next ? 1 : -1)));
  scenes[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
});

// Marca la escena activa
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      dotEls.forEach((d, i) => d.classList.toggle("on", scenes[i] === en.target));
    }
  });
}, { threshold: 0.5 });
scenes.forEach((s) => io.observe(s));

// Movimiento (GSAP) — solo si el usuario no pide menos movimiento
if (!reduce && window.gsap) {
  document.documentElement.classList.add("js");
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);   // en equipos lentos las animaciones no se arrastran

  // Auto "carretera": avanza con el scroll
  gsap.to(".road__car", {
    x: () => innerWidth - 22,
    ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });

  // Revelados de texto y figuras, una vez
  scenes.forEach((s) => {
    const items = s.querySelectorAll(".display, .seg, .headline, .quote, .bignum, .lede, .body, .kv, .points li, .bi, .byline, .source");
    items.forEach((el) => el.classList.add("rv"));
    gsap.to(items, {
      opacity: 1, y: 0, duration: 0.8, ease: "power4.out", stagger: 0.08,
      scrollTrigger: { trigger: s, start: "top 65%", once: true },
    });
  });

  // Contador del gancho
  document.querySelectorAll(".count").forEach((el) => {
    const to = parseFloat(el.dataset.to), dec = +el.dataset.dec || 0, o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.8, ease: "power2.out",
      onUpdate: () => (el.textContent = o.v.toFixed(dec).replace(".", ",")),
      scrollTrigger: { trigger: el, start: "top 80%", once: true },
    });
  });
} else {
  document.querySelectorAll(".count").forEach((el) => (el.textContent = el.dataset.to.replace(".", ",")));
}
