document.addEventListener("DOMContentLoaded", () => {
  // ===== THEME TOGGLE =====
  const themeToggle = document.getElementById("themeToggle");
  let isDark = localStorage.getItem("th_mode") === "dark";

  function applyTheme() {
    document.body.classList.toggle("dark", isDark);
    if (themeToggle) {
      themeToggle.innerHTML = isDark
        ? `<img src="./assets/images/light.svg" width="18" alt="Light mode">`
        : `<img src="./assets/images/dark.svg" width="18" alt="Dark mode">`;
    }
  }

  applyTheme();

  if (themeToggle) {
    themeToggle.onclick = () => {
      isDark = !isDark;
      localStorage.setItem("th_mode", isDark ? "dark" : "light");
      applyTheme();
    };
  }

  // ===== TOAST FUNCTION =====
  function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.innerHTML = `
        <div class="toast-icon">✔</div>
        <div class="toast-message"></div>
        <div class="toast-close">&times;</div>
      `;
      document.body.appendChild(toast);
    }

    const msg = toast.querySelector(".toast-message");
    msg.textContent = message;
    toast.classList.add("show");

    const timeout = setTimeout(() => toast.classList.remove("show"), 4000);
    toast.querySelector(".toast-close").onclick = () => {
      toast.classList.remove("show");
      clearTimeout(timeout);
    };
  }

  // ===== ELEMENTS =====
  const addHabitBtn = document.getElementById("addHabitBtn");
  const habitModal = document.getElementById("habitModal");
  const closeIcon = document.getElementById("closeIcon");
  const closeModal = document.getElementById("closeModal");
  const habitForm = document.getElementById("habitForm");
  const habitList = document.getElementById("habitList");
  const emptyState = document.getElementById("emptyState");
  const submitBtn = document.querySelector("#habitForm button[type='submit']");
  const frequencySelect = document.getElementById("habitFrequency");
  const chooseDayContainer = document.getElementById("chooseDayContainer");
  const chooseDayInput = document.getElementById("chooseDayInput");
  const daysDropdown = document.getElementById("daysDropdown");
  const searchInput = document.getElementById("searchInput");
  const filterFrequency = document.getElementById("filterFrequency");
  const sortBy = document.getElementById("sortBy");

  if (!habitList) throw new Error("Missing #habitList element in HTML");

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  let selectedDays = [];
  let habits = JSON.parse(localStorage.getItem("habits")) || [];
  let editingHabitId = null;
  let selectedDate = null;

  // ===== VALIDATION HELPERS =====
  function showFieldError(field, message) {
    // Remove existing error
    clearFieldError(field);

    // Add error styling
    field.style.borderColor = "#ef4444";
    field.style.borderWidth = "2px";

    // Create error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "field-error";
    errorDiv.style.color = "#ef4444";
    errorDiv.style.fontSize = "12px";
    errorDiv.style.marginTop = "4px";
    errorDiv.textContent = message;

    // Insert after field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
  }

  function clearFieldError(field) {
    field.style.borderColor = "";
    field.style.borderWidth = "";

    const nextEl = field.nextSibling;
    if (nextEl && nextEl.className === "field-error") {
      nextEl.remove();
    }
  }

  function clearAllErrors() {
    const nameField = document.getElementById("habitName");
    const freqField = document.getElementById("habitFrequency");
    const dayField = document.getElementById("chooseDayInput");

    clearFieldError(nameField);
    clearFieldError(freqField);
    if (dayField) {
      dayField.style.borderColor = "";
      dayField.style.borderWidth = "";
      const nextEl = dayField.nextSibling;
      if (nextEl && nextEl.className === "field-error") {
        nextEl.remove();
      }
    }
  }

  function validateHabitForm() {
    clearAllErrors();
    let isValid = true;

    const nameField = document.getElementById("habitName");
    const freqField = document.getElementById("habitFrequency");
    const dayField = document.getElementById("chooseDayInput");

    // Validate habit name
    if (!nameField.value.trim()) {
      showFieldError(nameField, "Habit name is required");
      isValid = false;
    }

    // Validate frequency
    if (!freqField.value) {
      showFieldError(freqField, "Please select a frequency");
      isValid = false;
    }

    // Validate days selection for weekly/custom
    if ((freqField.value === "weekly" || freqField.value === "custom") && selectedDays.length === 0) {
      if (dayField) {
        dayField.style.borderColor = "#ef4444";
        dayField.style.borderWidth = "2px";

        const errorDiv = document.createElement("div");
        errorDiv.className = "field-error";
        errorDiv.style.color = "#ef4444";
        errorDiv.style.fontSize = "12px";
        errorDiv.style.marginTop = "4px";
        errorDiv.textContent = "Please select at least one day";

        dayField.parentNode.insertBefore(errorDiv, dayField.nextSibling);
      }
      isValid = false;
    }

    return isValid;
  }

  // ===== MODAL CONTROL =====
  if (addHabitBtn)
    addHabitBtn.onclick = () => {
      resetHabitForm();
      habitModal.classList.add("active");
    };

  if (closeIcon) closeIcon.onclick = closeModal.onclick = () => {
    resetHabitForm();
    habitModal.classList.remove("active");
  };

  function resetHabitForm() {
    habitForm.reset();
    selectedDays = [];
    chooseDayInput.textContent = "Choose Day";
    chooseDayContainer.classList.add("hidden");
    daysDropdown.classList.remove("show");
    daysDropdown.innerHTML = "";
    editingHabitId = null;
    submitBtn.textContent = "Add Habit";
    submitBtn.classList.remove("update-mode");
    clearAllErrors();
  }

  // ===== CLEAR ERRORS ON INPUT =====
  document.getElementById("habitName").addEventListener("input", function () {
    if (this.value.trim()) clearFieldError(this);
  });

  frequencySelect.addEventListener("change", function () {
    if (this.value) clearFieldError(this);
  });

  // ===== SHOW/HIDE CHOOSE DAY =====
  frequencySelect.addEventListener("change", () => {
    if (frequencySelect.value === "weekly" || frequencySelect.value === "custom") {
      chooseDayContainer.classList.remove("hidden");
    } else {
      chooseDayContainer.classList.add("hidden");
      selectedDays = [];
      chooseDayInput.textContent = "Choose Day";
      daysDropdown.classList.remove("show");
      daysDropdown.innerHTML = "";
      const dayField = document.getElementById("chooseDayInput");
      if (dayField) {
        dayField.style.borderColor = "";
        dayField.style.borderWidth = "";
        const nextEl = dayField.nextSibling;
        if (nextEl && nextEl.className === "field-error") {
          nextEl.remove();
        }
      }
    }
  });

  // ===== CHOOSE DAY DROPDOWN =====
  chooseDayInput.addEventListener("click", () => {
    if (frequencySelect.value !== "weekly" && frequencySelect.value !== "custom") return;
    daysDropdown.classList.toggle("show");
    daysDropdown.innerHTML = "";

    const ul = document.createElement("ul");
    ul.classList.add("days-list");

    allDays.forEach(day => {
      const li = document.createElement("li");
      li.className = "day-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selectedDays.includes(day);

      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        if (frequencySelect.value === "weekly") {
          selectedDays = [day];
          ul.querySelectorAll("input").forEach(inp => inp.checked = (inp === checkbox));
        } else {
          if (selectedDays.includes(day)) selectedDays = selectedDays.filter(d => d !== day);
          else selectedDays.push(day);
        }
        chooseDayInput.textContent = selectedDays.length ? selectedDays.join(", ") : "Choose Day";

        // Clear error when day is selected
        if (selectedDays.length > 0) {
          const dayField = document.getElementById("chooseDayInput");
          if (dayField) {
            dayField.style.borderColor = "";
            dayField.style.borderWidth = "";
            const nextEl = dayField.nextSibling;
            if (nextEl && nextEl.className === "field-error") {
              nextEl.remove();
            }
          }
        }
      });

      const label = document.createElement("label");
      label.textContent = day;
      label.addEventListener("click", () => checkbox.click());

      li.append(checkbox, label);
      ul.appendChild(li);
    });

    daysDropdown.appendChild(ul);
  });

  // ===== DATE HELPERS =====
  function isoDate(y, m, d) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function formatLabel(iso) {
    const dt = new Date(iso + "T00:00:00");
    const dayNum = dt.getDate();
    const weekday = dt.toLocaleString('en-GB', { weekday: 'short' });
    return `<div class="date-num">${dayNum}</div><div class="date-day">${weekday}</div>`;
  }

  function addDaysToDate(dateObj, offset) {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + offset);
    return d;
  }

  function nextNDays(startDate, n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const d = addDaysToDate(startDate, i);
      arr.push(isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
    }
    return arr;
  }

  function nextKWeekdayOccurrences(startDate, weekdayName, k) {
    const arr = [];
    const start = new Date(startDate);
    let cursor = new Date(start);
    while (arr.length < k) {
      const name = cursor.toLocaleString('en-GB', { weekday: 'long' });
      if (name === weekdayName) arr.push(isoDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
      cursor.setDate(cursor.getDate() + 1);
    }
    return arr;
  }

  function nextOccurrencesForMultipleWeekdays(startDate, selectedWeekdays, countWanted) {
    const arr = [];
    const start = new Date(startDate);
    let cursor = new Date(start);
    while (arr.length < countWanted) {
      const name = cursor.toLocaleString('en-GB', { weekday: 'long' });
      if (selectedWeekdays.includes(name))
        arr.push(isoDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
      cursor.setDate(cursor.getDate() + 1);
    }
    return arr;
  }

  // ===== ADD / UPDATE HABIT =====
  habitForm.addEventListener("submit", e => {
    e.preventDefault();

    // Validate form
    if (!validateHabitForm()) {
      return;
    }

    const name = document.getElementById("habitName").value.trim();
    const desc = document.getElementById("habitDescription").value.trim();
    const freq = frequencySelect.value;

    const created = new Date();
    let dateISOs = [];

    if (freq === "daily") dateISOs = nextNDays(created, 7);
    else if (freq === "weekly") dateISOs = nextKWeekdayOccurrences(created, selectedDays[0], 7);
    else if (freq === "custom") dateISOs = nextOccurrencesForMultipleWeekdays(created, selectedDays, 7);

    const dates = dateISOs.map(iso => ({
      iso,
      label: formatLabel(iso),
      completed: false,
      missed: false
    }));

    if (editingHabitId) {
      const index = habits.findIndex(h => h.id === editingHabitId);
      if (index !== -1) {
        habits[index] = {
          ...habits[index],
          name,
          desc,
          freq,
          days: selectedDays.slice(),
          dates,
        };
        localStorage.setItem("habits", JSON.stringify(habits));
        showToast("Habit updated successfully!");
      }
    } else {
      const habit = {
        id: Date.now(),
        name,
        desc,
        freq,
        days: selectedDays.slice(),
        streak: 0,
        dates,
        created: created.toISOString()
      };
      habits.push(habit);
      localStorage.setItem("habits", JSON.stringify(habits));
      showToast("Habit added successfully!");
    }

    applyFiltersAndRender();
    resetHabitForm();
    habitModal.classList.remove("active");
    window.dispatchEvent(new Event("habitsUpdated"));
  });

  // ===== ENTER KEY NAVIGATION & SUBMIT =====
  habitForm.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const focusable = Array.from(
      habitForm.querySelectorAll("input, select, textarea, button")
    ).filter(el => !el.disabled && el.offsetParent !== null);

    const index = focusable.indexOf(e.target);

    e.preventDefault();

    if (e.target.tagName === "TEXTAREA" && !e.shiftKey) {
      e.stopPropagation();
      return;
    }

    if (index > -1 && index < focusable.length - 1) {
      focusable[index + 1].focus();
    } else {
      submitBtn.click();
    }
  });

  // ===== APPLY RULES TO HABITS =====
function checkRuleMatch(habit, rule) {
    if (!rule.enabled || !rule.conditions || rule.conditions.length === 0) return false;

    const logicType = (rule.logic || "AND").toUpperCase();
    
    // For AND: start with true, all must pass
    // For OR: start with false, at least one must pass
    let matched = logicType === "AND";

    rule.conditions.forEach(cond => {
      const field = (cond.field || "").toLowerCase();
      const operator = (cond.operator || "").toLowerCase();
      const value = (cond.value || "").toLowerCase();

      let conditionMatched = false;

      switch (field) {
        case "frequency": {
          const habitFreq = (habit.freq || "").toLowerCase();
          switch (operator) {
            case "equals":
              conditionMatched = habitFreq === value;
              break;
            case "not equals":
              conditionMatched = habitFreq !== value;
              break;
            case "less than":
              if (habitIndex !== -1 && valueIndex !== -1) {
                conditionMatched = habitIndex < valueIndex;
              }
              break;
            case "greater than":
              if (habitIndex !== -1 && valueIndex !== -1) {
                conditionMatched = habitIndex > valueIndex;
              }
              break;
            default:
              conditionMatched = false;
          }
          break;
        }

        case "streak": {
          const habitStreak = parseInt(habit.streak || 0);
          const ruleValue = parseInt(value) || 0;
          switch (operator) {
            case "equals":
              conditionMatched = habitStreak === ruleValue;
              break;
            case "not equals":
              conditionMatched = habitStreak !== ruleValue;
              break;
            case "greater than":
              conditionMatched = habitStreak > ruleValue;
              break;
            case "less than":
              conditionMatched = habitStreak < ruleValue;
              break;
            default:
              conditionMatched = false;
          }
          break;
        }

        case "streak status": {
          const statusOrder = ["broken", "active", "consistent"];
          const habitStatus = (habit.streakStatus || "").toLowerCase();
          const habitIndex = statusOrder.indexOf(habitStatus);
          const valueIndex = statusOrder.indexOf(value);

          if (habitIndex !== -1 && valueIndex !== -1) {
            switch (operator) {
              case "equals":
                conditionMatched = habitStatus === value;
                break;
              case "not equals":
                conditionMatched = habitStatus !== value;
                break;
              case "less than":
                conditionMatched = habitIndex < valueIndex;
                break;
              case "greater than":
                conditionMatched = habitIndex > valueIndex;
                break;
            }
          }
          break;
        }

        default:
          conditionMatched = false;
      }

      if (logicType === "AND") {
        matched = matched && conditionMatched;
      } else if (logicType === "OR") {
        matched = matched || conditionMatched;
      }
    });

    return matched;
  }

// ===== RENDER HABITS =====
  function renderHabits(listOverride = null) {
    const list = listOverride || habits;
    habitList.innerHTML = "";
    if (!list.length) {
      emptyState.style.display = "flex";
      return;
    }
    emptyState.style.display = "none";

    const rules = JSON.parse(localStorage.getItem("rules")) || [];
    const habitHighlightRules = rules.filter(r =>
      r.applyTo === "habits" &&
      r.enabled &&
      r.action?.type === "highlight" &&
      r.action?.value
    );

    const todayIso = isoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

    list.forEach(h => {
      h.dates.forEach(d => {
        if (new Date(d.iso) < new Date(todayIso) && !d.completed) {
          d.missed = true;
        }
      });

      const card = document.createElement("div");
      card.className = "habit-card";

      // Check if ALL past dates (including today) are completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allPastDates = h.dates.filter((d) => {
        const dateObj = new Date(d.iso);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj <= today;
      });

      const everyPastDateComplete = allPastDates.length > 0 && allPastDates.every((d) => d.completed);

      const datesHtml = (h.dates || []).map(d => {
        let stateClass = "";
        if (d.completed) stateClass = " done";
        else if (d.missed) stateClass = " missed";
        return `<div class="day-box${stateClass}" data-habit-id="${h.id}" data-iso="${d.iso}">${d.label}</div>`;
      }).join("");

      card.innerHTML = `
        <div class="habit-header">
          <h4>${escapeHtml(h.name)}</h4>
          <div class="right-icons">
            <button class="icon-btn delete-btn" onclick="deleteHabit(${h.id})"><img src="./assets/images/trash-regular.svg" alt="delete"></button>
            <button class="icon-btn edit-btn" onclick="editHabit(${h.id})"><img src="./assets/images/edit-regular.svg" alt="edit"></button>
            <button class="mark-top-btn ${everyPastDateComplete ? "completed" : ""}">
              ${everyPastDateComplete ? "Completed" : "Mark Complete"}
            </button>
          </div>
        </div>
        <p class="habit-desc">${escapeHtml(h.desc || "")}</p>
        <div class="habit-meta">
          <span class="freq-tag">🗓️ ${escapeHtml(h.freq.charAt(0).toUpperCase() + h.freq.slice(1))}</span>
          <span class="streak-tag">🔥 ${h.streak} day streak</span>
        </div>
        <div class="habit-days">${datesHtml}</div>
      `;

      habitHighlightRules.forEach(rule => {
        if (checkRuleMatch(h, rule)) {
          const color = rule.action.value;
          card.style.border = `2px solid ${color}`;
          card.style.boxShadow = `0 0 8px ${color}40`;
        }
      });

      habitList.appendChild(card);
    });

    localStorage.setItem("habits", JSON.stringify(habits));
    window.dispatchEvent(new Event("habitsUpdated"));
  }
  // ===== SEARCH + FILTER + SORT =====
  function applyFiltersAndRender() {
    let list = [...habits];

    const query = searchInput?.value?.trim().toLowerCase() || "";
    if (query) list = list.filter(h => h.name.toLowerCase().includes(query) || (h.desc && h.desc.toLowerCase().includes(query)));

    const freq = filterFrequency?.value;
    if (freq && freq !== "All Frequency") list = list.filter(h => h.freq.toLowerCase() === freq.toLowerCase());

    const sortValue = sortBy?.value;
    if (sortValue === "Streak") list.sort((a, b) => b.streak - a.streak);
    else if (sortValue === "Created at") list.sort((a, b) => new Date(b.created) - new Date(a.created));
    else if (sortValue === "Ascending") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortValue === "Descending") list.sort((a, b) => b.name.localeCompare(a.name));

    renderHabits(list);
  }

  if (searchInput && filterFrequency && sortBy) {
    searchInput.addEventListener("input", applyFiltersAndRender);
    filterFrequency.addEventListener("change", applyFiltersAndRender);
    sortBy.addEventListener("change", applyFiltersAndRender);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  // ===== MARK COMPLETE =====

  // ===== DELETE & EDIT =====
  let habitToDelete = null;

  window.deleteHabit = (id) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    habitToDelete = id;
    document.getElementById("deleteMessage").textContent =
      `Are you sure you want to delete "${habit.name}"?`;

    document.getElementById("deletePopup").classList.add("active");
  };

  const closePopup = () => {
    document.getElementById("deletePopup").classList.remove("active");
    habitToDelete = null;
  };

  document.getElementById("closeDeletePopup").onclick = closePopup;
  document.getElementById("cancelDeleteBtn").onclick = closePopup;

  document.getElementById("confirmDeleteBtn").onclick = () => {
    if (habitToDelete) {
      habits = habits.filter(h => h.id !== habitToDelete);
      localStorage.setItem("habits", JSON.stringify(habits));
      applyFiltersAndRender();
      window.dispatchEvent(new Event("habitsUpdated"));
      showToast("Habit deleted successfully!");
    }
    closePopup();
  };

  window.editHabit = id => {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    document.getElementById("habitName").value = h.name;
    document.getElementById("habitDescription").value = h.desc || "";
    frequencySelect.value = h.freq;
    selectedDays = [...(h.days || [])];
    chooseDayInput.textContent = selectedDays.length ? selectedDays.join(", ") : "Choose Day";
    if (h.freq === "weekly" || h.freq === "custom") chooseDayContainer.classList.remove("hidden");
    editingHabitId = h.id;
    submitBtn.textContent = "Update Habit";
    submitBtn.classList.add("update-mode");
    habitModal.classList.add("active");
    clearAllErrors();
  };

  // ===== CLEAR FILTER =====
  const clearFilter = document.querySelector(".filter-card p");
  if (clearFilter) {
    clearFilter.addEventListener("click", () => {
      location.reload();
    });
  }

// ===== SELECT DATE =====
habitList.addEventListener("click", (e) => {
  const box = e.target.closest(".day-box");
  const markBtn = e.target.classList.contains("mark-top-btn");

  // === MARK COMPLETE BUTTON ===
  if (markBtn) {
    const card = e.target.closest(".habit-card");
    const id = parseInt(
      card.querySelector(".delete-btn").getAttribute("onclick").match(/\d+/)[0]
    );
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // All past & today dates
    const pastDates = habit.dates.filter((d) => {
      const dateObj = new Date(d.iso);
      dateObj.setHours(0, 0, 0, 0);
      return dateObj <= today;
    });

    // Check if button currently shows "Completed"
    const isCurrentlyCompleted = e.target.classList.contains("completed");

    if (isCurrentlyCompleted) {
      // Revert back - mark all as incomplete
      pastDates.forEach((d) => {
        d.completed = false;
        d.missed = false;
      });
    } else {
      // Mark all past & today as complete (even if some are already green)
      pastDates.forEach((d) => {
        d.completed = true;
        d.missed = false;
      });
    }

    habit.streak = habit.dates.filter((d) => d.completed).length;
    localStorage.setItem("habits", JSON.stringify(habits));
    applyFiltersAndRender();
    return;
  }

  // === INDIVIDUAL DATE CLICK ===
  if (box) {
    const habitId = parseInt(box.dataset.habitId);
    const iso = box.dataset.iso;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayIso = isoDate(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      new Date().getDate()
    );
    
    const clickedDate = new Date(iso);
    clickedDate.setHours(0, 0, 0, 0);
    const todayDate = new Date(todayIso);
    todayDate.setHours(0, 0, 0, 0);
    
    // Prevent clicking future dates
    if (clickedDate > todayDate) return;

    // Toggle individual date
    const dateData = habit.dates.find((d) => d.iso === iso);
    if (!dateData) return;
    dateData.completed = !dateData.completed;
    dateData.missed = false;

    habit.streak = habit.dates.filter((d) => d.completed).length;

    localStorage.setItem("habits", JSON.stringify(habits));
    applyFiltersAndRender();
  }
});
  // ===== INIT =====
  applyFiltersAndRender();
});

// ===== GLOBAL ENTER KEY SUPPORT =====
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  if (habitModal.classList.contains("active")) {
    if (document.activeElement.closest("#habitForm")) {
      e.preventDefault();
      submitBtn.click();
    }
  }

  const deletePopup = document.getElementById("deletePopup");
  if (deletePopup && deletePopup.classList.contains("active")) {
    e.preventDefault();
    document.getElementById("confirmDeleteBtn").click();
  }
});