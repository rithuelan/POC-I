// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("themeToggle");
let isDark = localStorage.getItem("th_mode") === "dark";
function setThemeIcon() {
  themeToggle.innerHTML = isDark
    ? `<img src="./assets/images/light.svg" width="15" alt="Light mode">`
    : `<img src="./assets/images/dark.svg" width="15" alt="Dark mode">`;
}
function applyTheme() {
  document.body.classList.toggle("dark", isDark);
  setThemeIcon();
}
applyTheme();
themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("th_mode", isDark ? "dark" : "light");
  applyTheme();
});

// DOM references
const openModalBtn = document.getElementById("openModal") || document.querySelector(".add-task");
const modal = document.getElementById("addTaskModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelModalBtn = document.getElementById("cancelModal");
const taskForm = document.getElementById("taskForm");
const taskListEl = document.getElementById("taskList");
const emptyState = document.querySelector(".empty-state");

// FILTER / SORT DOM
const filterSelects = document.querySelectorAll('.filter-card .filters select');
const statusFilter = filterSelects[0];
const priorityFilter = filterSelects[1];
const sortBySelect = document.querySelector('.sort-group select');

// ===== CLEAR FILTER LOGIC =====
const clearFilter = document.querySelector(".filter-group p");

if (clearFilter) {
  clearFilter.addEventListener("click", () => {
    // Refresh the page
    location.reload();
  });
}

// SEARCH BAR
const searchInput = document.querySelector('#taskSearch');

// storage + state
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let editingId = null;

// ====== ✅ SAVE TASKS WITH DASHBOARD SYNC ======
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  window.dispatchEvent(new Event("tasksUpdated"));
}

function saveTasksToStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  window.dispatchEvent(new Event("tasksUpdated"));
}

// helper functions
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-GB");
}
function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

// ===== SORT LOGIC =====
function getSortMeta() {
  const val = sortBySelect ? sortBySelect.value : "Created at";
  let field = "Created at";
  let order = "desc";

  if (val === "Ascending") {
    field = "Title";
    order = "asc";
  } else if (val === "Descending") {
    field = "Title";
    order = "desc";
  } else if (val === "Due date") {
    field = "Due date";
  } else if (val === "Priority") {
    field = "Priority";
  }

  return { field, order };
}

// ===== FILTER + SEARCH + SORT =====
function getFilteredSortedTasks() {
  let list = tasks.slice();

  const status = statusFilter ? statusFilter.value : 'All Status';
  if (status && status !== 'All Status') {
    list = list.filter(t => (t.status || 'Todo') === status);
  }

  const pr = priorityFilter ? priorityFilter.value : 'All Priority';
  if (pr && pr !== 'All Priority') {
    list = list.filter(t => (t.priority || 'Medium') === pr);
  }

  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
  if (searchText) {
    list = list.filter(t => (t.title || "").toLowerCase().includes(searchText));
  }

  const { field, order } = getSortMeta();
  const dir = order === "asc" ? 1 : -1;
  const priorityRank = p => ({ High: 3, Medium: 2, Low: 1 }[p] ?? 2);

  list.sort((a, b) => {
    if (field === "Created at") {
      return ((Number(a.id) || 0) - (Number(b.id) || 0)) * dir;
    }
    if (field === "Due date") {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return (da - db) * dir;
    }
    if (field === "Priority") {
      return (priorityRank(b.priority) - priorityRank(a.priority)) * -dir;
    }
    if (field === "Title") {
      const ta = (a.title || "").toLowerCase();
      const tb = (b.title || "").toLowerCase();
      if (ta < tb) return -1 * dir;
      if (ta > tb) return 1 * dir;
      return 0;
    }
    return 0;
  });

  return list;
}

// ===== ✅ APPLY RULES (BADGE INTEGRATION with AND/OR logic + <, > support) =====
function applyRulesToTasks() {
  const rules = JSON.parse(localStorage.getItem("rules") || "[]");
  console.log("rules", rules);

  const activeRules = rules.filter(
    (r) => r.enabled && (r.type === "tasks" || r.applyTo === "tasks")
  );

  console.log("activeRules", activeRules);

  tasks.forEach((task) => {
    console.log("Applying rules to task:", task);
    task.badges = []; // reset before applying new ones

    activeRules.forEach((rule) => {
      console.log("Evaluating rule:test", rule);
      
      const logicType = (rule.logic || "AND").toUpperCase(); // "AND" or "OR"
      let matched = logicType === "AND" ? true : false;
    

      rule.conditions.forEach((cond) => {
     
        const field = (cond.field || "").toLowerCase();
        const operator = (cond.operator || "").toLowerCase();
        const value = (cond.value || "").toLowerCase();
        console.log("fields",field)
        console.log("value",value)
        console.log("operator",operator)
        let conditionMatched = false;

        switch (field) {
          // ===== PRIORITY =====
          case "priority": {
            const taskPriority = (task.priority || "").toLowerCase();
            const priorityOrder = ["low", "medium", "high"]; // define order
            const taskIndex = priorityOrder.indexOf(taskPriority);
            const valueIndex = priorityOrder.indexOf(value);
            
            switch (operator) {
              case "equals":
                console.log("condition", conditionMatched)
                conditionMatched = taskPriority === value;
                console.log("condition2", conditionMatched)

                break;
              case "not equals":
                conditionMatched = taskPriority !== value;
                break;
              case "less than":
                // valid only if both exist in order list
                conditionMatched =
                  taskIndex !== -1 && valueIndex !== -1 && taskIndex < valueIndex;
                break;
              case "greater than":
                conditionMatched =
                  taskIndex !== -1 && valueIndex !== -1 && taskIndex > valueIndex;
                break;
              default:
                conditionMatched = false;
            }
            break;
          }

          // ===== STATUS =====
          case "status": {
            const taskStatus = (task.status || "").toLowerCase();
            const statusOrder = ["todo", "in progress", "completed"]; // define order
            const taskIndex = statusOrder.indexOf(taskStatus);
            const valueIndex = statusOrder.indexOf(value);

            switch (operator) {
              case "equals":
                conditionMatched = taskStatus === value;
                break;
              case "not equals":
                conditionMatched = taskStatus !== value;
                break;
              case "less than":
                conditionMatched =
                  taskIndex !== -1 && valueIndex !== -1 && taskIndex < valueIndex;
                break;
              case "greater than":
                conditionMatched =
                  taskIndex !== -1 && valueIndex !== -1 && taskIndex > valueIndex;
                break;
              default:
                conditionMatched = false;
            }
            break;
          }


          // ===== DUE DATE =====
          case "due date": {
            const taskDateStr = task.date || "";
            const taskDate = new Date(taskDateStr);
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            // Generate helper dates
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];

            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            // Handle date comparisons
            switch (value) {
              case "today":
                conditionMatched = taskDateStr === todayStr;
                break;
              case "tomorrow":
                conditionMatched = taskDateStr === tomorrowStr;
                break;
              case "yesterday":
                conditionMatched = taskDateStr === yesterdayStr;
                break;
              default:
                // Handle greater than / less than comparisons
                const compareDate = new Date(value);
                if (!isNaN(compareDate)) {
                  if (operator === "less than")
                    conditionMatched = taskDate < compareDate;
                  if (operator === "greater than")
                    conditionMatched = taskDate > compareDate;
                }
            }
            break;
          }

          // ===== DUE IN DAYS (example numeric field) =====
          case "days remaining": {
            const taskDate = new Date(task.date);
            const today = new Date();
            const diffDays = Math.floor(
              (taskDate - today) / (1000 * 60 * 60 * 24)
            );
            const numValue = parseInt(value);

            if (!isNaN(numValue)) {
              switch (operator) {
                case "less than":
                  conditionMatched = diffDays < numValue;
                  break;
                case "greater than":
                  conditionMatched = diffDays > numValue;
                  break;
                case "equals":
                  conditionMatched = diffDays === numValue;
                  break;
                case "not equals":
                  conditionMatched = diffDays !== numValue;
                  break;
              }
            }
            break;
          }

          default:
            conditionMatched = false;
        }

        // ===== Combine logic results =====
        if (logicType === "AND") {
          matched = matched && conditionMatched;
        } else if (logicType === "OR") {
          matched = matched || conditionMatched;
        }

        console.log(
          `Condition [${field} ${operator} ${value}] → ${conditionMatched}, Overall matched: ${matched}`
        );
      });

      // ===== Apply rule if matched =====
      if (matched && rule.action?.type === "badge" && rule.action?.value) {
        if (!task.badges.includes(rule.action.value)) {
          console.log("Adding badge:", rule.action.value);
          task.badges.push(rule.action.value);
        }
      }
    });
  });

  saveTasks();
}


// ===== RENDER TASKS =====
function renderTasks(list = null) {
  applyRulesToTasks(); // ✅ Apply rules before rendering
  taskListEl.innerHTML = "";
  const filtered = list ?? getFilteredSortedTasks();

  if (!filtered.length) {
    const noTask = document.createElement("div");
    noTask.className = "no-task-found align-center";
    noTask.innerHTML = `<img src="./assets/images/clipboard-list-regular.svg" width="80" align="center" style="opacity:0.3; margin-bottom:12px;">
      <p>${(searchInput && searchInput.value) ? "No task found" : "No tasks available"}</p>`;
    taskListEl.appendChild(noTask);
    return;
  }

  filtered.forEach((task, index) => {
    if (task.originalIndex === undefined) task.originalIndex = index;
    const el = createTaskElement(task, index);
    taskListEl.appendChild(el);
  });
}

// ===== CREATE TASK CARD =====
function createTaskElement(task, index) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.setAttribute("draggable", "true");
  card.dataset.id = task.id ?? index;

  const dateText = formatDate(task.date);
  if (!task.subtasks) task.subtasks = [];

  const flagImg = `<img src="./assets/images/flag.svg" width="12" style="vertical-align:middle;margin-right:6px;">`;

  // ✅ Display badges properly
  const badgesHtml = task.badges && task.badges.length
    ? task.badges.map(b => `<span class="task-badge">${escapeHtml(b)}</span>`).join('')
    : '';

  card.innerHTML = `
    <div class="card-left">
      <div class="drag-handle">
        <img src="./assets/images/draggg.svg" width="16" alt="Drag" />
      </div>

      <div class="card-main">
        <div class="title-row">
         <h4 class="task-title ${task.status === "Completed" ? "completed-task" : ""}">
          ${escapeHtml(task.title)}
          ${badgesHtml}
        </h4>
          <div class="card-actions">
            <img src="./assets/images/angle-up-regular.svg" class="icon-img btn-move-up" title="Move up" />
            <img src="./assets/images/angle-down-regular.svg" class="icon-img btn-move-down" title="Move down" />
            <img src="./assets/images/edit-regular.svg" class="icon-img btn-edit" title="Edit" />
            <img src="./assets/images/trash-regular.svg" class="icon-img btn-delete" title="Delete" />
          </div>
        </div>

        <p class="task-desc">${escapeHtml(task.desc || "")}</p>

        <div class="task-info">
          <span class="priority-pill priority-${(task.priority || "").toLowerCase()}">${flagImg}${escapeHtml(task.priority || '')}</span>
          <span class="due-pill">
            <img src="./assets/images/calender.svg" width="12" style="vertical-align:middle; margin-right:4px;">
            ${escapeHtml(dateText)}
          </span>
        </div>
        <div class="task-status">
          <label class="status-label">Status</label>
          <select class="status-dropdown">
            <option ${task.status === "Todo" ? "selected" : ""}>Todo</option>
            <option ${task.status === "In progress" ? "selected" : ""}>In progress</option>
            <option ${task.status === "On hold" ? "selected" : ""}>On hold</option>
            <option ${task.status === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </div>

        <div class="subtask-section">
          <span class="subtask-toggle">▶</span>
          <span> Subtasks (${task.subtasks.length})</span>
        </div>

        <div class="subtask-container" style="display:none;">
          <div class="subtask-input-row">
            <input type="text" class="subtask-input" placeholder="Enter subtask..." required />
            <button class="subtask-add-btn">
              <img src="./assets/images/plus.svg" width="14" alt="Add" />
            </button>
          </div>
          <ul class="subtask-list"></ul>
        </div>
      </div>
    </div>
  `;

  // === Subtask logic ===
  const subToggle = card.querySelector(".subtask-toggle");
  const subContainer = card.querySelector(".subtask-container");
  const subList = card.querySelector(".subtask-list");
  const subInput = card.querySelector(".subtask-input");
  const subAddBtn = card.querySelector(".subtask-add-btn");
  let editIndex = null;

  function renderSubtasks() {
    subList.innerHTML = "";
    task.subtasks.forEach((sub, i) => {
      const li = document.createElement("li");
      li.className = "subtask-item";
      li.innerHTML = `
        <span class="subtask-check">${sub.done ? "✅" : "⬜"}</span>
        <span class="subtask-text" style="${sub.done ? "text-decoration:line-through;opacity:0.6;" : ""}">
          ${escapeHtml(sub.text)}
        </span>
        <div class="subtask-actions">
          <img src="./assets/images/edit-regular.svg" class="sub-edit" title="Edit subtask" />
          <img src="./assets/images/trash-regular.svg" class="sub-delete" title="Delete subtask" />
        </div>
      `;
      li.querySelector(".subtask-check").addEventListener("click", () => {
        task.subtasks[i].done = !task.subtasks[i].done;
        const idx = tasks.findIndex(t => String(t.id) === String(card.dataset.id));
        if (idx >= 0) tasks[idx].subtasks = task.subtasks;
        saveTasks(); renderSubtasks();
      });
      li.querySelector(".sub-delete").addEventListener("click", () => {
        task.subtasks.splice(i, 1);
        const idx = tasks.findIndex(t => String(t.id) === String(card.dataset.id));
        if (idx >= 0) tasks[idx].subtasks = task.subtasks;
        saveTasks(); renderSubtasks();
        card.querySelector(".subtask-section span:nth-child(2)").textContent = ` Subtasks (${task.subtasks.length})`;
      });
      li.querySelector(".sub-edit").addEventListener("click", () => {
        editIndex = i;
        subContainer.style.display = "block";
        subToggle.textContent = "▼";
        subInput.value = sub.text;
        subInput.focus();
      });
      subList.appendChild(li);
    });
  }
  renderSubtasks();

  subToggle.addEventListener("click", () => {
    const isOpen = subContainer.style.display === "block";
    subContainer.style.display = isOpen ? "none" : "block";
    subToggle.textContent = isOpen ? "▶" : "▼";
  });

  subAddBtn.addEventListener("click", () => {
    const text = subInput.value.trim();
    if (!subInput.checkValidity()) {
      subInput.reportValidity();
      return;
    }
    const idx = tasks.findIndex(t => String(t.id) === String(card.dataset.id));
    if (editIndex !== null) {
      task.subtasks[editIndex].text = text;
      if (idx >= 0) tasks[idx].subtasks = task.subtasks;
      editIndex = null;
    } else {
      task.subtasks.push({ text, done: false });
      if (idx >= 0) tasks[idx].subtasks = task.subtasks;
    }
    saveTasks();
    renderSubtasks();
    subInput.value = "";
    card.querySelector(".subtask-section span:nth-child(2)").textContent = ` Subtasks (${task.subtasks.length})`;
  });

  card.querySelector(".btn-delete").addEventListener("click", () => {
    const deleteModal = document.getElementById("deleteConfirmModal");
    const deleteTitleEl = document.getElementById("deleteTaskTitle");
    const cancelBtn = document.getElementById("cancelDelete");
    const confirmBtn = document.getElementById("confirmDelete");
    const closeIcon = document.querySelector(".delete-close");

    // ✅ Fix: use `task.title` or `task.id`, not undefined `t`
    deleteTitleEl.textContent = task.title || "this task";
    deleteModal.style.display = "flex";

    function closeModal() {
      deleteModal.style.display = "none";
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", closeModal);
      closeIcon.removeEventListener("click", closeModal);
      window.removeEventListener("click", handleOutsideClick);
    }

    function handleConfirm() {
      tasks = tasks.filter(t => String(t.id) !== String(card.dataset.id));
      saveTasks();
      renderTasks();
      showToast(`Done! The "${task.title}" task has been deleted.`);
      closeModal();
    }

    function handleOutsideClick(e) {
      if (e.target === deleteModal) closeModal();
    }

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", closeModal);
    closeIcon.addEventListener("click", closeModal);
    window.addEventListener("click", handleOutsideClick);
  });


  card.querySelector(".btn-edit").addEventListener("click", () => {
    editingId = card.dataset.id;
    openModalWithData(editingId);
  });

  card.querySelector(".btn-move-down").addEventListener("click", () => {
    const idx = tasks.findIndex(t => String(t.id) === String(card.dataset.id));
    if (idx < tasks.length - 1) {
      [tasks[idx], tasks[idx + 1]] = [tasks[idx + 1], tasks[idx]];
      saveTasks(); renderTasks();
    }
  });

  card.querySelector(".btn-move-up").addEventListener("click", () => {
    const idx = tasks.findIndex(t => String(t.id) === String(card.dataset.id));
    if (idx > 0) {
      [tasks[idx - 1], tasks[idx]] = [tasks[idx], tasks[idx - 1]];
      saveTasks(); renderTasks();
    }
  });

  // === Status change ===
  card.querySelector(".status-dropdown").addEventListener("change", (e) => {
    const idx = tasks.findIndex(t => String(t.id) === String(card.dataset.id));
    if (idx < 0) return;

    tasks[idx].status = e.target.value;
    const titleEl = card.querySelector(".task-title");

    if (e.target.value === "Completed") {
      titleEl.classList.add("completed-task");
      const [done] = tasks.splice(idx, 1);
      tasks.push(done);
    } else {
      titleEl.classList.remove("completed-task");
      const [todo] = tasks.splice(idx, 1);
      const insertAt = Math.min(tasks[idx]?.originalIndex || 0, tasks.length);
      tasks.splice(insertAt, 0, todo);
    }

    saveTasks();
    renderTasks();
  });

  // === Drag ===
  card.addEventListener("dragstart", (ev) => {
    ev.dataTransfer.setData("text/plain", card.dataset.id);
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  return card;
}

// ===== MODAL =====
function openModalForNew() {
  editingId = null;
  taskForm.reset();
  modal.classList.add("show");
  const t = document.getElementById("taskTitle");
  if (t) t.focus();
}

function openModalWithData(id) {
  const idx = tasks.findIndex(t => String(t.id) === String(id));
  if (idx < 0) return;
  const t = tasks[idx];
  document.getElementById("taskTitle").value = t.title || "";
  document.getElementById("taskDesc").value = t.desc || "";
  document.getElementById("taskDate").value = t.date || t.dueDate || "";
  document.getElementById("taskPriority").value = t.priority || "Medium";
  document.getElementById("taskStatus").value = t.status || "Todo";
  modal.classList.add("show");
  editingId = id;
}

if (openModalBtn) openModalBtn.addEventListener("click", openModalForNew);
if (closeModalBtn) closeModalBtn.addEventListener("click", () => modal.classList.remove("show"));
if (cancelModalBtn) cancelModalBtn.addEventListener("click", () => modal.classList.remove("show"));

// ===== FORM SUBMIT =====
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const date = document.getElementById("taskDate").value;
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value || "Todo";

  if (!title || !date || !priority) {
    alert("Please fill title, date and priority.");
    return;
  }

  if (editingId != null) {
    const idx = tasks.findIndex(t => String(t.id) === String(editingId));
    if (idx >= 0) tasks[idx] = { ...tasks[idx], title, desc, date, priority, status };
    showToast("All set! Your changes have been saved successfully!");
  } else {
    const id = Date.now().toString();
    const newTask = { id, title, desc, date, priority, status, tags: [], badges: [], subtasks: [] };
    tasks.unshift(newTask);
    showToast("Your task has been added!");
  }

  saveTasks();
  renderTasks();
  taskForm.reset();
  modal.classList.remove("show");
  editingId = null;
});

// ===== DRAG-AND-DROP =====
taskListEl.addEventListener("dragover", (ev) => {
  ev.preventDefault();
  const after = getDragAfterElement(taskListEl, ev.clientY);
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;
  if (!after) taskListEl.appendChild(dragging);
  else taskListEl.insertBefore(dragging, after);
});
taskListEl.addEventListener("drop", (ev) => {
  ev.preventDefault();
  const order = Array.from(taskListEl.querySelectorAll(".task-card")).map(el => el.dataset.id);
  tasks = order.map(id => tasks.find(t => String(t.id) === String(id))).filter(Boolean);
  saveTasks();
  renderTasks();
});

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll(".task-card:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===== FILTERS + SEARCH =====
filterSelects.forEach(sel => sel.addEventListener("change", () => renderTasks()));
sortBySelect?.addEventListener("change", () => renderTasks());
searchInput?.addEventListener("input", () => renderTasks());

// ===== Populate SortBy =====
(function initSortOptions() {
  if (!sortBySelect) return;
  sortBySelect.innerHTML = `
    <option>Created at</option>
    <option>Due date</option>
    <option>Priority</option>
    <option>Ascending</option>
    <option>Descending</option>
  `;
})();

// ===== ✅ LISTEN FOR RULES CHANGES =====
window.addEventListener("rulesUpdated", () => {
  renderTasks();
});

// ===== INIT =====
renderTasks();

// ===== UNIVERSAL ENTER KEY HANDLER (Submit / Subtask Add / Delete Confirm) =====
document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;

  const active = document.activeElement;
  // Do nothing if inside a textarea or contenteditable
  if (active && (active.tagName === "TEXTAREA" || active.isContentEditable)) return;

  // helper: safe click
  const safeClick = (el) => { if (!el) return false; el.click(); return true; };

  // 1) Task form submit (works for both Add and Edit modals)
  const taskForm = document.getElementById("taskForm");
  if (taskForm && taskForm.contains(active)) {
    e.preventDefault();
    // prefer native submit button
    const submitBtn = taskForm.querySelector('button[type="submit"], .submit-btn, .save-btn');
    if (safeClick(submitBtn)) return;
    // fallback requestSubmit if available
    if (typeof taskForm.requestSubmit === "function") { taskForm.requestSubmit(); return; }
    taskForm.dispatchEvent(new Event("submit", { cancelable: true })); // fallback
    return;
  }

  // 2) Habit form submit (if you have habit modal)
  const habitForm = document.getElementById("habitForm");
  if (habitForm && habitForm.contains(active)) {
    e.preventDefault();
    const submitBtn = habitForm.querySelector('button[type="submit"], .submit-btn, .update-mode');
    if (safeClick(submitBtn)) return;
    if (typeof habitForm.requestSubmit === "function") { habitForm.requestSubmit(); return; }
    habitForm.dispatchEvent(new Event("submit", { cancelable: true }));
    return;
  }

  // 3) Subtask add — focus must be on the subtask input (.subtask-input)
  if (active && active.classList && active.classList.contains("subtask-input")) {
    const parentCard = active.closest(".task-card");
    const addBtn = parentCard && parentCard.querySelector(".subtask-add-btn, .subtask-add, button.subtask-add-btn");
    if (active.value && active.value.trim() !== "") {
      e.preventDefault();
      if (safeClick(addBtn)) return;
    } else {
      // if empty show validation UI if needed
      // do nothing so Enter won't submit the main form accidentally
      return;
    }
  }

  // 4) If a delete button on a card is focused, pressing Enter should open confirm (click the delete button)
  if (active && active.classList && (active.classList.contains("btn-delete") || active.classList.contains("btn-delete-icon") || active.classList.contains("btn-delete-task"))) {
    e.preventDefault();
    safeClick(active);
    return;
  }

  // 5) If a delete confirmation modal is visible, press Enter to confirm deletion.
  // Try common modal ids/classes and common confirm button selectors.
  const deleteModalCandidates = [
    "#deleteConfirmModal", "#deleteConfirm", "#deleteModal", "#delete-confirm", ".delete-modal", ".confirm-delete-modal"
  ];
  let visibleDeleteModal = null;
  for (const sel of deleteModalCandidates) {
    const m = document.querySelector(sel);
    if (!m) continue;
    // consider it visible if `.show` or `.active` or display != none or style display === 'flex'
    const isVisible = m.classList.contains("show") || m.classList.contains("active") ||
      (m.style && (m.style.display && m.style.display !== "none")) ||
      (window.getComputedStyle(m).display !== "none");
    if (isVisible) { visibleDeleteModal = m; break; }
  }

  if (visibleDeleteModal) {
    e.preventDefault();
    // find confirm button using multiple possible selectors
    const confirmSelectors = [
      "#confirmDelete", "#confirmDeleteBtn", "#confirmDeleteButton", "#confirm", ".confirm-btn", ".confirm-delete", "button.confirm"
    ];
    for (const cs of confirmSelectors) {
      const cb = visibleDeleteModal.querySelector(cs) || document.querySelector(cs);
      if (cb) { safeClick(cb); return; }
    }
    // fallback: try first button inside modal
    const firstBtn = visibleDeleteModal.querySelector("button");
    if (firstBtn) { safeClick(firstBtn); return; }
  }

  // 6) If focus is on a generic clickable icon (img) inside a button (e.g., card action images), allow Enter to trigger parent button
  if (active && active.tagName === "IMG") {
    const parentBtn = active.closest("button, .btn, .icon-img, .card-actions img");
    if (parentBtn) {
      e.preventDefault();
      // if it's an <img> inside a button, click the button; otherwise click the image's parent element
      const clickable = parentBtn.tagName === "BUTTON" ? parentBtn : parentBtn.closest("button") || parentBtn;
      safeClick(clickable);
      return;
    }
  }

  // nothing matched — no-op
});


// === show toast ===
// === show toast ===
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-success";

  toast.innerHTML = `
    <span class="toast-icon">
      <img src="./assets/images/toast.svg" alt="Toast icon">
    </span>
    <span class="toast-msg">${message}</span>
    <span class="toast-close" title="Close">
      <img src="./assets/images/cancelI.svg" alt="Close">
    </span>
  `;

  // Append to body
  document.body.appendChild(toast);

  // Fade in animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Close button logic
  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    });
  }

  // Auto-remove after 2.5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
