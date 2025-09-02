const RATE = 650; // PHP per session
let billingUnlocked = false; // track if parent has unlocked billing

// Fetch CSV file
async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error('Error fetching the CSV file:', error);
    return null;
  }
}

// Parse sessions.csv
function parseSessionsCSV(data) {
  if (!data) return [];

  const lines = data.trim().split('\n').slice(1);
  return lines.map(line => {
    const [date, time, tutee, sessions, status] = line.split(',');
    return {
      date,
      time,
      tutee,
      sessions: parseFloat(sessions),
      status: status.trim()
    };
  });
}

// Parse topics.csv
function parseTopicsCSV(data) {
  if (!data) return [];

  const lines = data.trim().split('\n').slice(1);
  return lines.map(line => {
    const [date, tutee, topic] = line.split(',');
    return { date, tutee, topic };
  });
}

// Update Home tab
function updateHome(sessions) {
  const completed = sessions.reduce((sum, s) => sum + s.sessions, 0);
  const paid = sessions.filter(s => s.status === "Paid").reduce((sum, s) => sum + s.sessions, 0);
  const unpaid = sessions.filter(s => s.status === "Unpaid").reduce((sum, s) => sum + s.sessions, 0);
  const unpaidTotal = unpaid * RATE;

  document.getElementById('sessions-completed').textContent = completed.toFixed(1);
  document.getElementById('sessions-paid').textContent = paid.toFixed(1);
  document.getElementById('sessions-unpaid').textContent = unpaid.toFixed(1);
  document.getElementById('total-balance').textContent = unpaidTotal.toLocaleString();
}

// Update Log tab
function updateLog(sessions) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  sessions.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.date} ${s.time} — ${s.tutee}, ${s.sessions} session(s) [${s.status}]`;
    li.classList.add(s.status.toLowerCase());
    list.appendChild(li);
  });
}

// Update Tutees tab
function updateTutees(topics) {
  const jcList = document.getElementById('topics-jc');
  const juliaList = document.getElementById('topics-julia');
  jcList.innerHTML = '';
  juliaList.innerHTML = '';

  topics.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.date}: ${t.topic}`;
    if (t.tutee === "JC") jcList.appendChild(li);
    else if (t.tutee === "Julia") juliaList.appendChild(li);
  });
}

// Update Billing tab
function updateBilling(sessions) {
  const unpaidSessions = sessions.filter(s => s.status === "Unpaid");
  const unpaidTotal = unpaidSessions.reduce((sum, s) => sum + s.sessions * RATE, 0);

  document.getElementById('billing-total').textContent = unpaidTotal.toLocaleString();

  const list = document.getElementById('billing-list');
  list.innerHTML = '';
  unpaidSessions.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.date} ${s.time} — ${s.tutee}, ${s.sessions} session(s) ₱${(s.sessions * RATE).toLocaleString()}`;
    li.classList.add('unpaid');
    list.appendChild(li);
  });
}

// Tab functionality
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // password protection for Billing tab
  if (tabName === "Billing" && !billingUnlocked) {
    document.getElementById("passwordModal").style.display = "block";
    return; // stop until password is entered
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Modal password check
function checkPassword() {
  const input = document.getElementById("passwordInput").value;
  const error = document.getElementById("passwordError");

  if (input === "parentalaccess") { // <-- set your password
    billingUnlocked = true;
    document.getElementById("passwordModal").style.display = "none";
    document.getElementById("passwordInput").value = "";
    error.textContent = "";

    // open Billing tab after unlock
    document.getElementById("Billing").style.display = "block";
    document.querySelector("button[onclick*='Billing']").className += " active";
  } else {
    error.textContent = "Incorrect password. Please try again.";
  }
}

function closeModal() {
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("passwordInput").value = "";
  document.getElementById("passwordError").textContent = "";
}

// Main
async function main() {
  const sessionsCSV = await fetchCSV('sessions.csv');
  const topicsCSV   = await fetchCSV('topics.csv');

  const sessions = parseSessionsCSV(sessionsCSV);
  const topics   = parseTopicsCSV(topicsCSV);

  updateHome(sessions);
  updateLog(sessions);
  updateTutees(topics);
  updateBilling(sessions);
}

main();
document.getElementById("defaultOpen").click();
