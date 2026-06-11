const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyHint = document.getElementById('empty-hint');

function updateEmptyHint() {
  emptyHint.style.display = taskList.children.length === 0 ? 'block' : 'none';
}

function saveTasks() {
  const tasks = Array.from(taskList.querySelectorAll('.task-item')).map(li => ({
    text: li.querySelector('.task-text').textContent,
    done: li.classList.contains('done'),
  }));
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function createTaskElement(text, done = false) {
  const li = document.createElement('li');
  li.className = 'task-item' + (done ? ' done' : '');

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = text;
  span.addEventListener('click', () => {
    li.classList.toggle('done');
    saveTasks();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'Delete task';
  deleteBtn.addEventListener('click', () => {
    li.remove();
    saveTasks();
    updateEmptyHint();
  });

  li.appendChild(span);
  li.appendChild(deleteBtn);
  return li;
}

function addTask() {
  const text = input.value.trim();
  if (!text) return;

  taskList.appendChild(createTaskElement(text));
  saveTasks();

  input.value = '';
  input.focus();
  updateEmptyHint();
}

function loadTasks() {
  const saved = localStorage.getItem('tasks');
  if (!saved) return;
  JSON.parse(saved).forEach(({ text, done }) => {
    taskList.appendChild(createTaskElement(text, done));
  });
}

addBtn.addEventListener('click', addTask);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

loadTasks();
updateEmptyHint();
