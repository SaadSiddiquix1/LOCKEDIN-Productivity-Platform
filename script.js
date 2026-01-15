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

    // Manage Floating Pomodoro Helper
    const floater = document.getElementById("floatingPomodoro");
    if (floater) {
      // If we are LEAVING 'study' section AND timer is relevant (running or paused with time)
      // Actually strictly: If entering 'study', hide floater. If entering others, show if appropriate.
      if (id === 'study') {
        floater.classList.add("hidden");
        floater.style.pointerEvents = "none";
      } else {
        // Show if timer is running OR (paused but not at default max time)
        // Check global vars: pomodoroRunning, currentSessionMinutes, pomodoroTimeLeft
        const isDefault = pomodoroTimeLeft === (currentSessionMinutes * 60);
        if (pomodoroRunning || !isDefault) {
          floater.classList.remove("hidden");
          floater.style.pointerEvents = "auto";
        }
      }
    }

    // Manage Studyverse Loop
    if (id === 'studyverse') {
      if (window.startStudyverse) window.startStudyverse();
      if (window.resumeStudyverse) window.resumeStudyverse();
    } else {
      if (window.stopStudyverse) window.stopStudyverse();
    }

    // Scroll to top of main content
    document.querySelector(".main").scrollTop = 0;
  }
}

/* ===============================
   SIDEBAR COLLAPSE
================================ */
function toggleSidebar() {
  const app = document.querySelector('.app');
  const isCollapsed = app.classList.toggle('sidebar-collapsed');
  localStorage.setItem('sidebarCollapsed', isCollapsed);

  // Trigger resize for Studyverse 3D if active
  if (app.classList.contains('sidebar-collapsed') || !app.classList.contains('sidebar-collapsed')) {
    // Wait for transition to finish approx (400ms)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 450);
  }
}

function initSidebar() {
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  const app = document.querySelector('.app');
  if (isCollapsed && app) {
    app.classList.add('sidebar-collapsed');
  }

  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
  }
}

document.addEventListener('DOMContentLoaded', initSidebar);

// Floating Pomodoro Logic
const floater = document.getElementById("floatingPomodoro");
const floatDrag = floater?.querySelector(".drag-handle");
const floatTimer = document.getElementById("floatTimerDisplay");
const floatPlay = document.getElementById("floatPlayBtn");
const floatExpand = document.getElementById("floatExpandBtn");
const floatClose = document.getElementById("floatCloseBtn");
const floatPiPBtn = document.getElementById("floatPiPBtn");

let pipWindow = null;

// Sync Display Helper
function updateFloatDisplay() {
  if (!floatTimer) return;
  const minutes = Math.floor(pomodoroTimeLeft / 60);
  const seconds = pomodoroTimeLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  floatTimer.innerText = timeStr;

  if (floatPlay) {
    floatPlay.innerText = pomodoroRunning ? "⏸" : "▶";
  }

  // Update PiP if active
  if (pipWindow && pipWindow.document) {
    const pipTimer = pipWindow.document.getElementById("pipTimer");
    const pipBtn = pipWindow.document.getElementById("pipPlayBtn");
    if (pipTimer) pipTimer.innerText = timeStr;
    if (pipBtn) pipBtn.innerText = pomodoroRunning ? "⏸" : "▶";
  }

  // Robust Visibility Check (Self-Correcting)
  const floater = document.getElementById("floatingPomodoro");
  const studySection = document.getElementById("study");

  if (floater && studySection) {
    const isStudyActive = studySection.classList.contains("active");
    // Check if default time (using global vars)
    const totalSeconds = (currentSessionMinutes || 25) * 60;
    const isDefault = pomodoroTimeLeft === totalSeconds;

    if (isStudyActive) {
      // Always hide if in study mode
      if (!floater.classList.contains("hidden")) {
        floater.classList.add("hidden");
        floater.style.pointerEvents = "none";
      }
    } else {
      // If NOT in study mode, only show if running or non-default state
      if (pomodoroRunning || !isDefault) {
        if (floater.classList.contains("hidden")) {
          floater.classList.remove("hidden");
          floater.style.pointerEvents = "auto";
        }
      } else {
        // Otherwise hide
        if (!floater.classList.contains("hidden")) {
          floater.classList.add("hidden");
          floater.style.pointerEvents = "none";
        }
      }
    }
  }
}

async function togglePiP() {
  // Feature detection
  if (!('documentPictureInPicture' in window)) {
    alert("Picture-in-Picture for HTML is not supported in this browser. Try Chrome or Edge!");
    return;
  }

  if (pipWindow) {
    // Close existing
    pipWindow.close();
    pipWindow = null;
    return;
  }

  try {
    pipWindow = await documentPictureInPicture.requestWindow({
      width: 250,
      height: 150
    });

    // Copy styles
    [...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
        const style = document.createElement('style');
        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    });

    // Create Content (Minimal)
    const container = document.createElement("div");
    container.className = "pip-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.height = "100%";
    container.style.background = "#0f172a";

    container.innerHTML = `
      <div id="pipTimer" style="font-size: 3rem; font-weight: 700; color: #6366f1; margin-bottom: 10px;">${floatTimer.innerText}</div>
      <button id="pipPlayBtn" style="font-size: 1.5rem; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 5px 15px; border-radius: 8px; cursor: pointer;">${pomodoroRunning ? "⏸" : "▶"}</button>
    `;

    pipWindow.document.body.appendChild(container);
    pipWindow.document.body.style.margin = "0";

    // Bind PiP Controls
    const pipBtn = pipWindow.document.getElementById("pipPlayBtn");
    pipBtn.onclick = () => {
      if (pomodoroRunning) pausePomodoro();
      else startPomodoro();
    };

    // Cleanup when closed
    pipWindow.addEventListener("pagehide", () => {
      pipWindow = null;
    });

  } catch (err) {
    console.error("PiP Error:", err);
  }
}

if (floater) {
  // Controls
  if (floatPlay) floatPlay.onclick = () => {
    if (pomodoroRunning) pausePomodoro();
    else startPomodoro();
  };

  if (floatExpand) floatExpand.onclick = () => {
    showSection('study');
  };

  if (floatClose) floatClose.onclick = () => {
    floater.classList.add("hidden");
    floater.style.pointerEvents = "none";
  };

  if (floatPiPBtn) floatPiPBtn.onclick = togglePiP;

  // Draggable Logic
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  if (floatDrag) {
    floatDrag.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floater.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      floatDrag.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Reset right/bottom constraints to allow free movement via top/left
      floater.style.right = 'auto';
      floater.style.bottom = 'auto';
      floater.style.left = `${initialLeft + dx}px`;
      floater.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      if (floatDrag) floatDrag.style.cursor = "grab";
    });
  }
}

/* ===============================
   ANALYZER LOGIC
================================ */

let currentGPAmax = 125;
const schemaButtons = document.querySelectorAll(".schema-btn");

schemaButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Update UI
    schemaButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentGPAmax = parseInt(btn.dataset.total);

    // Toggle Visibility
    const labCard = document.getElementById("labCard");
    const practicalCard = document.getElementById("practicalCard");

    if (currentGPAmax === 100) {
      if (labCard) labCard.style.display = "none";
      if (practicalCard) practicalCard.style.display = "none";
    } else if (currentGPAmax === 125) {
      if (labCard) labCard.style.display = "block";
      if (practicalCard) practicalCard.style.display = "none";
    } else if (currentGPAmax === 150) {
      if (labCard) labCard.style.display = "block";
      if (practicalCard) practicalCard.style.display = "block";
    }

    // Clear results
    document.getElementById("total").innerText = "--";
    document.getElementById("status").innerText = "--";
    document.getElementById("percentage").innerText = "--";
    document.getElementById("progressFill").style.width = "0%";
    document.getElementById("progressText").innerText = "0%";
  });
});

function calculateEligibility() {
  const lab = Number(document.getElementById("lab").value) || 0;
  const ia = Number(document.getElementById("ia").value) || 0;
  const end = Number(document.getElementById("end").value) || 0;
  const practical = Number(document.getElementById("practical").value) || 0;

  let total = ia + end;
  if (currentGPAmax >= 125) total += lab;
  if (currentGPAmax === 150) total += practical;

  const percentage = (total / currentGPAmax) * 100;

  // Animate input cards
  const inputCards = document.querySelectorAll(".input-card");
  inputCards.forEach((card, index) => {
    if (card.style.display !== "none") {
      card.style.animation = "none";
      setTimeout(() => {
        card.style.animation = `pulse 0.5s ease-out ${index * 0.1}s`;
      }, 10);
    }
  });

  // Update result cards
  const resultCards = document.querySelectorAll(".result-card");
  resultCards.forEach((card, index) => {
    card.style.animation = "none";
    setTimeout(() => {
      card.style.animation = `fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s both`;
    }, 10);
  });

  // Numbers
  animateValue("total", 0, total, 800, ` / ${currentGPAmax}`);
  animateValue("percentage", 0, percentage, 1500, "%");

  // Status
  let statusText = "";
  let statusColor = "";
  if (percentage >= 80) {
    statusText = "O Grade (10 GP)";
    statusColor = "#10b981";
  } else if (percentage >= 70) {
    statusText = "A+ Grade (9 GP)";
    statusColor = "#3b82f6";
  } else if (percentage >= 60) {
    statusText = "A Grade (8 GP)";
    statusColor = "#6366f1";
  } else {
    statusText = "Not upto mark.";
    statusColor = "#ef4444";
  }

  const statusElement = document.getElementById("status");
  statusElement.innerText = statusText;
  statusElement.style.color = statusColor;

  // Progress Bar
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const progressContainer = document.querySelector(".progress-container");

  progressFill.style.width = "0%";
  progressText.innerText = "0%";
  progressContainer.style.animation = "fadeInUp 0.6s ease-out";

  setTimeout(() => {
    const targetWidth = Math.min(percentage, 100);
    progressFill.style.width = `${targetWidth}%`;

    if (percentage >= 80) {
      progressFill.style.background = "linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)";
    } else if (percentage >= 70) {
      progressFill.style.background = "linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)";
    } else if (percentage >= 60) {
      progressFill.style.background = "linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%)";
    } else {
      progressFill.style.background = "linear-gradient(90deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)";
    }

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

  // Sort tasks: Active Priority First -> Active Regular -> Completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.done && a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
    if (a.date && b.date) return new Date(a.date) - new Date(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  sortedTasks.forEach((task) => {
    const originalIndex = tasks.findIndex(t => t === task);
    const li = document.createElement("li");
    li.className = `${task.done ? 'done' : ''} ${task.priority === 'high' ? 'priority-high' : ''}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    const text = document.createElement("span");
    text.className = "task-text";
    text.contentEditable = !task.done;
    text.innerText = task.text;
    text.title = "Double click to edit";

    const date = document.createElement("span");
    date.className = "task-date";
    date.innerText = task.date || "No date";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "×";
    deleteBtn.className = "delete-task-btn";
    deleteBtn.style.cssText = `
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;

    // Inline Editing
    text.addEventListener("blur", () => {
      task.text = text.innerText.trim() || task.text;
      saveTasks();
    });

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      if (checkbox.checked) {
        addXP(20);
        if (typeof playSound === 'function') playSound('check');
      }
      saveTasks();
      renderTasks();
      renderUpcomingDeadlines();
      updateCharts();
    });

    deleteBtn.addEventListener("click", () => {
      li.style.transform = "translateX(20px)";
      li.style.opacity = "0";
      setTimeout(() => {
        tasks.splice(originalIndex, 1);
        saveTasks();
        renderTasks();
        renderUpcomingDeadlines();
        updateCharts();
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
  const priority = document.getElementById("taskPriority")?.value || 'normal';

  if (!text) {
    taskInput.style.animation = "shake 0.5s ease";
    setTimeout(() => { taskInput.style.animation = ""; }, 500);
    return;
  }

  tasks.push({
    text,
    date,
    priority,
    done: false
  });

  taskInput.value = "";
  dateInput.value = "";

  saveTasks();
  renderTasks();
  renderUpcomingDeadlines();

  // Badge: Master Planner
  const deadlineCount = tasks.filter(t => t.date).length;
  if (deadlineCount >= 10) unlockBadge('master_planner');

  updateCharts();
});

// Clear Completed
const clearBtn = document.getElementById("clearCompletedBtn");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const originalCount = tasks.length;
    tasks = tasks.filter(t => !t.done);
    if (tasks.length < originalCount) {
      saveTasks();
      renderTasks();
      updateCharts();
      triggerCrimsonConfetti(); // Little feedback for cleaning up
    }
  });
}

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

const themes = ['default', 'light', 'midnight', 'cyberpunk', 'onyx'];
const themeIcons = {
  'default': '🩸',
  'light': '☀️',
  'midnight': '🌌',
  'cyberpunk': '🤖',
  'onyx': '🌑'
};

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "onyx";
  applyTheme(savedTheme);
}

function applyTheme(themeName) {
  // Ensure valid theme
  if (!themes.includes(themeName)) themeName = 'onyx';

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
  const currentTheme = localStorage.getItem("theme") || "onyx";
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  applyTheme(themes[nextIndex]);
}

// --- UI Enhancement Helpers ---
function typeWriter(element, text, speed = 50) {
  if (!element) return;

  // Cancel any existing typewriter animation on this element
  if (element._typeWriterTimeout) {
    clearTimeout(element._typeWriterTimeout);
  }

  let i = 0;
  element.textContent = "";

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      element._typeWriterTimeout = setTimeout(type, speed);
    } else {
      delete element._typeWriterTimeout;
    }
  }
  type();
}

function animateNumber(id, start, end, duration = 1500) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerText = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function triggerCrimsonConfetti() {
  if (typeof confetti === 'undefined') return;
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ef4444', '#991b1b', '#ffffff']
  });
}
// -----------------------------

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", cycleTheme);
}

initTheme();

// Profile Persistence
// Initialized in initGamification -> checkDailyQuote

if (userName) {
  userName.innerText = localStorage.getItem("userName") || "Saad Siddiqui";
  userName.addEventListener("input", () => localStorage.setItem("userName", userName.innerText));
}

if (userBranch) {
  userBranch.innerText = localStorage.getItem("userBranch") || "CSBS";
  userBranch.addEventListener("input", () => localStorage.setItem("userBranch", userBranch.innerText));
}

// --- Environment Matrix Logic ---

// Profile Picture logic with scaling
function initDashboardProfile() {
  const profilePic = document.getElementById("profilePic");
  const profileUpload = document.getElementById("profileUpload");
  const profilePicContainer = document.querySelector(".profile-pic-container");

  if (!profilePic) return;

  // Load from localStorage
  const localPic = localStorage.getItem("profilePic");
  if (localPic) {
    profilePic.src = localPic;
  }

  if (profilePicContainer && profileUpload) {
    profilePicContainer.addEventListener("click", () => profileUpload.click());

    profileUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Scale image to max 512px
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 512;

            if (width > height) {
              if (width > maxDim) {
                height *= maxDim / width;
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width *= maxDim / height;
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const scaledData = canvas.toDataURL('image/jpeg', 0.8);
            profilePic.src = scaledData;

            try {
              localStorage.setItem("profilePic", scaledData);
            } catch (err) {
              console.warn("Storage quota exceeded, using temporary display.");
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

initDashboardProfile();

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
    triggerCrimsonConfetti();
  }

  localStorage.setItem("userLevel", userLevel);
  updateGamificationUI();

  // Badge: Scholar King
  if (userLevel >= 10) unlockBadge('scholar_king');
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

  // Weekly Focus Chart (Real Data)
  const history = getStudyHistory();
  const last7Days = [];
  const startDay = new Date();
  startDay.setDate(startDay.getDate() - 6); // Start from 6 days ago

  const labels = [];
  const dataPoints = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const key = getDateKey(d);

    labels.push(dayName);
    const mins = history[key] || 0;
    dataPoints.push((mins / 60).toFixed(1)); // Convert to hours
  }

  const weeklyGradient = weeklyCtx.createLinearGradient(0, 0, 0, 250);
  weeklyGradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
  weeklyGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

  weeklyChartInstance = new Chart(weeklyCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Focus Hours',
        data: dataPoints,
        backgroundColor: weeklyGradient,
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: '#ef4444'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `${context.parsed.y} Hours`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.5)' }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)' }
        }
      }
    }
  });

  // Task Completion Chart
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const remainingTasks = totalTasks - completedTasks;

  const completionGradient = completionCtx.createLinearGradient(0, 0, 0, 400);
  completionGradient.addColorStop(0, '#ef4444');
  completionGradient.addColorStop(1, '#991b1b');

  completionChartInstance = new Chart(completionCtx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [completedTasks, remainingTasks],
        backgroundColor: [completionGradient, 'rgba(255, 255, 255, 0.05)'],
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } } }
      },
      animation: { animateRotate: true, animateScale: true }
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
      // Get real data for today
      const history = getStudyHistory();
      const todayKey = new Date().toISOString().split('T')[0];
      const minutesToday = history[todayKey] || 0;

      weeklyChartInstance.data.datasets[0].data[todayIndex] = minutesToday / 60; // Convert to hours
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
let pomodoroWorker = null;
let pomodoroTimeLeft = 25 * 60;
let pomodoroEndTime = null; // Track absolute end time
let pomodoroRunning = false;
let sessionCount = parseInt(localStorage.getItem("pomodoro_sessions")) || 0;
let consecutiveSessions = parseInt(localStorage.getItem("consecutive_sessions")) || 0;
let currentSessionMinutes = 25; // Track intended length

// Study History Helpers
// Helper to get local date string (YYYY-MM-DD)
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getStudyHistory() {
  return JSON.parse(localStorage.getItem("study_history")) || {};
}

function saveStudyHistory(history) {
  localStorage.setItem("study_history", JSON.stringify(history));
}

function updateStudyHistory(minutes) {
  const history = getStudyHistory();
  const today = getDateKey(new Date());

  console.log(`[DEBUG] Logging ${minutes}m to ${today}`); // Data Integrity Check

  if (!history[today]) {
    history[today] = 0;
  }

  history[today] += minutes;
  saveStudyHistory(history);

  // Badge: Marathoner
  if (history[today] >= 180) unlockBadge('marathoner');

  // Re-render things that depend on history
  updateCharts();
  initHeatmap(); // Update heatmap immediately
}

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

  // Update Progress Bar
  const pomodoroProgressEl = document.getElementById("pomodoroProgress");
  if (pomodoroProgressEl) {
    const totalSeconds = currentSessionMinutes * 60;
    const elapsedSeconds = totalSeconds - pomodoroTimeLeft;
    const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));
    pomodoroProgressEl.style.width = `${progressPercent}%`;
  }

  if (typeof updateFloatDisplay === "function") {
    updateFloatDisplay();
  }
}

function startPomodoro() {
  if (pomodoroRunning) return;

  // Reset consecutive sessions if it's been more than 2 hours since last session
  const lastSessionEnd = parseInt(localStorage.getItem("last_session_end")) || 0;
  if (Date.now() - lastSessionEnd > 2 * 60 * 60 * 1000) {
    consecutiveSessions = 0;
    localStorage.setItem("consecutive_sessions", 0);
  }

  pomodoroRunning = true;
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  if (pomodoroStatusEl) {
    if (currentSessionMinutes === 2) {
      pomodoroStatusEl.textContent = "Breathing...";
    } else {
      pomodoroStatusEl.textContent = "Focusing...";
    }
  }

  // Request notification permission
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  pomodoroEndTime = Date.now() + (pomodoroTimeLeft * 1000);

  // Start the tick source
  if (window.Worker) {
    if (!pomodoroWorker) {
      pomodoroWorker = new Worker('timer-worker.js');
      pomodoroWorker.onmessage = (e) => {
        if (e.data === 'tick' && pomodoroRunning) pomodoroTick();
      };
    }
    pomodoroWorker.postMessage('start');
  } else {
    pomodoroInterval = setInterval(pomodoroTick, 1000);
  }
}

function pomodoroTick() {
  if (!pomodoroRunning) return;

  const now = Date.now();
  pomodoroTimeLeft = Math.max(0, Math.ceil((pomodoroEndTime - now) / 1000));
  updatePomodoroDisplay();

  if (pomodoroTimeLeft <= 0) {
    finishPomodoro();
  }
}

function finishPomodoro() {
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  if (pomodoroWorker) pomodoroWorker.postMessage('stop');

  pomodoroRunning = false;
  pomodoroTimeLeft = 0;
  updatePomodoroDisplay();

  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  if (pomodoroStatusEl) {
    pomodoroStatusEl.textContent = "Session Complete!";
  }

  // Trigger Notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Session Complete!", {
      body: "Great job! Take a break.",
      icon: "favicon.ico"
    });
  }

  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  audio.play().catch(e => console.log("Audio play failed:", e));

  sessionCount++;
  addXP(50);
  localStorage.setItem("pomodoro_sessions", sessionCount);
  updateStudyHistory(currentSessionMinutes);

  const history = getStudyHistory();
  const totalMinutes = Object.values(history).reduce((a, b) => a + b, 0);
  if (totalMinutes >= 100) unlockBadge('zen_master');

  consecutiveSessions++;
  localStorage.setItem("consecutive_sessions", consecutiveSessions);
  localStorage.setItem("last_session_end", Date.now().toString());
  if (consecutiveSessions >= 3) unlockBadge('focus_ninja');

  const sessionCountEl = document.getElementById("sessionCount");
  if (sessionCountEl) sessionCountEl.textContent = sessionCount;

  if (typeof checkBadgesOnSessionComplete === 'function') {
    checkBadgesOnSessionComplete();
  }
}

// Ensure timer stays synced when returning to the tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && pomodoroRunning) {
    pomodoroTick();
  }
});

/* ===============================
   HEATMAP (SEGMENTED MONTH CARDS)
   Style: 12 Separate Boxed Calendars
================================ */

const totalActiveDaysEl = document.getElementById("totalActiveDays");
const maxStreakEl = document.getElementById("maxStreak");

// Helper to get days in month

// Helper to get days in month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function initHeatmap() {
  const heatmapContainer = document.querySelector(".heatmap-container");
  if (!heatmapContainer) return;

  heatmapContainer.innerHTML = "";

  const history = getStudyHistory();
  const today = new Date();

  let totalActive = 0;
  let maxStreak = 0;
  let currentStreak = 0;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fragment = document.createDocumentFragment();

  // Loop 11 months ago -> 0 (current)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    // Create Month Block
    const block = document.createElement("div");
    block.className = "month-block";

    // Header
    const header = document.createElement("div");
    header.className = "month-header";
    header.innerText = `${monthNames[month]}`;
    block.appendChild(header);

    // Grid (Column First)
    const grid = document.createElement("div");
    grid.className = "month-grid";

    // Padding for start day (Sunday = 0, Monday = 1...)
    // GitHub puts Sunday at Row 1.
    // CSS Grid fills columns first. Row 1 is Sunday.
    // If 1st is Tuesday (2), items 0(Sun) and 1(Mon) are empty.
    const startDay = new Date(year, month, 1).getDay(); // 0-6

    for (let p = 0; p < startDay; p++) {
      const spacer = document.createElement("div");
      spacer.style.pointerEvents = "none";
      grid.appendChild(spacer);
    }

    // Days
    const totalDays = getDaysInMonth(year, month);
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      const dateKey = getDateKey(dateObj); // YYYY-MM-DD
      const minutes = history[dateKey] || 0;
      const isFuture = dateObj > today;

      const cell = document.createElement("div");
      cell.className = "heatmap-day";

      // Data Integrity Check (Visual)
      // cell.dataset.date = dateKey; 

      if (!isFuture) {
        if (minutes > 0) {
          totalActive++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;

          // Levels
          if (minutes < 15) cell.classList.add("level-1");
          else if (minutes < 30) cell.classList.add("level-2");
          else if (minutes < 60) cell.classList.add("level-3");
          else if (minutes < 120) cell.classList.add("level-4");
          else cell.classList.add("level-5");
        } else {
          if (dateObj < today) currentStreak = 0;
        }
      } else {
        cell.style.opacity = "0.05";
        cell.style.pointerEvents = "none";
      }

      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      cell.setAttribute("data-tooltip", `${minutes}m on ${dateStr}`);

      grid.appendChild(cell);
    }

    block.appendChild(grid);
    fragment.appendChild(block);
  }

  heatmapContainer.appendChild(fragment);

  // Auto-scroll to end
  setTimeout(() => {
    heatmapContainer.scrollLeft = heatmapContainer.scrollWidth;
  }, 100);

  if (totalActiveDaysEl) animateNumber("totalActiveDays", 0, totalActive);
  if (maxStreakEl) animateNumber("maxStreak", 0, maxStreak);
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

  if (pomodoroInterval) clearInterval(pomodoroInterval);
  if (pomodoroWorker) pomodoroWorker.postMessage('stop');

  pomodoroRunning = false;
  const pomodoroStatusEl = document.getElementById("pomodoroStatus");
  if (pomodoroStatusEl) {
    pomodoroStatusEl.textContent = "Paused";
  }
}

function resetPomodoro() {
  if (pomodoroInterval) clearInterval(pomodoroInterval);
  if (pomodoroWorker) pomodoroWorker.postMessage('stop');

  pomodoroRunning = false;

  // Reset time to selected preset or default 25
  const activePreset = document.querySelector(".preset-btn.active");
  const minutes = activePreset ? parseInt(activePreset.dataset.minutes) : 25;
  currentSessionMinutes = minutes;
  pomodoroTimeLeft = minutes * 60;

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
    currentSessionMinutes = minutes; // Update intended duration
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

// Lab Manual Calendar State
let currentCalendarDate = new Date();

function updateLabProgress() {
  const progressBar = document.getElementById("labProgressBar");
  const progressText = document.getElementById("labProgressText");
  const statsText = document.getElementById("labStatsText");

  // Dashboard elements
  const dashBar = document.getElementById("dashLabBar");
  const dashStats = document.getElementById("dashLabStats");
  const dashPercent = document.getElementById("dashLabPercent");
  const dashPendingList = document.getElementById("dashPendingLabs");

  if (!progressBar || !progressText || !statsText) return;

  const total = labManualItems.length;
  const pendingLabs = labManualItems.filter(i => i.status === 'pending' || i.status === 'in-progress');
  const completed = total - pendingLabs.length;
  // Safer percent calc
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update Lab Manual Section
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}% Complete`;
  statsText.textContent = `${completed}/${total} Labs Done`;

  // Update Dashboard Card (Linear Widget)
  if (dashBar) dashBar.style.width = `${percent}%`;
  if (dashStats) dashStats.innerText = `${completed}/${total} Done`;

  if (dashPercent) {
    let currentVal = parseInt(dashPercent.innerText);
    if (isNaN(currentVal)) currentVal = 0;
    animateNumber("dashLabPercent", currentVal, percent, "%");
  }

  if (dashPendingList) {
    dashPendingList.innerHTML = "";
    if (pendingLabs.length === 0) {
      dashPendingList.innerHTML = '<div class="dash-pending-item" style="justify-content:center; color:var(--text-muted);"><span>All caught up! 🎉</span></div>';
    } else {
      pendingLabs.slice(0, 3).forEach(lab => {

        const item = document.createElement("div");
        item.className = "dash-pending-item";

        // Format date: 2024-02-20 -> Feb 20
        let dateDisplay = "No date";
        if (lab.dueDate) {
          const dateObj = new Date(lab.dueDate);
          dateDisplay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }

        item.innerHTML = `
          <span>${lab.name}</span>
          <span class="deadline-tag">${dateDisplay}</span>
        `;
        dashPendingList.appendChild(item);
      });
    }
  }
}

function renderLabManualItems() {
  const labmanualList = document.getElementById("labmanualList");
  if (!labmanualList) return;

  labmanualList.innerHTML = "";
  updateLabProgress();
  renderLabCalendar(); // Sync calendar whenever items change

  labManualItems.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "labmanual-item";
    itemEl.style.animationDelay = `${index * 0.05}s`;

    const nameEl = document.createElement("div");
    nameEl.className = "labmanual-item-name";
    nameEl.textContent = item.name;

    const dateEl = document.createElement("div");
    dateEl.className = "labmanual-item-date";
    dateEl.textContent = item.dueDate || "No date";

    const statusEl = document.createElement("div");
    statusEl.className = `labmanual-item-status ${item.status}`;
    statusEl.textContent = item.status.replace('-', ' ').toUpperCase();

    // Status Cycling Logic
    statusEl.addEventListener("click", () => {
      const statuses = ['pending', 'in-progress', 'submitted', 'evaluated'];
      let nextIndex = (statuses.indexOf(item.status) + 1) % statuses.length;
      item.status = statuses[nextIndex];
      saveLabManualItems();
      renderLabManualItems();
    });

    const linkEl = document.createElement("div");
    if (item.link) {
      const a = document.createElement("a");
      a.href = item.link;
      a.target = "_blank";
      a.className = "lab-link-btn";
      a.innerHTML = "🔗";
      a.title = "View Resource";
      linkEl.appendChild(a);
    }

    const actionsEl = document.createElement("div");
    actionsEl.className = "labmanual-item-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      const subjectNameInput = document.getElementById("subjectName");
      const dueDateInput = document.getElementById("dueDate");
      const labLinkInput = document.getElementById("labLink");
      const submissionStatusSelect = document.getElementById("submissionStatus");
      if (subjectNameInput) subjectNameInput.value = item.name;
      if (dueDateInput) dueDateInput.value = item.dueDate || "";
      if (labLinkInput) labLinkInput.value = item.link || "";
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
    itemEl.appendChild(linkEl);
    itemEl.appendChild(actionsEl);

    labmanualList.appendChild(itemEl);
  });
}

function addLabManualItem() {
  const subjectNameInput = document.getElementById("subjectName");
  const dueDateInput = document.getElementById("dueDate");
  const labLinkInput = document.getElementById("labLink");
  const submissionStatusSelect = document.getElementById("submissionStatus");

  const name = subjectNameInput?.value.trim();
  const dueDate = dueDateInput?.value || "";
  const link = labLinkInput?.value.trim() || "";
  const status = submissionStatusSelect?.value || "pending";

  if (!name) {
    if (subjectNameInput) {
      subjectNameInput.style.animation = "shake 0.5s ease";
      setTimeout(() => { if (subjectNameInput) subjectNameInput.style.animation = ""; }, 500);
    }
    return;
  }

  labManualItems.push({ name, dueDate, link, status });
  saveLabManualItems();
  renderLabManualItems();

  if (subjectNameInput) subjectNameInput.value = "";
  if (dueDateInput) dueDateInput.value = "";
  if (labLinkInput) labLinkInput.value = "";
  if (submissionStatusSelect) submissionStatusSelect.value = "pending";
}

function deleteLabManualItem(index) {
  labManualItems.splice(index, 1);
  saveLabManualItems();
  renderLabManualItems();
}

function renderLabCalendar() {
  const grid = document.getElementById("labCalendarGrid");
  const title = document.getElementById("currentMonthYear");
  if (!grid || !title) return;

  grid.innerHTML = "";
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  title.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalendarDate);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Padding for first week
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.textContent = d;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    if (isToday) dayEl.classList.add("today");

    const hasDeadline = labManualItems.some(item => item.dueDate === dateStr);
    if (hasDeadline) dayEl.classList.add("has-deadline");

    grid.appendChild(dayEl);
  }
}

// Calendar Navigation
document.getElementById("prevMonth")?.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderLabCalendar();
});
document.getElementById("nextMonth")?.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderLabCalendar();
});

// View Toggling
document.getElementById("labListViewBtn")?.addEventListener("click", () => {
  document.getElementById("labmanualList").classList.add("active-view");
  document.getElementById("labmanualCalendar").classList.remove("active-view");
  document.getElementById("labListViewBtn").classList.add("active");
  document.getElementById("labCalendarViewBtn").classList.remove("active");
});
document.getElementById("labCalendarViewBtn")?.addEventListener("click", () => {
  document.getElementById("labmanualList").classList.remove("active-view");
  document.getElementById("labmanualCalendar").classList.add("active-view");
  document.getElementById("labListViewBtn").classList.remove("active");
  document.getElementById("labCalendarViewBtn").classList.add("active");
  renderLabCalendar();
});

const addSubjectBtn = document.getElementById("addSubjectBtn");
const subjectNameInput = document.getElementById("subjectName");

if (addSubjectBtn) {
  addSubjectBtn.addEventListener("click", addLabManualItem);
}

if (subjectNameInput) {
  subjectNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addLabManualItem();
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

  function updateNotesStats() {
    const text = notesArea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    document.getElementById("wordCount").textContent = `${words} words`;
    document.getElementById("charCount").textContent = `${chars} chars`;
  }

  updateNotesStats();

  let saveTimeout;
  notesArea.addEventListener("input", () => {
    updateNotesStats();
    if (notesStatus) {
      notesStatus.textContent = "Saving...";
      notesStatus.classList.add("saving");
    }

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem("lockedin_notes", notesArea.value);
      if (notesStatus) {
        notesStatus.textContent = "Saved";
        notesStatus.classList.remove("saving");
      }
    }, 1000);
  });

  // Notes Toolbar Actions
  document.getElementById("copyNotesBtn")?.addEventListener("click", () => {
    notesArea.select();
    document.execCommand("copy");
    const originalText = document.getElementById("copyNotesBtn").innerHTML;
    document.getElementById("copyNotesBtn").innerHTML = "✅ Copied";
    setTimeout(() => { document.getElementById("copyNotesBtn").innerHTML = originalText; }, 2000);
  });

  document.getElementById("clearNotesBtn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear ALL notes? This cannot be undone.")) {
      notesArea.value = "";
      localStorage.setItem("lockedin_notes", "");
      updateNotesStats();
      if (notesStatus) notesStatus.textContent = "Cleared";
    }
  });

  document.getElementById("downloadNotesBtn")?.addEventListener("click", () => {
    const text = notesArea.value;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lockedin_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
   EYE-LOCK FOCUS AI (FocusAI)
   Uses MediaPipe Face Mesh
================================ */

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
  { id: 'streak_master', icon: '🔥', name: 'Streak 3 Days', desc: 'Reach a 3-day streak' },
  { id: 'focus_ninja', icon: '🥷', name: 'Focus Ninja', desc: 'Complete 3 Pomodoro sessions in a row' },
  { id: 'scholar_king', icon: '👑', name: 'Scholar King', desc: 'Reach Level 10' },
  { id: 'productivity_pro', icon: '⚡', name: 'Productivity Pro', desc: 'Complete all daily quests' },
  { id: 'zen_master', icon: '🧠', name: 'Zen Master', desc: 'Study for 100 total minutes' },
  { id: 'master_planner', icon: '📅', name: 'Master Planner', desc: 'Add 10 deadlines' },
  { id: 'consistent_legend', icon: '💎', name: 'Consistent Legend', desc: 'Reach a 7-day streak' },
  { id: 'marathoner', icon: '🏃', name: 'Study Marathon', desc: 'Study for 3 hours in one day' }
];

const QUEST_TEMPLATES = [
  { text: "Study for 25 mins", xp: 50, type: 'study', target: 25 },
  { text: "Complete 2 Tasks", xp: 40, type: 'task', target: 2 },
  { text: "Earn 100 XP", xp: 30, type: 'xp', target: 100 },
  { text: "Focus for 1 session", xp: 40, type: 'focus', target: 1 },
  { text: "Study for 50 mins", xp: 100, type: 'study', target: 50 },
  { text: "Complete 4 Tasks", xp: 80, type: 'task', target: 4 },
  { text: "Earn 200 XP", xp: 60, type: 'xp', target: 200 }
];

const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The future depends on what you do today. - Mahatma Gandhi",
  "Success is not final, failure is not fatal: it is the courage to continue. - Winston Churchill",
  "Hardships often prepare ordinary people for an extraordinary destiny. - C.S. Lewis",
  "It always seems impossible until it's done. - Nelson Mandela",
  "The starting point of all achievement is desire. - Napoleon Hill",
  "Your attitude determines how well you do it. - Lou Holtz",
  "Act as if what you do makes a difference. It does. - William James",
  "Success usually comes to those who are too busy to be looking for it. - Thoreau",
  "Dream big and dare to fail. - Norman Vaughan",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "Focus is a superpower. In an age of distraction, it's the ultimate competitive advantage.",
  "The pain of discipline is far less than the pain of regret.",
  "Don't stop when you're tired. Stop when you're done.",
  "Your mind is a weapon. Keep it sharp.",
  "Small progress is still progress. Keep moving forward.",
  "The best way to predict the future is to create it. - Peter Drucker",
  "Amateurs wait for inspiration. Professionals get to work.",
  "Consistency is the bridge between goals and accomplishment. - Jim Rohn",
  "Either you run the day or the day runs you. - Jim Rohn",
  "Your only limit is the one you set in your own mind.",
  "Wake up with determination. Go to bed with satisfaction.",
  "The secret of getting ahead is getting started. - Mark Twain",
  "Hard work beats talent when talent doesn't work hard.",
  "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
  "Motivation gets you going, but discipline keeps you growing. - John Maxwell",
  "The only person you should try to be better than is the person you were yesterday.",
  "Don't tell people your plans. Show them your results.",
  "Strength does not come from winning. Your struggles develop your strengths.",
  "If it's important to you, you'll find a way. If not, you'll find an excuse.",
  "Excellence is not a gift, but a skill that takes practice. - Plato",
  "Winners focus on winning. Losers focus on winners.",
  "The grind ignores your feelings.",
  "Be so good they can't ignore you. - Steve Martin",
  "Obsession beats talent every time."
];

// State
let unlockedBadges = JSON.parse(localStorage.getItem('unlockedBadges')) || [];
let dailyQuests = JSON.parse(localStorage.getItem('dailyQuests')) || [];
let questLastRefresh = localStorage.getItem('questLastRefresh');
let quoteLastRefresh = localStorage.getItem('quoteLastRefresh');

// Init
function initGamification() {
  try {
    renderBadges();
    checkDailyQuests();
    checkDailyQuote();
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
  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;

  if (!questLastRefresh || (now - parseInt(questLastRefresh)) > twelveHours) {
    // Generate new quests
    dailyQuests = [];
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 3; i++) {
      const template = shuffled[i % shuffled.length];
      dailyQuests.push({ ...template, progress: 0, completed: false, id: Date.now() + i });
    }
    localStorage.setItem('dailyQuests', JSON.stringify(dailyQuests));
    localStorage.setItem('questLastRefresh', now.toString());
    questLastRefresh = now.toString();

    // Reset quest timer display
    updateQuestTimer();
  }
}

function updateQuestTimer() {
  const timerEl = document.getElementById('questTimer');
  if (!timerEl || !questLastRefresh) return;

  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;
  const timeLeft = twelveHours - (now - parseInt(questLastRefresh));

  if (timeLeft <= 0) {
    timerEl.textContent = "Refreshing...";
    checkDailyQuests();
    renderQuests();
    return;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  timerEl.textContent = `Refreshes in ${hours}h ${minutes}m`;
}

// Update timer every minute
setInterval(updateQuestTimer, 60000);

function checkDailyQuote() {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const savedQuote = localStorage.getItem("quoteText");

  if (!quoteLastRefresh || (now - parseInt(quoteLastRefresh)) > twentyFourHours || !savedQuote) {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    const newQuote = MOTIVATIONAL_QUOTES[randomIndex];
    localStorage.setItem('quoteText', newQuote);
    localStorage.setItem('quoteLastRefresh', now.toString());
    quoteLastRefresh = now.toString();
    if (quoteText) setTimeout(() => typeWriter(quoteText, newQuote), 1000);
  } else {
    if (quoteText) setTimeout(() => typeWriter(quoteText, savedQuote), 1000);
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

    // Badge: Productivity Pro
    if (dailyQuests.every(q => q.completed)) {
      unlockBadge('productivity_pro');
    }
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

  // Streak check
  const streak = parseInt(document.getElementById('maxStreak')?.innerText || 0);
  if (streak >= 3) unlockBadge('streak_master');
  if (streak >= 7) unlockBadge('consistent_legend');

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

    // Optimistic UI update
    signInBtn.innerHTML = "Signing in...";
    signInBtn.disabled = true;

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
        // Set local flag for optimistic UI next load
        localStorage.setItem("local_auth_state", "true");
        // Reset button state just in case
        signInBtn.innerHTML = "Sign in";
        signInBtn.disabled = false;
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
      localStorage.setItem("local_auth_state", "true"); // Confirm flag
      if (signInBtn) signInBtn.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'flex';
      }
      if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';

      // Sync Dashboard Profile Pic if not set locally
      const mainProfilePic = document.getElementById("profilePic");
      if (mainProfilePic && !localStorage.getItem("profilePic") && user.photoURL) {
        mainProfilePic.src = user.photoURL;
      }
      console.log("User authenticated:", user.uid);
    } else {
      localStorage.removeItem("local_auth_state"); // Clear flag
      if (signInBtn) {
        signInBtn.style.display = 'block';
        signInBtn.innerHTML = "Sign in";
        signInBtn.disabled = false;
      }
      if (userInfo) {
        userInfo.style.display = 'none';
      }
    }
  });

  // Optimistic Initial Check (to prevent flicker)
  if (localStorage.getItem("local_auth_state") === "true") {
    if (signInBtn) signInBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
  }
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

// Ensure Global Access for HTML buttons
window.exportData = exportData;
window.importData = importData;

/* ===============================
   NAVIGATION LOGIC (RESTORED)
================================ */

// Navigation History Stack
const sectionHistory = [];

function goBack() {
  if (sectionHistory.length > 1) {
    sectionHistory.pop(); // Remove current
    const prev = sectionHistory[sectionHistory.length - 1]; // Peek previous
    // Find button
    const btn = document.querySelector(`.nav-btn[onclick*="'${prev}'"]`);
    // Assuming showSection is globally available. 
    // Note: The showSection function also needs to push to history, 
    // but the user edited showSection earlier to remove that logic.
    // We will just call showSection here.
    if (typeof showSection === 'function') {
      showSection(prev, btn);
    }
  }
}

// Full Keyboard Navigation Logic
document.addEventListener('keydown', (e) => {
  // Escape: Go Back
  if (e.key === 'Escape') {
    goBack();
    return;
  }

  const activeEl = document.activeElement;
  const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
  // Check if element is inside sidebar
  const sidebarEl = document.querySelector('.sidebar');
  const isInSidebar = activeEl.classList.contains('nav-btn') ||
    activeEl.classList.contains('link-item') ||
    (sidebarEl && sidebarEl.contains(activeEl));

  // Sidebar Navigation (Up/Down)
  if (isInSidebar) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn, .sidebar .link-item, .sidebar button, .sidebar a'));
      const visibleBtns = btns.filter(b => b.offsetParent !== null);
      const idx = visibleBtns.indexOf(activeEl);
      if (idx < visibleBtns.length - 1) visibleBtns[idx + 1].focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn, .sidebar .link-item, .sidebar button, .sidebar a'));
      const visibleBtns = btns.filter(b => b.offsetParent !== null);
      const idx = visibleBtns.indexOf(activeEl);
      if (idx > 0) visibleBtns[idx - 1].focus();
    }
  }

  // Sidebar -> Content (Right Arrow)
  if (isInSidebar && e.key === 'ArrowRight') {
    e.preventDefault();
    const section = document.querySelector('.section.active');
    if (section) {
      const focusable = section.querySelector('input, button, [tabindex="0"]');
      if (focusable) focusable.focus();
    }
  }

  // Content -> Sidebar (Left Arrow)
  if (!isInSidebar && !isInput && e.key === 'ArrowLeft') {
    e.preventDefault();
    const activeSecId = document.querySelector('.section.active')?.id;
    if (activeSecId) {
      const btn = document.querySelector(`.nav-btn[onclick*="'${activeSecId}'"]`);
      if (btn) btn.focus();
    }
  }
});
