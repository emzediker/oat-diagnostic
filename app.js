
let current = 0;
let answers = [];
let seconds = 0;
let timer = null;

const $ = id => document.getElementById(id);

function normalizeQuestion(q, index) {
  return {
    n: q.n ?? q.id ?? index + 1,
    section: q.section,
    topic: q.topic ?? "",
    q: q.q ?? q.question ?? "",
    choices: q.a ?? q.choices ?? [],
    correct: q.correct ?? q.answer ?? 0,
    explanation: q.exp ?? q.explanation ?? ""
  };
}

const ITEMS = Array.isArray(window.QUESTIONS) ? window.QUESTIONS.map(normalizeQuestion) : [];
answers = Array(ITEMS.length).fill(null);

function start() {
  if (!ITEMS.length) {
    alert("The question bank could not be loaded. Make sure questions.js is uploaded in the same GitHub folder as index.html and app.js.");
    return;
  }
  $("startScreen").classList.add("hidden");
  $("testScreen").classList.remove("hidden");
  $("resultsScreen").classList.add("hidden");
  timer = setInterval(() => {
    seconds++;
    $("timer").textContent = fmt(seconds);
  }, 1000);
  render();
}

function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function render() {
  const x = ITEMS[current];
  $("sectionLabel").textContent = x.section;
  $("questionCount").textContent = `Question ${current + 1} of ${ITEMS.length}`;
  $("topicLabel").textContent = x.topic;
  $("questionText").textContent = x.q;
  $("progressBar").style.width = ((current + 1) / ITEMS.length * 100) + "%";

  const c = $("choices");
  c.innerHTML = "";
  x.choices.forEach((v, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice" + (answers[current] === i ? " selected" : "");
    b.textContent = String.fromCharCode(65 + i) + ". " + v;
    b.onclick = () => { answers[current] = i; render(); };
    c.appendChild(b);
  });

  $("prevBtn").disabled = current === 0;
  $("nextBtn").classList.toggle("hidden", current === ITEMS.length - 1);
  $("submitBtn").classList.toggle("hidden", current !== ITEMS.length - 1);
  renderJump();
}

function renderJump() {
  const j = $("jump");
  j.innerHTML = "";
  ITEMS.forEach((q, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = i + 1;
    if (answers[i] !== null) b.classList.add("done");
    if (i === current) b.classList.add("current");
    b.onclick = () => { current = i; render(); };
    j.appendChild(b);
  });
}

function submit() {
  const unanswered = answers.filter(x => x === null).length;
  if (unanswered && !confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`)) return;
  clearInterval(timer);
  showResults();
}

function scaled(raw, total) {
  return Math.round(200 + (raw / total) * 200);
}

function showResults() {
  $("testScreen").classList.add("hidden");
  $("resultsScreen").classList.remove("hidden");

  const total = answers.reduce((n, a, i) => n + (a === ITEMS[i].correct ? 1 : 0), 0);
  const overall = scaled(total, ITEMS.length);
  const sections = [...new Set(ITEMS.map(q => q.section))];

  let html = `<div class="card"><h2>Diagnostic Complete 🎉</h2>
    <div class="score">${overall}</div>
    <p><strong>Estimated OAT-style Academic Diagnostic Score</strong></p>
    <p>${total}/${ITEMS.length} correct (${Math.round(total / ITEMS.length * 100)}%). This is an unofficial practice estimate and does not reproduce the ADA's actual scoring conversion.</p>
    <div class="resultGrid">`;

  sections.forEach(s => {
    const qs = ITEMS.filter(q => q.section === s);
    const score = qs.reduce((n, q) => {
      const i = ITEMS.indexOf(q);
      return n + (answers[i] === q.correct ? 1 : 0);
    }, 0);
    html += `<div class="resultBox"><span>${s}</span><strong>${scaled(score, qs.length)}</strong><small>${score}/${qs.length} correct</small></div>`;
  });

  html += `</div></div><div class="card"><h2>Review Missed Questions</h2>`;
  let missed = 0;
  ITEMS.forEach((q, i) => {
    if (answers[i] !== q.correct) {
      missed++;
      html += `<div class="missed"><strong>Question ${q.n} — ${q.section}</strong>
        <p>${q.q}</p>
        <p class="incorrect">Your answer: ${answers[i] === null ? "Not answered" : q.choices[answers[i]]}</p>
        <p class="correct">Correct answer: ${q.choices[q.correct]}</p>
        <p>${q.explanation}</p></div>`;
    }
  });
  if (!missed) html += '<p class="correct"><strong>Perfect diagnostic!</strong> No missed questions.</p>';
  html += `</div><button class="restart" onclick="location.reload()">Retake Diagnostic</button>`;
  $("resultsScreen").innerHTML = html;
}

$("startBtn").onclick = start;
$("prevBtn").onclick = () => { if (current > 0) { current--; render(); } };
$("nextBtn").onclick = () => { if (current < ITEMS.length - 1) { current++; render(); } };
$("submitBtn").onclick = submit;
