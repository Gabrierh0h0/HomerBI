// Intro de cielo y nubes: solo se cierra cuando quien presenta avanza (clic, tecla, rueda o botón)
(() => {
  const el = document.getElementById("intro");
  if (!el) return;
  const top = () => scrollTo({ top: 0, behavior: "instant" });
  history.scrollRestoration = "manual"; top(); addEventListener("load", top);   // siempre arranca en la primera diapositiva
  document.body.classList.add("intro-on");
  let done = false;
  const ready = () => document.documentElement.classList.contains("world-ready");
  const close = () => {
    if (done) return;
    if (!ready()) { setTimeout(close, 150); return; }   // si el mundo 3D aún carga, espera
    done = true;
    el.classList.add("out");
    document.body.classList.remove("intro-on");
    setTimeout(() => el.remove(), 1000);
  };
  const next = (e) => {
    if (done) return;
    if (["Tab", "Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
    e.stopImmediatePropagation(); e.preventDefault();   // la tecla solo cierra la intro, no cambia de diapositiva
    close();
  };
  el.addEventListener("click", close);
  addEventListener("keydown", next, true);
  addEventListener("wheel", (e) => { if (e.deltaY > 0) close(); }, { passive: true });
  addEventListener("touchstart", close, { passive: true, once: true });
})();
