// Mockup: Light / Dark / System theme switch. "System" follows the device setting.
(function () {
  const root = document.documentElement;
  let saved = "system";
  try { saved = localStorage.getItem("rf-theme") || "system"; } catch {}
  if (saved !== "system") root.dataset.theme = saved;

  document.addEventListener("DOMContentLoaded", () => {
    for (const input of document.querySelectorAll('input[name="theme"]')) {
      input.checked = input.value === saved;
      input.addEventListener("change", () => {
        if (input.value === "system") delete root.dataset.theme;
        else root.dataset.theme = input.value;
        try { localStorage.setItem("rf-theme", input.value); } catch {}
      });
    }
  });
})();
