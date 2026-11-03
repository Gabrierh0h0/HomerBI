import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEBUG = new URLSearchParams(location.search).has("debug");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2000);
const view = { x: 0, y: 0 };            // desplazamiento actual de la proyección (fracción del ancho/alto)
const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
addEventListener("resize", resize); resize();

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a68, 1.7));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.6); sun.position.set(-4, 8, 6); scene.add(sun);

const draco = new DRACOLoader().setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
const loader = new GLTFLoader().setDRACOLoader(draco);
const load = (n) => loader.loadAsync(`models/${n}.glb`);

const worlds = { room: new THREE.Group(), street: new THREE.Group() };
Object.values(worlds).forEach((w) => { w.visible = false; scene.add(w); });

// ---- Reparto: archivo, tamaño y tipo ----
const CAST = {
  scuzzy:    { file: "homer_scuzzy",    size: 1.75, rig: true },
  underwear: { file: "homer_underwear", size: 1.75, rig: true },
  muumuu:    { file: "homer_muumuu",    size: 1.8,  rig: true },
  donut:     { file: "homer_donut",     size: 1.75, rig: true },
  evil:      { file: "homer_evil",      size: 1.75, rig: true },
  marge:     { file: "marge_cop",       size: 1.7,  rig: true },
  maggie:    { file: "maggie",          size: 0.95, rig: true },
  car:       { file: "planet_hype_car", size: 4.6,  axis: "z", front: 0 },
  police:    { file: "police_car",      size: 4.6,  axis: "z", front: 0, lights: true },
  bike:      { file: "hover_bike",      size: 2.6,  axis: "z" },
  six:       { file: "duff_sixpack",    size: 0.45, axis: "x" },
  cooler:    { file: "duff_cooler",     size: 0.95, axis: "x" },
  six2:      { file: "duff_sixpack",    size: 0.45, axis: "x" },
  cooler2:   { file: "duff_cooler",     size: 0.95, axis: "x" },
};
const SEAT = [-0.42, 0.02, -0.12];      // asiento del conductor, en coordenadas del auto

// ---- Diapositivas (clave = id de la sección) ----
// c: centro · a: ángulo de cámara · d,h,ly: distancia, altura y mirada (de→a)
// layout: 'text' (personajes a la derecha) | 'chart' (abajo a la izquierda) | 'wide' (fila abajo)
// reparto: u = derecha en pantalla, v = hacia la cámara (m); ry = giro extra; anim = clip o lista de clips
// walk/drive = {from,to,t:[p0,p1]} · ride = {car, off} · show = [p0,p1] · hop · fly · spin
const ROOM = [-4.3, 0, 2.4], ST = [-30, -0.2, -119];
const T = (a) => a;
const SLIDES = {
  "hero": { world: "room", c: ROOM, a: -0.5, d: [5.4, 4.3], h: [1.9, 1.5], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "underwear", u: -0.2, v: 0.3, anim: ["talk_b", "wave", "idle"] }, { k: "six", u: 1.6, v: -0.6, spin: 0.4, sc: 4.5 }] },
  "why-div": { world: "room", c: ROOM, a: -0.4, d: [5.4, 4.8], h: [1.7, 1.5], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "underwear", walk: { from: [0.4, 0.6], to: [-2.2, -1.0], t: [0.15, 0.85] }, anim: "wave" }, { k: "cooler", u: 1.6, v: -0.8, spin: 0.3, sc: 3.1 }] },
  "why-problem": { world: "street", c: ST, a: 0.35, d: [11, 8.5], h: [4, 2.2], ly: [1.2, 1.3], layout: "text",
    cast: [
      { k: "car", drive: { from: [-9, -9], to: [-2.2, -1.2], t: [0.02, 0.5] }, sc: 1.25 },
      { k: "scuzzy", ride: { car: "car", off: SEAT }, anim: "drive" },
      { k: "police", drive: { from: [10, -12], to: [3.6, -3.6], t: [0.12, 0.55] }, lights: [0.55, 1] },
      { k: "marge", show: [0.55, 1], walk: { from: [3.1, -3.2], to: [0.9, 0.2], t: [0.58, 0.85] }, anim: ["talk_a", "point", "idle"] },
      { k: "cooler", u: 6, v: -7, spin: 0.25, sc: 4.5 }] },
  "why-belief": { world: "street", c: ST, a: -0.4, d: [7.5, 6], h: [2, 1.7], ly: [1.2, 1.3], layout: "text",
    cast: [{ k: "evil", u: 0.7, v: 0.2, anim: ["point", "talk_b", "laugh"], ry: -0.2 }, { k: "scuzzy", u: -1.3, v: 0.4, anim: ["think", "idle"], ry: 0.4 },
           { k: "marge", u: 2.4, v: 0.6, anim: ["idle", "talk_a"], ry: -0.5 }, { k: "car", u: -3.6, v: -3.5, ry: 0.8, sc: 1.2 },
           { k: "six", u: 3.2, v: -4.5, spin: 0.3, sc: 10.8 }] },
  "why-users": { world: "room", c: ROOM, a: -0.45, d: [5, 4.4], h: [1.6, 1.4], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "marge", u: 0.5, v: 0.2, anim: ["talk_b", "point"], ry: -0.2 }, { k: "scuzzy", u: -1.1, v: 0.4, anim: ["think", "idle"], ry: 0.4 },
           { k: "six", u: 1.9, v: -0.8, spin: 0.3, sc: 3.6 }] },
  "why-tasks": { world: "street", c: ST, a: 0.3, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "text",
    cast: [{ k: "marge", u: 0.6, v: 0.3, anim: ["point", "talk_b"], ry: -0.3 }, { k: "underwear", u: -0.8, v: 0.5, anim: ["talk_a", "idle"], ry: 0.3 },
           { k: "car", u: 4, v: -3, ry: -0.7, sc: 1.3 }, { k: "six", u: -1, v: -6, spin: 0.3, sc: 10.8 }] },
  "what-div": { world: "room", c: ROOM, a: -0.35, d: [5.2, 4.4], h: [1.7, 1.5], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "underwear", u: -0.8, v: 0.3, anim: ["wave", "talk_a"], ry: 0.3 }, { k: "muumuu", u: 0.8, v: 0.2, anim: ["laugh", "idle"], ry: -0.2 },
           { k: "cooler", u: 2.0, v: -0.8, spin: 0.3, sc: 3.1 }] },
  "what-sources": { world: "room", c: ROOM, a: -0.5, d: [5.2, 4.6], h: [1.6, 1.5], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "marge", u: 0.6, v: 0.2, anim: ["talk_a", "idle"], ry: -0.3 }, { k: "underwear", u: -0.9, v: 0.5, anim: ["think", "talk_a"], ry: 0.4 },
           { k: "six", u: 1.9, v: -0.7, spin: 0.3, sc: 3.9 }] },
  "what-unit": { world: "room", c: ROOM, a: -0.3, d: [5, 4.4], h: [1.6, 1.4], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "scuzzy", u: 0.3, v: 0.3, anim: ["talk_b", "think"], ry: -0.1 }, { k: "marge", u: -1.4, v: 0, anim: ["idle", "talk_a"], ry: 0.5 },
           { k: "cooler", u: 1.9, v: -0.7, spin: 0.3, sc: 3.1 }] },
  "what-derived": { world: "street", c: ST, a: 0.4, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "text",
    cast: [{ k: "marge", u: 0.5, v: 0.3, anim: ["point", "talk_b"], ry: -0.3 }, { k: "scuzzy", u: -0.9, v: 0.5, anim: ["think", "idle"], ry: 0.3 },
           { k: "police", u: 4, v: -3, ry: -0.8, lights: [0, 1], sc: 1.2 }, { k: "car", u: -4.5, v: -3.5, ry: 0.7, sc: 1.2 },
           { k: "six", u: 1.6, v: -5, spin: 0.3, sc: 10.8 }] },
  "how-div": { world: "street", c: ST, a: -0.3, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "text",
    cast: [{ k: "scuzzy", u: -0.6, v: 0.4, anim: ["wave", "talk_a"], ry: 0.3 }, { k: "marge", u: 0.8, v: 0.3, anim: ["talk_a", "idle"], ry: -0.3 },
           { k: "car", u: 3.6, v: -2.8, ry: -0.7, sc: 1.4 }, { k: "cooler", u: 1.0, v: -6.5, ry: -0.3, sc: 8.1 }] },
  "how-scatter": { world: "room", c: ROOM, a: -0.55, d: [5.6, 5], h: [1.7, 1.5], ly: [1.0, 1.0], layout: "chart",
    cast: [{ k: "marge", u: 0.6, v: 0.3, anim: ["point", "talk_a", "talk_b"], ry: -0.25 }, { k: "scuzzy", u: -0.7, v: 0.5, anim: ["think", "idle"], ry: 0.35 },
           { k: "six", u: 2.0, v: -0.4, spin: 0.3, sc: 3.1 }] },
  "how-map": { world: "room", c: ROOM, a: -0.35, d: [5.6, 5], h: [1.7, 1.5], ly: [1.0, 1.0], layout: "chart",
    cast: [{ k: "marge", u: 0.5, v: 0.2, anim: ["talk_b", "idle"], ry: -0.3 }, { k: "underwear", u: -0.9, v: 0.6, anim: ["surprise", "talk_a"], ry: 0.4 },
           { k: "cooler", u: 2.0, v: -0.4, spin: 0.3, sc: 2.5 }] },
  "how-twist": { world: "room", c: ROOM, a: -0.45, d: [5, 4], h: [1.6, 1.4], ly: [1.1, 1.1], layout: "text",
    cast: [{ k: "donut", u: 0, v: 0.2, anim: ["surprise", "think", "laugh"] }, { k: "scuzzy", u: -1.4, v: -0.3, anim: ["think", "idle"], ry: 0.5 },
           { k: "six", u: 1.7, v: -0.7, spin: 0.3, sc: 4.8 }] },
  "how-trends": { world: "street", c: ST, a: 0.5, d: [8, 7], h: [2.2, 2], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "marge", u: 0.6, v: 0.3, anim: ["talk_b", "talk_a"], ry: -0.3 }, { k: "scuzzy", u: -0.8, v: 0.5, anim: ["think", "idle"], ry: 0.3 },
           { k: "police", u: 4, v: -3, ry: -0.8, lights: [0, 1], sc: 1.2 }, { k: "six", u: -4.5, v: -4, spin: 0.3, sc: 9.0 }] },
  "how-comp": { world: "street", c: ST, a: -0.5, d: [8, 7], h: [2.2, 2], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "muumuu", u: 0, v: 0.3, anim: ["laugh", "talk_b", "idle"], ry: 0.2 }, { k: "cooler", u: 1.6, v: 0.8, ry: -0.5, sc: 1.6 }, { k: "six", u: -1.5, v: 0.9, sc: 1.6 },
           { k: "six2", u: -4.8, v: -4, spin: 0.3, sc: 9.0 }, { k: "cooler2", u: 4.6, v: -4.5, spin: 0.3, sc: 9.0 }] },
  "how-unreg": { world: "street", c: ST, a: 0.2, d: [8, 7], h: [2.2, 2], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "scuzzy", u: -1.0, v: 0.6, anim: ["think", "talk_a"], ry: 0.4 }, { k: "car", u: 3.8, v: -2.6, ry: -0.7, sc: 1.4 },
           { k: "cooler", u: -4.2, v: -4.5, spin: 0.3, sc: 9.0 }] },
  "how-col1": { world: "street", c: ST, a: 0.4, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "underwear", u: 0, v: 0.2, anim: ["talk_a", "wave", "idle"], ry: 0.1 }, { k: "car", u: 3.6, v: -2.4, ry: -0.6, sc: 1.4 },
           { k: "six", u: -4.2, v: -4.2, spin: 0.3, sc: 9.0 }] },
  "how-col2": { world: "street", c: ST, a: -0.4, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "scuzzy", u: 0, v: 0.3, anim: ["talk_b", "think"], ry: 0.2 }, { k: "six", u: 1.5, v: 0.8, sc: 1.6 },
           { k: "bike", u: 4.2, v: -3, ry: -0.7, sc: 1.2 }, { k: "cooler", u: -4.4, v: -4.5, spin: 0.3, sc: 9.0 }] },
  "how-col3": { world: "street", c: ST, a: 0.3, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "marge", u: 0.4, v: 0.3, anim: ["point", "talk_a"], ry: -0.2 }, { k: "police", u: 3.8, v: -3, ry: -0.7, lights: [0, 1], sc: 1.3 },
           { k: "car", u: -4.4, v: -3.6, ry: 0.7, sc: 1.2 }] },
  "how-col4": { world: "street", c: ST, a: -0.2, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "chart",
    cast: [{ k: "scuzzy", u: -0.6, v: 0.4, anim: ["idle", "laugh"], ry: 0.3 }, { k: "marge", u: 0.8, v: 0.3, anim: ["talk_a", "idle"], ry: -0.3 },
           { k: "six", u: -4.2, v: -4.2, spin: 0.3, sc: 9.0 }, { k: "car", u: 4, v: -3.2, ry: -0.6, sc: 1.3 }] },
  "how-dash": { world: "room", c: ROOM, a: -0.4, d: [7, 6.2], h: [1.8, 1.6], ly: [1.0, 1.0], layout: "wide",
    cast: [{ k: "underwear", u: -2.6, v: 0.5, anim: "wave", ry: 0.3 }, { k: "scuzzy", u: -1.4, v: 0.3, anim: "laugh", ry: 0.2 }, { k: "muumuu", u: -0.2, v: 0.5, anim: "talk_b" },
           { k: "donut", u: 1.0, v: 0.3, anim: "surprise", ry: -0.2 }, { k: "evil", u: 2.2, v: 0.5, anim: "point", ry: -0.3 }] },
  "concl-div": { world: "street", c: ST, a: 0.1, d: [8, 6.6], h: [2.1, 1.9], ly: [1.3, 1.4], layout: "text",
    cast: [{ k: "scuzzy", u: -0.5, v: 0.4, anim: ["wave", "talk_b"], ry: 0.3 }, { k: "marge", u: 0.9, v: 0.3, anim: ["talk_a", "idle"], ry: -0.3 },
           { k: "car", u: 3.8, v: -3.2, ry: -0.7, sc: 1.4 }, { k: "cooler", u: -3.6, v: -5, spin: 0.3, sc: 9.0 }] },
  "concl-yes": { world: "street", c: ST, a: -0.35, d: [7.5, 6], h: [2, 1.8], ly: [1.3, 1.4], layout: "text",
    cast: [{ k: "marge", u: 0.5, v: 0.3, anim: ["talk_b", "point"], ry: -0.3 }, { k: "underwear", u: -0.9, v: 0.5, anim: ["talk_a", "laugh"], ry: 0.3 },
           { k: "six", u: 2.8, v: -4.2, spin: 0.3, sc: 10.8 }, { k: "car", u: -4.2, v: -3.6, ry: 0.7, sc: 1.2 }] },
  "concl-no": { world: "street", c: ST, a: 0.35, d: [7.5, 6], h: [2, 1.8], ly: [1.3, 1.4], layout: "text",
    cast: [{ k: "scuzzy", u: 0.4, v: 0.3, anim: ["think", "talk_a"], ry: -0.2 }, { k: "evil", u: -1.2, v: 0.4, anim: ["point", "idle"], ry: 0.4 },
           { k: "police", u: 4.2, v: -3.2, ry: -0.8, lights: [0, 1], sc: 1.3 }, { k: "cooler", u: 1.8, v: -5.2, spin: 0.3, sc: 9.0 }] },
  "concl-next": { world: "street", c: ST, a: 0.1, d: [8, 9], h: [2.2, 3.6], ly: [1.3, 2.2], layout: "text",
    cast: [
      { k: "maggie", walk: { from: [3, -3], to: [0.4, 0.8], t: [0.05, 0.5] }, anim: "idle" },
      { k: "scuzzy", u: -1.6, v: 0.2, anim: ["wave", "idle"], ry: 0.4 }, { k: "marge", u: 1.8, v: 0.3, anim: ["talk_a", "idle"], ry: -0.4 },
      { k: "car", u: -3.8, v: -3.4, ry: 0.7, sc: 1.3 }, { k: "bike", fly: 1 }, { k: "six", u: 4.6, v: -5, spin: 0.3, sc: 10.8 }] },
};
const LAYOUT = { text: [0.2, 0], chart: [-0.24, 0.16], wide: [0, 0.26] };   // [x, y] del desplazamiento de proyección

const sections = [...document.querySelectorAll(".scene")];
const fade = document.querySelector(".fade");
let activeWorld = null;

const refresh = (m) => { m.updateMatrixWorld(true); m.traverse((o) => { if (o.isSkinnedMesh) o.skeleton.update(); }); };
// Pone un modelo de pie sobre y=0 con la altura/largo deseado y lo mete en un grupo
function wrap(model, { size, axis = "y" }) {
  refresh(model);
  const box = new THREE.Box3().setFromObject(model, true);
  const s = size / (box.max[axis] - box.min[axis]);
  model.scale.setScalar(s);
  refresh(model);
  box.setFromObject(model, true);
  model.position.y -= box.min.y;
  const c = box.getCenter(new THREE.Vector3());
  model.position.x -= c.x; model.position.z -= c.z;
  const g = new THREE.Group(); g.add(model);
  return g;
}

const actors = {};
async function build() {
  const [room, street] = await Promise.all([load("room"), load("street")]);
  worlds.room.add(room.scene); worlds.street.add(street.scene);
  await Promise.all(Object.entries(CAST).map(async ([k, def]) => {
    const gltf = await load(def.file);
    gltf.scene.traverse((o) => { o.frustumCulled = false; });
    let mixer = null, actions = {};
    if (def.rig && gltf.animations.length) {
      // se mide el personaje ya posado: la caja del reposo no coincide con lo que se dibuja
      mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => { actions[clip.name] = mixer.clipAction(clip); });
      actions.idle.play(); mixer.update(0);
      refresh(gltf.scene);
    }
    const g = wrap(gltf.scene, def);
    if (mixer) actions.idle.stop();
    const a = { g, def, mixer, actions, cur: null, phase: Math.random() * 20, lights: [] };
    if (def.lights) {
      [[0xff2a2a, -0.35], [0x2a5bff, 0.35]].forEach(([col, x]) => {
        const l = new THREE.PointLight(col, 0, 14, 2); l.position.set(x, 2.0, 0); g.add(l); a.lights.push(l);
      });
    }
    g.visible = false; scene.add(g); actors[k] = a;
  }));
  if (DEBUG) window.__w = { camera, THREE, worlds, actors };
}

function play(a, name) {
  if (!a.mixer || a.cur === name || !a.actions[name]) return;
  const next = a.actions[name].reset().play();
  if (a.cur) next.crossFadeFrom(a.actions[a.cur], 0.35, false);   // sin fundido la primera vez: nunca se ve la T-pose
  else next.setEffectiveWeight(1);
  a.cur = name;
}
// una lista de clips se va alternando cada ~4,5 s (cada personaje con su propio desfase)
const pick = (e, a, t) => Array.isArray(e.anim) ? e.anim[Math.floor((t + a.phase) / 4.5) % e.anim.length] : (e.anim ?? "idle");

function sectionProgress(i) {
  const r = sections[i].getBoundingClientRect();
  return THREE.MathUtils.clamp((innerHeight - r.top) / (r.height + innerHeight), 0, 1);
}
function currentSlide() {
  const mid = innerHeight / 2;
  return sections.findIndex((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
}

const ease = (x) => x * x * (3 - 2 * x);
const lerp = THREE.MathUtils.lerp;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const right = new THREE.Vector3(), toward = new THREE.Vector3(), pos = new THREE.Vector3(), look = new THREE.Vector3();
if (DEBUG) { new OrbitControls(camera, canvas); canvas.style.pointerEvents = "auto"; }
const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const idx = currentSlide(), S = SLIDES[sections[idx]?.id];
  canvas.style.visibility = S || DEBUG ? "visible" : "hidden";
  if (S) {
    if (S.world !== activeWorld) {
      if (activeWorld) { fade.classList.add("on"); setTimeout(() => fade.classList.remove("on"), 220); }
      activeWorld = S.world;
      const street = activeWorld === "street";
      scene.background = new THREE.Color(street ? 0x9bd8ff : 0x121c33);
      scene.fog = street ? new THREE.Fog(0xbfe6ff, 70, 280) : null;
      Object.entries(worlds).forEach(([k, w]) => (w.visible = k === activeWorld));
    }
    const p = reduce ? 0.5 : ease(sectionProgress(idx));
    const [cx, cy, cz] = S.c, ang = S.a;
    right.set(Math.cos(ang), 0, -Math.sin(ang)); toward.set(Math.sin(ang), 0, Math.cos(ang));
    if (!DEBUG) {
      pos.set(cx, lerp(S.h[0], S.h[1], p), cz).addScaledVector(toward, lerp(S.d[0], S.d[1], p));
      camera.position.copy(pos);
      look.set(cx, lerp(S.ly[0], S.ly[1], p), cz);
      camera.lookAt(look);
    }
    const [tx, ty] = innerWidth >= 900 ? LAYOUT[S.layout] : [0, 0];
    view.x += (tx - view.x) * Math.min(1, dt * 5); view.y += (ty - view.y) * Math.min(1, dt * 5);
    camera.setViewOffset(innerWidth, innerHeight, -innerWidth * view.x, -innerHeight * view.y, innerWidth, innerHeight);

    const used = new Set();
    S.cast.forEach((e) => {
      const a = actors[e.k]; if (!a) return;
      if (e.show && (p < e.show[0] || p > e.show[1])) return;
      used.add(e.k);
      a.g.visible = true;
      // movimiento: personas caminan, vehículos frenan con suavidad
      if (e.ride) {
        const car = actors[e.ride.car];
        car.g.add(a.g); a.g.position.set(...e.ride.off); a.g.rotation.set(0, 0, 0);
        if (a.mixer) { play(a, e.anim ?? "drive"); if (!reduce) a.mixer.update(dt); else a.mixer.setTime(0.4); }
        return;
      }
      worlds[S.world].add(a.g);
      let u = e.u ?? 0, v = e.v ?? 0, ry = (e.ry ?? 0) + ang, anim = pick(e, a, t), y = 0, pitch = 0, roll = 0;
      const mv = e.walk || e.drive;
      if (mv) {
        const q = reduce ? 1 : clamp01((p - mv.t[0]) / (mv.t[1] - mv.t[0]));
        const k = e.drive ? 1 - Math.pow(1 - q, 2.4) : q;       // el auto desacelera al llegar
        u = lerp(mv.from[0], mv.to[0], k); v = lerp(mv.from[1], mv.to[1], k);
        const du = mv.to[0] - mv.from[0], dv = mv.to[1] - mv.from[1];
        const heading = Math.atan2(du * right.x + dv * toward.x, du * right.z + dv * toward.z);
        if (e.walk) { if (q > 0 && q < 1) { ry = heading; anim = "walk"; } }
        else {
          ry = heading + (a.def.front ?? 0);
          pitch = Math.sin(clamp01((q - 0.55) / 0.45) * Math.PI) * 0.05;   // el frente se hunde al frenar
          roll = Math.sin(t * 9) * 0.004 * (q < 1 ? 1 : 0.2);
          y = Math.abs(Math.sin(t * 7)) * 0.012 * (q < 1 ? 1 : 0);
        }
      }
      if (e.hop && !reduce) y = Math.abs(Math.sin(t * 5)) * 0.35;
      if (e.fly) { const q = reduce ? 0.3 : p; u = -1.5 + q * 3; v = -2 - q * 40; y = 0.5 + q * 4 + Math.sin(t * 3) * 0.08; ry = Math.PI * 0.95; }
      if (a.def.flip) ry += a.def.flip;
      a.g.position.set(cx + right.x * u + toward.x * v, cy + y, cz + right.z * u + toward.z * v);
      a.g.scale.setScalar(e.sc ?? 1);
      a.g.rotation.set(pitch, e.spin && !reduce ? t * 0.8 * e.spin : ry, roll, "YXZ");
      if (a.mixer) { play(a, anim); if (!reduce) a.mixer.update(dt); else a.mixer.setTime(0.4); }
      if (a.lights.length) {
        const on = e.lights && p >= e.lights[0] && p <= e.lights[1] && !reduce;
        a.lights[0].intensity = on && Math.sin(t * 12) > 0 ? 60 : 0;
        a.lights[1].intensity = on && Math.sin(t * 12) <= 0 ? 60 : 0;
      }
    });
    Object.entries(actors).forEach(([k, a]) => { if (!used.has(k)) a.g.visible = false; });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
build().then(() => { document.documentElement.classList.add("world-ready"); frame(); });
