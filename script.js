const taskInput      = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn         = document.getElementById('addBtn');
const taskList       = document.getElementById('taskList');
const emptyMsg       = document.getElementById('emptyMsg');
const filterBtns     = document.querySelectorAll('.filter-btn');
const clockEl        = document.getElementById('clock');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';
let dragSrcIndex = null;

function updateClock() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockEl.innerHTML = `<span class="time">${timeStr}</span>${dateStr}`;
}
updateClock();
setInterval(updateClock, 1000);

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getFilteredIndices() {
  return tasks.map((t, i) => ({ t, i })).filter(({ t }) => {
    if (currentFilter === 'all')  return true;
    if (currentFilter === 'done') return t.done;
    return t.priority === currentFilter && !t.done;
  });
}

function render() {
  taskList.innerHTML = '';
  const filtered = getFilteredIndices();

  filtered.forEach(({ t: task, i: realIndex }) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.priority = task.priority;
    li.dataset.index = realIndex;
    li.draggable = true;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.done;
    cb.addEventListener('change', () => {
      task.done = cb.checked;
      task.doneAt = cb.checked ? Date.now() : null;
      save(); render();
    });

    const body = document.createElement('div');
    body.className = 'task-body';

    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const badge = document.createElement('span');
    const labels = { high: '🔴 紧急', medium: '🟡 普通', low: '🟢 轻松' };
    badge.className = `badge badge-${task.priority}`;
    badge.textContent = labels[task.priority];

    const timeSpan = document.createElement('span');
    if (task.done && task.doneAt) {
      timeSpan.className = 'task-time done-time';
      timeSpan.textContent = '✔ 完成于 ' + formatTime(task.doneAt);
    } else {
      timeSpan.className = 'task-time';
      timeSpan.textContent = '创建于 ' + formatTime(task.createdAt);
    }

    meta.append(badge, timeSpan);
    body.append(textSpan, meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', () => startEdit(task, textSpan, editBtn));

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.title = '删除';
    delBtn.addEventListener('click', () => {
      tasks.splice(realIndex, 1);
      save(); render();
    });

    actions.append(editBtn, delBtn);
    li.append(cb, body, actions);

    li.addEventListener('dragstart', () => {
      dragSrcIndex = realIndex;
      setTimeout(() => li.classList.add('dragging'), 0);
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', e => {
      e.preventDefault();
      li.classList.remove('drag-over');
      if (dragSrcIndex === null || dragSrcIndex === realIndex) return;
      const moved = tasks.splice(dragSrcIndex, 1)[0];
      const newTarget = parseInt(li.dataset.index);
      const adjustedTarget = dragSrcIndex < newTarget ? newTarget - 1 : newTarget;
      tasks.splice(adjustedTarget, 0, moved);
      dragSrcIndex = null;
      save(); render();
    });

    taskList.appendChild(li);
  });

  emptyMsg.classList.toggle('show', filtered.length === 0);
}

function startEdit(task, textSpan, editBtn) {
  const input = document.createElement('input');
  input.className = 'task-edit-input';
  input.value = task.text;
  textSpan.replaceWith(input);
  input.focus();
  editBtn.textContent = '💾';

  const finish = () => {
    const val = input.value.trim();
    if (val) { task.text = val; save(); }
    render();
  };

  editBtn.onclick = finish;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') finish();
    if (e.key === 'Escape') render();
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({ text, priority: prioritySelect.value, done: false, createdAt: Date.now(), doneAt: null, id: Date.now() });
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
