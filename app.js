// ===== ÉTAT =====
let tasks = [];
let currentTaskIndex = null;
let timerInterval = null;
let seconds = 0;

// ===== CHARGEMENT =====
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  migrateTasks();
  renderDay();
  updateDate();
  updateCapacity();
  setupListeners();
  setupDebord();
  setupBilan();
  setupPrepareTomorrow();
  checkMissedTasks();
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
    const today = new Date().toISOString().split('T')[0];
    tasks = [
      { id: Date.now() + 1, name: 'Routine matin', duration: 30, type: 'task', time: '06:00', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 2, name: 'Promenade chien', duration: 60, type: 'task', time: '06:30', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 3, name: 'Ménage du bas', duration: 60, type: 'task', time: '07:30', date: today, done: false, realTime: null, recurring: 'weekly', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 4, name: 'Courses', duration: 90, type: 'task', time: '08:30', date: today, done: false, realTime: null, recurring: 'weekly', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 5, name: 'Projets', duration: 120, type: 'task', time: '10:00', date: today, done: false, realTime: null, recurring: null, status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 6, name: 'Repas midi', duration: 30, type: 'task', time: '12:00', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 7, name: 'Projets (suite)', duration: 180, type: 'task', time: '12:30', date: today, done: false, realTime: null, recurring: null, status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 8, name: 'Prépa repas soir', duration: 30, type: 'task', time: '15:30', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 9, name: 'Sortie chiens + chat', duration: 30, type: 'task', time: '16:00', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 10, name: 'Douche / repos', duration: 60, type: 'free', time: '16:30', date: today, done: false, realTime: null, recurring: null, status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 11, name: 'Dîner + rangement', duration: 60, type: 'task', time: '17:30', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 12, name: 'Télé / repos', duration: 120, type: 'free', time: '18:30', date: today, done: false, realTime: null, recurring: null, status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 13, name: 'Dernière sortie', duration: 15, type: 'task', time: '20:30', date: today, done: false, realTime: null, recurring: 'daily', status: 'planned', missedDate: null, postponedDate: null },
      { id: Date.now() + 14, name: 'Temps libre / coucher', duration: 135, type: 'free', time: '20:45', date: today, done: false, realTime: null, recurring: null, status: 'planned', missedDate: null, postponedDate: null },
    ];
    saveTasks();
  }
}

// ===== MIGRATION =====
function migrateTasks() {
  let changed = false;
  const today = new Date().toISOString().split('T')[0];
  tasks.forEach(t => {
    if (!t.date) {
      t.date = today;
      changed = true;
    }
    if (!t.status) {
      t.status = t.done ? 'done' : 'planned';
      changed = true;
    }
    if (!t.recurring) {
      t.recurring = null;
      changed = true;
    }
    if (!t.missedDate) {
      t.missedDate = null;
      changed = true;
    }
    if (!t.postponedDate) {
      t.postponedDate = null;
      changed = true;
    }
  });
  if (changed) {
    saveTasks();
  }
}

// ===== RENDU JOUR =====
function renderDay() {
  const container = document.getElementById('dayBlocks');
  container.innerHTML = '';
  const today = new Date().toISOString().split('T')[0];
  const dayTasks = tasks.filter(t => t.date === today && t.status !== 'cancelled');
  const sorted = [...dayTasks].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  
  sorted.forEach((task, index) => {
    const bloc = document.createElement('div');
    const isActive = currentTaskIndex !== null && tasks.indexOf(task) === currentTaskIndex;
    bloc.className = `bloc ${task.type} ${task.done ? 'done' : ''} ${isActive ? 'active' : ''}`;
    const realIndex = tasks.indexOf(task);
    bloc.innerHTML = `
      <span class="time">${task.time || '--:--'}</span>
      <span class="name">${task.name} ${task.recurring ? '🔄' : ''} ${task.status === 'missed' ? '❌' : ''} ${task.status === 'postponed' ? '📅' : ''}</span>
      <span class="duration">${task.duration}min${task.realTime ? ` (réel:${task.realTime}min)` : ''}</span>
      <div class="actions">
        ${!task.done && !isActive ? `<button data-action="start" data-index="${realIndex}">▶️</button>` : ''}
        ${isActive ? `<button data-action="stop" data-index="${realIndex}">⏹</button>` : ''}
        ${task.done ? `<button data-action="reset" data-index="${realIndex}">↩️</button>` : ''}
        ${!task.done && !isActive ? `<button data-action="delete" data-index="${realIndex}">🗑️</button>` : ''}
        ${isActive ? `<button data-action="debord" data-index="${realIndex}">⚠️</button>` : ''}
      </div>
    `;
    container.appendChild(bloc);
  });
  updateCapacity();
}

// ===== RENDU SEMAINE =====
function renderWeek() {
  const container = document.getElementById('weekGrid');
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  
  let html = '<div class="week-grid">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.date === dateStr && t.status !== 'cancelled');
    const sorted = [...dayTasks].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    const total = dayTasks.reduce((sum, t) => sum + t.duration, 0);
    
    html += `<div class="week-day" data-date="${dateStr}">`;
    html += `<div class="day-label">${days[i]}</div>`;
    html += `<div class="day-total">${Math.round(total/60)}h</div>`;
    
    sorted.forEach(task => {
      const cls = `week-task ${task.type} ${task.recurring ? 'recurring' : ''} ${task.status === 'missed' ? 'missed' : ''}`;
      html += `<div class="${cls}" data-id="${task.id}">`;
      html += `<span class="task-time">${task.time || '--:--'}</span>`;
      html += `${task.name} ${task.recurring ? '🔄' : ''}`;
      html += `</div>`;
    });
    
    html += `<button class="week-add-btn" data-date="${dateStr}">+</button>`;
    html += `</div>`;
  }
  html += '</div>';
  container.innerHTML = html;
  
  // Ajouter les écouteurs sur les tâches de la semaine
  document.querySelectorAll('.week-task').forEach(el => {
    el.addEventListener('click', function() {
      const id = parseInt(this.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) {
        // Basculer vers la vue Jour et sélectionner la tâche
        document.getElementById('weekView').style.display = 'none';
        document.getElementById('dayView').style.display = 'block';
        document.getElementById('viewWeekBtn').textContent = 'Semaine';
        renderDay();
        // Scroll vers la tâche (optionnel)
      }
    });
  });
  
  // Ajouter les écouteurs sur les boutons "+" de la semaine
  document.querySelectorAll('.week-add-btn').forEach(el => {
    el.addEventListener('click', function() {
      const date = this.dataset.date;
      document.getElementById('taskDate').value = date;
      document.getElementById('addModal').style.display = 'flex';
    });
  });
}

// ===== CAPACITÉ =====
function updateCapacity() {
  const today = new Date().toISOString().split('T')[0];
  const dayTasks = tasks.filter(t => t.date === today && t.status !== 'cancelled');
  const total = dayTasks.reduce((sum, t) => sum + t.duration, 0);
  const free = dayTasks.filter(t => t.type === 'free').reduce((sum, t) => sum + t.duration, 0);
  document.getElementById('capacityDisplay').textContent = `⏱ Occupé: ${Math.round(total/60)}h | Libre: ${Math.round(free/60)}h`;
}

function updateDate() {
  const now = new Date();
  document.getElementById('dateDisplay').textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ===== LISTENERS =====
function setupListeners() {
  document.getElementById('addTaskBtn').addEventListener('click', () => {
    document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
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
    const date = document.getElementById('taskDate').value || new Date().toISOString().split('T')[0];
    tasks.push({
      id: Date.now(),
      name,
      duration,
      type,
      time,
      date,
      done: false,
      realTime: null,
      recurring: null,
      status: 'planned',
      missedDate: null,
      postponedDate: null
    });
    saveTasks();
    renderDay();
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('addForm').reset();
  });
  
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
      renderDay();
    }
  });
  
  document.getElementById('resetDayBtn').addEventListener('click', () => {
    if (confirm('Réinitialiser toutes les tâches de la journée ?')) {
      const today = new Date().toISOString().split('T')[0];
      tasks.forEach(t => {
        if (t.date === today) {
          t.done = false;
          t.realTime = null;
          t.status = 'planned';
        }
      });
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
    task.status = 'done';
    saveTasks();
    detectRecurring(task);
  }
  currentTaskIndex = null;
  renderDay();
  if (tasks.filter(t => t.date === new Date().toISOString().split('T')[0]).every(t => t.done)) {
    openBilan();
  }
}

function resetTask(index) {
  const task = tasks[index];
  if (task) {
    task.done = false;
    task.realTime = null;
    task.status = 'planned';
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
    const flexibles = tasks.filter(t => !t.done && t.type === 'free' && t.id !== tasks[currentTaskIndex]?.id);
    let totalGagne = 0;
    let html = '<p>✅ Solution proposée :</p><ul>';
    for (const t of flexibles) {
      if (totalGagne >= minutes) break;
      const reduction = Math.min(t.duration, minutes - totalGagne);
      html += `<li>Réduire "${t.name}" de ${reduction}min (${t.duration}min → ${t.duration - reduction}min)</li>`;
      totalGagne += reduction;
      t.duration -= reduction;
      if (t.duration <= 0) t.duration = 1;
    }
    if (totalGagne < minutes) {
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
  const today = new Date().toISOString().split('T')[0];
  const dayTasks = tasks.filter(t => t.date === today);
  const total = dayTasks.length;
  const done = dayTasks.filter(t => t.done).length;
  const totalTime = dayTasks.reduce((sum, t) => sum + t.duration, 0);
  const realTime = dayTasks.reduce((sum, t) => sum + (t.realTime || t.duration), 0);
  const diff = realTime - totalTime;
  const html = `
    <p>✅ Tâches réalisées : ${done}/${total}</p>
    <p>⏱ Temps prévu : ${Math.round(totalTime/60)}h</p>
    <p>⏱ Temps réel : ${Math.round(realTime/60)}h</p>
    <p>📊 Écart : ${diff > 0 ? '+' : ''}${diff}min</p>
    ${dayTasks.filter(t => t.realTime && Math.abs(t.realTime - t.duration) > 5).map(t => 
      `<p>• ${t.name} : ${t.duration}min prévu → ${t.realTime}min réel</p>`
    ).join('')}
  `;
  container.innerHTML = html;
  document.getElementById('bilanModal').style.display = 'flex';
}

// ===== DÉTECTION DES RÉCURRENTES =====
function detectRecurring(task) {
  const name = task.name;
  const similar = tasks.filter(t => t.name === name && t.done && t.date !== task.date);
  if (similar.length >= 3) {
    const existing = tasks.find(t => t.name === name && t.recurring === 'daily');
    if (!existing) {
      if (confirm(`🔁 J'ai remarqué que tu fais "${name}" régulièrement. Veux-tu que je la propose automatiquement chaque jour ?`)) {
        const today = new Date().toISOString().split('T')[0];
        // Ajouter la tâche récurrente pour les jours à venir
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          if (!tasks.find(t => t.name === name && t.date === dateStr && t.recurring === 'daily
