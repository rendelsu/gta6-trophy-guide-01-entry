// Leonida Ledger: GTA VI trophy tracker. Loads app/data/trophies.json, renders the
// checklist, saves earned trophies in localStorage, and offers export / import.
const KEY = 'gta6-trophy-guide-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoiler';
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let spoiler = localStorage.getItem(SPOILER_KEY) === '1';
let selected = null;

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const detailEl = $('detail');
const STORY_KINDS = new Set(['story']);

function isHidden(t) {
  return spoiler && STORY_KINDS.has(t.kind) && !earned.has(t.name);
}

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  $('earnedCount').textContent = n;
  $('barFill').style.width = `${Math.round((n / total) * 100)}%`;
  $('progressText').textContent =
    `${Math.round((n / total) * 100)}% to Platinum — ${total - n} to go` +
    (n === total ? ' — Leonida Legend!' : '');
}

function filtered() {
  const q = $('search').value.trim().toLowerCase();
  const grade = $('grade').value;
  const kind = $('kind').value;
  const status = $('status').value;
  const missOnly = $('missableOnly').checked;
  return trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (status === 'earned' && !earned.has(t.name)) return false;
    if (status === 'todo' && earned.has(t.name)) return false;
    if (missOnly && !t.missable) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function tagHtml(t) {
  const tags = [`<span class="tag ${t.grade}">${t.grade}</span>`, `<span class="tag">${t.kind}</span>`];
  if (t.missable) tags.push('<span class="tag miss">Missable</span>');
  return tags.join('');
}

function renderList() {
  const rows = filtered();
  $('countLine').textContent =
    `Showing ${rows.length} of ${trophies.length} trophies · ${earned.size} earned · ${trophies.filter((t) => t.missable).length} flagged missable`;
  listEl.replaceChildren();
  for (const t of rows) {
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (selected === t.name) li.classList.add('sel');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      renderAll();
    });
    const body = document.createElement('div');
    if (isHidden(t)) {
      body.innerHTML =
        '<div class="tname">??? — hidden story trophy</div>' +
        '<div class="tdesc">Spoiler-safe mode hides this story trophy until you earn it. Tick it off once it pops.</div>' +
        `<div class="tags"><span class="tag">${t.grade}</span><span class="tag">story · hidden</span></div>`;
    } else {
      const name = document.createElement('div');
      name.className = 'tname';
      name.textContent = t.name;
      const desc = document.createElement('div');
      desc.className = 'tdesc';
      desc.textContent = t.description;
      const tags = document.createElement('div');
      tags.className = 'tags';
      tags.innerHTML = tagHtml(t);
      body.append(name, desc, tags);
    }
    li.append(box, body);
    li.addEventListener('click', () => {
      selected = t.name;
      renderAll();
    });
    listEl.append(li);
  }
  if (!rows.length) {
    const li = document.createElement('li');
    li.textContent = 'No trophies match these filters.';
    listEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.name === selected) ?? trophies[0];
  if (!t) return;
  if (isHidden(t)) {
    detailEl.innerHTML =
      '<h2>??? — hidden story trophy</h2><p class="tdesc">Spoiler-safe mode is on. Earn this story trophy in the game and tick it off — then its name, description and guide appear here.</p>';
    return;
  }
  const h = document.createElement('h2');
  h.textContent = t.name;
  const d = document.createElement('p');
  d.className = 'tdesc';
  d.textContent = t.description;
  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.innerHTML = tagHtml(t);
  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  const g = document.createElement('p');
  g.textContent = t.guide;
  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  const s = document.createElement('p');
  s.className = 'sources';
  s.textContent = t.sources;
  const links = document.createElement('p');
  links.className = 'sources';
  links.innerHTML =
    'Official list: <a href="https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/">Exophase</a> · ' +
    '<a href="https://psnprofiles.com/trophies/43531-grand-theft-auto-vi">PSNProfiles</a>';
  const state = document.createElement('p');
  state.innerHTML = earned.has(t.name)
    ? '<strong>Earned ✓</strong> — untick it in the list if that was a mistake.'
    : '<strong>Not yet earned.</strong> Click its checkbox in the list when it pops.';
  detailEl.replaceChildren(h, d, tags, gh, g, sh, s, links, state);
}

const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', text: 'Chapters 1–4 plus every named story mission (Gone Fishing, Breakfast Run, The Cartel Heist, Child’s Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission. Chapter trophies can never be missed.' },
  { n: 2, title: 'Stage 2 — Strangers, contacts & partners', text: 'Finish 8 stranger strands, the final missions for Andy, Kenton, Billy, Randy and Tyrone, and the two partner trophies (Hot Together, Retail Therapy) BEFORE the final mission — partner moments may not come back.' },
  { n: 3, title: 'Stage 3 — Activities & combat', text: 'Shooting Range gold (42 challenges), 250 stunts, races, fishing, arcade, bowling, meditation, the combat trophies and the 9 gang operations. Most of these can be done any time after the story opens them.' },
  { n: 4, title: 'Stage 4 — Collectibles, money & cleanup', text: 'Cards (3 sets), WAiNK It at 100 spots, 100 vehicles, 52 areas, 8 garages, 10 Scooter Bros registrations, $250,000 laundered, $100,000 spent — then 100% completion and the platinum.' },
];

function renderRoadmap() {
  const host = $('roadmap');
  host.replaceChildren();
  for (const s of STAGES) {
    const box = document.createElement('div');
    box.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = s.title;
    const p = document.createElement('p');
    p.textContent = s.text;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const t of trophies.filter((x) => x.stage === s.n)) {
      const c = document.createElement('span');
      c.className = 'chip' + (earned.has(t.name) ? ' done' : '');
      c.textContent = (earned.has(t.name) ? '✓ ' : '') + t.name + (t.missable ? ' ⚠' : '');
      chips.append(c);
    }
    const count = document.createElement('p');
    count.className = 'muted';
    const done = trophies.filter((x) => x.stage === s.n && earned.has(x.name)).length;
    const tot = trophies.filter((x) => x.stage === s.n).length;
    count.textContent = `${done} of ${tot} earned in this stage`;
    box.append(h, p, chips, count);
    host.append(box);
  }
}

function renderMissable() {
  const host = $('missableList');
  host.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      renderAll();
    });
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = '⚠ ' + t.name;
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = t.description;
    const g = document.createElement('div');
    g.className = 'tdesc';
    g.textContent = t.guide;
    body.append(name, desc, g);
    li.append(box, body);
    host.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissable();
  $('spoiler').checked = spoiler;
  $('spoiler2').checked = spoiler;
}

function showView(name) {
  for (const b of document.querySelectorAll('#tabs button')) {
    b.classList.toggle('active', b.dataset.view === name);
  }
  for (const v of document.querySelectorAll('.view')) v.hidden = v.id !== `view-${name}`;
}

document.querySelectorAll('#tabs button').forEach((b) => {
  b.addEventListener('click', () => showView(b.dataset.view));
});
for (const id of ['search', 'grade', 'kind', 'status', 'missableOnly']) {
  $(id).addEventListener('input', renderList);
  $(id).addEventListener('change', renderList);
}
function onSpoiler(v) {
  spoiler = v;
  save();
  renderAll();
}
$('spoiler').addEventListener('change', (e) => onSpoiler(e.target.checked));
$('spoiler2').addEventListener('change', (e) => onSpoiler(e.target.checked));

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2)], { type: 'application/json' }),
  );
  a.download = 'gta6-trophy-progress.json';
  a.click();
  $('saveMsg').textContent = `Exported ${earned.size} earned trophies.`;
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => known.has(n)));
    save();
    renderAll();
    $('saveMsg').textContent = `Imported ${earned.size} earned trophies.`;
  } catch {
    $('saveMsg').textContent = 'That file could not be read as trophy progress.';
  }
});
$('reset').addEventListener('click', () => {
  if (!window.confirm('Reset all earned trophies?')) return;
  earned = new Set();
  save();
  renderAll();
  $('saveMsg').textContent = 'Progress reset.';
});

renderAll();
