const taskInput      = document.getElementById('taskInput');
const dateInput      = document.getElementById('dateInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn         = document.getElementById('addBtn');
const taskList       = document.getElementById('taskList');
const emptyMsg       = document.getElementById('emptyMsg');
const filterBtns     = document.querySelectorAll('.filter-btn');
const clockEl        = document.getElementById('clock');
const calGrid        = document.getElementById('calGrid');
const calTitle       = document.getElementById('calTitle');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';
let dragSrcIndex = null;
let selectedDate = null;
let calYear, calMonth;

const now = new Date();
calYear = now.getFullYear();
calMonth = now.getMonth();

// 时钟
function updateClock() {
  const n = new Date();
  const dateStr = n.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = n.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockEl.innerHTML = `<span class="time">${timeStr}</span>${dateStr}`;
}
updateClock();
setInterval(updateClock, 1000);

function toDateStr(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function save() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

// 日历
function renderCalendar() {
  calTitle.textContent = `${calYear}年 ${calMonth + 1}月`;
  calGrid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const todayStr = toDateStr(Date.now());

  // 任务按日期分组
  const tasksByDate = {};
  tasks.forEach(t => {
    if (t.deadline) {
      if (!tasksByDate[t.deadline]) tasksByDate[t.deadline] = [];
      tasksByDate[t.deadline].push(t);
    }
  });

  // 上月补位
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.textContent = day;
    calGrid.appendChild(d);
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const div = document.createElement('div');
    div.className = 'cal-day';
    if (dateStr === todayStr) div.classList.add('today');
    if (dateStr === selectedDate) div.classList.add('selected');

    div.textContent = d;

    if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) {
      div.classList.add('has-tasks');
      const dots = document.createElement('div');
      dots.className = 'dots';
      const shown = tasksByDate[dateStr].slice(0, 3);
      shown.forEach(t => {
        const dot = document.createElement('span');
        dot.className = `dot dot-${t.priority}`;
        dots.appendChild(dot);
      });
      div.appendChild(dots);
    }

    div.addEventListener('click', () => {
      selectedDate = selectedDate === dateStr ? null : dateStr;
      renderCalendar();
      renderList();
      updateDateLabel();
    });

    calGrid.appendChild(div);
  }

  // 下月补位
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    const div = document.createElement('div');
    div.className = 'cal-day other-month';
    div.textContent = d;
    calGrid.appendChild(div);
  }
}

function updateDateLabel() {
  let label = document.querySelector('.selected-date-label');
  if (!label) {
    label = document.createElement('div');
    label.className = 'selected-date-label';
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-date';
    clearBtn.textContent = '✕ 清除筛选';
    clearBtn.addEventListener('click', () => {
      selectedDate = null;
      renderCalendar();
      renderList();
      updateDateLabel();
    });
    label.appendChild(clearBtn);
    taskList.parentNode.insertBefore(label, taskList);
  }
  const textNode = label.childNodes[0];
  if (selectedDate) {
    const d = new Date(selectedDate + 'T00:00:00');
    const str = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    if (textNode && textNode.nodeType === 3) {
      textNode.textContent = `📅 ${str} 的任务  `;
    } else {
      label.insertBefore(document.createTextNode(`📅 ${str} 的任务  `), label.firstChild);
    }
    label.classList.add('show');
  } else {
    label.classList.remove('show');
  }
}

function renderList() {
  taskList.innerHTML = '';
  const todayStr = toDateStr(Date.now());

  const filtered = tasks.map((t, i) => ({ t, i })).filter(({ t }) => {
    if (selectedDate && t.deadline !== selectedDate) return false;
    if (currentFilter === 'all')  return true;
    if (currentFilter === 'done') return t.done;
    return t.priority === currentFilter && !t.done;
  });

  filtered.forEach(({ t: task, i: realIndex }) => {
    const isOverdue = task.deadline && task.deadline < todayStr && !task.done;
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '') + (isOverdue ? ' overdue' : '');
    li.dataset.priority = task.priority;
    li.dataset.index = realIndex;
    li.draggable = true;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.done;
    cb.addEventListener('change', () => {
      task.done = cb.checked;
      task.doneAt = cb.checked ? Date.now() : null;
      save(); renderList(); renderCalendar();
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
    } else if (task.deadline) {
      timeSpan.className = isOverdue ? 'task-time overdue-label' : 'task-time deadline';
      const d = new Date(task.deadline + 'T00:00:00');
      const dl = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      timeSpan.textContent = isOverdue ? '⚠️ 已逾期 · ' + dl : '📅 截止 ' + dl;
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
    editBtn.addEventListener('click', () => startEdit(task, textSpan, editBtn));

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      tasks.splice(realIndex, 1);
      save(); renderList(); renderCalendar();
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
      const adj = dragSrcIndex < newTarget ? newTarget - 1 : newTarget;
      tasks.splice(adj, 0, moved);
      dragSrcIndex = null;
      save(); renderList(); renderCalendar();
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
    renderList();
  };
  editBtn.onclick = finish;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') finish();
    if (e.key === 'Escape') renderList();
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({
    text,
    priority: prioritySelect.value,
    deadline: dateInput.value || null,
    done: false,
    createdAt: Date.now(),
    doneAt: null,
    id: Date.now()
  });
  taskInput.value = '';
  dateInput.value = '';
  save(); renderList(); renderCalendar();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderList();
  });
});

document.getElementById('prevMonth').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

renderCalendar();
renderList();
