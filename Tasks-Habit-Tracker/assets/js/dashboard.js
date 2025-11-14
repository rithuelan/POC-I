// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
let isDark = false;

themeToggle.addEventListener("click", (event) => {
  console.log('event',event);
  
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);

  themeIcon.src = isDark
    ? "./assets/images/light.svg"
    : "./assets/images/dark.svg";

  updateChartTheme();
});

// ===== GET DATA FROM DASHBOARD CARDS =====
function getDashboardData() {
  const completed = parseInt(document.querySelector('.card:nth-child(1) h1').textContent || 0);
  const overdue = parseInt(document.querySelector('.card:nth-child(2) h1').textContent || 0);
  const active = parseInt(document.querySelector('.card:nth-child(3) h1').textContent || 0);
  const streak = parseInt(document.querySelector('.card:nth-child(4) h1').textContent || 0);
  return { completed, overdue, active, streak };
}

// ===== STATUS OVERVIEW CHART =====
const ctx1 = document.getElementById("statusChart").getContext("2d");
const { completed } = getDashboardData();

let statusChart = new Chart(ctx1, {
  type: "doughnut",
  data: {
    labels: ["To-Do - 0", "On Hold - 0", "In Progress - 0", `Completed - ${completed}`],
    datasets: [{
      data: [0, 0, 0, completed],
      backgroundColor: ["#999999", "#fba731ff", "#007bff", "#2ac069ff"],
      borderWidth: 4,
      borderColor: "#fff",
      hoverOffset: 6,
    }],
  },
  options: {
    aspectRatio: 1.2,
    cutout: "70%",
    rotation: -90,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#333",
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          padding: 20,
          family: "Open Sans",
          font: { 
            size: 13 },
        },
      },
      tooltip: {
        backgroundColor: "#111",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 8,
      },
    },
  },
});

// ===== HABIT COMPLETION TREND CHART =====
// ===== HABIT COMPLETION TREND CHART =====
const ctx2 = document.getElementById("habitChart").getContext("2d");
let habitChart = new Chart(ctx2, {
  type: "line",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Habits Completed",
      data: [1, 1, 1, 1, 1, 1, 1],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.12)",
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 5,
      pointBackgroundColor: "#3b82f6",
      pointBorderColor: "#fff",
      tension: 0.15,
      family: "Open Sans",
      fill: true,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 10, // 🟢 Adds breathing space below X labels
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 7,
        ticks: {
          stepSize: 1,
          color: "#555",
          font: {
            family: "Open Sans",
            weight: "500",
          },
        },
        title: {
          display: true,
          text: "Total Habits",
          font: { family: "Open Sans", size: 13, weight: "400" },
          color: isDark ? "#e5e5e5" : "gray",
          rotation: 270,
          align: "center",
          letterSpacing: 2,
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
          drawBorder: false,
        },
        border: {
          color: "#000",
          width: 1,
        },
      },
      x: {
        ticks: {
          color: "#333", // 🟢 Darker, clearer
          font: {
            family: "Open Sans",
            weight: "400", // 🟢 Slightly bold
            size: 13,
          },
          padding: 6, // 🟢 Adds space for neatness
        },
        grid: {
          display: false,
        },
        border: {
          color: "#000",
          width: 1,
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  },
});


// ===== UPDATE CHART COLORS ON THEME CHANGE =====
function updateChartTheme() {
  const textColor = isDark ? "#f5f5f5" : "#333";
  const gridColor = isDark ? "#444" : "rgba(0,0,0,0.05)";
  const borderColor = isDark ? "#2b2b2b" : "#fff";

  statusChart.options.plugins.legend.labels.color = textColor;
  statusChart.data.datasets[0].borderColor = borderColor;
  statusChart.update();

  habitChart.options.scales.x.ticks.color = textColor;
  habitChart.options.scales.y.ticks.color = textColor;
  habitChart.options.scales.y.grid.color = gridColor;
  habitChart.update();
}

// ====== READ TASKS FROM LOCAL STORAGE ======
function readTasksFromLocalStorage() {
  try {
    const raw = localStorage.getItem("tasks");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed reading tasks from localStorage:", e);
    return [];
  }
}

// ====== READ HABITS FROM LOCAL STORAGE ======
function readHabitsFromLocalStorage() {
  try {
    const raw = localStorage.getItem("habits");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed reading habits from localStorage:", e);
    return [];
  }
}

// ====== COMPUTE COUNTS ======
function computeStatusCounts(tasks) {
  const counts = { todo: 0, "in progress": 0, "on hold": 0, completed: 0, overdue: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach(t => {
    const s = (t.status || "Todo").toLowerCase();
    const due = t.date ? new Date(t.date) : null;

    if (s === "completed") counts.completed++;
    else if (s === "in progress") counts["in progress"]++;
    else if (s === "on hold") counts["on hold"]++;
    else counts.todo++;

    if (due && due < today && s !== "completed") counts.overdue++;
  });

  return counts;
}

// ====== UPDATE DASHBOARD CARDS ======
function updateDashboardCards(counts) {
  const completedCard = document.querySelector('.card:nth-child(1) h1');
  const overdueCard = document.querySelector('.card:nth-child(2) h1');
  const activeCard = document.querySelector('.card:nth-child(3) h1');
  const streakCard = document.querySelector('.card:nth-child(4) h1');

  const habits = readHabitsFromLocalStorage();
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const activeHabits = habits.length;

  if (completedCard) completedCard.textContent = counts.completed;
  if (overdueCard) overdueCard.textContent = counts.overdue;
  if (activeCard) activeCard.textContent = activeHabits;
  if (streakCard) streakCard.textContent = longestStreak;
}

// ====== UPDATE STATUS CHART ======
function updateStatusChart(counts) {
  if (!statusChart) return;

  const labels = [
    `To-Do - ${counts.todo}`,
    `On Hold - ${counts["on hold"]}`,
    `In Progress - ${counts["in progress"]}`,
    `Completed - ${counts.completed}`
  ];
  const data = [counts.todo, counts["on hold"], counts["in progress"], counts.completed];

  statusChart.data.labels = labels;
  statusChart.data.datasets[0].data = data;
  statusChart.update();
}

// ====== UPDATE HABIT CHART FROM HABIT DATA ======
function updateHabitChartFromHabits() {
  const habits = readHabitsFromLocalStorage();
  if (!habitChart || !habits.length) return;

  const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

  habits.forEach(habit => {
    habit.dates?.forEach(d => {
      if (d.completed) {
        const dayName = new Date(d.iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
        if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
      }
    });
  });

  const labels = Object.keys(dayCounts);
  const data = Object.values(dayCounts);

  habitChart.data.labels = labels;
  habitChart.data.datasets[0].data = data;
  habitChart.update();
}

// ====== REFRESH DASHBOARD STATS ======
function refreshStatusOverview() {
  const tasks = readTasksFromLocalStorage();
  const counts = computeStatusCounts(tasks);
  updateDashboardCards(counts);
  updateStatusChart(counts);
  updateHabitChartFromHabits();
}

// ====== INITIAL LOAD ======
refreshStatusOverview();

// ====== AUTO REFRESH DAILY (for overdue updates) ======
setInterval(refreshStatusOverview, 60 * 60 * 1000);

// ====== SYNC FROM TASK OR HABIT PAGE ======
window.addEventListener("tasksUpdated", refreshStatusOverview);
window.addEventListener("habitsUpdated", refreshStatusOverview);
window.addEventListener("storage", e => {
  if (e.key === "tasks" || e.key === "habits") refreshStatusOverview();
});
