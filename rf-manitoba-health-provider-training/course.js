// Mockup: presentation mode, knowledge checks, YouTube facade and saved reflections.
// Everything on the page works without this script; it only adds to it.

document.documentElement.classList.add("js");

// ---- Presentation mode -------------------------------------------------
const screens = [...document.querySelectorAll(".screen")];
const bar = document.querySelector(".present-bar");
const toggle = document.getElementById("present-toggle");
let current = 0;

function show(index) {
  current = Math.max(0, Math.min(index, screens.length - 1));
  screens.forEach((s, i) => (s.hidden = i !== current));
  bar.querySelector(".present-count").textContent = `Screen ${current + 1} of ${screens.length}`;
  bar.querySelector("[data-prev]").disabled = current === 0;
  bar.querySelector("[data-next]").disabled = current === screens.length - 1;
  screens[current].querySelector("h2").focus();
}

function startPresenting() {
  document.body.classList.add("presenting");
  bar.hidden = false;
  show(0);
}

function stopPresenting() {
  document.body.classList.remove("presenting", "show-notes");
  bar.querySelector("[data-notes]").setAttribute("aria-pressed", "false");
  bar.hidden = true;
  screens.forEach((s) => (s.hidden = false));
  toggle.focus();
}

if (toggle && bar) {
  toggle.addEventListener("click", startPresenting);
  bar.querySelector("[data-prev]").addEventListener("click", () => show(current - 1));
  bar.querySelector("[data-next]").addEventListener("click", () => show(current + 1));
  bar.querySelector("[data-exit]").addEventListener("click", stopPresenting);
  bar.querySelector("[data-notes]").addEventListener("click", (e) => {
    const on = document.body.classList.toggle("show-notes");
    e.currentTarget.setAttribute("aria-pressed", String(on));
  });

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("presenting")) return;
    // Leave arrow keys alone inside form fields (radio groups use them).
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); show(current + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(current - 1); }
    else if (e.key === "Escape") stopPresenting();
  });

  if (location.hash === "#present") startPresenting();
}

// ---- Knowledge checks --------------------------------------------------
for (const quiz of document.querySelectorAll("[data-quiz]")) {
  const feedback = quiz.querySelector(".feedback");
  quiz.addEventListener("submit", (e) => {
    e.preventDefault();
    const chosen = quiz.querySelector("input:checked");
    feedback.className = "feedback";
    if (!chosen) {
      feedback.textContent = "Choose an answer, then select Check answer.";
      feedback.classList.add("is-error");
      return;
    }
    const correct = chosen.dataset.correct === "true";
    feedback.classList.add(correct ? "is-correct" : "is-incorrect");
    feedback.replaceChildren();
    const status = document.createElement("strong");
    status.textContent = correct ? "Correct. " : "Try again. ";
    feedback.append(status, chosen.dataset.feedback.replace(/^(Correct|Not quite)\. /, ""));
  });
}

// ---- YouTube facade ----------------------------------------------------
// Loads the player only when asked (privacy and speed), from the no-cookie domain.
for (const yt of document.querySelectorAll("[data-youtube]")) {
  const button = yt.querySelector(".yt-play");
  if (yt.dataset.mode !== "embed") {
    button.hidden = true;
    continue;
  }
  yt.querySelector(".yt-offline").hidden = true;
  button.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${yt.dataset.youtube}?autoplay=1&cc_load_policy=1&rel=0`;
    iframe.title = `YouTube video: ${yt.dataset.title}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    yt.replaceChildren(iframe);
    iframe.focus();
  });
}

// ---- Reflections saved on this device ----------------------------------
for (const form of document.querySelectorAll("[data-reflection]")) {
  const status = form.querySelector(".save-status");
  const key = (id) => `rf-reflection:${location.pathname}:${id}`;
  let timer;

  for (const field of form.querySelectorAll("textarea")) {
    try { field.value = localStorage.getItem(key(field.id)) ?? ""; } catch {}
    field.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(key(field.id), field.value);
          status.textContent = "Saved on this device.";
        } catch {
          status.textContent = "Couldn't save in this browser. Copy your answers somewhere else before leaving.";
        }
      }, 800);
    });
  }

  form.querySelector("[data-clear]").addEventListener("click", () => {
    for (const field of form.querySelectorAll("textarea")) {
      field.value = "";
      try { localStorage.removeItem(key(field.id)); } catch {}
    }
    status.textContent = "Your answers were cleared.";
  });
}
