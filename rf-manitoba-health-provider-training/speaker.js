// Mockup: speaker view. Shows the current and next screen, presenter notes and a timer,
// and drives the audience window over BroadcastChannel (same browser, no server).

const $ = (id) => document.getElementById(id);
const channel = new BroadcastChannel("rf-present");
let state = null;

// ---- Timer -------------------------------------------------------------
let startedAt = null;
let pausedTotal = 0;
let pausedAt = null;

const format = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const elapsed = () => (startedAt === null ? 0 : (pausedAt ?? Date.now()) - startedAt - pausedTotal);

function tick() {
  const ms = elapsed();
  $("sv-elapsed").textContent = format(ms);
  const target = (state?.duration || 0) * 60000;
  if (!target) return;
  $("sv-target").textContent = `of ${format(target)}`;
  $("sv-meter-fill").style.width = `${Math.min(100, (ms / target) * 100)}%`;
  const over = ms - target;
  $("sv-over").hidden = over <= 0;
  if (over > 0) $("sv-over").textContent = `Over time by ${format(over)}`;
  document.body.classList.toggle("sv-is-over", over > 0);
}
setInterval(tick, 1000);

$("sv-pause").addEventListener("click", (e) => {
  if (startedAt === null) return;
  if (pausedAt === null) {
    pausedAt = Date.now();
  } else {
    pausedTotal += Date.now() - pausedAt;
    pausedAt = null;
  }
  const paused = pausedAt !== null;
  e.currentTarget.setAttribute("aria-pressed", String(paused));
  e.currentTarget.textContent = paused ? "Resume" : "Pause";
  tick();
});

$("sv-reset").addEventListener("click", () => {
  startedAt = Date.now();
  pausedTotal = 0;
  if (pausedAt !== null) pausedAt = Date.now();
  tick();
});

// ---- Previews ----------------------------------------------------------
// Render each preview at a fixed width, then scale it to fit its frame.
const STAGE_WIDTH = 900;

function fit(stage) {
  const frame = stage.parentElement;
  const scale = frame.clientWidth / STAGE_WIDTH;
  stage.style.transform = `scale(${scale})`;
  frame.style.height = `${stage.scrollHeight * scale}px`;
}

function renderPreview(stage, screen) {
  stage.innerHTML = screen ? screen.html : '<p class="hint">End of section</p>';
  stage.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  stage.querySelectorAll("[autoplay]").forEach((el) => el.removeAttribute("autoplay"));
  requestAnimationFrame(() => fit(stage));
}

new ResizeObserver(() => document.querySelectorAll(".sv-stage").forEach(fit)).observe(document.body);

// ---- Sync --------------------------------------------------------------
function render() {
  const { index, screens } = state;
  const now = screens[index];
  const next = screens[index + 1];

  $("sv-waiting").hidden = true;
  $("sv-ended").hidden = true;
  $("sv-live").hidden = false;
  $("sv-section").textContent = state.section;
  $("sv-current-title").textContent = now.title;
  $("sv-next-title").textContent = next ? next.title : "End of section";
  $("sv-notes").innerHTML = now.notes || '<p class="hint">No notes for this screen.</p>';
  $("sv-count").textContent = `Screen ${index + 1} of ${screens.length}`;
  $("sv-prev").disabled = index === 0;
  $("sv-next-button").disabled = index === screens.length - 1;
  renderPreview($("sv-current"), now);
  renderPreview($("sv-next"), next);

  if (startedAt === null) startedAt = Date.now();
  tick();
}

channel.addEventListener("message", ({ data }) => {
  if (data.type === "state") {
    state = data;
    render();
  } else if (data.type === "ended") {
    $("sv-live").hidden = true;
    $("sv-ended").hidden = false;
    $("sv-count").textContent = "Presentation ended";
    state = null;
  }
});

const go = (delta) => state && channel.postMessage({ type: "goto", index: state.index + delta });
$("sv-prev").addEventListener("click", () => go(-1));
$("sv-next-button").addEventListener("click", () => go(1));

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
  else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
});

channel.postMessage({ type: "hello" });
