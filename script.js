let selectedCoins = 0;
let currentToss = 0;
let outcomes = [];
let database = { 1: {}, 2: {}, 3: {}, 4: {} };
let totalTosses = { 1: 0, 2: 0, 3: 0, 4: 0 };
let picks = { 1: 0, 2: 0, 3: 0, 4: 0 };

// Firestore
let db;
document.addEventListener("DOMContentLoaded", () => {
  if (window.db) {
    db = window.db;
    loadDatabaseFromFirestore(); // Fetch existing toss data
  }
});

async function loadDatabaseFromFirestore() {
  for (let n = 1; n <= 4; n++) {
    const docRef = await db.collection("tosses").doc(`${n}Coins`).get();
    const data = docRef.exists ? docRef.data() : {};
    database[n] = data.results || {};
    totalTosses[n] = data.total || 0;
    picks[n] = data.picks || 0;
  }
}

function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('hidden');
}

function showTestMenu() {
  hideAll();
  document.getElementById('test-menu').classList.remove('hidden');
}

function startToss(n) {
  selectedCoins = n;
  picks[n]++;
  currentToss = 0;
  outcomes = [];

  hideAll();
  document.getElementById('toss-section').classList.remove('hidden');

  const coinImg = document.getElementById('coin-image');
  coinImg.style.display = 'none';
  coinImg.src = '';

  document.getElementById('result-msg').classList.add('hidden');
  document.getElementById('toss-button').textContent = "Toss Coin 1";
  document.getElementById('toss-button').classList.remove('hidden');
  document.getElementById('after-toss-options').classList.add('hidden');
  document.getElementById('live-count').classList.add('hidden');

  savePickToFirestore(n);
}

function tossCoin() {
  const coinImg = document.getElementById('coin-image');
  const resultMsg = document.getElementById('result-msg');
  const tossBtn = document.getElementById('toss-button');
  const animation = document.getElementById('animation-msg');
  const liveCount = document.getElementById('live-count');
  const afterToss = document.getElementById('after-toss-options');

  // Hide everything before toss
  coinImg.style.display = 'none';
  resultMsg.classList.add('hidden');
  tossBtn.classList.add('hidden');
  liveCount.classList.add('hidden');
  afterToss.classList.add('hidden');
  animation.classList.remove('hidden');

  let flipInterval = null;
  let currentFace = true;

  flipInterval = setInterval(() => {
    coinImg.src = currentFace ? 'head.png' : 'tail.png';
    currentFace = !currentFace;
    coinImg.style.display = 'block';
  }, 150);

  const finalResult = Math.random() < 0.5 ? 'H' : 'T';

  setTimeout(() => {
    clearInterval(flipInterval);
    outcomes.push(finalResult);
    currentToss++;

    coinImg.src = finalResult === 'H' ? 'head.png' : 'tail.png';
    coinImg.style.display = 'block';

    resultMsg.textContent = `You got ${finalResult === 'H' ? 'Heads 🟡' : 'Tails ⚫'}!`;
    resultMsg.classList.remove('hidden');
    updateLiveCount();

    if (currentToss < selectedCoins) {
      tossBtn.textContent = `Toss Coin ${currentToss + 1}`;
      tossBtn.classList.remove('hidden');
    } else {
      tossBtn.classList.add('hidden');
      processResult();
      afterToss.classList.remove('hidden');
    }

    animation.classList.add('hidden');
    liveCount.classList.remove('hidden');
  }, 1500);
}

function updateLiveCount() {
  const h = outcomes.filter(x => x === 'H').length;
  const t = outcomes.length - h;
  document.getElementById('live-n').textContent = selectedCoins;
  document.getElementById('head-count').textContent = h;
  document.getElementById('tail-count').textContent = t;
}

function processResult() {
  const heads = outcomes.filter(x => x === 'H').length;
  const label = `${heads}H`;
  if (!database[selectedCoins][label]) database[selectedCoins][label] = 0;
  database[selectedCoins][label]++;
  totalTosses[selectedCoins]++;
  saveTossToFirestore(selectedCoins, label);
}

async function saveTossToFirestore(n, label) {
  const docRef = db.collection("tosses").doc(`${n}Coins`);
  const docSnap = await docRef.get();
  let data = docSnap.exists ? docSnap.data() : { results: {}, total: 0, picks: 0 };

  data.results[label] = (data.results[label] || 0) + 1;
  data.total++;
  await docRef.set(data);
}

async function savePickToFirestore(n) {
  const docRef = db.collection("tosses").doc(`${n}Coins`);
  const docSnap = await docRef.get();
  let data = docSnap.exists ? docSnap.data() : { results: {}, total: 0, picks: 0 };

  data.picks = (data.picks || 0) + 1;
  await docRef.set(data);
}

function showTable() {
  const header = document.getElementById('table-header');
  const body = document.getElementById('table-body');

  const n = selectedCoins;
  const headOrder = Array.from({ length: n + 1 }, (_, i) => `${i}H`);

  header.innerHTML = `
    <tr><th>No. of Coins</th>${headOrder.map(h => `<th colspan="2">${h.replace("H", " Head")}</th>`).join('')}</tr>
    <tr><th></th>${headOrder.map(() => `<th>Theoretical</th><th>Calculated</th>`).join('')}</tr>`;

  const row = headOrder.map(h => {
    const theo = theoreticalProbability(n, parseInt(h));
    const count = database[n][h] || 0;
    const calc = count / totalTosses[n] || 0;
    return `<td>${theo}</td><td>${calc.toFixed(3)}</td>`;
  }).join('');

  body.innerHTML = `<tr><td>${n}</td>${row}</tr>`;

  document.getElementById('toss-section').classList.add('hidden');
  document.getElementById('result-table').classList.remove('hidden');
}

function showLeaderboard() {
  hideAll();
  document.getElementById('leaderboard').classList.remove('hidden');

  let max = Math.max(...Object.values(picks));
  let mostPicked = Object.entries(picks).filter(([_, v]) => v === max)[0][0];

  document.getElementById('most-picked').textContent = `${mostPicked} Coins (${max} times)`;

  const body = document.getElementById('leaderboard-body');
  body.innerHTML = '';
  Object.entries(picks).forEach(([k, v]) => {
    body.innerHTML += `<tr><td>${k} Coin(s)</td><td>${v}</td></tr>`;
  });
}

function showAllTables() {
  const container = document.getElementById('all-prob-container');
  container.innerHTML = '';

  [1, 2, 3, 4].forEach(n => {
    const headOrder = Array.from({ length: n + 1 }, (_, i) => `${i}H`);
    let table = `<h3>${n} Coins</h3><table><tr><th>Outcome</th><th>Theoretical</th><th>Calculated</th></tr>`;
    headOrder.forEach(h => {
      const theo = theoreticalProbability(n, parseInt(h));
      const count = database[n][h] || 0;
      const calc = count / totalTosses[n] || 0;
      table += `<tr><td>${h}</td><td>${theo}</td><td>${calc.toFixed(3)}</td></tr>`;
    });
    table += '</table>';
    container.innerHTML += table;
  });

  hideAll();
  document.getElementById('all-tables').classList.remove('hidden');
}

function returnToMenu() {
  hideAll();
  document.getElementById('menu').classList.remove('hidden');
}

function hideAll() {
  const sections = ['menu', 'test-menu', 'toss-section', 'result-table', 'leaderboard', 'all-tables', 'quick-toss-section'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function theoreticalProbability(n, k) {
  return `${comb(n, k)}/${Math.pow(2, n)}`;
}

function comb(n, k) {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function factorial(n) {
  if (n <= 1) return 1;
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

// QUICK TOSS
function showQuickToss() {
  hideAll();
  document.getElementById('quick-toss-section').classList.remove('hidden');
  document.getElementById('toss-coin-image').style.display = 'none';
  document.getElementById('toss-result-msg').classList.add('hidden');
  document.getElementById('quick-animation-msg').classList.add('hidden');
}

function quickToss() {
  const img = document.getElementById('toss-coin-image');
  const msg = document.getElementById('toss-result-msg');
  const pulse = document.getElementById('quick-animation-msg');

  img.style.display = 'none';
  msg.classList.add('hidden');
  pulse.classList.remove('hidden');

  let currentFace = true;
  let flipInterval = setInterval(() => {
    img.src = currentFace ? 'head.png' : 'tail.png';
    img.style.display = 'block';
    currentFace = !currentFace;
  }, 150);

  const result = Math.random() < 0.5 ? 'H' : 'T';

  setTimeout(() => {
    clearInterval(flipInterval);
    img.src = result === 'H' ? 'head.png' : 'tail.png';
    img.style.display = 'block';
    msg.textContent = `You got ${result === 'H' ? 'Heads 🟡' : 'Tails ⚫'}!`;
    msg.classList.remove('hidden');
    pulse.classList.add('hidden');
  }, 1500);
}
