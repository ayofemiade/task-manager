// Task Management
let tasks = {
    todo: [],
    inProgress: [],
    done: []
};

let badges = [];
let completedTasksCount = 0;

// DOM Elements
const taskForm = document.getElementById('taskForm');
const todoList = document.getElementById('todoList');
const inProgressList = document.getElementById('inProgressList');
const doneList = document.getElementById('doneList');
const themeToggle = document.getElementById('themeToggle');
const toastContainer = document.getElementById('toastContainer');
const searchInput = document.getElementById('searchInput');
const filterPriority = document.getElementById('filterPriority');
const filterDueDate = document.getElementById('filterDueDate');
const sortBy = document.getElementById('sortBy');
const sortOrder = document.getElementById('sortOrder');
const badgesModal = document.getElementById('badgesModal');
const badgesContainer = document.getElementById('badgesContainer');

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Filter and sort tasks
function filterAndSortTasks(tasksList) {
    let filteredTasks = [...tasksList];

    // Search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );
    }

    // Priority filter
    if (filterPriority.value !== 'all') {
        filteredTasks = filteredTasks.filter(task =>
            task.priority === filterPriority.value
        );
    }

    // Due date filter
    if (filterDueDate.value !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch(filterDueDate.value) {
            case 'today':
                filteredTasks = filteredTasks.filter(task =>
                    new Date(task.dueDate).toDateString() === today.toDateString()
                );
                break;
            case 'week':
                const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                filteredTasks = filteredTasks.filter(task => {
                    const taskDate = new Date(task.dueDate);
                    return taskDate >= today && taskDate <= weekFromNow;
                });
                break;
            case 'month':
                const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                filteredTasks = filteredTasks.filter(task => {
                    const taskDate = new Date(task.dueDate);
                    return taskDate >= today && taskDate <= monthFromNow;
                });
                break;
        }
    }

    // Sorting
    filteredTasks.sort((a, b) => {
        let comparison = 0;
        switch(sortBy.value) {
            case 'dueDate':
                comparison = new Date(a.dueDate) - new Date(b.dueDate);
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
        }
        return sortOrder.value === 'desc' ? -comparison : comparison;
    });

    return filteredTasks;
}

// Create Task Element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item priority-${task.priority}`;
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;

    let attachmentHtml = '';
    if (task.attachment) {
        attachmentHtml = `
            <div class="task-attachment">
                <i class="fas fa-paperclip"></i>
                <span>${task.attachment}</span>
            </div>
        `;
    }

    let recurrenceHtml = '';
    if (task.recurrence && task.recurrence !== 'none') {
        recurrenceHtml = `<p><i class="fas fa-sync"></i> Repeats ${task.recurrence}</p>`;
    }

    taskElement.innerHTML = `
        <h3><i class="fas fa-tasks"></i> ${task.title}</h3>
        <p><i class="fas fa-align-left"></i> ${task.description}</p>
        <p><i class="fas fa-calendar-alt"></i> Due: ${task.dueDate}</p>
        <p><i class="fas fa-flag"></i> Priority: ${task.priority}</p>
        ${recurrenceHtml}
        ${attachmentHtml}
        <div class="task-actions">
            <button onclick="editTask('${task.id}')" aria-label="Edit task"><i class="fas fa-edit"></i></button>
            <button onclick="deleteTask('${task.id}')" aria-label="Delete task"><i class="fas fa-trash"></i></button>
        </div>
    `;

    taskElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        taskElement.classList.add('dragging');
    });

    taskElement.addEventListener('dragend', () => {
        taskElement.classList.remove('dragging');
    });

    return taskElement;
}

// Update Task Lists
function updateTaskLists() {
    [
        { element: todoList, tasks: filterAndSortTasks(tasks.todo) },
        { element: inProgressList, tasks: filterAndSortTasks(tasks.inProgress) },
        { element: doneList, tasks: filterAndSortTasks(tasks.done) }
    ].forEach(({ element, tasks }) => {
        const header = element.querySelector('h2');
        element.innerHTML = '';
        element.appendChild(header);
        tasks.forEach(task => {
            element.appendChild(createTaskElement(task));
        });
    });

    saveTasks();
    updateBadgeDisplay();
}

// Add Task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const recurrence = document.getElementById('taskRecurrence').value;
    const attachment = document.getElementById('taskAttachment').files[0];

    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }

    const task = {
        id: Date.now().toString(),
        title,
        description,
        dueDate,
        priority,
        recurrence,
        attachment: attachment ? attachment.name : null,
        createdAt: new Date().toISOString()
    };

    tasks.todo.push(task);
    updateTaskLists();
    showToast('Task added successfully!', 'success');
    taskForm.reset();
});

// Delete Task
function deleteTask(taskId) {
    ['todo', 'inProgress', 'done'].forEach(status => {
        tasks[status] = tasks[status].filter(task => task.id !== taskId);
    });
    updateTaskLists();
    showToast('Task deleted successfully!');
}

// Edit Task
function editTask(taskId) {
    const task = [...tasks.todo, ...tasks.inProgress, ...tasks.done]
        .find(task => task.id === taskId);

    if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskDueDate').value = task.dueDate;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskRecurrence').value = task.recurrence;

        const submitButton = taskForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Update Task';
        submitButton.dataset.editTaskId = taskId;

        taskForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Event listeners for drag and drop
[todoList, inProgressList, doneList].forEach(list => {
    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            list.appendChild(draggable);
        } else {
            list.insertBefore(draggable, afterElement);
        }
    });

    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const task = [...tasks.todo, ...tasks.inProgress, ...tasks.done]
            .find(task => task.id === taskId);

        if (task) {
            // Remove from current list
            ['todo', 'inProgress', 'done'].forEach(status => {
                tasks[status] = tasks[status].filter(t => t.id !== taskId);
            });

            // Add to new list
            if (list === todoList) tasks.todo.push(task);
            else if (list === inProgressList) tasks.inProgress.push(task);
            else if (list === doneList) {
                task.completedDate = new Date().toISOString();
                tasks.done.push(task);
                completedTasksCount++;
                checkBadges(task);
            }

            updateTaskLists();
            showToast('Task moved successfully!');
        }
    });
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Event listeners for filters and sorting
const debouncedUpdateTaskLists = debounce(updateTaskLists, 300);

searchInput.addEventListener('input', debouncedUpdateTaskLists);
filterPriority.addEventListener('change', debouncedUpdateTaskLists);
filterDueDate.addEventListener('change', debouncedUpdateTaskLists);
sortBy.addEventListener('change', debouncedUpdateTaskLists);
sortOrder.addEventListener('change', debouncedUpdateTaskLists);

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Badge system
function initializeBadges() {
    badges = [
        { id: 'first-task', title: 'First Steps', description: 'Complete your first task', icon: 'fa-star', earned: false },
        { id: 'productive-day', title: 'Productive Day', description: 'Complete 5 tasks in a day', icon: 'fa-sun', earned: false },
        { id: 'task-master', title: 'Task Master', description: 'Complete 20 tasks total', icon: 'fa-crown', earned: false },
        { id: 'priority-manager', title: 'Priority Manager', description: 'Complete 5 high-priority tasks', icon: 'fa-exclamation', earned: false },
        { id: 'consistency-champion', title: 'Consistency Champion', description: 'Complete tasks for 7 consecutive days', icon: 'fa-calendar-check', earned: false }
    ];
    updateBadgeDisplay();
}

function checkBadges(completedTask) {
    const today = new Date().toDateString();
    const dailyTaskCount = tasks.done.filter(task => 
        new Date(task.completedDate).toDateString() === today
    ).length;

    const highPriorityCount = tasks.done.filter(task => task.priority === 'high').length;

    if (completedTasksCount === 1) earnBadge('first-task');
    if (dailyTaskCount >= 5) earnBadge('productive-day');
    if (completedTasksCount >= 20) earnBadge('task-master');
    if (highPriorityCount >= 5) earnBadge('priority-manager');

    const consecutiveDays = getConsecutiveDays();
    if (consecutiveDays >= 7) earnBadge('consistency-champion');
}

function getConsecutiveDays() {
    const completedDates = tasks.done
        .map(task => new Date(task.completedDate).toDateString())
        .sort((a, b) => new Date(b) - new Date(a));

    let consecutiveDays = 1;
    let currentDate = new Date(completedDates[0]);

    for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);

        if (completedDates[i] === prevDate.toDateString()) {
            consecutiveDays++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return consecutiveDays;
}

function earnBadge(badgeId) {
    const badge = badges.find(b => b.id === badgeId);
    if (badge && !badge.earned) {
        badge.earned = true;
        showToast(`🎉 New Badge Earned: ${badge.title}!`, 'success');
        updateBadgeDisplay();
    }
}

function updateBadgeDisplay() {
    const badgeCount = badges.filter(b => b.earned).length;
    document.getElementById('badgeCount').textContent = badgeCount;
}

function showBadgesModal() {
    badgesContainer.innerHTML = '';

    badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge-item ${badge.earned ? 'earned' : 'locked'}`;
        badgeElement.innerHTML = `
            <div class="badge-icon">
                <i class="fas ${badge.icon} ${badge.earned ? 'earned' : 'locked'}"></i>
            </div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-description">${badge.description}</div>
        `;
        badgesContainer.appendChild(badgeElement);
    });

    badgesModal.style.display = 'block';
}

// Local Storage functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('badges', JSON.stringify(badges));
    localStorage.setItem('completedTasksCount', completedTasksCount);
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    const savedBadges = localStorage.getItem('badges');
    const savedCompletedTasksCount = localStorage.getItem('completedTasksCount');

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    if (savedBadges) {
        badges = JSON.parse(savedBadges);
    }
    if (savedCompletedTasksCount) {
        completedTasksCount = parseInt(savedCompletedTasksCount, 10);
    }

    updateTaskLists();
    updateBadgeDisplay();
}

// Keyboard navigation for accessibility
function enableKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && badgesModal.style.display === 'block') {
            badgesModal.style.display = 'none';
        }
    });

    const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                el.click();
            }
        });
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeBadges();
    loadTasks();
    enableKeyboardNavigation();

    // Add badge count click handler
    document.querySelector('.badge-count').addEventListener('click', showBadgesModal);

    // Add close modal handler
    document.querySelector('.close-modal').addEventListener('click', () => {
        badgesModal.style.display = 'none';
    });

    // Load dark mode preference
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === badgesModal) {
        badgesModal.style.display = 'none';
    }
};

// Update completed tasks count
document.getElementById('completedCount').textContent = completedTasksCount;

// Initial update of task lists
updateTaskLists();