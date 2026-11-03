// Intro de cielo y nubes: se cierra sola, con clic o con cualquier tecla
(() => {
  const el = document.getElementById("intro");
  if (!el) return;
  document.body.classList.add("intro-on");
  let done = false;
  const close = () => {
    if (done) return; done = true;
    el.classList.add("out");
    document.body.classList.remove("intro-on");
    setTimeout(() => el.remove(), 1000);
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // se espera a que el mundo 3D cargue (tope de 15 s) y a que la animación del título termine
  const minimo = new Promise((r) => setTimeout(r, reduce ? 1200 : 4800));
  const listo = new Promise((r) => {
    const ok = () => document.documentElement.classList.contains("world-ready");
    if (ok()) return r();
    const t = setInterval(() => { if (ok()) { clearInterval(t); r(); } }, 150);
    setTimeout(() => { clearInterval(t); r(); }, 15000);
  });
  Promise.all([minimo, listo]).then(close);
  el.addEventListener("click", close);
  addEventListener("keydown", close, { once: true });
})();
