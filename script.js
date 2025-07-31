let selectedCoins = 0;
let currentToss = 0;
let outcomes = [];
let database = { 1: {}, 2: {}, 3: {}, 4: {} };
let totalTosses = { 1: 0, 2: 0, 3: 0, 4: 0 };
let picks = { 1: 0, 2: 0, 3: 0, 4: 0 };

const firebaseConfig = {
  apiKey: "AIzaSyBPLYuPbib2NUULTrZA5nE2H3A4zkpDffw",
  authDomain: "probabilitywebsite-c035b.firebaseapp.com",
  projectId: "probabilitywebsite-c035b",
  storageBucket: "probabilitywebsite-c035b.appspot.com",
  messagingSenderId: "1046798969004",
  appId: "1:1046798969004:web:bcbd36c3786d639fa95709",
  measurementId: "G-R4B2XPH0NP"
};

if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('hidden');
}

function showTestMenu() {
  hideAll();
  document.getElementById('test-menu').classList.remove('hidden');
}

async function startToss(n) {
  selectedCoins = n;
  picks[n]++;
  currentToss = 0;
  outcomes = [];

  const lbRef = db.collection("users").doc("tossData").collection("leaderboard").doc(String(n));
  try {
    await lbRef.set({
      picked: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
    console.log(`📈 Firestore updated: leaderboard → ${n} coins`);
  } catch (err) {
    console.error("⚠️ Firestore leaderboard update error:", err);
  }

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
}

function tossCoin() {
  const coinImg = document.getElementById('coin-image');
  const resultMsg = document.getElementById('result-msg');
  const tossBtn = document.getElementById('toss-button');
  const animation = document.getElementById('animation-msg');
  const liveCount = document.getElementById('live-count');
  const afterToss = document.getElementById('after-toss-options');

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

async function processResult() {
  const heads = outcomes.filter(x => x === 'H').length;
  const label = `${heads}H`;
  const n = selectedCoins;

  if (!database[n][label]) database[n][label] = 0;
  database[n][label]++;
  totalTosses[n]++;

  const tossDocRef = db.collection("users").doc("tossData").collection(String(n)).doc("1");
  try {
    await tossDocRef.set({
      [label]: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
    console.log(`Firestore updated: tossData → ${n} coins → ${label}`);
  } catch (err) {
    console.error("⚠️ Firestore tossData update error:", err);
  }

  const totalDocRef = db.collection("users").doc("totalTosses");
  try {
    await totalDocRef.set({
      [n]: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
    console.log(`Firestore updated: totalTosses → ${n}`);
  } catch (err) {
    console.error("⚠️ Firestore totalTosses update error:", err);
  }
}

async function showTable() {
  await loadFirestoreData();

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
    const calc = totalTosses[n] > 0 ? count / totalTosses[n] : 0;
    return `<td>${theo}</td><td>${calc.toFixed(3)}</td>`;
  }).join('');

  body.innerHTML = `<tr><td>${n}</td>${row}</tr>`;

  document.getElementById('toss-section').classList.add('hidden');
  document.getElementById('result-table').classList.remove('hidden');
}

async function showLeaderboard() {
  hideAll();
  document.getElementById('leaderboard').classList.remove('hidden');

  const leaderboardRef = db.collection("users").doc("tossData").collection("leaderboard");
  const body = document.getElementById('leaderboard-body');
  body.innerHTML = '';

  try {
    const snapshot = await leaderboardRef.get();
    let max = 0;
    let mostPicked = '';
    const picksData = {};

    snapshot.forEach(doc => {
      const coinCount = doc.id;
      const pickCount = doc.data().picked || 0;
      picksData[coinCount] = pickCount;

      if (pickCount > max) {
        max = pickCount;
        mostPicked = coinCount;
      }
    });

    document.getElementById('most-picked').textContent =
      mostPicked ? `${mostPicked} Coins (${max} times)` : 'No picks yet';

    Object.entries(picksData).forEach(([k, v]) => {
      body.innerHTML += `<tr><td>${k} Coin(s)</td><td>${v}</td></tr>`;
    });
  } catch (err) {
    console.error("⚠️ Error loading leaderboard:", err);
    document.getElementById('most-picked').textContent = 'Error loading leaderboard';
  }
}

async function showAllTables() {
  await loadFirestoreData();

  const container = document.getElementById('all-prob-container');
  container.innerHTML = '';

  [1, 2, 3, 4].forEach(n => {
    const headOrder = Array.from({ length: n + 1 }, (_, i) => `${i}H`);
    let table = `<h3>${n} Coins</h3><table><tr><th>Outcome</th><th>Theoretical</th><th>Calculated</th></tr>`;
    headOrder.forEach(h => {
      const theo = theoreticalProbability(n, parseInt(h));
      const count = database[n][h] || 0;
      const calc = totalTosses[n] > 0 ? count / totalTosses[n] : 0;
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

async function loadFirestoreData() {
  for (let n = 1; n <= 4; n++) {
    const tossDoc = await db.collection("users").doc("tossData").collection(String(n)).doc("1").get();
    if (tossDoc.exists) {
      const data = tossDoc.data();
      database[n] = { ...data };
    }

    const totalDoc = await db.collection("users").doc("totalTosses").get();
    if (totalDoc.exists) {
      const totals = totalDoc.data();
      totalTosses[n] = totals[n] || 0;
    }
  }
  console.log("✅ Firestore data loaded into memory");
}
