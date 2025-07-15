let selectedCoins = 0;
let currentToss = 0;
let outcomes = [];
let database = JSON.parse(localStorage.getItem("database")) || { 1: {}, 2: {}, 3: {}, 4: {} };
let totalTosses = JSON.parse(localStorage.getItem("totalTosses")) || { 1: 0, 2: 0, 3: 0, 4: 0 };
let picks = JSON.parse(localStorage.getItem("picks")) || { 1: 0, 2: 0, 3: 0, 4: 0 };
let picks = { 1: 0, 2: 0, 3: 0, 4: 0 };

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
  localStorage.setItem("picks", JSON.stringify(picks)); // save pick count

  currentToss = 0;
  outcomes = [];

  hideAll();
  document.getElementById('toss-section').classList.remove('hidden');

  // Clear image before first toss
  const coinImg = document.getElementById('coin-image');
  coinImg.style.display = 'none';
  coinImg.src = '';

  // Reset UI
  document.getElementById('result-msg').classList.add('hidden');
  document.getElementById('result-msg').textContent = '';
  document.getElementById('toss-button').textContent = "Toss Coin 1";
  document.getElementById('toss-button').classList.remove('hidden');
  document.getElementById('after-toss-options').classList.add('hidden');
  document.getElementById('live-count').classList.add('hidden');
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
  let currentFace = true; // true = head, false = tail

  // Start alternating coin face during animation
  flipInterval = setInterval(() => {
    coinImg.src = currentFace ? 'head.png' : 'tail.png';
    currentFace = !currentFace;
    coinImg.style.display = 'block';
  }, 150);

  const finalResult = Math.random() < 0.5 ? 'H' : 'T';

  setTimeout(() => {
    clearInterval(flipInterval); // stop the flip
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
  localStorage.setItem("database", JSON.stringify(database));
  localStorage.setItem("totalTosses", JSON.stringify(totalTosses));
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

  // Find most picked
  let max = Math.max(...Object.values(picks));
  let mostPickedEntry = Object.entries(picks).find(([_, v]) => v === max);
  let mostPicked = mostPickedEntry ? mostPickedEntry[0] : "None";

  document.getElementById('most-picked').textContent = `${mostPicked} Coin(s) (${max} times)`;

  // Build leaderboard table
  const body = document.getElementById('leaderboard-body');
  body.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Coin Option</th>
          <th>Times Picked</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(picks)
          .map(([k, v]) => `<tr><td>${k} Coin(s)</td><td>${v}</td></tr>`)
          .join('')}
      </tbody>
    </table>
  `;
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
