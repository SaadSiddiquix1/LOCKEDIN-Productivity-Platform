/* ===============================
   SECTION NAVIGATION
================================ */

// Request notification permission on load just in case
if ("Notification" in window && Notification.permission === "default") {
  // We can request quietly or wait for user interaction. 
  // Good practice usually waits for interaction, handled in startPomodoro.
}

function showSection(id, btn) {
  // Remove active from all sections and nav buttons
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.remove("active");
  });

  // Add active to clicked button
  if (btn) {
    btn.classList.add("active");
  }

  // Show and animate in new section
  const newSection = document.getElementById(id);
  if (newSection) {
    newSection.classList.add("active");
    // Scroll to top of main content
    document.querySelector(".main").scrollTop = 0;
  }
}

/* ===============================
   ANALYZER LOGIC
================================ */

function calculateEligibility() {
  const lab = Number(document.getElementById("lab").value) || 0;
  const ia = Number(document.getElementById("ia").value) || 0;
  const end = Number(document.getElementById("end").value) || 0;

  const total = lab + ia + end;
  const percentage = (total / 125) * 100;

  // Animate input cards
  const inputCards = document.querySelectorAll(".input-card");
  inputCards.forEach((card, index) => {
    card.style.animation = "none";
    setTimeout(() => {
      card.style.animation = `pulse 0.5s ease-out ${index * 0.1}s`;
    }, 10);
  });

  // Update result cards with staggered animation
  const resultCards = document.querySelectorAll(".result-card");
  resultCards.forEach((card, index) => {
    card.style.animation = "none";
    setTimeout(() => {
      card.style.animation = `fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s both`;
    }, 10);
  });

  // Update values with number animation
  animateValue("total", 0, total, 800, " / 125");
  animateValue("percentage", 0, percentage, 1500, "%");

  // Determine status with color coding
  let statusText = "";
  let statusColor = "";

  if (percentage >= 80) {
    statusText = "O Grade (10 GP)";
    statusColor = "#10b981"; // success green
  } else if (percentage >= 70 && percentage <= 80) {
    statusText = "A+ Grade (9 GP)";
    statusColor = "#3b82f6"; // primary blue
  } else {
    statusText = "Not upto mark.";
    statusColor = "#ef4444"; // danger red
  }

  const statusElement = document.getElementById("status");
  statusElement.innerText = statusText;
  statusElement.style.color = statusColor;
  statusElement.style.transition = "color 0.5s ease";

  // Animate progress bar
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const progressContainer = document.querySelector(".progress-container");

  // Reset progress bar
  progressFill.style.width = "0%";
  progressText.innerText = "0%";
  progressContainer.style.animation = "fadeInUp 0.6s ease-out";

  // Animate progress bar fill
  setTimeout(() => {
    const targetWidth = Math.min(percentage, 100);
    progressFill.style.width = `${targetWidth}%`;

    // Update progress bar color based on percentage
    if (percentage >= 80) {
      progressFill.style.background = "linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)";
    } else if (percentage >= 70) {
      progressFill.style.background = "linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)";
    } else {
      progressFill.style.background = "linear-gradient(90deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)";
    }

    // Animate progress text
    animateValue("progressText", 0, percentage, 1500, "%");
  }, 100);
}

// Helper function to animate number values
function animateValue(elementId, start, end, duration, suffix = "") {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startTime = performance.now();
  const isPercentage = suffix === "%";

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeOutCubic;

    if (isPercentage) {
      element.innerText = `${current.toFixed(2)}%`;
    } else {
      element.innerText = `${Math.round(current)}${suffix}`;
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      if (isPercentage) {
        element.innerText = `${end.toFixed(2)}%`;
      } else {
        element.innerText = `${Math.round(end)}${suffix}`;
      }
    }
  }

  requestAnimationFrame(update);
}

/* ===============================
   STUDY PLANNER (WITH DATE + SAVE)
================================ */

const taskInput = document.getElementById("taskInput");
const dateInput = document.getElementById("dateInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("eligix_tasks")) || [];

function saveTasks() {
  localStorage.setItem("eligix_tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.style.animationDelay = `${index * 0.05}s`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    const text = document.createElement("span");
    text.innerText = task.text;

    const date = document.createElement("span");
    date.className = "task-date";
    date.innerText = task.date || "—";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "×";
    deleteBtn.style.cssText = `
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.2s ease;
    `;

    deleteBtn.addEventListener("mouseenter", () => {
      deleteBtn.style.background = "rgba(239, 68, 68, 0.3)";
      deleteBtn.style.transform = "scale(1.1)";
    });

    deleteBtn.addEventListener("mouseleave", () => {
      deleteBtn.style.background = "rgba(239, 68, 68, 0.2)";
      deleteBtn.style.transform = "scale(1)";
    });

    checkbox.addEventListener("change", () => {
      tasks[index].done = checkbox.checked;
      if (checkbox.checked) {
        addXP(20); // Award XP for task completion

        // Gamification Hooks
        if (typeof checkBadgesOnTaskComplete === 'function') {
          checkBadgesOnTaskComplete();
        }

        // Play Sound
        if (typeof playSound === 'function') {
          playSound('check');
        }
      }
      saveTasks();
      renderTasks();
      renderUpcomingDeadlines();
      updateCharts(); // Update charts on change
    });

    deleteBtn.addEventListener("click", () => {
      li.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
        renderUpcomingDeadlines();
        updateCharts(); // Update charts on delete
      }, 300);
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(date);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  });
}

addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const date = dateInput.value;

  if (!text) {
    // Shake animation for empty input
    taskInput.style.animation = "shake 0.5s ease";
    setTimeout(() => {
      taskInput.style.animation = "";
    }, 500);
    return;
  }

  tasks.push({
    text,
    date,
    done: false
  });

  taskInput.value = "";
  dateInput.value = "";

  saveTasks();
  renderTasks();
  renderUpcomingDeadlines();
  updateCharts();
});

// Add enter key support for task input
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click();
  }
});

try {
  renderTasks();
  renderUpcomingDeadlines();
} catch (e) {
  console.error("Error rendering tasks:", e);
}

/* ===============================
   UPCOMING DEADLINES LOGIC
================================ */

function renderUpcomingDeadlines() {
  const upcomingList = document.getElementById("upcomingList");
  if (!upcomingList) return;

  // Filter tasks that are incomplete and have a due date
  const upcomingTasks = tasks
    .filter(t => !t.done && t.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3); // Take top 3

  upcomingList.innerHTML = "";

  if (upcomingTasks.length === 0) {
    upcomingList.innerHTML = `
      <div class="deadline-item empty-state" style="color: var(--text-muted); font-style: italic;">
        <span>No upcoming deadlines! Clear sailing. ⛵</span>
      </div>
    `;
    return;
  }

  upcomingTasks.forEach(task => {
    const dateObj = new Date(task.date);
    const dateStr = dateObj.toLocaleDateString();

    // Calculate days remaining
    const diffTime = dateObj - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let timeText = "";
    let timeClass = "";

    if (diffDays < 0) {
      timeText = "Overdue";
      timeClass = "overdue";
    } else if (diffDays === 0) {
      timeText = "Today";
      timeClass = "today";
    } else if (diffDays === 1) {
      timeText = "Tomorrow";
      timeClass = "soon";
    } else {
      timeText = `In ${diffDays} days`;
      timeClass = "upcoming";
    }

    const item = document.createElement("div");
    item.className = "deadline-item";
    item.style.padding = "10px 0";
    item.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";

    item.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-weight: 500; color: var(--text-primary);">${task.text}</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">📅 ${dateStr}</span>
      </div>
      <span class="deadline-tag ${timeClass}" style="
        font-size: 0.75rem; 
        padding: 4px 8px; 
        border-radius: 12px; 
        font-weight: 600;
        background: rgba(255, 255, 255, 0.1);
      ">${timeText}</span>
    `;

    // Add specific colors for tags
    const tag = item.querySelector(".deadline-tag");
    if (timeClass === "overdue") {
      tag.style.background = "rgba(239, 68, 68, 0.2)";
      tag.style.color = "#ef4444";
    } else if (timeClass === "today") {
      tag.style.background = "rgba(245, 158, 11, 0.2)";
      tag.style.color = "#f59e0b";
    } else if (timeClass === "soon") {
      tag.style.background = "rgba(59, 130, 246, 0.2)";
      tag.style.color = "#3b82f6";
    }

    upcomingList.appendChild(item);
  });
}


/* ===============================
   CALENDAR VIEW LOGIC
================================ */

const listViewBtn = document.getElementById("listViewBtn");
const calendarViewBtn = document.getElementById("calendarViewBtn");
const listView = document.getElementById("listView");
const calendarView = document.getElementById("calendarView");
const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");

if (listViewBtn && calendarViewBtn) {
  listViewBtn.addEventListener("click", () => {
    listViewBtn.classList.add("active");
    calendarViewBtn.classList.remove("active");
    listView.style.display = "block";
    calendarView.style.display = "none";
  });

  calendarViewBtn.addEventListener("click", () => {
    calendarViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
    listView.style.display = "none";
    calendarView.style.display = "block";
    renderCalendar();
  });
}

function renderCalendar() {
  if (!calendarGrid) return;
  calendarGrid.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Update Title
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  if (calendarTitle) calendarTitle.innerText = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Headers
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  days.forEach(day => {
    const el = document.createElement("div");
    el.className = "calendar-day-header";
    el.innerText = day;
    calendarGrid.appendChild(el);
  });

  // Empty slots
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement("div");
    calendarGrid.appendChild(el);
  }

  // Days
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const el = document.createElement("div");
    el.className = "calendar-day";

    // Check if today
    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      el.classList.add("today");
    }

    // Check for tasks
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const hasTask = tasks.some(t => t.date === dateStr && !t.done);

    if (hasTask) {
      el.classList.add("has-task");
    }

    el.innerHTML = `<span class="calendar-date-number">${i}</span>`;
    calendarGrid.appendChild(el);
  }
}

// ===== TOPBAR CUSTOM TEXT (QUOTE, NAME, BRANCH) =====

const quoteText = document.getElementById("quoteText");
const userName = document.getElementById("userName");
const userBranch = document.getElementById("userBranch");

// Theme Toggle Logic
// Theme Logic
const themeToggleBtn = document.getElementById("themeToggleBtn");
const body = document.body;

const themes = ['default', 'light', 'midnight', 'forest', 'sunset', 'cyberpunk'];
const themeIcons = {
  'default': '🌙',
  'light': '☀️',
  'midnight': '🌌',
  'forest': '🌲',
  'sunset': '🌅',
  'cyberpunk': '🤖'
};

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "default";
  applyTheme(savedTheme);
}

function applyTheme(themeName) {
  // Ensure valid theme
  if (!themes.includes(themeName)) themeName = 'default';

  // Apply to DOM
  if (themeName === 'default') {
    body.removeAttribute('data-theme');
    body.classList.remove('light-mode');
  } else {
    body.setAttribute('data-theme', themeName);
    body.classList.remove('light-mode');
  }

  // Update Button Icon
  if (themeToggleBtn) {
    themeToggleBtn.textContent = themeIcons[themeName] || '🎨';
  }

  localStorage.setItem("theme", themeName);
}

function cycleTheme() {
  const currentTheme = localStorage.getItem("theme") || "default";
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  applyTheme(themes[nextIndex]);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", cycleTheme);
}

initTheme();

// Profile Persistence
if (quoteText) {
  quoteText.innerText = localStorage.getItem("quoteText") || "I am > I was ✏️";
  quoteText.addEventListener("input", () => localStorage.setItem("quoteText", quoteText.innerText));
}

if (userName) {
  userName.innerText = localStorage.getItem("userName") || "Saad Siddiqui";
  userName.addEventListener("input", () => localStorage.setItem("userName", userName.innerText));
}

if (userBranch) {
  userBranch.innerText = localStorage.getItem("userBranch") || "CSBS";
  userBranch.addEventListener("input", () => localStorage.setItem("userBranch", userBranch.innerText));
}

// Profile Picture logic
const profilePic = document.getElementById("profilePic");
const profileUpload = document.getElementById("profileUpload");
const profilePicContainer = document.querySelector(".profile-pic-container");

if (profilePic && localStorage.getItem("profilePic")) {
  profilePic.src = localStorage.getItem("profilePic");
}

if (profilePicContainer && profileUpload) {
  profilePicContainer.addEventListener("click", () => profileUpload.click());

  profileUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        profilePic.src = result;
        localStorage.setItem("profilePic", result);
      };
      reader.readAsDataURL(file);
    }
  });
}

/* ===============================
   GAMIFICATION SYSTEM
================================ */

let userXP = parseInt(localStorage.getItem("userXP")) || 0;
let userLevel = parseInt(localStorage.getItem("userLevel")) || 1;
const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");
const levelBadge = document.getElementById("levelBadge");

function updateGamificationUI() {
  const xpForNextLevel = userLevel * 100;
  const progress = (userXP / xpForNextLevel) * 100;

  if (xpBar) xpBar.style.width = `${Math.min(progress, 100)}%`;
  if (xpText) xpText.innerText = `${userXP} / ${xpForNextLevel} XP`;

  // Rank Titles
  let rank = "Novice";
  if (userLevel >= 50) rank = "Grandmaster";
  else if (userLevel >= 25) rank = "Expert";
  else if (userLevel >= 10) rank = "Apprentice";

  if (levelBadge) levelBadge.innerText = `Level ${userLevel} ${rank}`;
}

function addXP(amount) {
  userXP += amount;
  const xpForNextLevel = userLevel * 100;

  if (userXP >= xpForNextLevel) {
    userLevel++;
    userXP -= xpForNextLevel;
    // Level Up Alert
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Level Up! 🎉", {
        body: `Congratulations! You reached Level ${userLevel}.`,
        icon: "favicon.ico"
      });
    }
    alert(`🎉 LEVEL UP! You are now Level ${userLevel}!`);
  }

  localStorage.setItem("userXP", userXP);
  localStorage.setItem("userLevel", userLevel);
  updateGamificationUI();
}

try {
  updateGamificationUI();
} catch (e) {
  console.error("Error updating gamification UI:", e);
}

/* ===============================
   ANALYTICS (CHART.JS)
================================ */

let weeklyChartInstance = null;
let completionChartInstance = null;

function initCharts() {
  const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
  const completionCtx = document.getElementById('completionChart')?.getContext('2d');

  if (!weeklyCtx || !completionCtx) return;

  // Destroy existing charts if any
  if (weeklyChartInstance) weeklyChartInstance.destroy();
  if (completionChartInstance) completionChartInstance.destroy();

  // Weekly Focus Chart (Dummy Data for demo, can be linked to real sessions)
  // To make this real, we would need to store session history with dates.
  // For hackathon "winner worthy" visuals, we'll initialize with some data
  // and update the "Today" bar dynamically.

  const sessionsToday = parseInt(localStorage.getItem("pomodoro_sessions")) || 0;

  weeklyChartInstance = new Chart(weeklyCtx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Focus Hours',
        data: [2, 4, 3, 5, 2, 6, sessionsToday * 0.5], // 25min sessions approx 0.5hr
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });

  // Task Completion Chart
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const remainingTasks = totalTasks - completedTasks;

  completionChartInstance = new Chart(completionCtx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [completedTasks, remainingTasks],
        backgroundColor: ['#10b981', '#1e293b'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Call initCharts on load and window resize
window.addEventListener('load', initCharts);
window.addEventListener('resize', initCharts);

// Helper to update charts when data changes
function updateCharts() {
  if (completionChartInstance) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    completionChartInstance.data.datasets[0].data = [completedTasks, totalTasks - completedTasks];
    completionChartInstance.update();
  }

  if (weeklyChartInstance) {
    const sessionsToday = parseInt(localStorage.getItem("pomodoro_sessions")) || 0;
    // Update the last bar (assuming today is Sunday for demo simplicity, or just 'Today')
    // For a better app we'd map getDay() to the index.
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    if (todayIndex >= 0) {
      weeklyChartInstance.data.datasets[0].data[todayIndex] = sessionsToday * (25 / 60); // Exact hours
      weeklyChartInstance.update();
    }
  }
}

// Add CSS animations via style tag
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-20px) scale(0.98);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

/* ===============================
   FLIP CLOCK
================================ */

function updateFlipClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const digits = [
    { tens: 'hours-tens', ones: 'hours-ones', value: hours },
    { tens: 'minutes-tens', ones: 'minutes-ones', value: minutes }
  ];

  digits.forEach((digit) => {
    const tensEl = document.getElementById(digit.tens);
    const onesEl = document.getElementById(digit.ones);
    const tensBackEl = document.getElementById(digit.tens + '-back');
    const onesBackEl = document.getElementById(digit.ones + '-back');

    if (tensEl && tensEl.textContent !== digit.value[0]) {
      if (tensBackEl) tensBackEl.textContent = digit.value[0];
      const inner = tensEl.parentElement;
      if (inner) {
        inner.style.transform = 'rotateY(180deg)';
        setTimeout(() => {
          tensEl.textContent = digit.value[0];
          inner.style.transform = 'rotateY(0deg)';
        }, 300);
      }
    }

    if (onesEl && onesEl.textContent !== digit.value[1]) {
      if (onesBackEl) onesBackEl.textContent = digit.value[1];
      const inner = onesEl.parentElement;
      if (inner) {
        inner.style.transform = 'rotateY(180deg)';
        setTimeout(() => {
          onesEl.textContent = digit.value[1];
          inner.style.transform = 'rotateY(0deg)';
        }, 300);
      }
    }
  });
}

setInterval(updateFlipClock, 60000); // Update every minute
updateFlipClock();

/* ===============================
   POMODORO TIMER
================================ */

let pomodoroInterval = null;
let pomodoroTimeLeft = 25 * 60;
let pomodoroRunning = false;
let sessionCount = parseInt(localStorage.getItem("pomodoro_sessions")) || 0;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updatePomodoroDisplay() {
  const pomodoroTimeEl = document.getElementById("pomodoroTime");
  if (pomodoroTimeEl) {
    pomodoroTimeEl.textContent = formatTime(pomodoroTimeLeft);
  }
}

function startPomodoro() {
  if (pomodoroRunning) return;

  pomodoroRunning = true;
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  if (pomodoroStatusEl) {
    pomodoroStatusEl.textContent = "Focusing...";
  }

  // Request notification permission
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  pomodoroInterval = setInterval(() => {
    pomodoroTimeLeft--;
    updatePomodoroDisplay();

    if (pomodoroTimeLeft <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      pomodoroTimeLeft = 0;
      updatePomodoroDisplay();

      if (pomodoroStatusEl) {
        pomodoroStatusEl.textContent = "Session Complete!";
      }

      // Trigger Notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Session Complete!", {
          body: "Great job! Take a break.",
          icon: "favicon.ico" // Optional: path to icon
        });
      }

      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play().catch(e => console.log("Audio play failed:", e)); // Simple beep

      sessionCount++;
      addXP(50); // Award XP for focus session
      localStorage.setItem("pomodoro_sessions", sessionCount);
      const sessionCountEl = document.getElementById("sessionCount");
      if (sessionCountEl) {
        sessionCountEl.textContent = sessionCount;
      }
      updateCharts(); // Update charts

      // Gamification Hooks
      if (typeof checkBadgesOnSessionComplete === 'function') {
        checkBadgesOnSessionComplete();
      }
    }
  }, 1000);
}

/* ===============================
   HEATMAP (LEETCODE STYLE)
================================ */

const heatmapGrid = document.getElementById("heatmapGrid");
const heatmapMonths = document.getElementById("heatmapMonths");
const totalActiveDaysEl = document.getElementById("totalActiveDays");
const maxStreakEl = document.getElementById("maxStreak");

function initHeatmap() {
  if (!heatmapGrid) return;
  heatmapGrid.innerHTML = "";
  if (heatmapMonths) heatmapMonths.innerHTML = "";

  // 1. Generate Activity Data (Simulated)
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setDate(today.getDate() - 365); // Full year

  let totalActive = 0;
  let currentStreak = 0;
  let maxStreak = 0;

  // 2. Render Grid
  // We need 53 columns (weeks) x 7 rows (days)
  const totalCells = 53 * 7;

  for (let i = 0; i < totalCells; i++) {
    const dayDate = new Date(yearAgo);
    dayDate.setDate(yearAgo.getDate() + i);

    // Stop if we reach tomorrow
    // if (dayDate > today) break; // Don't break, fill grid to keep layout stable

    const day = document.createElement("div");
    day.className = "heatmap-day";

    // Simulate Data
    const rand = Math.random();
    let level = 0;

    // Only simulate data for past dates (up to today)
    if (dayDate <= today) {
      if (rand > 0.85) level = 4;
      else if (rand > 0.70) level = 3;
      else if (rand > 0.55) level = 2;
      else if (rand > 0.40) level = 1;
    }

    if (level > 0) {
      totalActive++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    day.classList.add(`level-${level}`);

    // Tooltip Data
    const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const activityStr = level === 0 ? 'No study sessions' : `${level} hours studied`;
    day.setAttribute('data-tooltip', `${activityStr} on ${dateStr}`);

    heatmapGrid.appendChild(day);
  }

  // 3. Render Month Labels
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let currentMonth = -1;

  for (let i = 0; i < 53; i++) { // 53 weeks
    const weekDate = new Date(yearAgo);
    weekDate.setDate(yearAgo.getDate() + (i * 7));
    const monthIndex = weekDate.getMonth();

    const label = document.createElement("div");
    if (monthIndex !== currentMonth) {
      label.innerText = monthNames[monthIndex];
      currentMonth = monthIndex;
    }
    heatmapMonths.appendChild(label);
  }

  // 4. Update Stats
  if (totalActiveDaysEl) totalActiveDaysEl.innerText = totalActive;
  if (maxStreakEl) maxStreakEl.innerText = maxStreak;
}

// Force init on load
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { initHeatmap(); } catch (e) { console.error("Error init heatmap:", e); }
    });
  } else {
    initHeatmap();
  }
} catch (e) {
  console.error("Error setting up heatmap:", e);
}



function pausePomodoro() {
  if (!pomodoroRunning) return;

  clearInterval(pomodoroInterval);
  pomodoroRunning = false;
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  if (pomodoroStatusEl) {
    pomodoroStatusEl.textContent = "Paused";
  }
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroRunning = false;
  pomodoroTimeLeft = 25 * 60;
  updatePomodoroDisplay();
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  if (pomodoroStatusEl) {
    pomodoroStatusEl.textContent = "Ready to Focus";
  }
}

const pomodoroStartBtn = document.getElementById("pomodoroStart");
const pomodoroPauseBtn = document.getElementById("pomodoroPause");
const pomodoroResetBtn = document.getElementById("pomodoroReset");
const sessionCountEl = document.getElementById("sessionCount");
const presetBtns = document.querySelectorAll(".preset-btn");

if (sessionCountEl) {
  sessionCountEl.textContent = sessionCount;
}

if (pomodoroStartBtn) {
  pomodoroStartBtn.addEventListener("click", startPomodoro);
}

if (pomodoroPauseBtn) {
  pomodoroPauseBtn.addEventListener("click", pausePomodoro);
}

if (pomodoroResetBtn) {
  pomodoroResetBtn.addEventListener("click", resetPomodoro);
}

presetBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    presetBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const minutes = parseInt(btn.dataset.minutes);
    pomodoroTimeLeft = minutes * 60;
    updatePomodoroDisplay();
    if (pomodoroRunning) {
      pausePomodoro();
    }
  });
});

updatePomodoroDisplay();

/* ===============================
   LAB MANUAL
================================ */

let labManualItems = JSON.parse(localStorage.getItem("labmanual_items")) || [];

function saveLabManualItems() {
  localStorage.setItem("labmanual_items", JSON.stringify(labManualItems));
}

function renderLabManualItems() {
  const labmanualList = document.getElementById("labmanualList");
  if (!labmanualList) return;

  labmanualList.innerHTML = "";

  labManualItems.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "labmanual-item";
    itemEl.style.animationDelay = `${index * 0.05} s`;

    const nameEl = document.createElement("div");
    nameEl.className = "labmanual-item-name";
    nameEl.textContent = item.name;

    const dateEl = document.createElement("div");
    dateEl.className = "labmanual-item-date";
    dateEl.textContent = item.dueDate || "No date";

    const statusEl = document.createElement("div");
    statusEl.className = `labmanual-item-status ${item.status}`;
    statusEl.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);

    const actionsEl = document.createElement("div");
    actionsEl.className = "labmanual-item-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      const subjectNameInput = document.getElementById("subjectName");
      const dueDateInput = document.getElementById("dueDate");
      const submissionStatusSelect = document.getElementById("submissionStatus");
      if (subjectNameInput) subjectNameInput.value = item.name;
      if (dueDateInput) dueDateInput.value = item.dueDate || "";
      if (submissionStatusSelect) submissionStatusSelect.value = item.status;
      deleteLabManualItem(index);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      itemEl.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        deleteLabManualItem(index);
      }, 300);
    });

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(deleteBtn);

    itemEl.appendChild(nameEl);
    itemEl.appendChild(dateEl);
    itemEl.appendChild(statusEl);
    itemEl.appendChild(actionsEl);

    labmanualList.appendChild(itemEl);
  });
}

function addLabManualItem() {
  const subjectNameInput = document.getElementById("subjectName");
  const dueDateInput = document.getElementById("dueDate");
  const submissionStatusSelect = document.getElementById("submissionStatus");

  const name = subjectNameInput?.value.trim();
  const dueDate = dueDateInput?.value || "";
  const status = submissionStatusSelect?.value || "pending";

  if (!name) {
    if (subjectNameInput) {
      subjectNameInput.style.animation = "shake 0.5s ease";
      setTimeout(() => {
        if (subjectNameInput) subjectNameInput.style.animation = "";
      }, 500);
    }
    return;
  }

  labManualItems.push({
    name,
    dueDate,
    status,
    id: Date.now()
  });

  saveLabManualItems();
  renderLabManualItems();

  if (subjectNameInput) subjectNameInput.value = "";
  if (dueDateInput) dueDateInput.value = "";
  if (submissionStatusSelect) submissionStatusSelect.value = "pending";
}

function deleteLabManualItem(index) {
  labManualItems.splice(index, 1);
  saveLabManualItems();
  renderLabManualItems();
}

const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectNameInput = document.getElementById("subjectName");

if (addSubjectBtn) {
  addSubjectBtn.addEventListener("click", addLabManualItem);
}

if (subjectNameInput) {
  subjectNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addLabManualItem();
    }
  });
}

renderLabManualItems();

// Home card click handlers
document.querySelectorAll(".home-card").forEach(card => {
  card.addEventListener("click", () => {
    const sectionId = card.dataset.section;
    const navBtn = document.querySelector(`button[onclick *= "${sectionId}"]`);
    if (navBtn) {
      showSection(sectionId, navBtn);
    }
  });
});

/* ===============================
   NOTES SECTION
================================ */

const notesArea = document.getElementById("notesArea");
const notesStatus = document.getElementById("notesStatus");

if (notesArea) {
  // Load saved notes
  notesArea.value = localStorage.getItem("lockedin_notes") || "";

  let saveTimeout;
  notesArea.addEventListener("input", () => {
    if (notesStatus) notesStatus.textContent = "Saving...";

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem("lockedin_notes", notesArea.value);
      if (notesStatus) notesStatus.textContent = "Saved";
    }, 1000);
  });
}

/* ===============================
   EXAM COUNTDOWN
================================ */

const examNameInput = document.getElementById("examName");
const examDateInput = document.getElementById("examDate");
const addExamBtn = document.getElementById("addExamBtn");
const examGrid = document.getElementById("examGrid");

let exams = JSON.parse(localStorage.getItem("lockedin_exams")) || [];

function saveExams() {
  localStorage.setItem("lockedin_exams", JSON.stringify(exams));
}

function getDaysLeft(dateString) {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderExams() {
  if (!examGrid) return;
  examGrid.innerHTML = "";

  exams.sort((a, b) => new Date(a.date) - new Date(b.date));

  exams.forEach((exam, index) => {
    const daysLeft = getDaysLeft(exam.date);
    const dayText = daysLeft === 1 ? "Day" : "Days";

    const card = document.createElement("div");
    card.className = "exam-card";
    card.style.animation = `fadeInScale 0.5s ease - out ${index * 0.1}s backwards`;

    card.innerHTML = `
      <div class="exam-header">
        <div class="exam-title">${exam.name}</div>
        <button class="delete-exam-btn" onclick="deleteExam(${index})">🗑️</button>
      </div>
      <div class="days-left">${daysLeft}</div>
      <div class="days-label">${dayText} Left</div>
      <div class="exam-date">📅 ${new Date(exam.date).toLocaleDateString()}</div>
      `;

    examGrid.appendChild(card);
  });
}

function addExam() {
  const name = examNameInput.value.trim();
  const date = examDateInput.value;

  if (!name || !date) {
    if (!name) examNameInput.style.animation = "shake 0.5s ease";
    if (!date) examDateInput.style.animation = "shake 0.5s ease";
    setTimeout(() => {
      examNameInput.style.animation = "";
      examDateInput.style.animation = "";
    }, 500);
    return;
  }

  exams.push({ name, date });
  saveExams();
  renderExams();

  examNameInput.value = "";
  examDateInput.value = "";
}

window.deleteExam = function (index) {
  exams.splice(index, 1);
  saveExams();
  renderExams();
}

if (addExamBtn) {
  addExamBtn.addEventListener("click", addExam);
}

renderExams();

/* ===============================
   GEMINI AI ASSISTANT
================================ */

const geminiMessages = document.getElementById("geminiMessages");
const geminiInput = document.getElementById("geminiInput");
const geminiSendBtn = document.getElementById("geminiSendBtn");

function addMessage(text, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `gemini-message ${isUser ? 'user-message' : 'bot-message'}`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = isUser ? "👤" : "🤖";

  const messageText = document.createElement("div");
  messageText.className = "message-text";
  messageText.textContent = text;

  messageContent.appendChild(avatar);
  messageContent.appendChild(messageText);
  messageDiv.appendChild(messageContent);

  geminiMessages.appendChild(messageDiv);
  geminiMessages.scrollTop = geminiMessages.scrollHeight;
}

/**
 * Collect academic context from the app
 * Returns structured data for the AI coach
 */
function collectAcademicContext() {
  const context = {
    eligibility: {},
    attendance: { subjects: [] },
    planner: {},
    studyMode: {}
  };

  // Get eligibility data
  const totalEl = document.getElementById("total");
  const percentageEl = document.getElementById("percentage");
  const statusEl = document.getElementById("status");

  if (totalEl && percentageEl && statusEl) {
    const totalText = totalEl.textContent;
    const percentageText = percentageEl.textContent;
    const statusText = statusEl.textContent;

    if (totalText !== "--" && percentageText !== "--") {
      context.eligibility = {
        total: totalText,
        percentage: parseFloat(percentageText.replace('%', '')) || 0,
        status: statusText
      };
    }
  }

  // Get attendance data
  if (typeof attendanceData !== 'undefined' && attendanceData.length > 0) {
    attendanceData.forEach(subject => {
      const stats = calculateAttendance(subject);
      const risk = getRiskZone(stats.percentage);

      context.attendance.subjects.push({
        name: subject.name,
        percentage: stats.percentage,
        totalConducted: stats.totalConducted,
        totalAttended: stats.totalAttended,
        riskZone: risk.zone
      });
    });
  }

  // Get planner data
  if (typeof tasks !== 'undefined' && tasks.length > 0) {
    const completedTasks = tasks.filter(t => t.done).length;
    context.planner = {
      totalTasks: tasks.length,
      completedTasks: completedTasks,
      completionRate: Math.round((completedTasks / tasks.length) * 100)
    };
  }

  // Get study mode data
  if (typeof sessionCount !== 'undefined') {
    context.studyMode = {
      sessionsToday: sessionCount || 0
    };
  }

  return context;
}

/**
 * Call the backend Gemini API
 * Sends academic context and user message to get AI coach response
 */
async function getGeminiResponse(userMessage) {
  try {
    // Collect academic context
    const context = collectAcademicContext();

    // Determine API endpoint (works for both local dev and Firebase deployment)
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001/lockedin-functions/us-central1/gemini'
      : 'https://us-central1-lockedin-functions.cloudfunctions.net/gemini';

    // Call backend API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        ...context
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status} `);
    }

    const data = await response.json();
    return data.response || 'I received your message but got an empty response. Please try again.';

  } catch (error) {
    console.error('Gemini API Error:', error);

    // Return user-friendly error message
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Unable to connect to AI Coach. Please check your internet connection and try again.';
    }

    return `AI Coach is temporarily unavailable: ${error.message}. Please try again in a moment.`;
  }
}

async function sendMessage() {
  const message = geminiInput.value.trim();
  if (!message) return;

  // Add user message
  addMessage(message, true);
  geminiInput.value = "";
  geminiSendBtn.disabled = true;

  // Show typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "gemini-message bot-message";
  typingDiv.id = "typing-indicator";
  typingDiv.innerHTML = `
    <div class="message-content">
      <div class="message-avatar">🤖</div>
      <div class="message-text">AI Coach is thinking...</div>
    </div>
  `;
  geminiMessages.appendChild(typingDiv);
  geminiMessages.scrollTop = geminiMessages.scrollHeight;

  try {
    // Call real Gemini API
    const response = await getGeminiResponse(message);

    // Remove typing indicator
    const typingEl = document.getElementById("typing-indicator");
    if (typingEl) typingEl.remove();

    // Add AI response
    addMessage(response, false);
  } catch (error) {
    // Remove typing indicator
    const typingEl = document.getElementById("typing-indicator");
    if (typingEl) typingEl.remove();

    // Show error message
    addMessage("Sorry, I encountered an error. Please try again.", false);
    console.error("Error sending message:", error);
  } finally {
    geminiSendBtn.disabled = false;
    geminiInput.focus();
  }
}

if (geminiSendBtn) {
  geminiSendBtn.addEventListener("click", sendMessage);
}

if (geminiInput) {
  geminiInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  geminiInput.addEventListener("input", () => {
    geminiSendBtn.disabled = !geminiInput.value.trim();
  });
}

/* ===============================
   ATTENDANCE ANALYZER
================================ */

const MIN_ATTENDANCE = 75; // Minimum required attendance percentage

let attendanceData = JSON.parse(localStorage.getItem("attendance_data")) || [];

// Initialize attendance analyzer
function initAttendanceAnalyzer() {
  const addSubjectBtn = document.getElementById("attendanceAddSubjectBtn");
  const subjectNameInput = document.getElementById("attendanceSubjectNameInput");
  const subjectsContainer = document.getElementById("subjectsContainer");

  if (!addSubjectBtn || !subjectNameInput || !subjectsContainer) return;

  // Add subject event listener
  addSubjectBtn.addEventListener("click", addSubject);
  subjectNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addSubject();
    }
  });

  // Render existing subjects
  renderSubjects();
}

// Add a new subject
function addSubject() {
  const subjectNameInput = document.getElementById("attendanceSubjectNameInput");
  const name = subjectNameInput?.value.trim();

  if (!name) {
    if (subjectNameInput) {
      subjectNameInput.style.animation = "shake 0.5s ease";
      setTimeout(() => {
        if (subjectNameInput) subjectNameInput.style.animation = "";
      }, 500);
    }
    return;
  }

  // Check if subject already exists
  if (attendanceData.some(subj => subj.name.toLowerCase() === name.toLowerCase())) {
    alert("Subject already exists!");
    return;
  }

  attendanceData.push({
    id: Date.now(),
    name: name,
    weeks: []
  });

  saveAttendanceData();
  renderSubjects();

  if (subjectNameInput) subjectNameInput.value = "";
}

// Delete a subject
function deleteSubject(subjectId) {
  if (confirm("Are you sure you want to delete this subject?")) {
    attendanceData = attendanceData.filter(subj => subj.id !== subjectId);
    saveAttendanceData();
    renderSubjects();
  }
}

// Add a week to a subject
function addWeek(subjectId) {
  const subject = attendanceData.find(s => s.id === subjectId);
  if (!subject) return;

  subject.weeks.push({
    id: Date.now(),
    conducted: 0,
    attended: 0
  });

  saveAttendanceData();
  renderSubjects();
}

// Delete a week
function deleteWeek(subjectId, weekId) {
  const subject = attendanceData.find(s => s.id === subjectId);
  if (!subject) return;

  subject.weeks = subject.weeks.filter(w => w.id !== weekId);
  saveAttendanceData();
  renderSubjects();
}

// Update week data
function updateWeek(subjectId, weekId, field, value) {
  const subject = attendanceData.find(s => s.id === subjectId);
  if (!subject) return;

  const week = subject.weeks.find(w => w.id === weekId);
  if (!week) return;

  const numValue = parseInt(value) || 0;

  if (field === "conducted") {
    week.conducted = Math.max(0, numValue);
    // Ensure attended doesn't exceed conducted
    if (week.attended > week.conducted) {
      week.attended = week.conducted;
    }
  } else if (field === "attended") {
    week.attended = Math.max(0, Math.min(numValue, week.conducted));
  }

  saveAttendanceData();
  renderSubjects();
}

// Calculate attendance statistics
function calculateAttendance(subject) {
  const totalConducted = subject.weeks.reduce((sum, week) => sum + week.conducted, 0);
  const totalAttended = subject.weeks.reduce((sum, week) => sum + week.attended, 0);
  const percentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

  return {
    totalConducted,
    totalAttended,
    percentage: parseFloat(percentage.toFixed(2))
  };
}

// Determine risk zone
function getRiskZone(percentage) {
  if (percentage >= 80) {
    return { zone: "safe", message: "Safe — you can afford to miss some classes." };
  } else if (percentage >= MIN_ATTENDANCE) {
    return { zone: "at-risk", message: "At risk — missing one more class may drop you below minimum attendance." };
  } else {
    return { zone: "danger", message: "Danger — you must attend upcoming classes to recover attendance." };
  }
}

// Calculate recovery requirement
function calculateRecovery(totalConducted, totalAttended, minPercentage = MIN_ATTENDANCE) {
  if (totalConducted === 0) return null;

  const currentPercentage = (totalAttended / totalConducted) * 100;

  if (currentPercentage >= minPercentage) return null;

  // Calculate how many classes need to be attended to reach 75%
  // (totalAttended + x) / (totalConducted + x) >= 0.75
  // totalAttended + x >= 0.75 * (totalConducted + x)
  // totalAttended + x >= 0.75 * totalConducted + 0.75 * x
  // x - 0.75x >= 0.75 * totalConducted - totalAttended
  // 0.25x >= 0.75 * totalConducted - totalAttended
  // x >= (0.75 * totalConducted - totalAttended) / 0.25

  const required = Math.ceil((minPercentage / 100 * totalConducted - totalAttended) / (1 - minPercentage / 100));

  return Math.max(1, required);
}

// Render all subjects
function renderSubjects() {
  const subjectsContainer = document.getElementById("subjectsContainer");
  if (!subjectsContainer) return;

  subjectsContainer.innerHTML = "";

  if (attendanceData.length === 0) {
    subjectsContainer.innerHTML = `
      <div style="text-align: center; padding: 48px; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">No subjects added yet. Add your first subject above!</p>
      </div>
      `;
    return;
  }

  attendanceData.forEach((subject, index) => {
    const stats = calculateAttendance(subject);
    const risk = getRiskZone(stats.percentage);
    const recovery = calculateRecovery(stats.totalConducted, stats.totalAttended);

    const subjectCard = document.createElement("div");
    subjectCard.className = `subject-card ${risk.zone}-zone`;
    subjectCard.style.animationDelay = `${index * 0.1} s`;

    subjectCard.innerHTML = `
      <div class="subject-header">
        <div class="subject-name">${escapeHtml(subject.name)}</div>
        <div class="subject-stats">
          <div class="stat-item">
            <div class="stat-label">Conducted</div>
            <div class="stat-value">${stats.totalConducted}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Attended</div>
            <div class="stat-value">${stats.totalAttended}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Attendance</div>
            <div class="stat-value attendance-percentage ${risk.zone}">${stats.percentage}%</div>
          </div>
          <div class="risk-status ${risk.zone}">
            ${risk.zone === "safe" ? "🟢" : risk.zone === "at-risk" ? "🟡" : "🔴"} 
            ${risk.zone === "safe" ? "Safe" : risk.zone === "at-risk" ? "At Risk" : "Danger"}
          </div>
        </div>
      </div>

        <div class="risk-message ${risk.zone}">
          ${escapeHtml(risk.message)}
        </div>

      ${recovery ? `
        <div class="recovery-message">
          <strong>Recovery Required:</strong> You must attend the next ${recovery} class${recovery > 1 ? "es" : ""} without absence to recover to ${MIN_ATTENDANCE}% attendance.
        </div>
      ` : ""
      }

      <div class="weeks-section">
        <div class="weeks-header">
          <div class="weeks-title">Weekly Attendance</div>
          <button class="add-week-btn" onclick="addWeek(${subject.id})">+ Add Week</button>
        </div>
        <div class="weeks-list" id="weeks-${subject.id}"></div>
      </div>

      <button class="delete-subject-btn" onclick="deleteSubject(${subject.id})">Delete Subject</button>
      `;

    subjectsContainer.appendChild(subjectCard);

    // Render weeks for this subject
    renderWeeks(subject.id, subject.weeks);
  });
}

// Render weeks for a subject
function renderWeeks(subjectId, weeks) {
  const weeksList = document.getElementById(`weeks-${subjectId}`);
  if (!weeksList) return;

  weeksList.innerHTML = "";

  if (weeks.length === 0) {
    weeksList.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem;">
        No weeks added yet. Click "Add Week" to start tracking.
      </div>
      `;
    return;
  }

  weeks.forEach((week, index) => {
    const weekItem = document.createElement("div");
    weekItem.className = "week-item";
    weekItem.style.animationDelay = `${index * 0.05} s`;

    weekItem.innerHTML = `
      <div class="week-label">Week ${index + 1}</div>
      <div>
        <input 
          type="number" 
          class="week-input" 
          placeholder="Conducted" 
          value="${week.conducted}"
          min="0"
          onchange="updateWeek(${subjectId}, ${week.id}, 'conducted', this.value)"
        />
      </div>
      <div>
        <input 
          type="number" 
          class="week-input" 
          placeholder="Attended" 
          value="${week.attended}"
          min="0"
          max="${week.conducted}"
          onchange="updateWeek(${subjectId}, ${week.id}, 'attended', this.value)"
        />
      </div>
      <button class="delete-week-btn" onclick="deleteWeek(${subjectId}, ${week.id})">Delete</button>
      `;

    weeksList.appendChild(weekItem);
  });
}

// Save attendance data to localStorage
function saveAttendanceData() {
  localStorage.setItem("attendance_data", JSON.stringify(attendanceData));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAttendanceAnalyzer);
} else {
  initAttendanceAnalyzer();
}

/* ===============================
   GAMIFICATION 2.0 (BADGES & QUESTS)
================================ */

// Data
const BADGES = [
  { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Complete a session after 10 PM' },
  { id: 'early_bird', icon: '🌅', name: 'Early Bird', desc: 'Complete a session before 6 AM' },
  { id: 'task_slayer', icon: '⚔️', name: 'Task Slayer', desc: 'Complete 5 tasks in one day' },
  { id: 'weekend_warrior', icon: '🏰', name: 'Weekend Warrior', desc: 'Study on a weekend' },
  { id: 'streak_master', icon: '🔥', name: 'Streak 3 Days', desc: 'Reach a 3-day streak' }
];

const QUEST_TEMPLATES = [
  { text: "Study for 25 mins", xp: 50, type: 'study', target: 25 },
  { text: "Complete 2 Tasks", xp: 40, type: 'task', target: 2 },
  { text: "Earn 100 XP", xp: 30, type: 'xp', target: 100 },
  { text: "Reach Level 2", xp: 100, type: 'level', target: 2 }
];

// State
let unlockedBadges = JSON.parse(localStorage.getItem('unlockedBadges')) || [];
let dailyQuests = JSON.parse(localStorage.getItem('dailyQuests')) || [];
let questDate = localStorage.getItem('questDate');

// Init
function initGamification() {
  try {
    renderBadges();
    checkDailyQuests();
    renderQuests();
  } catch (e) {
    console.error("Error init gamification:", e);
  }
}

// Auto init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGamification);
} else {
  initGamification();
}

// --- BADGES ---
function renderBadges() {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  BADGES.forEach(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    const div = document.createElement('div');
    div.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
    div.title = badge.desc;
    div.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <span class="badge-name">${badge.name}</span>
    `;
    grid.appendChild(div);
  });
}

function unlockBadge(id) {
  if (unlockedBadges.includes(id)) return;
  unlockedBadges.push(id);
  localStorage.setItem('unlockedBadges', JSON.stringify(unlockedBadges));
  renderBadges();
  triggerConfetti();
  playSound('success');

  // Notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🏆 Badge Unlocked!", { body: `You earned: ${BADGES.find(b => b.id === id).name}` });
  }
}

// --- QUESTS ---
function checkDailyQuests() {
  const today = new Date().toDateString();
  if (questDate !== today) {
    // Generate new quests
    dailyQuests = [];
    for (let i = 0; i < 3; i++) {
      const template = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
      dailyQuests.push({ ...template, progress: 0, completed: false, id: Date.now() + i });
    }
    localStorage.setItem('dailyQuests', JSON.stringify(dailyQuests));
    localStorage.setItem('questDate', today);
    questDate = today;
  }
}

function renderQuests() {
  const list = document.getElementById('questList');
  if (!list) return;
  list.innerHTML = '';

  dailyQuests.forEach((quest, index) => {
    const div = document.createElement('div');
    div.className = `quest-item ${quest.completed ? 'completed' : ''}`;
    div.onclick = () => checkQuestCompletion(index, true); // Manual check for demo
    div.innerHTML = `
      <div class="quest-checkbox"></div>
      <div class="quest-info">
        <span class="quest-text">${quest.text}</span>
        <span class="quest-reward">+${quest.xp} XP</span>
      </div>
    `;
    list.appendChild(div);
  });
}

function updateQuestProgress(type, amount = 1) {
  let changed = false;
  dailyQuests.forEach(quest => {
    if (!quest.completed && quest.type === type) {
      quest.progress += amount;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        addXP(quest.xp);
        triggerConfetti(0.5); // Small burst
        playSound('check');
        changed = true;
      }
    }
  });

  if (changed) {
    localStorage.setItem('dailyQuests', JSON.stringify(dailyQuests));
    renderQuests();
  }
}

// --- LISTENERS ---
// Hook into existing functions
function checkBadgesOnSessionComplete() {
  const hour = new Date().getHours();
  if (hour >= 22) unlockBadge('night_owl');
  if (hour < 6) unlockBadge('early_bird');

  const day = new Date().getDay();
  if (day === 0 || day === 6) unlockBadge('weekend_warrior');

  // Streak check (mock logic for now, assumes heatmap usage)
  const streak = parseInt(document.getElementById('maxStreak')?.innerText || 0);
  if (streak >= 3) unlockBadge('streak_master');

  updateQuestProgress('study', 25); // Assume 25m session
}

function checkBadgesOnTaskComplete() {
  // Simple daily counter (could be persisted)
  let todayTasks = parseInt(localStorage.getItem('todayTasks') || '0') + 1;
  localStorage.setItem('todayTasks', todayTasks);

  if (todayTasks >= 5) unlockBadge('task_slayer');
  updateQuestProgress('task');
}

// --- VISUALS ---
function triggerConfetti(scale = 1) {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100 * scale,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function playSound(type) {
  const sounds = {
    success: "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg", // Placeholder
    check: "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
    click: "https://actions.google.com/sounds/v1/ui/click_on_on.ogg"
  };

  // In a real app, host local files. Using generic placeholders for demo.
  // const audio = new Audio(sounds[type]);
  // audio.volume = 0.5;
  // audio.play().catch(() => {});
}

// Init Line
initGamification();



/* ===============================
   AUTHENTICATION LOGIC
================================ */

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const authContainer = document.getElementById('authContainer');

// Diagnostic function to check Firebase setup
function checkFirebaseSetup() {
  console.log("🔍 Checking Firebase setup...");
  console.log("Current domain:", window.location.hostname);
  console.log("Auth object:", auth ? "✅ Initialized" : "❌ Not initialized");
  console.log("Provider object:", provider ? "✅ Initialized" : "❌ Not initialized");

  if (auth) {
    console.log("Auth domain:", auth.app.options.authDomain);
    console.log("Project ID:", auth.app.options.projectId);
  }

  // Check if we're on an authorized domain
  const currentDomain = window.location.hostname;
  console.log("Current domain:", currentDomain);
  console.log("Expected domains:", [
    "lockedin-d7c07.web.app",
    "lockedin-d7c07.firebaseapp.com",
    "localhost",
    "127.0.0.1"
  ]);
}

// Run diagnostics on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkFirebaseSetup, 1000);
  });
} else {
  setTimeout(checkFirebaseSetup, 1000);
}

// Sign In Event
if (signInBtn) {
  signInBtn.addEventListener('click', () => {
    console.log("🔐 Sign-in button clicked");

    // Check if auth is initialized
    if (!auth) {
      alert("❌ Firebase Auth is not initialized. Please check your Firebase configuration.");
      console.error("Auth object is null or undefined");
      return;
    }

    // Check if provider is initialized
    if (!provider) {
      alert("❌ Google Auth Provider is not initialized.");
      console.error("Provider object is null or undefined");
      return;
    }

    console.log("🚀 Attempting sign-in with Google...");

    // Try popup first, fallback to redirect if popup is blocked
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log("✅ Signed in successfully as:", result.user.displayName);
        console.log("User email:", result.user.email);
        console.log("User UID:", result.user.uid);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Welcome!", { body: `Signed in as ${result.user.displayName}` });
        }
      })
      .catch((error) => {
        console.error("❌ Sign in error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Full error object:", error);

        // Handle specific error cases
        if (error.code === 'auth/popup-blocked') {
          // Popup was blocked, try redirect instead
          console.log("⚠️ Popup blocked, trying redirect...");
          alert("Popup was blocked. Trying redirect method...");
          auth.signInWithRedirect(provider);
        } else if (error.code === 'auth/popup-closed-by-user') {
          // User closed the popup
          console.log("ℹ️ Sign-in popup was closed by user");
          // Don't show alert for this - user intentionally closed
        } else if (error.code === 'auth/unauthorized-domain') {
          const currentDomain = window.location.hostname;
          alert(`❌ Unauthorized Domain Error\n\nCurrent domain: ${currentDomain}\n\nPlease add this domain to:\nFirebase Console > Authentication > Settings > Authorized domains\n\nMake sure these are added:\n- ${currentDomain}\n- lockedin-d7c07.web.app\n- lockedin-d7c07.firebaseapp.com`);
        } else if (error.code === 'auth/operation-not-allowed') {
          alert(`❌ Google Sign-In Not Enabled\n\nError: ${error.message}\n\nTo fix this:\n1. Go to Firebase Console\n2. Navigate to: Authentication > Sign-in method\n3. Click on "Google" provider\n4. Toggle "Enable" to ON\n5. Enter a support email\n6. Click "Save"\n\nThen try signing in again.`);
        } else if (error.code === 'auth/network-request-failed') {
          alert("❌ Network Error\n\nPlease check your internet connection and try again.");
        } else {
          // Generic error - show user-friendly message
          const errorMessage = error.message || "Unknown error occurred";
          console.error("Full error details:", error);
          alert(`❌ Sign in failed\n\nError: ${errorMessage}\n\nError Code: ${error.code || 'N/A'}\n\nPlease check:\n1. Google Sign-In is enabled in Firebase Console > Authentication > Sign-in method\n2. Your domain (${window.location.hostname}) is in Authorized domains\n3. Check browser console (F12) for more details`);
        }
      });
  });
} else {
  console.error("❌ Sign-in button not found in DOM");
}

// Sign Out Event
if (signOutBtn) {
  signOutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      console.log("Signed out");
    }).catch((error) => {
      console.error("Sign out error:", error);
    });
  });
}

// Handle redirect result (if popup was blocked and redirect was used)
auth.getRedirectResult()
  .then((result) => {
    if (result.user) {
      console.log("Signed in via redirect:", result.user.displayName);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Welcome!", { body: `Signed in as ${result.user.displayName}` });
      }
    }
  })
  .catch((error) => {
    if (error.code !== 'auth/popup-closed-by-user') {
      console.error("Redirect sign-in error:", error);
    }
  });

// Auth State Listener
if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      if (signInBtn) signInBtn.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'flex';
      }
      if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
      console.log("User authenticated:", user.uid);
    } else {
      if (signInBtn) {
        signInBtn.style.display = 'block';
      }
      if (userInfo) {
        userInfo.style.display = 'none';
      }
    }
  });
} else {
  // If auth is not initialized, show sign in button
  console.error("Firebase Auth not initialized!");
  if (signInBtn) {
    signInBtn.style.display = 'block';
  }
  if (userInfo) {
    userInfo.style.display = 'none';
  }
}
