// ---------- ESTADO ----------
let players = [];
let level = "picante";
let deck = [];      // retos barajados de la intensidad elegida
let deckIndex = 0;
let nightMode = false;
let copas = 0;
let gameType = "retos"; // "retos" | "moneda"
let coinStyle = "normal"; // "normal" | "mixto"

// Umbrales del Modo Noche: a partir de X copas, sube de nivel solo
const nightThresholds = [
  { copas: 0,  level: "suave"   },
  { copas: 6,  level: "picante" },
  { copas: 13, level: "salvaje" },
  { copas: 22, level: "bestia"  },
];
const levelUpMsg = {
  picante: "🌶️ La cosa se anima...<br>¡Modo Picante!",
  salvaje: "🔥 La noche se calienta...<br>¡Modo Salvaje!",
  bestia:  "😈 Ya no hay vuelta atrás...<br>¡Modo Bestia!",
};

// ---------- ELEMENTOS ----------
const $ = (id) => document.getElementById(id);
const setup = $("setup"), game = $("game");
const nameInput = $("nameInput"), playersList = $("playersList"), hint = $("hint");
const startBtn = $("startBtn"), addBtn = $("addBtn");
const card = $("card"), challengeEl = $("challenge"), cardTag = $("cardTag");
const levelBadge = $("levelBadge"), nextBtn = $("nextBtn"), exitBtn = $("exitBtn");

// ---------- SETUP: jugadores ----------
function addPlayer() {
  const name = nameInput.value.trim();
  if (!name) return;
  if (players.length >= 16) return;
  if (players.some((p) => p.toLowerCase() === name.toLowerCase())) { nameInput.value = ""; return; }
  players.push(name);
  nameInput.value = "";
  nameInput.focus();
  renderPlayers();
}

function removePlayer(i) { players.splice(i, 1); renderPlayers(); }

function renderPlayers() {
  playersList.innerHTML = "";
  players.forEach((p, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `${escapeHtml(p)} <span class="x">✕</span>`;
    chip.querySelector(".x").onclick = () => removePlayer(i);
    playersList.appendChild(chip);
  });
  const ok = players.length >= 3;
  startBtn.disabled = !ok;
  hint.textContent = ok
    ? `${players.length} jugadores listos 🍻`
    : `Añade al menos ${3 - players.length} jugador${3 - players.length === 1 ? "" : "es"} más`;
}

addBtn.onclick = addPlayer;
nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addPlayer(); });

// ---------- INTENSIDAD ----------
const bestiaNote = $("bestiaNote");
const nightBtn = $("nightBtn");
document.querySelectorAll(".int-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".int-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    level = btn.dataset.level;
    nightMode = false;
    nightBtn.classList.remove("active");
    bestiaNote.classList.toggle("show", level === "bestia");
  };
});

// Selector de juego: Retos (4 intensidades) vs La Moneda (2 estilos)
const intensitySection = $("intensitySection"), coinStyleSection = $("coinStyleSection");
document.querySelectorAll(".gt-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".gt-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gameType = btn.dataset.game;
    const isMoneda = gameType === "moneda";
    intensitySection.style.display = isMoneda ? "none" : "";
    coinStyleSection.style.display = isMoneda ? "" : "none";
    if (isMoneda) { nightMode = false; nightBtn.classList.remove("active"); }
  };
});

// Selector de estilo de La Moneda
const mixtoNote = $("mixtoNote");
document.querySelectorAll(".cs-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".cs-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    coinStyle = btn.dataset.style;
    mixtoNote.classList.toggle("show", coinStyle === "mixto");
  };
});

// Modo Noche: desactiva la intensidad manual y arranca en suave
nightBtn.onclick = () => {
  nightMode = !nightMode;
  nightBtn.classList.toggle("active", nightMode);
  if (nightMode) {
    document.querySelectorAll(".int-btn").forEach((b) => b.classList.remove("active"));
    bestiaNote.classList.remove("show");
  }
};

// ---------- BARAJAR ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  // Solo retos que necesiten como mucho los jugadores disponibles
  const usable = CHALLENGES[level].filter((c) => {
    const max = maxPlaceholder(c.text);
    return max < players.length;
  });
  deck = shuffle(usable);
  deckIndex = 0;
}

function maxPlaceholder(text) {
  const matches = [...text.matchAll(/\{(\d+)\}/g)].map((m) => +m[1]);
  return matches.length ? Math.max(...matches) : -1;
}

// Rellena {0},{1},{2}... con jugadores DISTINTOS al azar
function fillNames(text) {
  const needed = maxPlaceholder(text) + 1;
  const picks = shuffle(players).slice(0, needed);
  return text.replace(/\{(\d+)\}/g, (_, n) => `<strong>${escapeHtml(picks[+n])}</strong>`)
             .replace(/\{ALL\}/g, "<strong>todos</strong>");
}

// ---------- JUGAR ----------
function nextChallenge() {
  if (deckIndex >= deck.length) buildDeck(); // se acabó la tanda: rebaraja
  const c = deck[deckIndex++];
  cardTag.textContent = c.tag;
  challengeEl.innerHTML = fillNames(c.text);
  card.classList.remove("flip"); void card.offsetWidth; card.classList.add("flip");
}

const levelInfo = { suave: "😇 Suave", picante: "🌶️ Picante", salvaje: "🔥 Salvaje", bestia: "😈 Bestia" };

const copasBar = $("copasBar"), copasNum = $("copasNum"), addCopaBtn = $("addCopaBtn"), levelUp = $("levelUp");

startBtn.onclick = () => {
  if (gameType === "moneda") { startCoin(); return; }
  if (nightMode) { level = "suave"; copas = 0; copasNum.textContent = "0"; }
  copasBar.classList.toggle("show", nightMode);
  buildDeck();
  levelBadge.textContent = levelInfo[level];
  setup.classList.remove("active");
  game.classList.add("active");
  nextChallenge();
};

// Sumar copa → recalcular nivel y avisar si sube
addCopaBtn.onclick = () => {
  copas++;
  copasNum.textContent = copas;
  let newLevel = "suave";
  for (const t of nightThresholds) if (copas >= t.copas) newLevel = t.level;
  if (newLevel !== level) {
    level = newLevel;
    levelBadge.textContent = levelInfo[level];
    buildDeck();
    showLevelUp(level);
  }
};

function showLevelUp(lvl) {
  levelUp.innerHTML = levelUpMsg[lvl] || "";
  levelUp.classList.remove("show"); void levelUp.offsetWidth; levelUp.classList.add("show");
  setTimeout(() => levelUp.classList.remove("show"), 2200);
}

nextBtn.onclick = nextChallenge;
card.onclick = nextChallenge;

exitBtn.onclick = () => {
  game.classList.remove("active");
  setup.classList.add("active");
};

// ---------- LA MONEDA ----------
const coinScreen = $("coin"), coinQuestion = $("coinQuestion"), coinEl = $("coinEl");
const coinResult = $("coinResult"), coinFlipBtn = $("coinFlipBtn"), coinNextBtn = $("coinNextBtn");
const coinExit = $("coinExit"), holdPanel = $("holdPanel"), coinBadge = $("coinBadge");
let coinDeck = [], coinIndex = 0, coinDeg = 0, flipping = false;

// Mantener pulsado: revela mientras presionas, se tapa al soltar
const reveal = () => holdPanel.classList.add("revealed");
const cover = () => holdPanel.classList.remove("revealed");
holdPanel.addEventListener("pointerdown", (e) => { e.preventDefault(); reveal(); });
holdPanel.addEventListener("pointerup", cover);
holdPanel.addEventListener("pointerleave", cover);
holdPanel.addEventListener("pointercancel", cover);
holdPanel.addEventListener("contextmenu", (e) => e.preventDefault());

function startCoin() {
  setup.classList.remove("active");
  coinScreen.classList.add("active");
  coinBadge.textContent = coinStyle === "mixto" ? "🪙 😈 Mixto" : "🪙 😏 Normal";
  coinDeck = shuffle(COIN_QUESTIONS[coinStyle]);
  coinIndex = 0;
  newCoinQuestion();
}

function newCoinQuestion() {
  if (coinIndex >= coinDeck.length) coinDeck = shuffle(COIN_QUESTIONS[coinStyle]), coinIndex = 0;
  const decider = players[Math.floor(Math.random() * players.length)];
  const q = coinDeck[coinIndex++];
  coinQuestion.innerHTML = `<strong>${escapeHtml(decider)}</strong>, señala (en secreto) a quién es más probable que ${q}.`;
  cover();
  coinResult.textContent = "";
  coinFlipBtn.style.display = "";
  coinNextBtn.style.display = "none";
}

function flipCoin() {
  if (flipping) return;
  flipping = true;
  const heads = Math.random() < 0.5;
  coinDeg += 360 * 5;
  coinDeg -= coinDeg % 360;      // cae en CARA (frontal)
  if (!heads) coinDeg += 180;    // o en CRUZ (trasera)
  coinEl.style.transform = `rotateX(${coinDeg}deg)`;
  coinFlipBtn.style.display = "none";
  setTimeout(() => {
    coinResult.innerHTML = heads
      ? "🔥 ¡CARA! Dilo en alto: ¿a quién has señalado?"
      : "🤫 ¡CRUZ! Se queda en secreto. Nadie lo sabrá.";
    coinNextBtn.style.display = "";
    flipping = false;
  }, 1350);
}

coinFlipBtn.onclick = flipCoin;
coinNextBtn.onclick = newCoinQuestion;
coinExit.onclick = () => { coinScreen.classList.remove("active"); setup.classList.add("active"); };

// ---------- UTIL ----------
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

renderPlayers();
