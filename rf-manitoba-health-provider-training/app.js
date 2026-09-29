// Mockup: live privacy check and a preview of the GitHub Issue a question would create.
// The real version runs the same checks again on the server before anything is stored.

const PII_PATTERNS = [
  { label: "an email address", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { label: "a phone number", re: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { label: "a 9-digit number (could be a PHIN or SIN)", re: /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g },
  { label: "a postal code", re: /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi },
  {
    label: "a date (could be a date of birth)",
    re: /\b(?:(?:19|20)\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/](?:19|20)?\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2},? (?:19|20)\d{2})\b/gi,
  },
  { label: "what looks like a name", re: /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr)\.? [A-Z][a-z]+|\b(?:my|our) (?:patient|client),? [A-Z][a-z]+/g },
];

function findPII(text) {
  const found = [];
  for (const { label, re } of PII_PATTERNS) {
    for (const match of text.matchAll(re)) found.push({ label, value: match[0] });
  }
  return found;
}

const form = document.getElementById("ask-form");
if (form) {
const question = document.getElementById("question");
const questionError = document.getElementById("question-error");
const warning = document.getElementById("pii-warning");
const errorSummary = document.getElementById("error-summary");
const result = document.getElementById("result");

function renderWarning(found) {
  warning.replaceChildren();
  if (!found.length) return;
  const intro = document.createElement("p");
  intro.innerHTML = "<strong>Check for identifying details.</strong> Your question may include:";
  const list = document.createElement("ul");
  for (const { label, value } of found) {
    const li = document.createElement("li");
    const mark = document.createElement("mark");
    mark.textContent = value;
    li.append(`${label[0].toUpperCase()}${label.slice(1)}: `, mark);
    list.append(li);
  }
  const outro = document.createElement("p");
  outro.textContent = "Please remove or generalize these before sending. This check can't catch everything, so a reviewer also reads every question before it's published.";
  warning.append(intro, list, outro);
}

let timer;
question.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => renderWarning(findPII(question.value)), 700);
});

function showErrors(messages) {
  errorSummary.replaceChildren();
  if (!messages.length) return;
  const box = document.createElement("div");
  box.className = "pii-warning";
  const h = document.createElement("h3");
  h.textContent = "Your question can't be sent yet";
  const list = document.createElement("ul");
  for (const m of messages) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#question";
    a.textContent = m;
    li.append(a);
    list.append(li);
  }
  box.append(h, list);
  errorSummary.append(box);
  errorSummary.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  result.replaceChildren();
  const text = question.value.trim();
  const messages = [];

  questionError.hidden = true;
  question.removeAttribute("aria-invalid");

  if (!text) {
    messages.push("Enter your question");
    questionError.textContent = "Enter your question.";
  } else {
    const found = findPII(text);
    renderWarning(found);
    if (found.length) {
      messages.push("Remove identifying details from your question");
      questionError.textContent = "Remove identifying details, listed below.";
    }
  }

  if (messages.length) {
    questionError.hidden = false;
    question.setAttribute("aria-invalid", "true");
    showErrors(messages);
    return;
  }

  showErrors([]);
  if (document.getElementById("website").value) return; // spam trap

  const forWhom = form.elements.for.value;
  const issue = [
    `Title: ${text.length > 70 ? text.slice(0, 67) + "…" : text}`,
    `Labels: question, section-5, needs-answer, pii-check-passed, for: ${forWhom.toLowerCase()}`,
    "",
    "### Question",
    text,
    "",
    "### Section",
    "5. Application processes",
    "",
    `### Contact`,
    document.getElementById("email").value ? "Stored separately (not in this issue)" : "None given",
  ].join("\n");

  const h = document.createElement("h3");
  h.textContent = "Thanks, your question was sent (mockup)";
  const p = document.createElement("p");
  p.textContent = "Nothing was actually sent. In the real version, this private GitHub Issue would be created for the presenters:";
  const pre = document.createElement("pre");
  pre.textContent = issue;
  const more = document.createElement("p");
  const a = document.createElement("a");
  a.href = "how-it-works.html";
  a.textContent = "See what happens next";
  more.append(a);
  result.append(h, p, pre, more);
  result.focus();
  form.reset();
  renderWarning([]);
});
}
