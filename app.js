const SYMPTOMS = [
  { key: "Pain", color: "var(--pain)", icon: "●" },
  { key: "Sadness", color: "var(--sad)", icon: "▲" },
  { key: "Boredom Short-Term Stay", color: "var(--bst)", icon: "◆" },
  { key: "Boredom Long-Term Stay", color: "var(--blt)", icon: "⬣" },
  { key: "Anxiety / Hyperactivity", color: "var(--anx)", icon: "★" },
  { key: "Cognitive Impairment", color: "var(--cog)", icon: "✳" },
];

const state = {
  games: [],
  selectedSymptoms: new Set(),
  platform: "",
  age: "",
  q: "",
};

const el = (id) => document.getElementById(id);

function uniq(arr) {
  return [...new Set(arr)].sort((a,b) => a.localeCompare(b));
}

function shortPreview(text, max=160) {
  if (!text) return "";
  const t = String(text).trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max-1) + "…" : t;
}

function renderSymptomFilters() {
  const grid = el("symptomGrid");
  grid.innerHTML = "";

  SYMPTOMS.forEach((s) => {
    const label = document.createElement("label");
    label.className = "symptom";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = s.key;
    cb.addEventListener("change", (e) => {
      if (e.target.checked) state.selectedSymptoms.add(s.key);
      else state.selectedSymptoms.delete(s.key);
      render();
    });

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.style.background = s.color;

    const text = document.createElement("div");
    text.innerHTML = `<div><b>${s.icon} ${s.key}</b><small>Filter by this target</small></div>`;

    label.appendChild(cb);
    label.appendChild(badge);
    label.appendChild(text);
    grid.appendChild(label);
  });
}

function setupControls() {
  el("search").addEventListener("input", (e) => {
    state.q = e.target.value.toLowerCase();
    render();
  });

  el("platform").addEventListener("change", (e) => {
    state.platform = e.target.value;
    render();
  });

  el("age").addEventListener("change", (e) => {
    state.age = e.target.value;
    render();
  });
}

function matchesSymptoms(game) {
  if (state.selectedSymptoms.size === 0) return true;
  const tags = new Set(game.symptomTags || []);
  for (const s of state.selectedSymptoms) {
    if (!tags.has(s)) return false;
  }
  return true;
}

function matchesText(game) {
  if (!state.q) return true;
  const hay = [
    game.name, 
    (game.genre||""), 
    (game.summary||""),
    (game.details||""),
    (game.platforms||[]).join(" ")
  ].join(" ").toLowerCase();
  return hay.includes(state.q);
}

function matchesPlatform(game) {
  if (!state.platform) return true;
  return (game.platforms || []).includes(state.platform);
}

function matchesAge(game) {
  if (!state.age) return true;
  return (game.ageGroup || "").toLowerCase() === state.age.toLowerCase();
}

function filteredGames() {
  return state.games.filter(g => 
    matchesSymptoms(g) && matchesText(g) && matchesPlatform(g) && matchesAge(g)
  );
}

function chip(symptomKey) {
  const s = SYMPTOMS.find(x => x.key === symptomKey);
  if (!s) return `<span class="chip">${symptomKey}</span>`;
  return `<span class="chip">${s.icon} ${s.key}</span>`;
}

function renderGrid(list) {
  const grid = el("grid");
  grid.innerHTML = "";

  list.forEach((g) => {
    const card = document.createElement("div");
    card.className = "game";
    card.tabIndex = 0;

    const platforms = (g.platforms || []).join(" • ");
    const meta = [
      g.genre ? `🎭 ${g.genre}` : null,
      g.ageGroup ? `🧒 ${g.ageGroup}` : null,
      platforms ? `🕹️ ${platforms}` : null,
    ].filter(Boolean).join("  ");

    const chips = (g.symptomTags || []).map(chip).join("");

    card.innerHTML = `
      <h3>${g.name}</h3>
      <div class="meta">${meta}</div>
      <div class="tagline">${shortPreview(g.summary, 180)}</div>
      <div class="chips">${chips}</div>
    `;

    card.addEventListener("click", () => openModal(g));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openModal(g);
    });

    grid.appendChild(card);
  });

  el("count").textContent = `${list.length} shown`;
}

function openModal(g) {
  const modal = el("modal");
  const body = el("modalBody");

  const chips = (g.symptomTags || []).map(chip).join("");
  const platforms = (g.platforms || []).join(", ");

  body.innerHTML = `
    <h3>${g.name}</h3>
    <div class="chips">${chips}</div>

    <div class="kv">
      <div><b>Platforms</b>${platforms || "—"}</div>
      <div><b>Age group</b>${g.ageGroup || "—"}</div>
      <div><b>Avatar gender</b>${g.avatarGender || "—"}</div>
      <div><b>Genre</b>${g.genre || "—"}</div>
      <div><b>Players / Online?</b>${g.playersOnline || "—"}</div>
    </div>

    <div class="section-title">Summary</div>
    <p class="p">${(g.summary || "—").replace(/</g,"&lt;")}</p>

    <div class="section-title">Potential concerns</div>
    <p class="p">${(g.potentialConcerns || "—").replace(/</g,"&lt;")}</p>

    <div class="section-title">Aspects & connections</div>
    <p class="p">${(g.details || "—").replace(/</g,"&lt;")}</p>
  `;

  modal.showModal();
}

function populateSelects() {
  const platforms = uniq(state.games.flatMap(g => g.platforms || []));
  const ages = uniq(state.games.map(g => g.ageGroup).filter(Boolean));

  const pSel = el("platform");
  platforms.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    pSel.appendChild(opt);
  });

  const aSel = el("age");
  ages.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    aSel.appendChild(opt);
  });
}

function render() {
  const list = filteredGames();
  renderGrid(list);
}

async function init() {
  renderSymptomFilters();
  setupControls();

  const res = await fetch("games.json");
  state.games = await res.json();

  populateSelects();
  render();
}

init();
