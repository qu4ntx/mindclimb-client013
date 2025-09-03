const RATE = 650; // PHP per session
let billingUnlocked = false;

// Fetch CSV
async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error('Error fetching CSV:', error);
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
      status: status ? status.trim().toLowerCase() : "" // normalize here
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

// Update Log
function updateLog(sessions) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  sessions.forEach(s => {
    const div = document.createElement('div');
    div.classList.add('log-item', s.status);
    div.textContent = `${s.date} ${s.time} — ${s.tutee}: ${s.sessions} session(s)`;
    list.appendChild(div);
  });
}

// Update Tutees
function updateTutees(topics) {
  const jcList = document.getElementById('topics-jc');
  const juliaList = document.getElementById('topics-julia');
  jcList.innerHTML = '';
  juliaList.innerHTML = '';
  topics.forEach(t => {
    const div = document.createElement('div');
    div.classList.add('topic-item');
    div.textContent = `${t.date}: ${t.topic}`;
    if (t.tutee === "JC") jcList.appendChild(div);
    else if (t.tutee === "Julia") juliaList.appendChild(div);
  });
}

// Update Billing
function updateBilling(sessions) {
  const unpaidSessions = sessions.filter(s => s.status === "unpaid"); // lowercase check
  const unpaidTotal = unpaidSessions.reduce((sum, s) => sum + s.sessions * RATE, 0);

  document.getElementById('billing-total').textContent = unpaidTotal.toLocaleString();

  const list = document.getElementById('billing-list');
  list.innerHTML = '';
  unpaidSessions.forEach(s => {
    const div = document.createElement('div');
    div.classList.add('billing-item', 'unpaid');
    div.textContent = `${s.date} ${s.time} — ${s.tutee}: ${s.sessions} session(s) • ₱${(s.sessions * RATE).toLocaleString()}`;
    list.appendChild(div);
  });
}

// Tab handling
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";

  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");

  if (tabName === "Billing" && !billingUnlocked) {
    document.getElementById("passwordModal").style.display = "block";
    return;
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Modal password check
function checkPassword() {
  const input = document.getElementById("passwordInput").value;
  const error = document.getElementById("passwordError");

  if (input === "climb123") { // set password
    billingUnlocked = true;
    document.getElementById("passwordModal").style.display = "none";
    document.getElementById("passwordInput").value = "";
    error.textContent = "";
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
  const topics = parseTopicsCSV(topicsCSV);

  updateLog(sessions);
  updateTutees(topics);
  updateBilling(sessions);
}

main();
document.getElementById("defaultOpen").click();
