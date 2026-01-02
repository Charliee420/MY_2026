const HABIT_SECTIONS = {
    "🌅 Morning Routine": ["⏰ Wake Up Early", "🚿 Hygiene (Brush/Bath)", "💧 Morning Hydration", "🧘 Stretch / Meditate"],
    "📚 Study / Work": ["📘 Core Subject Focus", "➕ Math Practice", "✍️ Revision / Notes"],
    "🏋️ Fitness & Health": ["🏃 Workout / Walk", "🍗 Protein Intake", "🥗 Eat Fruits & Veggies", "🚰 Drink 3 Litres Water"],
    "🧠 Skill / Self Growth": ["📖 Clean Reading", "💻 Coding / Skills", "♟️ Chess / Brain Games"],
    "🌙 Night Routine": ["📵 No Phone (Early)", "📝 Day Review & Plan", "😴 Sleep on Time"]
};

let DAYS = 31; // Default, will change

// Generate month-specific storage key
function getStorageKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
    return `habitTrackerData_${year}_${month}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // 0. Setup Date & Dynamic Days
    DAYS = updateDateInfo();

    // 1. Initial Render
    renderDays();
    renderHabits();

    // 2. Load Data from Storage
    loadData();
    setupInputs();
    setupTheme();
    initChart();
    setupTaskEditor();
});

// Load custom tasks or use defaults
function loadCustomTasks() {
    const saved = localStorage.getItem('customHabitSections');
    if (saved) {
        return JSON.parse(saved);
    }
    return null; // Will use default HABIT_SECTIONS
}

function saveCustomTasks(tasks) {
    localStorage.setItem('customHabitSections', JSON.stringify(tasks));
}

function getCurrentTasks() {
    return loadCustomTasks() || HABIT_SECTIONS;
}

function setupTaskEditor() {
    const editBtn = document.getElementById('edit-tasks-btn');
    editBtn.addEventListener('click', openEditModal);
}

function openEditModal() {
    const modal = document.getElementById('edit-tasks-modal');
    const container = document.getElementById('edit-sections-container');
    container.innerHTML = '';

    const currentTasks = getCurrentTasks();

    for (const [sectionName, tasks] of Object.entries(currentTasks)) {
        const section = document.createElement('div');
        section.className = 'edit-section';
        section.dataset.section = sectionName;

        const title = document.createElement('h4');
        title.textContent = sectionName;
        section.appendChild(title);

        const taskList = document.createElement('ul');
        taskList.className = 'task-list';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <span>${task}</span>
                <button class="delete-btn" onclick="removeTask('${sectionName}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            taskList.appendChild(li);
        });

        section.appendChild(taskList);

        // Add task input
        const addContainer = document.createElement('div');
        addContainer.className = 'add-task-container';
        addContainer.innerHTML = `
            <input type="text" class="add-task-input" placeholder="Add new task..." id="input-${sectionName.replace(/[^a-zA-Z0-9]/g, '')}">
            <button class="add-task-btn" onclick="addTask('${sectionName}')">
                <i class="fas fa-plus"></i> Add
            </button>
        `;
        section.appendChild(addContainer);

        container.appendChild(section);
    }

    modal.classList.remove('hidden');
}

function closeEditModal() {
    const modal = document.getElementById('edit-tasks-modal');
    modal.classList.add('hidden');
}

function addTask(sectionName) {
    const inputId = 'input-' + sectionName.replace(/[^a-zA-Z0-9]/g, '');
    const input = document.getElementById(inputId);
    const taskName = input.value.trim();

    if (!taskName) {
        alert('Please enter a task name');
        return;
    }

    const currentTasks = getCurrentTasks();
    currentTasks[sectionName].push(taskName);
    saveCustomTasks(currentTasks);

    input.value = '';
    openEditModal(); // Refresh the modal
}

function removeTask(sectionName, index) {
    if (!confirm('Remove this task?')) return;

    const currentTasks = getCurrentTasks();
    currentTasks[sectionName].splice(index, 1);
    saveCustomTasks(currentTasks);

    openEditModal(); // Refresh the modal
}

function saveTasksAndClose() {
    closeEditModal();

    // Reload the entire tracker with new tasks
    location.reload();
}

let progressChart = null;

function initChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: DAYS }, (_, i) => i + 1),
            datasets: [{
                label: 'Tasks Completed',
                data: calculateDailyScores(),
                borderColor: isDark ? '#ffffff' : '#1ABC9C',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 188, 156, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: isDark ? '#ffffff' : '#1ABC9C'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#ffffff' : '#2C3E50'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: isDark ? '#ffffff' : '#2C3E50'
                    },
                    grid: {
                        color: isDark ? '#333333' : '#BDC3C7'
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? '#ffffff' : '#2C3E50'
                    },
                    grid: {
                        color: isDark ? '#333333' : '#BDC3C7'
                    }
                }
            }
        }
    });
}

function calculateDailyScores() {
    const scores = new Array(DAYS).fill(0);
    const currentTasks = getCurrentTasks(); // Use custom or default tasks

    // Count checked tasks for each day
    for (let day = 1; day <= DAYS; day++) {
        let dayScore = 0;
        Object.values(currentTasks).flat().forEach(habit => {
            const safeHabitName = habit.replace(/[^a-zA-Z0-9]/g, '');
            const cellId = `${safeHabitName}_${day}`;
            const cell = document.querySelector(`.day-cell[data-id="${cellId}"]`);
            if (cell && cell.classList.contains('checked')) {
                dayScore++;
            }
        });
        scores[day - 1] = dayScore;
    }

    return scores;
}

function updateChart() {
    if (progressChart) {
        progressChart.data.datasets[0].data = calculateDailyScores();

        // Update colors based on theme
        const isDark = document.body.classList.contains('dark-mode');
        progressChart.data.datasets[0].borderColor = isDark ? '#ffffff' : '#1ABC9C';
        progressChart.data.datasets[0].backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 188, 156, 0.1)';
        progressChart.data.datasets[0].pointBackgroundColor = isDark ? '#ffffff' : '#1ABC9C';

        progressChart.options.plugins.legend.labels.color = isDark ? '#ffffff' : '#2C3E50';
        progressChart.options.scales.y.ticks.color = isDark ? '#ffffff' : '#2C3E50';
        progressChart.options.scales.x.ticks.color = isDark ? '#ffffff' : '#2C3E50';
        progressChart.options.scales.y.grid.color = isDark ? '#333333' : '#BDC3C7';
        progressChart.options.scales.x.grid.color = isDark ? '#333333' : '#BDC3C7';

        progressChart.update();
    }
}

function updateDateInfo() {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Update DOM
    document.getElementById('display-month').textContent = `Month: ${monthNames[now.getMonth()]}`;
    document.getElementById('display-today').textContent = `Today: ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // Get actual days in current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return daysInMonth; // Returns 28, 29, 30, or 31
}

// ... existing code ...

function setupTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const icon = toggleBtn.querySelector('i');
    const body = document.body;

    // Check saved theme
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');

        // Update Icon
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }

        updateChart(); // Update chart colors on theme change
    });
}

function renderDays() {
    const headerContainer = document.querySelector('.header-row .days-container');
    headerContainer.innerHTML = '';

    for (let i = 1; i <= DAYS; i++) {
        const d = document.createElement('div');
        d.className = 'day-cell';
        d.textContent = i;
        headerContainer.appendChild(d);
    }
}

function renderHabits() {
    const container = document.getElementById('sections-container');
    container.innerHTML = '';

    const currentTasks = getCurrentTasks(); // Use custom or default tasks

    for (const [sectionTitle, habits] of Object.entries(currentTasks)) {
        // Section Header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.textContent = sectionTitle.toUpperCase();
        container.appendChild(sectionHeader);

        // Habits
        habits.forEach((habit) => {
            const row = document.createElement('div');
            row.className = 'grid-row habit-row';

            // Habit Name Column
            const habitCol = document.createElement('div');
            habitCol.className = 'habit-col';
            habitCol.textContent = habit;
            row.appendChild(habitCol);

            // Days Columns
            const daysContainer = document.createElement('div');
            daysContainer.className = 'days-container';

            for (let i = 1; i <= DAYS; i++) {
                const cell = document.createElement('div');
                cell.className = 'day-cell habit-check';

                // Unique ID for storage
                const safeHabitName = habit.replace(/[^a-zA-Z0-9]/g, '');
                cell.dataset.id = `${safeHabitName}_${i}`;
                cell.dataset.day = i; // Store day number

                // Click Event
                cell.addEventListener('click', toggleCheck);

                daysContainer.appendChild(cell);
            }
            row.appendChild(daysContainer);

            container.appendChild(row);
        });
    }
}

function toggleCheck(e) {
    // Robustly get the cell (handles clicks on text/pseudo elements)
    const cell = e.target.closest('.day-cell');
    if (!cell) return;

    const day = parseInt(cell.dataset.day);
    const today = new Date().getDate();

    // Strict Mode: Only allow editing "today"
    if (day !== today) {
        const modal = document.getElementById('warning-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            alert("Nice try diddy! (Modal missing, but: You can only edit today!)");
        }
        return;
    }

    // Toggle class
    cell.classList.toggle('checked');

    // Save state
    saveData();
}

function closeModal() {
    const modal = document.getElementById('warning-modal');
    modal.classList.add('hidden');
}

function saveData() {
    const checkedCells = document.querySelectorAll('.day-cell.checked');
    const checkedIds = Array.from(checkedCells).map(cell => cell.dataset.id);

    localStorage.setItem(getStorageKey(), JSON.stringify(checkedIds));
    updateChart(); // Update chart when data changes
}

function loadData() {
    const storedData = localStorage.getItem(getStorageKey());
    if (storedData) {
        const checkedIds = JSON.parse(storedData);

        checkedIds.forEach(id => {
            const cell = document.querySelector(`.day-cell[data-id="${id}"]`);
            if (cell) {
                cell.classList.add('checked');
            }
        });
    }
}

function setupInputs() {
    const inputs = ['inp-name', 'txt-motivation', 'txt-win', 'txt-improve'];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Load saved
        const saved = localStorage.getItem(id);
        if (saved) el.value = saved;

        // Save on change
        el.addEventListener('input', () => {
            localStorage.setItem(id, el.value);
        });
    });
}
