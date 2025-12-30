const HABIT_SECTIONS = {
    "🌅 Morning Routine": ["⏰ Wake Up Early", "🚿 Hygiene (Brush/Bath)", "💧 Morning Hydration", "🧘 Stretch / Meditate"],
    "📚 Study / Work": ["📘 Core Subject Focus", "➕ Math Practice", "✍️ Revision / Notes"],
    "🏋️ Fitness & Health": ["🏃 Workout / Walk", "🍗 Protein Intake", "🥗 Eat Fruits & Veggies", "🚰 Drink 3 Litres Water"],
    "🧠 Skill / Self Growth": ["📖 Clean Reading", "💻 Coding / Skills", "♟️ Chess / Brain Games"],
    "🌙 Night Routine": ["📵 No Phone (Early)", "📝 Day Review & Plan", "😴 Sleep on Time"]
};

let DAYS = 31; // Default, will change
const STORAGE_KEY = 'habitTrackerData_v2';

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
});

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

    for (const [sectionTitle, habits] of Object.entries(HABIT_SECTIONS)) {
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
}

function loadData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
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
