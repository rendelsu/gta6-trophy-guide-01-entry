// Vice Atlas: offline GTA VI trophy tracker. Loads app/data/trophies.json, renders the
// checklist, the cited per-trophy guides, the platinum roadmap and the evidence panel.
// Progress lives in localStorage; export/import move it as a JSON file. No network use.
const STORE_KEY = 'vice-atlas-progress-v1';
const SPOILER_KEY = 'vice-atlas-spoiler-v1';
const KIND_LABELS = { story: 'Story', side: 'Side missions', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime', money: 'Money', misc: 'Misc' };
const STAGE_INFO = [
  { n: 1, title: 'Stage 1 — Story first', text: 'Play Chapters 1–4 and the final mission. All 13 story trophies pop here, none missable.' },
  { n: 2, title: 'Stage 2 — Strangers & side missions', text: 'Finish the five named contacts and 8 stranger strands across Leonida.' },
  { n: 3, title: 'Stage 3 — Collectibles & exploration', text: 'Meditation spots, card sets, WAiNK spots, vehicles, areas and garages. Do the meditation spots as they appear.' },
  { n: 4, title: 'Stage 4 — Activities & skill grinds', text: 'Shooting range golds, stunts, races, drone races, fishing, arcade and bowling.' },
  { n: 5, title: 'Stage 5 — Crime, money & 100%', text: 'Vaults, trucks, shops, laundering and spending, then the 100% checklist and the platinum.' }
];

let DATA = null;
let earned = new Set();
let spoiler = false;
let selectedId = 14;
let view = 'tracker';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) earned = new Set(JSON.parse(raw).earned || []);
    spoiler = localStorage.getItem(SPOILER_KEY) === '1';
  } catch (e) { earned = new Set(); spoiler = false; }
}
function saveStored() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: Array.from(earned).sort((a, b) => a - b) }));
    localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
  } catch (e) { /* storage unavailable: tracker still works for the session */ }
}
function sourceById(id) {
  return (DATA.sources || []).find(function (s) { return s.id === id; }) || { name: id, url: '', date: '' };
}
function citeChips(ids) {
  return ids.map(function (id) {
    const s = sourceById(id);
    return '<span class="cite">' + esc(s.name.split(' — ')[0]) + ' · ' + esc(s.date) + '</span>';
  }).join('');
}
function isHiddenFromSpoiler(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}
function trophyLabel(t) {
  return isHiddenFromSpoiler(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
}
function trophyDesc(t) {
  return isHiddenFromSpoiler(t) ? 'Story details hidden by the spoiler setting.' : t.description;
}
function filteredTrophies() {
  const q = (document.getElementById('search').value || '').toLowerCase();
  const grade = document.getElementById('gradeFilter').value;
  const kind = document.getElementById('kindFilter').value;
  return DATA.trophies.filter(function (t) {
    if (grade && t.grade !== grade) return false;
    if (kind === 'missable' && !t.missable) return false;
    if (kind === 'online') return false;
    if (kind && kind !== 'missable' && kind !== 'online' && t.kind !== kind) return false;
    if (q && (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}
function renderList() {
  const list = filteredTrophies();
  const ul = document.getElementById('trophyList');
  document.getElementById('listCount').textContent = list.length + ' of 55 trophies';
  ul.innerHTML = list.map(function (t) {
    const done = earned.has(t.id);
    const miss = t.missable ? '<span class="flag">Possibly missable</span>' : '';
    const cnt = t.count ? '<span class="kindtag">Target: ' + t.count + '</span>' : '';
    return '<li data-id="' + t.id + '" class="' + (done ? 'earned ' : '') + (t.id === selectedId ? 'selected' : '') + '">' +
      '<input type="checkbox" ' + (done ? 'checked' : '') + ' data-check="' + t.id + '" aria-label="Earned: ' + esc(t.name) + '">' +
      '<div><div class="tname">' + esc(trophyLabel(t)) + '</div>' +
      '<div class="tdesc">' + esc(trophyDesc(t)) + '</div>' +
      '<div class="tmeta"><span class="grade ' + t.grade + '">' + t.grade + '</span>' +
      '<span class="kindtag">' + (KIND_LABELS[t.kind] || t.kind) + '</span>' + cnt + miss + '</div></div></li>';
  }).join('');
  ul.querySelectorAll('li').forEach(function (li) {
    li.addEventListener('click', function (ev) {
      if (ev.target.matches('input[type=checkbox]')) return;
      selectTrophy(Number(li.getAttribute('data-id')));
    });
  });
  ul.querySelectorAll('input[type=checkbox]').forEach(function (box) {
    box.addEventListener('change', function () {
      toggleEarned(Number(box.getAttribute('data-check')), box.checked);
    });
  });
}
function renderDetail() {
  const t = DATA.trophies.find(function (x) { return x.id === selectedId; }) || DATA.trophies[0];
  const pane = document.getElementById('detailPane');
  if (isHiddenFromSpoiler(t)) {
    pane.innerHTML = '<h2>Hidden story trophy</h2><p class="official">Spoiler setting is on. Earn this trophy in the game to reveal its name, description and guide — or switch the spoiler setting off.</p>';
    return;
  }
  const miss = t.missable ? '<p><span class="flag">Possibly missable</span> — guides flag this as the one trophy that may not come back. Do it as it appears.</p>' : '';
  const steps = t.steps.map(function (s) {
    return '<li>' + esc(s.t) + citeChips(s.s) + '</li>';
  }).join('');
  const used = {};
  t.steps.forEach(function (s) { s.s.forEach(function (id) { used[id] = true; }); });
  const srcs = Object.keys(used).map(function (id) {
    const s = sourceById(id);
    const link = s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name);
    return '<div>' + link + ' <span class="sdate">· published ' + esc(s.date) + '</span></div>';
  }).join('');
  pane.innerHTML =
    '<h2>' + esc(t.name) + '</h2>' +
    '<p class="official">“' + esc(t.description) + '” — official PlayStation description</p>' +
    '<div class="tmeta"><span class="grade ' + t.grade + '">' + t.grade + '</span>' +
    '<span class="kindtag">' + (KIND_LABELS[t.kind] || t.kind) + '</span>' +
    '<span>Roadmap stage ' + t.stage + '</span>' +
    (t.count ? '<span>PSN target: ' + t.count + '</span>' : '') +
    (t.hidden ? '<span>Hidden on PSN until earned</span>' : '') + '</div>' + miss +
    '<h3>Guide — in our own words</h3><p class="guide">' + esc(t.guide) + '</p>' +
    '<h3>Steps — each one cited</h3><ol class="steps">' + steps + '</ol>' +
    '<div class="srcbox"><strong>Sources for this trophy</strong>' + srcs +
    '<div class="sdate">Every step above names its source and the date it was published. Unconfirmed methods are marked as such in the steps.</div></div>';
}
function updateProgress() {
  const n = earned.size;
  document.getElementById('earnedCount').textContent = n;
  document.getElementById('progressFill').style.width = Math.round(n / 55 * 100) + '%';
  const left = 55 - n;
  document.getElementById('countdown').textContent = left === 0
    ? 'Platinum earned — Vice Got a Price! is yours'
    : left + ' troph' + (left === 1 ? 'y' : 'ies') + ' to the platinum';
}
function renderRoadmap() {
  const box = document.getElementById('roadmapStages');
  box.innerHTML = STAGE_INFO.map(function (st) {
    const items = DATA.trophies.filter(function (t) { return t.stage === st.n; });
    const done = items.filter(function (t) { return earned.has(t.id); }).length;
    const lis = items.map(function (t) {
      return '<li class="' + (earned.has(t.id) ? 'earned' : '') + '">' + esc(t.name) + ' <span class="grade ' + t.grade + '">' + t.grade + '</span></li>';
    }).join('');
    return '<div class="stage"><h3>' + esc(st.title) + '</h3><div class="count">' + done + ' / ' + items.length + ' earned</div><p>' + esc(st.text) + '</p><ul>' + lis + '</ul></div>';
  }).join('');
  const m = DATA.trophies.filter(function (t) { return t.missable; });
  document.getElementById('missableCallout').innerHTML = '<b>Missable trophies: ' + m.length + ' flagged.</b> ' +
    m.map(function (t) { return '<strong>' + esc(t.name) + '</strong>'; }).join(', ') +
    ' — meditate at every spot as it appears, especially the Chapter 1 spot with Lucia; guides (GTABase, 18 Nov 2026; EGamers.io, 18 Nov 2026) flag it as the only possibly missable trophy. Everything else can be finished in free roam after the story.';
}
function renderSources() {
  let steps = 0, twoPlus = 0;
  const per = {};
  DATA.trophies.forEach(function (t) {
    t.steps.forEach(function (s) {
      steps++;
      if (s.s.length >= 2) twoPlus++;
      s.s.forEach(function (id) { per[id] = (per[id] || 0) + 1; });
    });
  });
  document.getElementById('evidenceBox').innerHTML =
    '<div class="stat"><div class="num">55</div><div class="lbl">trophies, each with a cited guide</div></div>' +
    '<div class="stat"><div class="num">' + steps + '</div><div class="lbl">guide steps, every one cited</div></div>' +
    '<div class="stat"><div class="num">' + twoPlus + '</div><div class="lbl">steps backed by 2+ sources</div></div>' +
    '<div class="stat"><div class="num">' + DATA.sources.length + '</div><div class="lbl">dated sources</div></div>';
  const rows = {
    exo: 'Official names, descriptions, grades and hidden flags',
    psn: 'Grades and PSN progress targets (counts)',
    gta: 'Roadmap, missable flag, per-trophy tips',
    kee: 'Platinum roadmap and per-trophy unlocks',
    omg: 'Full list cross-check',
    ega: 'Hardest trophies and missable analysis',
    pgg: 'List cross-check; unconfirmed-method notes',
    ppx: 'Missable flag cross-check',
    twz: 'List cross-check'
  };
  document.getElementById('sourcesTable').innerHTML = DATA.sources.map(function (s) {
    const link = s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name);
    return '<tr><td>' + link + '</td><td>' + esc(s.date) + '</td><td>' + (per[s.id] || 0) + ' steps</td><td>' + esc(rows[s.id] || '') + '</td></tr>';
  }).join('');
}
function renderAll() {
  renderList();
  renderDetail();
  renderRoadmap();
  renderSources();
  updateProgress();
}
function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
}
function toggleEarned(id, on) {
  if (on) earned.add(id); else earned.delete(id);
  saveStored();
  renderList();
  renderDetail();
  renderRoadmap();
  updateProgress();
}
function setView(v) {
  view = v;
  document.querySelectorAll('.tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-view') === v);
  });
  document.getElementById('view-tracker').classList.toggle('hidden', v !== 'tracker');
  document.getElementById('view-roadmap').classList.toggle('hidden', v !== 'roadmap');
  document.getElementById('view-sources').classList.toggle('hidden', v !== 'sources');
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: 'vice-atlas', earned: Array.from(earned).sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vice-atlas-progress.json';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(reader.result);
      const ids = data.earned || data;
      earned = new Set(ids.filter(function (id) { return DATA.trophies.some(function (t) { return t.id === id; }); }));
      saveStored();
      renderAll();
    } catch (e) { alert('That file is not a Vice Atlas progress export.'); }
  };
  reader.readAsText(file);
}
function applyHash() {
  const h = location.hash || '#/tracker';
  if (h.indexOf('#/trophy-') === 0) {
    const id = Number(h.slice(9));
    if (DATA.trophies.some(function (t) { return t.id === id; })) selectedId = id;
    setView('tracker');
  } else if (h === '#/roadmap') {
    setView('roadmap');
  } else if (h === '#/sources') {
    setView('sources');
  } else {
    setView('tracker');
  }
  renderAll();
}
function boot() {
  loadStored();
  document.getElementById('spoilerToggle').checked = spoiler;
  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () { location.hash = '#/' + b.getAttribute('data-view'); });
  });
  document.getElementById('search').addEventListener('input', renderList);
  document.getElementById('gradeFilter').addEventListener('change', renderList);
  document.getElementById('kindFilter').addEventListener('change', renderList);
  document.getElementById('spoilerToggle').addEventListener('change', function (ev) {
    spoiler = ev.target.checked;
    saveStored();
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', function (ev) {
    if (ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (confirm('Clear all earned trophies?')) { earned = new Set(); saveStored(); renderAll(); }
  });
  window.addEventListener('hashchange', applyHash);
  fetch('data/trophies.json').then(function (r) { return r.json(); }).then(function (d) {
    DATA = d;
    applyHash();
  }).catch(function () {
    document.getElementById('detailPane').innerHTML = '<h2>Could not load the trophy list</h2><p>Open this guide from its own folder over http (for example, node serve.ts) so data/trophies.json can load.</p>';
  });
}
boot();
