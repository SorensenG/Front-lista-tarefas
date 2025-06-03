const API_URL = 'http://localhost:3333';

let authToken = null;

// DOM Elements
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const modalTitle = document.getElementById('modal-title');
const switchMode = document.getElementById('switch-mode');
const nameGroup = document.getElementById('name-group');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name');
const authSubmit = document.getElementById('auth-submit');
const btnText = authSubmit.querySelector('.btn-text');
const btnLoader = authSubmit.querySelector('.btn-loader');
const appHeader = document.getElementById('app-header');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const mainContent = document.getElementById('main-content');
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const tasksContainer = document.getElementById('tasks-container');
const emptyState = document.getElementById('empty-state');

let isLoginMode = true;

// Utilities
function showToast(message, type = 'info') {
  alert(`${type.toUpperCase()}: ${message}`);
}

// Authentication
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  const name = nameInput.value;

  try {
    authSubmit.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const body = isLoginMode ? { email, password } : { name, email, password };

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Erro de autenticação');

    authToken = data.token;
    localStorage.setItem('token', authToken);
    userEmail.textContent = email;

    authModal.classList.remove('active');
    appHeader.classList.remove('hidden');
    mainContent.classList.remove('hidden');

    loadTasks();

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    authSubmit.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
});

switchMode.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  modalTitle.textContent = isLoginMode ? 'Login' : 'Registrar';
  authSubmit.querySelector('.btn-text').textContent = isLoginMode ? 'Entrar' : 'Registrar';
  nameGroup.classList.toggle('hidden', isLoginMode);
});

// Logout
logoutBtn.addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('token');
  appHeader.classList.add('hidden');
  mainContent.classList.add('hidden');
  authModal.classList.add('active');
});

// Tasks
// Substitua a função loadTasks:
async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await response.json();
    const tasks = data.tasks || data;
    renderTasks(tasks);
  } catch (error) {
    showToast('Erro ao carregar tarefas', 'error');
  }
}
async function deleteTask(taskId) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
  try {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    loadTasks();
    showToast('Tarefa excluída com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao excluir tarefa', 'error');
  }
}
async function editTask(taskId) {
  const newTitle = prompt('Digite o novo título da tarefa:');
  const newDescription = prompt('Digite a nova descrição da tarefa:');
  const newStatus = prompt('Digite o novo status (pending/completed):');

  if (!newTitle) {
    showToast('Título não pode estar vazio', 'error');
    return;
  }

  try {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription,
        status: newStatus || 'pending'
      })
    });
    loadTasks();
    showToast('Tarefa atualizada com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao atualizar tarefa', 'error');
  }
}

function renderTasks(tasks) {
  tasksContainer.innerHTML = '';

  // Ordena as tarefas mais recentes no topo
  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!tasks.length) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description || ''}</p>
      <p>Status: ${task.status}</p>
      <button class="task-btn edit-btn" data-id="${task.id}">✏️ Editar</button>
      <button class="task-btn delete-btn" data-id="${task.id}">🗑️ Excluir</button>
    `;
    tasksContainer.appendChild(div);
  });

  // Adicionando eventos aos botões
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = e.target.dataset.id;
      editTask(taskId);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = e.target.dataset.id;
      deleteTask(taskId);
    });
  });
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitle.value;
  const description = taskDescription.value;
  const status = document.getElementById('task-status').value;

  try {
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        description,
        status,
        createdAt: new Date().toISOString()
      })
    });
    taskForm.reset();
    loadTasks();
  } catch (err) {
    showToast('Erro ao criar tarefa', 'error');
  }
});


// Auto-login if token exists
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    authToken = token;
    authModal.classList.remove('active');
    appHeader.classList.remove('hidden');
    mainContent.classList.remove('hidden');
    loadTasks();
  }
});




//modal editar tarefa


