const taskInput      = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn         = document.getElementById('addBtn');
const taskList       = document.getElementById('taskList');
const emptyMsg       = document.getElementById('emptyMsg');
const filterBtns     = document.querySelectorAll('.filter-btn');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';

function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function render() {
  taskList.innerHTML = '';
  const filtered = tasks.filter(t => {
    if (currentFilter === 'all')  return true;
    if (currentFilter === 'done') return t.done;
    return t.priority === currentFilter && !t.done;
  });

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.priority = task.priority;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.done;
    cb.addEventListener('change', () => { task.done = cb.checked; save(); render(); });

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const badge = document.createElement('span');
    badge.className = `badge badge-${task.priority}`;
    const labels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
    badge.textContent = labels[task.priority];

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '✕';
    del.addEventListener('click', () => { tasks = tasks.filter(t => t !== task); save(); render(); });

    li.append(cb, span, badge, del);
    taskList.appendChild(li);
  });

  emptyMsg.classList.toggle('show', filtered.length === 0);
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({ text, priority: prioritySelect.value, done: false, id: Date.now() });
  taskInput.value = '';
  save(); render();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();
