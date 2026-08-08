// ===== ÉTAT =====
let tasks = [];
let currentTaskIndex = null;
let timerInterval = null;
let seconds = 0;

// ===== CHARGEMENT =====
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  renderDay();
  updateDate();
  setupListeners();
  setupDebord();
  setupBilan();
});

// ===== SAUVEGARDE =====
function saveTasks() {
  localStorage.setItem('journeeDouceTasks', JSON.stringify(tasks));
}

function loadTasks() {
  const data = localStorage.getItem('journeeDouceTasks');
  if (data) {
    tasks = JSON.parse(data);
  } else {
    // Tâches par défaut
    tasks = [
      { id: Date.now() + 1, name: 'Routine matin', duration: 30, type: 'task', time: '06:00', done: false, realTime: null },
      { id: Date.now() + 2, name: 'Promenade chien', duration: 60, type: 'task', time: '06:30', done: false, realTime: null },
      { id: Date.now() + 3, name: 'Ménage du bas', duration: 60, type: 'task', time: '07:30', done: false, realTime: null },
      { id: Date.now() + 4, name: 'Courses', duration: 90, type: 'task', time: '08:30', done: false, realTime: null },
      { id: Date.now() + 5, name: 'Projets', duration: 120, type: 'task', time: '10:00', done: false, realTime: null },
      { id: Date.now() + 6, name: 'Repas midi', duration: 30, type: 'task', time: '12:00', done: false, realTime: null },
      { id: Date.now() + 7, name: 'Projets (suite)', duration: 180, type: 'task', time: '12:30', done: false, realTime: null },
      { id: Date.now() + 8, name: 'Prépa repas soir', duration: 30, type: 'task', time: '15:30', done: false, realTime: null },
      { id: Date.now() + 9, name: 'Sortie chiens + chat', duration: 30, type: 'task', time: '16:00', done: false, realTime: null },
      { id: Date.now() + 10, name: 'Douche / repos', duration: 60, type: 'free', time: '16:30', done: false, realTime: null },
      { id: Date.now() + 11, name: 'Dîner + rangement', duration: 60, type: 'task', time: '17:30', done: false, realTime: null },
      { id: Date.now() + 12, name: 'Télé / repos', duration: 120, type: 'free', time: '18:30', done: false, realTime: null },
      { id: Date.now() + 13, name: 'Dernière sortie', duration: 15, type: 'task', time: '20:30', done: false, realTime: null },
      { id: Date.now() + 14, name: 'Temps libre / coucher', duration: 135, type: 'free', time: '20:45', done: false, realTime: null },
    ];
    saveTasks();
  }
}

// ===== RENDU =====
function renderDay() {
  const container = document.getElementById('dayBlocks');
  container.innerHTML = '';
  tasks.forEach((task, index) => {
    const bloc = document.createElement('div');
    bloc.className = `bloc ${task.type} ${task.done ? 'done' : ''} ${currentTaskIndex === index ? 'active' : ''}`;
    bloc.innerHTML = `
      <span class="time">${task.time || '--:--'}</span>
      <span class="name">${task.name}</span>
      <span class="duration">${task.duration}min${task.realTime ? ` (réel:${task.realTime}min)` : ''}</span>
      <div class="actions">
        ${!task.done && currentTaskIndex !== index ? `<button data-action="start" data-index="${index}">▶️</button>` : ''}
        ${currentTaskIndex === index ? `<button data-action="stop" data-index="${index}">⏹</button>` : ''}
        ${task.done ? `<button data-action="reset" data-index="${index}">↩️</button>` : ''}
        ${!task.done && currentTaskIndex !== index ? `<button data-action="delete" data-index="${index}">🗑️</button>` : ''}
        ${currentTaskIndex === index ? `<button data-action="debord" data-index="${index}">⚠️</button>` : ''}
      </div>
    `;
    container.appendChild(bloc);
  });
  updateCapacity();
}

function renderWeek() {
  const container = document.getElementById('weekBlocks');
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  
  let html = '<div class="week-grid">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const total = tasks.reduce((sum, t) => sum + (t.done ? t.duration : 0), 0);
    const fill = Math.min(100, (total / 600) * 100);
    html += `
      <div class="week-day">
        <div class="day-label">${days[i]}</div>
        <div class="day-bar"><div class="fill" style="width:${fill}%"></div></div>
        <div class="day-total">${Math.round(total/60)}h</div>
      </div>
    `;
  }
  html += '</div>';
  container.innerHTML = html;
}

// ===== CAPACITÉ =====
function updateCapacity() {
  const total = tasks.reduce((sum, t) => sum + t.duration, 0);
  const free = tasks.filter(t => t.type === 'free').reduce((sum, t) => sum + t.duration, 0);
  document.getElementById('capacityDisplay').textContent = `⏱ Occupé: ${Math.round(total/60)}h | Libre: ${Math.round(free/60)}h`;
}

function updateDate() {
  const now = new Date();
  document.getElementById('dateDisplay').textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ===== LISTENERS =====
function setupListeners() {
  // Ajout
  document.getElementById('addTaskBtn').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'flex';
  });
  document.querySelectorAll('.close').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    });
  });
  document.getElementById('addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('taskName').value;
    const duration = parseInt(document.getElementById('taskDuration').value);
    const type = document.getElementById('taskType').value;
    const time = document.getElementById('taskTime').value || '--:--';
    tasks.push({ id: Date.now(), name, duration, type, time, done: false, realTime: null });
    saveTasks();
    renderDay();
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('addForm').reset();
  });

  // Actions sur blocs (délégation)
  document.getElementById('dayBlocks').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const index = parseInt(btn.dataset.index);
    if (isNaN(index)) return;
    const action = btn.dataset.action;

    if (action === 'start') {
      startTask(index);
    } else if (action === 'stop') {
      stopTask(index);
    } else if (action === 'reset') {
      resetTask(index);
    } else if (action === 'delete') {
      deleteTask(index);
    } else if (action === 'debord') {
      openDebord(index);
    }
  });

  // Vue semaine
  document.getElementById('viewWeekBtn').addEventListener('click', () => {
    const dayView = document.getElementById('dayView');
    const weekView = document.getElementById('weekView');
    if (dayView.style.display !== 'none') {
      dayView.style.display = 'none';
      weekView.style.display = 'block';
      renderWeek();
      document.getElementById('viewWeekBtn').textContent = 'Jour';
    } else {
      dayView.style.display = 'block';
      weekView.style.display = 'none';
      document.getElementById('viewWeekBtn').textContent = 'Semaine';
    }
  });

  // Reset journée
  document.getElementById('resetDayBtn').addEventListener('click', () => {
    if (confirm('Réinitialiser toutes les tâches de la journée ?')) {
      tasks.forEach(t => { t.done = false; t.realTime = null; });
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      currentTaskIndex = null;
      saveTasks();
      renderDay();
    }
  });
}

// ===== CHRONO =====
function startTask(index) {
  if (currentTaskIndex !== null && currentTaskIndex !== index) {
    if (!confirm('Une tâche est déjà en cours. L\'arrêter ?')) return;
    stopTask(currentTaskIndex);
  }
  currentTaskIndex = index;
  seconds = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
  }, 1000);
  renderDay();
}

function stopTask(index) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const task = tasks[index];
  if (task) {
    const realTime = Math.round(seconds / 60);
    task.realTime = realTime > 0 ? realTime : task.duration;
    task.done = true;
    saveTasks();
  }
  currentTaskIndex = null;
  renderDay();
  // Bilan auto si toutes finies
  if (tasks.every(t => t.done)) {
    openBilan();
  }
}

function resetTask(index) {
  const task = tasks[index];
  if (task) {
    task.done = false;
    task.realTime = null;
    saveTasks();
    renderDay();
  }
}

function deleteTask(index) {
  if (confirm('Supprimer cette tâche ?')) {
    tasks.splice(index, 1);
    saveTasks();
    renderDay();
  }
}

// ===== DÉRAPAGE =====
function setupDebord() {
  document.getElementById('debordAutoBtn').addEventListener('click', () => {
    const minutes = parseInt(document.getElementById('debordMinutes').value) || 15;
    const solution = document.getElementById('debordSolution');
    // Trouver des tâches flexibles à réduire
    const flexibles = tasks.filter(t => !t.done && t.type === 'free' && t.id !== tasks[currentTaskIndex]?.id);
    let found = false;
    let html = '<p>✅ Solution proposée :</p><ul>';
    let totalGagne = 0;
    for (const t of flexibles) {
      if (totalGagne >= minutes) break;
      const reduction = Math.min(t.duration, minutes - totalGagne);
      html += `<li>Réduire "${t.name}" de ${reduction}min (${t.duration}min → ${t.duration - reduction}min)</li>`;
      totalGagne += reduction;
      t.duration -= reduction;
      if (t.duration <= 0) t.duration = 1;
      found = true;
    }
    if (!found || totalGagne < minutes) {
      html += `<li>⚠️ Pas assez de temps libre. Il faudra reporter une tâche.</li>`;
    }
    html += `</ul><p>Total gagné : ${Math.min(totalGagne, minutes)}min</p>`;
    solution.innerHTML = html + `<button id="applyDebordBtn" class="btn-primary">Appliquer</button>`;
    document.getElementById('applyDebordBtn').addEventListener('click', () => {
      saveTasks();
      renderDay();
      document.getElementById('debordModal').style.display = 'none';
    });
  });
}

function openDebord(index) {
  const task = tasks[index];
  if (!task) return;
  document.getElementById('debordTaskName').textContent = task.name;
  document.getElementById('debordMinutes').value = 15;
  document.getElementById('debordSolution').innerHTML = '';
  document.getElementById('debordModal').style.display = 'flex';
}

// ===== BILAN =====
function setupBilan() {
  document.querySelectorAll('.close').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('bilanModal').style.display = 'none';
    });
  });
}

function openBilan() {
  const container = document.getElementById('bilanContent');
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const totalTime = tasks.reduce((sum, t) => sum + t.duration, 0);
  const realTime = tasks.reduce((sum, t) => sum + (t.realTime || t.duration), 0);
  const diff = realTime - totalTime;
  const html = `
    <p>✅ Tâches réalisées : ${done}/${total}</p>
    <p>⏱ Temps prévu : ${Math.round(totalTime/60)}h</p>
    <p>⏱ Temps réel : ${Math.round(realTime/60)}h</p>
    <p>📊 Écart : ${diff > 0 ? '+' : ''}${diff}min</p>
    ${tasks.filter(t => t.realTime && Math.abs(t.realTime - t.duration) > 5).map(t => 
      `<p>• ${t.name} : ${t.duration}min prévu → ${t.realTime}min réel</p>`
    ).join('')}
  `;
  container.innerHTML = html;
  document.getElementById('bilanModal').style.display = 'flex';
}