
const user_id = localStorage.getItem("user_id");

// ======================
// LOGIN CHECK
// ======================

const currentPage = window.location.pathname;

if (
    !user_id &&
    !currentPage.includes("login.html") &&
    !currentPage.includes("register.html") &&
    !currentPage.includes("index.html")
) {
    window.location.href = "login.html";
}

// ======================
// STATE
// ======================

const state = {
    courses: [],
    exams: [],
    tasks: [],
    streak: Number(localStorage.getItem("streak")) || 0,
    completedTasks: Number(localStorage.getItem("completedTasks")) || 0
};

// ======================
// TOAST
// ======================

function showToast(message, color) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = message;
    toast.style.background =
        color ||
        "linear-gradient(135deg,rgba(0,229,160,0.92),rgba(0,168,255,0.92))";

    toast.style.opacity = 1;

    setTimeout(() => {
        toast.style.opacity = 0;
    }, 3000);
}

// ======================
// LOAD DATA FROM MYSQL BACKEND
// ======================

async function loadCounts() {
    if (!user_id) return;

    try {
        const [coursesRes, examsRes, tasksRes] = await Promise.all([
            fetch(`/courses/${user_id}`),
            fetch(`/exams/${user_id}`),
            fetch(`/tasks/${user_id}`)
        ]);

        const courses = await coursesRes.json();
        const exams = await examsRes.json();
        const tasks = await tasksRes.json();

        state.courses = courses || [];
        state.exams = exams || [];
        state.tasks = tasks || [];

        renderDashboard();
        updateCounters();
        applyRewards();

    } catch (err) {
        console.log("LOAD ERROR:", err);
    }
}

// ======================
// COUNTERS
// ======================

function updateCounters() {
    const c = document.getElementById("classesCount");
    const e = document.getElementById("examsCount");
    const t = document.getElementById("tasksCount");

    if (c) c.textContent = state.courses.length;
    if (e) e.textContent = state.exams.length;
    if (t) t.textContent = state.tasks.length;
}

// ======================
// DASHBOARD RENDER
// ======================

function renderDashboard() {
    const dashboard = document.getElementById("dashboardContent");
    if (!dashboard) return;

    const { courses, exams, tasks, streak, completedTasks } = state;

    let output = "";

    if (!courses.length && !exams.length && !tasks.length) {
        dashboard.innerHTML = `
        <div style="text-align:center;padding:30px;">
            <h2>🎉 All Done!</h2>
        </div>`;
        return;
    }

    // ======================
    // STREAK CARD
    // ======================

    let msg = "Start your journey 🚀";
    if (streak >= 10) msg = "Legendary 👑";
    else if (streak >= 5) msg = "On fire 🔥";
    else if (streak > 0) msg = "Keep going 💪";

    output += `
    <div class="plan-card" style="text-align:center;padding:20px;">
        <div style="font-size:50px;">🔥 ${streak}</div>
        <div>${msg}</div>
    </div>`;

    // ======================
    // PROGRESS
    // ======================

    const total = courses.length + exams.length + tasks.length + completedTasks;
    const progress = total ? Math.min((completedTasks / total) * 100, 100) : 0;

    output += `
    <div class="plan-card">
        <div>📊 Progress</div>
        <div style="width:100%;height:12px;background:#222;border-radius:10px;">
            <div style="width:${progress}%;height:100%;background:green;"></div>
        </div>
        <div>${progress.toFixed(0)}%</div>
    </div>`;

    // ======================
    // COURSES
    // ======================

    if (courses.length) {
        output += `<h3>📚 Courses</h3>`;

        courses.forEach(c => {
            output += `
            <div class="plan-card" data-id="${c.id}" data-type="course">
                <h3>${c.course_name}</h3>
                <button onclick="completeTask(this)">Complete</button>
            </div>`;
        });
    }

    // ======================
    // EXAMS
    // ======================

    if (exams.length) {
        output += `<h3>📝 Exams</h3>`;

        exams.forEach(e => {
            output += `
            <div class="plan-card" data-id="${e.id}" data-type="exam">
                <h3>${e.subject}</h3>
                <button onclick="completeTask(this)">Complete</button>
            </div>`;
        });
    }

    // ======================
    // TASKS
    // ======================

    if (tasks.length) {
        output += `<h3>✅ Tasks</h3>`;

        tasks.forEach(t => {
            output += `
            <div class="plan-card" data-id="${t.id}" data-type="task">
                <h3>${t.task_name}</h3>
                <button onclick="completeTask(this)">Complete</button>
            </div>`;
        });
    }

    dashboard.innerHTML = output;
}

// ======================
// COMPLETE TASK (FIXED FOR YOUR BACKEND)
// ======================

async function completeTask(button) {
    const card = button.closest(".plan-card");
    const itemId = card?.dataset?.id;
    const type = card?.dataset?.type;

    if (!itemId || !type) {
        showToast("Missing data ❌", "#ff3cac");
        return;
    }

    button.disabled = true;

    try {
        // ======================
        // MATCH YOUR EXPRESS ROUTES
        // ======================

        const map = {
            task: "delete-task",
            course: "delete-course",
            exam: "delete-exam"
        };

        const endpoint = map[type];

        const res = await fetch(`/${endpoint}/${itemId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const err = await res.text();
            console.log("SERVER ERROR:", err);
            throw new Error("Delete failed");
        }

        // ======================
        // UPDATE STATE
        // ======================

        if (type === "course") {
            state.courses = state.courses.filter(x => String(x.id) !== String(itemId));
        }

        if (type === "exam") {
            state.exams = state.exams.filter(x => String(x.id) !== String(itemId));
        }

        if (type === "task") {
            state.tasks = state.tasks.filter(x => String(x.id) !== String(itemId));
        }

        // ======================
        // STREAK UPDATE
        // ======================

        const prev = state.streak;

        state.completedTasks++;
        state.streak++;

        localStorage.setItem("streak", state.streak);
        localStorage.setItem("completedTasks", state.completedTasks);

        applyRewards();

        // ======================
        // UI REMOVE
        // ======================

        card.style.opacity = "0";

        setTimeout(() => {
            card.remove();
            renderDashboard();
            updateCounters();
        }, 300);

        showToast(
            getNewRewardMessage(prev, state.streak) || "🎉 Completed!",
            "#00e5a0"
        );

    } catch (err) {
        console.log("ERROR:", err);

        button.disabled = false;
        button.textContent = "Try Again";

        showToast("❌ Server Error", "#ff3cac");
    }
}

// ======================
// REWARDS
// ======================

function getNewRewardMessage(prev, cur) {
    if (prev < 1 && cur >= 1) return "✨ Started!";
    if (prev < 3 && cur >= 3) return "🎨 Theme unlocked!";
    if (prev < 5 && cur >= 5) return "🏆 Badge unlocked!";
    if (prev < 10 && cur >= 10) return "👑 Pro mode!";
    if (prev < 15 && cur >= 15) return "🚀 Rocket!";
    if (prev < 20 && cur >= 20) return "🌟 Galaxy!";
    return null;
}

// ======================
// APPLY THEME
// ======================

function applyRewards() {
    const s = state.streak;
    const root = document.documentElement;

    if (s >= 10) {
        root.style.setProperty("--pink", "#ffcc00");
        root.style.setProperty("--blue", "#ff8800");
    } else {
        root.style.setProperty("--pink", "#ff3cac");
        root.style.setProperty("--blue", "#2b86c5");
    }
}
async function registerUser() {

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value;

    if (!name || !email || !password || !phone) {
        alert("Please fill all fields");
        return;
    }

    try {

        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password,
                phone
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registered Successfully ✅");
            window.location.href = "login.html";
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.log(error);
        alert("Server Error ❌");
    }
}
async function addCourse() {

    const user_id = localStorage.getItem("user_id");
    const course_name = document.getElementById("courseName").value;
    const difficulty = document.getElementById("difficulty").value;

    if (!course_name || !difficulty) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch("http://localhost:5000/add-course", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id,
            course_name,
            difficulty
        })
    });

    const data = await res.json();
    alert(data.message);
}
async function addExam() {

    const user_id = localStorage.getItem("user_id");
    const subject = document.getElementById("subject").value;
    const exam_date = document.getElementById("examDate").value;

    if (!subject || !exam_date) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch("http://localhost:5000/add-exam", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id,
            subject,
            exam_date
        })
    });

    const data = await res.json();
    alert(data.message);
}
async function addTask() {

    const user_id = localStorage.getItem("user_id");
    const task_name = document.getElementById("taskName").value;
    const task_date = document.getElementById("taskDate").value;

    if (!task_name || !task_date) {
        alert("Fill all fields");
        return;
    }

    const res = await fetch("http://localhost:5000/add-task", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id,
            task_name,
            task_date
        })
    });

    const data = await res.json();
    alert(data.message);
}
async function generatePlan() {

    const user_id = localStorage.getItem("user_id");

    const res = await fetch("http://localhost:5000/generate-plan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id })
    });

    const data = await res.json();
    alert(data.message);
}
async function showPlans() {

    const user_id = localStorage.getItem("user_id");

    const res = await fetch(`http://localhost:5000/plans/${user_id}`);
    const data = await res.json();

    const box = document.getElementById("plansBox");
    box.innerHTML = "";

    data.forEach(plan => {

        box.innerHTML += `
        <div class="plan-table-row">
            <div class="subject">${plan.subject}</div>
            <div class="hours">${plan.study_hours}h</div>
            <div class="date">${plan.study_date}</div>
        </div>
        `;
    });
}
async function registerUser() {

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value;

    if (!name || !email || !password || !phone) {
        alert("Please fill all fields");
        return;
    }

    try {

        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password,
                phone
            })
        });

        const data = await response.json();

        if (response.ok) {

            alert("Account created successfully 🎉");

            // مهم جدًا: امسح أي user قديم
            localStorage.clear();

            // روح للـ login
            window.location.href = "login.html";

        } else {
            alert(data.message || "Register failed");
        }

    } catch (err) {
        console.log(err);
        alert("Server Error ❌");
    }
}