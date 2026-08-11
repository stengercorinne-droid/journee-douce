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

// ===== MODIFIER UNE TÂCHE =====
function editTask(index) {
  const task = tasks[index];
  if (!task) return;
  
  document.getElementById('editTaskId').value = index;
  document.getElementById('editTaskName').value = task.name;
  document.getElementById('editTaskDuration').value = task.duration;
  document.getElementById('editTaskType').value = task.type;
  document.getElementById('editTaskTime').value = task.time || '';
  document.getElementById('editTaskDate').value = task.date || new Date().toISOString().split('T')[0];
  
  document.getElementById('editModal').style.display = 'flex';
}

function saveEdit() {
  const index = parseInt(document.getElementById('editTaskId').value);
  const task = tasks[index];
  if (!task) return;
  
  task.name = document.getElementById('editTaskName').value;
  task.duration = parseInt(document.getElementById('editTaskDuration').value);
  task.type = document.getElementById('editTaskType').value;
  task.time = document.getElementById('editTaskTime').value || '--:--';
  task.date = document.getElementById('editTaskDate').value || new Date().toISOString().split('T')[0];
  
  saveTasks();
  renderDay();
  document.getElementById('editModal').style.display = 'none';
}

// ===== RENDU JOUR =====
function renderDay() {
  const container = document.getElementById('dayBlocks');
  const today = new Date().toISOString().split('T')[0];
  const dayTasks = tasks.filter(t => t.date === today && t.status !== 'cancelled');
  const sorted = [...dayTasks].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  
  if (container.children.length === sorted.length) {
    container.querySelectorAll('.bloc').forEach((el, i) => {
      const task = sorted[i];
      if (!task) return;
      const nameSpan = el.querySelector('.name');
      const durationSpan = el.querySelector('.duration');
      const timeSpan = el.querySelector('.time');
      
      if (nameSpan) nameSpan.textContent = task.name + (task.recurring ? ' 🔄' : '') + (task.status === 'missed' ? ' ❌' : '') + (task.status === 'postponed' ? ' 📅' : '');
      if (durationSpan) durationSpan.textContent = task.duration + 'min' + (task.realTime ? ` (réel:${task.realTime}min)` : '');
      if (timeSpan) timeSpan.textContent = task.time || '--:--';
      
      el.className = `bloc ${task.type} ${task.done ? 'done' : ''} ${tasks.indexOf(task) === currentTaskIndex ? 'active' : ''}`;
    });
  } else {
    container.innerHTML = '';
    sorted.forEach((task) => {
      const bloc = document.createElement('div');
      const realIndex = tasks.indexOf(task);
      const isActive = currentTaskIndex !== null && realIndex === currentTaskIndex;
      
      bloc.className = `bloc ${task.type} ${task.done ? 'done' : ''} ${isActive ? 'active' : ''}`;
      bloc.innerHTML = `
        <span class="time">${task.time || '--:--'}</span>
        <span class="name">${task.name} ${task.recurring ? '🔄' : ''} ${task.status === 'missed' ? '❌' : ''} ${task.status === 'postponed' ? '📅' : ''}</span>
        <span class="duration">${task.duration}min${task.realTime ? ` (réel:${task.realTime}min)` : ''}</span>
        <div class="actions">
          ${!task.done && !isActive ? `<button data-action="start" data-index="${realIndex}">▶️</button>` : ''}
          ${isActive ? `<button data-action="stop" data-index="${realIndex}">⏹</button>` : ''}
          ${task.done ? `<button data-action="reset" data-index="${realIndex}">↩️</button>` : ''}
          ${!task.done && !isActive ? `<button data-action="edit" data-index="${realIndex}">✏️</button>` : ''}
          ${!task.done && !isActive ? `<button data-action="delete" data-index="${realIndex}">🗑️</button>` : ''}
          ${isActive ? `<button data-action="debord" data-index="${realIndex}">⚠️</button>` : ''}
        </div>
      `;
      container.appendChild(bloc);
    });
  }
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
      html += `<span class="task-name">${task.name} ${task.recurring ? '🔄' : ''}</span>`;
      html += `<span class="task-actions">`;
      html += `<button class="week-edit-btn" data-id="${task.id}">✏️</button>`;
      html += `<button class="week-delete-btn" data-id="${task.id}">🗑️</button>`;
      html += `</span>`;
      html += `</div>`;
    });
    
    html += `<button class="week-add-btn" data-date="${dateStr}">+</button>`;
    html += `</div>`;
  }
  html += '</div>';
  container.innerHTML = html;
  
  container.querySelectorAll('.week-edit-btn').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = parseInt(this.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) {
        const index = tasks.indexOf(task);
        editTask(index);
      }
    });
  });
  
  container.querySelectorAll('.week-delete-btn').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = parseInt(this.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) {
        const index = tasks.indexOf(task);
        if (confirm(`Supprimer "${task.name}" ?`)) {
          tasks.splice(index, 1);
          saveTasks();
          renderWeek();
          renderDay();
        }
      }
    });
  });
  
  container.querySelectorAll('.week-task').forEach(el => {
    el.addEventListener('click', function(e) {
      if (e.target.closest('button')) return;
      const id = parseInt(this.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) {
        document.getElementById('weekView').style.display = 'none';
        document.getElementById('dayView').style.display = 'block';
        document.getElementById('viewWeekBtn').textContent = 'Semaine';
        renderDay();
      }
    });
  });
  
  container.querySelectorAll('.week-add-btn').forEach(el => {
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
    } else if (action === 'edit') {
      editTask(index);
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
  
  document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveEdit();
  });
  
  document.querySelector('#editModal .close').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
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
