// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("themeToggle");
let isDark = localStorage.getItem("theme") === "dark";

function setTheme() {
  if (!themeToggle) return;
  document.body.classList.toggle("dark", isDark);
  themeToggle.innerHTML = isDark
    ? `<img src="./assets/images/light.svg" width="16" alt="Light">`
    : `<img src="./assets/images/dark.svg" width="16" alt="Dark">`;
}
setTheme();

if (themeToggle) {
  themeToggle.onclick = () => {
    isDark = !isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setTheme();
  };
}

// ===== MODAL =====
const modal = document.getElementById("modal");
const addTaskBtn = document.getElementById("addTaskBtn");
const closeModal = document.getElementById("closeModal");

if (addTaskBtn) {
  addTaskBtn.onclick = () => {
    modal?.classList.add("active");
    const form = document.getElementById("ruleForm");
    if (form) {
      form.reset();
      clearErrors(form);
      delete form.dataset.editIndex;
    }
  };
}
if (closeModal) {
  closeModal.onclick = () => {
    modal?.classList.remove("active");
    const form = document.getElementById("ruleForm");
    if (form) {
      form.reset();
      clearErrors(form);
      delete form.dataset.editIndex;
    }
  };
}

// ===== LOCAL STORAGE HELPERS =====
function getRules() {
  try {
    return JSON.parse(localStorage.getItem("rules") || "[]");
  } catch {
    return [];
  }
}

function saveRules(rules) {
  console.log("Saving rules:", rules);
  localStorage.setItem("rules", JSON.stringify(rules));
  console.log("Saving done");
  // Trigger event so tasks.js and habits.js know to reapply rules
  window.dispatchEvent(new Event("rulesUpdated"));
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===== CONDITION LOGIC (dynamic fields) =====
function initConditionLogic(form) {
  if (!form) return;
  const logic = form.querySelector(".logic");
  const addBtn = form.querySelector(".add-condition");
  const group = form.querySelector(".condition-group");

  function updateAndLabels() {
    form.querySelectorAll(".and-label").forEach((e) => e.remove());
    const rows = group.querySelectorAll(".condition-row");
    for (let i = 1; i < rows.length; i++) {
      const lbl = document.createElement("span");
      lbl.className = "and-label";
      lbl.textContent = logic?.value || "AND";
      group.insertBefore(lbl, rows[i]);
    }
  }

  function updateTrashIcons() {
    const rows = group.querySelectorAll(".condition-row");
    rows.forEach((r) => {
      let trash = r.querySelector(".trash-icon");
      if (rows.length > 1) {
        if (!trash) {
          trash = document.createElement("img");
          trash.src = "./assets/images/trash-regular.svg";
          trash.width = 14;
          trash.className = "trash-icon";
          trash.onclick = () => {
            r.remove();
            updateAndLabels();
            updateTrashIcons();
          };
          r.appendChild(trash);
        }
      } else if (trash) trash.remove();
    });
  }

  function updateValueField(row, fieldValue, formType) {
    const existingValueEl = row.querySelector(".dynamic-value");
    if (existingValueEl) existingValueEl.remove();

    let newEl = document.createElement("input");
    newEl.type = "text";
    newEl.placeholder = "Value";
    newEl.className = "dynamic-value";

    if (formType === "tasks") {
      if (fieldValue === "Priority") {
        newEl = document.createElement("select");
        newEl.className = "dynamic-value";
        newEl.innerHTML = `
          <option value="">Select</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        `;
      } else if (fieldValue === "Due date") {
        newEl = document.createElement("select");
        newEl.className = "dynamic-value";
        newEl.innerHTML = `
          <option value="">Select</option>
          <option>Today</option>
          <option>Tomorrow</option>
          <option>Yesterday</option>
        `;
      } else if (fieldValue === "Status") {
        newEl = document.createElement("select");
        newEl.className = "dynamic-value";
        newEl.innerHTML = `
          <option value="">Select</option>
          <option>Todo</option>
          <option>In progress</option>
          <option>On hold</option>
          <option>Completed</option>
        `;
      }
    }

    if (formType === "habits") {
      if (fieldValue === "Frequency") {
        newEl = document.createElement("select");
        newEl.className = "dynamic-value";
        newEl.innerHTML = `
          <option value="">Select</option>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Custom</option>
        `;
      } else if (fieldValue === "Streak") {
        newEl = document.createElement("input");
        newEl.type = "number";
        newEl.className = "dynamic-value";
        newEl.placeholder = "Number of days";
        newEl.min = "0";
      }
    }

    row.appendChild(newEl);
  }

  function addChangeListeners(row) {
    const fieldSelect = row.querySelector("select:first-of-type");
    const formType = form.querySelector(".apply-to")?.value || "tasks";
    if (fieldSelect) {
      fieldSelect.addEventListener("change", (e) => {
        updateValueField(row, e.target.value, formType);
      });
      updateValueField(row, fieldSelect.value, formType);
    }
  }

  if (addBtn) {
    addBtn.onclick = (e) => {
      e.preventDefault();
      const newRow = document.createElement("div");
      newRow.className = "condition-row";
      const formType = form.querySelector(".apply-to")?.value || "tasks";

      if (formType === "tasks") {
        newRow.innerHTML = `
          <select><option value="">Field</option><option>Status</option><option>Priority</option><option>Due date</option></select>
          <select><option value="">Operator</option><option>Equals</option><option>Not Equals</option><option>Greater than</option><option>Less than</option></select>
        `;
      } else {
        newRow.innerHTML = `
          <select><option value="">Field</option><option>Frequency</option><option>Streak</option></select>
          <select><option value="">Operator</option><option>Equals</option><option>Not Equals</option><option>Greater than</option><option>Less than</option></select>
        `;
      }

      group.appendChild(newRow);
      addChangeListeners(newRow);
      updateAndLabels();
      updateTrashIcons();
    };
  }

  group.querySelectorAll(".condition-row").forEach((row) => addChangeListeners(row));
  if (logic) logic.addEventListener("change", updateAndLabels);
  updateAndLabels();
  updateTrashIcons();
}

// ===== VALIDATION =====
function showError(element) {
  if (!element) return;
  element.style.border = "1.5px solid #e63946";
  element.style.backgroundColor = "#fff5f5";
  let msg = element.parentNode.querySelector(".error-msg");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "error-msg";
    msg.textContent = "Please fill out this field";
    msg.style.color = "#e63946";
    msg.style.fontSize = "12px";
    msg.style.marginTop = "4px";
    element.parentNode.appendChild(msg);
  }
}

function clearErrors(form) {
  if (!form) return;
  form.querySelectorAll(".error-msg").forEach((m) => m.remove());
  form.querySelectorAll("input, select, textarea").forEach((el) => {
    el.style.border = "";
    el.style.backgroundColor = "";
  });
}

// ===== FORM VALIDATION & SUBMIT =====
function validateAndSave(form) {
  if (!form) return;
  clearErrors(form);
  let valid = true;
  console.log("form",form)
  const name = form.querySelector('input[type="text"]');
  const desc = form.querySelector("textarea");
  const applyTo = form.querySelector(".apply-to");

  if (!name || !name.value.trim()) {
    showError(name);
    valid = false;
  }
  if (!applyTo || !applyTo.value.trim()) {
    showError(applyTo);
    valid = false;
  }

  const logicSpan = form.querySelector(".and-label");
  const logicType = logicSpan ? logicSpan.textContent.trim().toUpperCase() : "AND";

  const conditionRows = form.querySelectorAll(".condition-row");
  conditionRows.forEach((r) => {
    const selects = r.querySelectorAll("select");
    const valueField = r.querySelector(".dynamic-value");

    if (selects[0] && !selects[0].value.trim()) {
      showError(selects[0]);
      valid = false;
    }
    if (selects[1] && !selects[1].value.trim()) {
      showError(selects[1]);
      valid = false;
    }
    if (valueField && (valueField.value === undefined || !String(valueField.value).trim())) {
      showError(valueField);
      valid = false;
    }
  });

  // Additional validation: ensure action is valid when required
  const actionSection = form.querySelector(".action-section") || form.querySelector(".form-section:last-of-type");
  if (actionSection) {
    const actionSelect = actionSection.querySelector("select");
    const actionInput = actionSection.querySelector("input:not(#actionColor)");
    const actionColorInput = actionSection.querySelector("#actionColor");
    const applyToVal = applyTo?.value || "";

    if (!actionSelect || !actionSelect.value.trim()) {
      // Not strictly necessary, but user UX prefers having an action; only warn (not block) if no action chosen.
      // We'll not make it a blocking validation to keep previous behavior, but we can show a toast.
      // showToast("Consider selecting an action for this rule.", "info");
    } else {
      const typeVal = (actionSelect.value || "").toLowerCase();
      if (applyToVal === "tasks" && typeVal.startsWith("show") && (!actionInput || !actionInput.value.trim())) {
        showError(actionInput || actionSelect);
        valid = false;
      }
      if (applyToVal === "habits" && typeVal === "highlight" && (!actionColorInput || !actionColorInput.value.trim())) {
        showError(actionColorInput || actionSelect);
        valid = false;
      }
    }
  }

  if (!valid) return;

  const conditions = [];
  conditionRows.forEach((r) => {
    const selects = r.querySelectorAll("select");
    const valueField = r.querySelector(".dynamic-value");
    conditions.push({
      field: selects[0]?.value || "",
      operator: selects[1]?.value || "",
      value: valueField?.value || "",
    });
  });

  console.log("conditions from rules",conditions)

  const actionSelect = actionSection?.querySelector("select");
  const actionInput = actionSection?.querySelector("input:not(#actionColor)");
  const actionColorInput = actionSection?.querySelector("#actionColor");

  let actionTypeVal = (actionSelect?.value || "").toLowerCase();
  let actionValueVal = "";

  // For tasks: badge text input
  // For habits: highlight color input
  if (applyTo.value === "tasks") {
    actionValueVal = (actionInput?.value || "").trim();
  } else if (applyTo.value === "habits" && actionTypeVal === "highlight") {
    actionValueVal = (actionColorInput?.value || "").trim();
  }

  // Normalize action type
  if (actionTypeVal.startsWith("show ")) {
    actionTypeVal = actionTypeVal.replace("show ", "");
  }

  const action = {
    type: actionTypeVal.replace(/\s+/g, ""),
    value: actionValueVal,
  };

  const rules = getRules();
  const editIndex = typeof form.dataset.editIndex !== "undefined" ? Number(form.dataset.editIndex) : -1;

  const newRule = {
    id: editIndex >= 0 && rules[editIndex] ? rules[editIndex].id : Date.now(),
    name: name.value.trim(),
    desc: desc?.value.trim() || "",
    applyTo: applyTo.value,
    conditions,
    logic : logicType,
    action,
    enabled: editIndex >= 0 && rules[editIndex] ? rules[editIndex].enabled : true,
  };

  if (editIndex >= 0) {
    rules[editIndex] = newRule;
    showToast("Rule updated successfully!", "success");
    delete form.dataset.editIndex;
  } else {
    rules.push(newRule);
    showToast("Rule added successfully!", "success");
  }

  saveRules(rules);
  renderRules();

  modal?.classList.remove("active");
  form.reset();
}

// ===== SWITCH FORM TYPE =====
function loadForm(type) {
  const form = document.getElementById("ruleForm");
  if (!form) return;
  let html = "";

  if (type === "tasks") {
    html = `
      <input type="text" placeholder="Rule name" />
      <textarea rows="3" placeholder="Description"></textarea>
      <select class="apply-to">
        <option value="">Apply to</option>
        <option value="tasks" selected>Tasks</option>
        <option value="habits">Habits</option>
      </select>
 
      <div class="form-section">
        <div class="section-header">
          <span>Condition</span>
          <select class="logic"><option>AND</option><option>OR</option></select>
        </div>
        <div class="condition-group">
          <div class="condition-row">
            <select><option value="">Field</option><option>Priority</option><option>Due date</option><option>Status</option></select>
            <select><option value="">Operator</option><option>Equals</option><option>Not Equals</option><option>Greater than</option><option>Less than</option></select>
            <input type="text" placeholder="Value" class="dynamic-value" />
          </div>
        </div>
        <a href="#" class="add-condition">+ Add condition</a>
      </div>
 
      <div class="form-section action-section">
        <div class="section-header"><span>Action</span></div>
        <select><option value="">Action</option><option>Show badge</option></select>
        <input type="text" placeholder="Badge text (e.g. Urgent)" />
      </div>
 
      <div class="form-actions">
        <button type="button" class="cancel" id="cancelBtn">Cancel</button>
        <button type="button" class="submit" id="submitBtn">Submit</button>
      </div>
    `;
  } else {
    html = `
      <input type="text" placeholder="Rule name" />
      <textarea rows="3" placeholder="Description"></textarea>
      <select class="apply-to">
        <option value="">Apply to</option>
        <option value="tasks">Tasks</option>
        <option value="habits" selected>Habits</option>
      </select>
 
      <div class="form-section">
        <div class="section-header">
          <span>Condition</span>
          <select class="logic"><option>AND</option><option>OR</option></select>
        </div>
        <div class="condition-group">
          <div class="condition-row">
            <select><option value="">Field</option><option>Frequency</option><option>Streak</option></select>
            <select><option value="">Operator</option><option>Equals</option><option>Not Equals</option><option>Greater than</option><option>Less than</option></select>
            <input type="text" placeholder="Value" class="dynamic-value" />
          </div>
        </div>
        <a href="#" class="add-condition">+ Add condition</a>
      </div>
 
      <div class="form-section action-section">
        <div class="section-header"><span>Action</span></div>
        <select id="actionType"><option value="">Action</option><option value="highlight">Highlight</option></select>
        <div class="color-input-wrapper" style="display:none; margin-top:8px; align-items:center;">
          <label for="actionColor" style="margin-right:8px;">Highlight Color:</label>
          <input type="text" id="actionColor" placeholder="Enter color name or hex (e.g. red or #ff9900)" />
          <div id="colorPreview" class="color-preview" style="width:18px;height:18px;border-radius:4px;margin-left:8px;border:1px solid #ddd;"></div>
        </div>
      </div>
 
      <div class="form-actions">
        <button type="button" class="cancel" id="cancelBtn">Cancel</button>
        <button type="button" class="submit" id="submitBtn">Submit</button>
      </div>
    `;
  }

  form.innerHTML = html;

  const cancelBtn = form.querySelector("#cancelBtn");
  const submitBtn = form.querySelector("#submitBtn");
  const applySelect = form.querySelector(".apply-to");

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal?.classList.remove("active");
      form.reset();
      clearErrors(form);
      delete form.dataset.editIndex;
    };
  }
  if (submitBtn) {
    submitBtn.onclick = () => validateAndSave(form);
  }
  if (applySelect) {
    applySelect.onchange = (e) => loadForm(e.target.value);
  }

  // Highlight Action JS for habits
  const actionType = form.querySelector("#actionType");
  const colorInputWrapper = form.querySelector(".color-input-wrapper");
  const actionColor = form.querySelector("#actionColor");
  const colorPreview = form.querySelector("#colorPreview");

  if (actionType) {
    actionType.addEventListener("change", () => {
      if (colorInputWrapper) colorInputWrapper.style.display = actionType.value === "highlight" ? "flex" : "none";
      if (actionType.value !== "highlight" && actionColor) {
        actionColor.value = "";
        if (colorPreview) colorPreview.style.background = "transparent";
      }
    });
  }

  if (actionColor) {
    actionColor.addEventListener("input", () => {
      const val = actionColor.value.trim();
      if (colorPreview) colorPreview.style.background = val || "transparent";
    });
  }

  initConditionLogic(form);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderRules();
  const initialForm = document.getElementById("ruleForm");
  if (initialForm) initConditionLogic(initialForm);

  const submitBtn = document.getElementById("submitBtn");
  const applySelect = document.querySelector(".apply-to");

  if (submitBtn) submitBtn.onclick = () => validateAndSave(document.getElementById("ruleForm"));
  if (applySelect) applySelect.onchange = (e) => loadForm(e.target.value);

  const formEl = document.getElementById("ruleForm");
  if (formEl) {
    formEl.addEventListener("submit", (ev) => {
      ev.preventDefault();
      validateAndSave(formEl);
    });
  }
});

// ===== DISPLAY RULES (without badge/highlight display) =====
function renderRules() {
  const section = document.querySelector(".rules-section") || document.getElementById("rulesList");
  const emptyState = document.querySelector(".empty-state");
  const rules = getRules();

  if (!section) return;

  if (rules.length === 0) {
    section.innerHTML = "";
    if (emptyState) emptyState.style.display = "flex";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  let html = "";
  rules.forEach((r, i) => {
    html += `
      <div class="rule-card" data-index="${i}">
        <div class="rule-left">
          <div class="rule-header">
            <span class="rule-title">${escapeHtml(r.name)}</span>
            <span class="rule-tag ${r.applyTo === "tasks" ? "task-tag" : "habit-tag"}">
              ${r.applyTo === "tasks" ? "Task" : "Habit"}
            </span>
          </div>
          <p class="rule-desc">${escapeHtml(r.desc || "")}</p>
        </div>
        <div class="rule-right">
          <img src="./assets/images/trash-regular.svg" class="delete" data-index="${i}" width="16">
          <img src="./assets/images/edit-regular.svg" class="edit" data-index="${i}" width="16">
          <label class="switch">
            <input type="checkbox" ${r.enabled ? "checked" : ""} data-index="${i}">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;
  });
  section.innerHTML = html;

  // Event listeners
  section.querySelectorAll(".delete").forEach((btn) => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const allRules = getRules();
      const rule = allRules[index];
      const deleteModal = document.getElementById("deleteConfirmModal");
      const deleteRuleTitle = document.getElementById("deleteRuleTitle");
      const cancelBtn = document.getElementById("cancelDelete");
      const confirmBtn = document.getElementById("confirmDelete");
      const closeIcon = document.querySelector(".delete-close");

      if (!deleteModal || !deleteRuleTitle || !cancelBtn || !confirmBtn) {
        allRules.splice(index, 1);
        saveRules(allRules);
        renderRules();
        showToast("Rule deleted!", "error");
        return;
      }

      deleteRuleTitle.textContent = `Are you sure you want to delete "${rule.name}"?`;
      deleteModal.classList.add("active");

      function closeDeleteModal() {
        deleteModal.classList.remove("active");
        cancelBtn.removeEventListener("click", onCancel);
        confirmBtn.removeEventListener("click", onConfirm);
        if (closeIcon) closeIcon.removeEventListener("click", onCancel);
      }

      function onCancel() {
        closeDeleteModal();
      }

      function onConfirm() {
        allRules.splice(index, 1);
        saveRules(allRules);
        renderRules();
        showToast("Rule deleted!", "error");
        closeDeleteModal();
      }

      cancelBtn.addEventListener("click", onCancel);
      confirmBtn.addEventListener("click", onConfirm);
      if (closeIcon) closeIcon.addEventListener("click", onCancel);
    };
  });

  section.querySelectorAll(".rule-right input[type='checkbox']").forEach((chk) => {
    chk.onchange = () => {
      const index = Number(chk.dataset.index);
      const rules = getRules();
      if (rules[index]) {
        rules[index].enabled = chk.checked;
        saveRules(rules);
      }
    };
  });

  // Edit handler (same as before)
  section.querySelectorAll(".edit").forEach((btn) => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const rules = getRules();
      const rule = rules[index];
      if (!rule) return;
      modal?.classList.add("active");
      loadForm(rule.applyTo);
      const form = document.getElementById("ruleForm");
      if (!form) return;

      form.dataset.editIndex = index;
      const titleInput = form.querySelector('input[type="text"]');
      const descInput = form.querySelector("textarea");
      const applySelect = form.querySelector(".apply-to");

      if (titleInput) titleInput.value = rule.name || "";
      if (descInput) descInput.value = rule.desc || "";
      if (applySelect) applySelect.value = rule.applyTo || "";

      // fill conditions
      const group = form.querySelector(".condition-group");
      group.innerHTML = "";
      if (Array.isArray(rule.conditions) && rule.conditions.length > 0) {
        rule.conditions.forEach((c) => {
          const row = document.createElement("div");
          row.className = "condition-row";
          const formType = rule.applyTo;
          if (formType === "tasks") {
            row.innerHTML = `
              <select><option value="">Field</option><option>Status</option><option>Priority</option><option>Due date</option></select>
              <select><option value="">Operator</option><option>Equals</option><option>Not Equals</option><option>Greater than</option><option>Less than</option></select>
            `;
          } else {
            row.innerHTML = `
              <select><option value="">Field</option><option>Frequency</option><option>Streak</option></select>
              <select><option value="">Operator</option><option>Equals</option><option>Not Equals</option><option>Greater than</option><option>Less than</option></select>
            `;
          }
          group.appendChild(row);
        });
      }
      initConditionLogic(form);
    };
  });
}

// ===== SEARCH FILTER (without badge/highlight display) =====
function showFilteredRules(rules) {
  const section = document.querySelector(".rules-section") || document.getElementById("rulesList");
  const emptyState = document.querySelector(".empty-state");

  if (!section) return;

  if (rules.length === 0) {
    section.innerHTML = "";
    if (emptyState) {
      emptyState.style.display = "flex";
      emptyState.querySelector("p").innerText = "No matching rules found.";
    }
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  let html = "";
  rules.forEach((r, i) => {
    html += `
      <div class="rule-card" data-index="${i}">
        <div class="rule-left">
          <div class="rule-header">
            <span class="rule-title">${escapeHtml(r.name)}</span>
            <span class="rule-tag ${r.applyTo === "tasks" ? "task-tag" : "habit-tag"}">
              ${r.applyTo === "tasks" ? "Task" : "Habit"}
            </span>
          </div>
          <p class="rule-desc">${escapeHtml(r.desc || "")}</p>
        </div>
        <div class="rule-right">
          <img src="./assets/images/trash-regular.svg" class="delete" data-index="${i}" width="16">
          <img src="./assets/images/edit-regular.svg" class="edit" data-index="${i}" width="16">
          <label class="switch">
            <input type="checkbox" ${r.enabled ? "checked" : ""} data-index="${i}">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;
  });
  section.innerHTML = html;


  // Reattach event listeners
  section.querySelectorAll(".delete").forEach((btn) => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const allRules = getRules();
      const rule = allRules[index];
      // Use centralized deleteConfirmModal if present
      const deleteModal = document.getElementById("deleteConfirmModal");
      const deleteRuleTitle = document.getElementById("deleteRuleTitle");
      const cancelBtn = document.getElementById("cancelDelete");
      const confirmBtn = document.getElementById("confirmDelete");
      const closeIcon = document.querySelector(".delete-close");

      if (!deleteModal || !deleteRuleTitle || !cancelBtn || !confirmBtn) {
        // fallback - immediate delete with toast (shouldn't happen if modal exists)
        allRules.splice(index, 1);
        saveRules(allRules);
        renderRules();
        showToast("Rule deleted!", "error");
        return;
      }

      deleteRuleTitle.textContent = `Are you sure you want to delete "${rule.name}"?`;
      deleteModal.classList.add("active");

      function closeDeleteModal() {
        deleteModal.classList.remove("active");
        cancelBtn.removeEventListener("click", onCancel);
        confirmBtn.removeEventListener("click", onConfirm);
        if (closeIcon) closeIcon.removeEventListener("click", onCancel);
      }

      function onCancel() {
        closeDeleteModal();
      }

      function onConfirm() {
        allRules.splice(index, 1);
        saveRules(allRules);
        renderRules();
        showToast("Rule deleted!", "error");
        closeDeleteModal();
      }

      cancelBtn.addEventListener("click", onCancel);
      confirmBtn.addEventListener("click", onConfirm);
      if (closeIcon) closeIcon.addEventListener("click", onCancel);
    };
  });

  section.querySelectorAll(".rule-right input[type='checkbox']").forEach((chk) => {
    chk.onchange = () => {
      const index = Number(chk.dataset.index);
      const rules = getRules();
      if (rules[index]) {
        rules[index].enabled = chk.checked;
        saveRules(rules);
      }
    };
  });

  section.querySelectorAll(".edit").forEach((btn) => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const rules = getRules();
      const rule = rules[index];
      if (!rule) return;

      modal?.classList.add("active");
      loadForm(rule.applyTo);
      const form = document.getElementById("ruleForm");
      if (!form) return;

      form.dataset.editIndex = index;

      const titleInput = form.querySelector('input[type="text"]');
      const descInput = form.querySelector("textarea");
      const applySelect = form.querySelector(".apply-to");

      if (titleInput) titleInput.value = rule.name || "";
      if (descInput) descInput.value = rule.desc || "";
      if (applySelect) applySelect.value = rule.applyTo || "";

      const group = form.querySelector(".condition-group");
      group.innerHTML = "";
      if (Array.isArray(rule.conditions) && rule.conditions.length > 0) {
        rule.conditions.forEach((c) => {
          const row = document.createElement("div");
          row.className = "condition-row";

          if (rule.applyTo === "tasks") {
            const fieldSel = document.createElement("select");
            fieldSel.innerHTML = `<option value="">Field</option>
              <option value="Status">Status</option>
              <option value="Priority">Priority</option>
              <option value="Due date">Due date</option>`;
            fieldSel.value = c.field || "";

            const opSel = document.createElement("select");
            opSel.innerHTML = `<option value="">Operator</option>
              <option value="Equals">Equals</option>
              <option value="Not Equals">Not Equals</option>
              <option value="Greater than">Greater than</option>
              <option value="Less than">Less than</option>`;
            opSel.value = c.operator || "";

            let valEl;
            if (c.field === "Priority") {
              valEl = document.createElement("select");
              valEl.className = "dynamic-value";
              valEl.innerHTML = `<option value="">Select</option><option>High</option><option>Medium</option><option>Low</option>`;
              valEl.value = c.value || "";
            } else if (c.field === "Due date") {
              valEl = document.createElement("select");
              valEl.className = "dynamic-value";
              valEl.innerHTML = `<option value="">Select</option><option>Today</option><option>Tomorrow</option><option>Yesterday</option>`;
              valEl.value = c.value || "";
            } else if (c.field === "Status") {
              valEl = document.createElement("select");
              valEl.className = "dynamic-value";
              valEl.innerHTML = `<option value="">Select</option><option>Todo</option><option>In progress</option><option>On hold</option><option>Completed</option>`;
              valEl.value = c.value || "";
            } else {
              valEl = document.createElement("input");
              valEl.type = "text";
              valEl.className = "dynamic-value";
              valEl.value = c.value || "";
            }

            row.appendChild(fieldSel);
            row.appendChild(opSel);
            row.appendChild(valEl);
          } else {
            const fieldSel = document.createElement("select");
            fieldSel.innerHTML = `<option value="">Field</option>
              <option value="Frequency">Frequency</option>
              <option value="Streak">Streak</option>`;
            fieldSel.value = c.field || "";

            const opSel = document.createElement("select");
            opSel.innerHTML = `<option value="">Operator</option>
              <option value="Equals">Equals</option>
              <option value="Not Equals">Not Equals</option>
              <option value="Greater than">Greater than</option>
              <option value="Less than">Less than</option>`;
            opSel.value = c.operator || "";

            let valEl;
            if (c.field === "Frequency") {
              valEl = document.createElement("select");
              valEl.className = "dynamic-value";
              valEl.innerHTML = `<option value="">Select</option><option>Daily</option><option>Weekly</option><option>Custom</option>`;
              valEl.value = c.value || "";
            } else if (c.field === "Streak") {
              valEl = document.createElement("input");
              valEl.type = "number";
              valEl.className = "dynamic-value";
              valEl.placeholder = "Number of days";
              valEl.min = "0";
              valEl.value = c.value || "";
            } else {
              valEl = document.createElement("input");
              valEl.type = "text";
              valEl.className = "dynamic-value";
              valEl.value = c.value || "";
            }

            row.appendChild(fieldSel);
            row.appendChild(opSel);
            row.appendChild(valEl);
          }

          group.appendChild(row);
        });
      }

      // Prefill action fields
      const actionSection = form.querySelector(".form-section:last-of-type");
      if (actionSection && rule.action) {
        const actionSelect = actionSection.querySelector("select");
        const actionInput = actionSection.querySelector("input:not(#actionColor)");
        const actionColorInput = actionSection.querySelector("#actionColor");
        const colorPreview = actionSection.querySelector("#colorPreview");

        if (actionSelect && rule.action.type) {
          if (rule.action.type === "badge") actionSelect.value = "Show badge";
          else if (rule.action.type === "highlight") actionSelect.value = "highlight";
          else actionSelect.value = rule.action.type;
        }
        if (actionInput && rule.action.value && (actionSelect?.value !== "highlight")) {
          actionInput.value = rule.action.value;
        }
        if (actionColorInput && rule.action.value && actionSelect?.value === "highlight") {
          actionColorInput.value = rule.action.value;
          if (colorPreview) colorPreview.style.background = rule.action.value;
          const wrapper = actionSection.querySelector(".color-input-wrapper");
          if (wrapper) wrapper.style.display = "flex";
        }
      }

      // re-init condition logic so dynamic fields and trash icons appear correctly
      initConditionLogic(form);
    };
  });
}

// ===== SEARCH FILTER =====
const searchInput = document.getElementById("searchRule");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const allRules = getRules();
    const filteredRules = allRules.filter(rule => {
      const name = rule.name?.toLowerCase() || "";
      const desc = rule.desc?.toLowerCase() || "";
      const type = rule.applyTo?.toLowerCase() || "";
      return name.includes(query) || desc.includes(query) || type.includes(query);
    });
    showFilteredRules(filteredRules);
  });
}

function showFilteredRules(rules) {
  const section = document.querySelector(".rules-section") || document.getElementById("rulesList");
  const emptyState = document.querySelector(".empty-state");

  if (!section) return;

  if (rules.length === 0) {
    section.innerHTML = "";
    if (emptyState) {
      emptyState.style.display = "flex";
      emptyState.querySelector("p").innerText = "No matching rules found.";
    }
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Use renderRules logic but with filtered list
  let html = "";
  rules.forEach((r, i) => {
    const actionText = r.action?.value || "";
    const swatchHtml = (r.action?.type === "highlight" && r.action?.value)
      ? `<span class="color-swatch" title="${escapeHtml(r.action.value)}" style="display:inline-block;width:12px;height:12px;border-radius:3px;margin-left:8px;border:1px solid #ddd;background:${escapeHtml(r.action.value)}"></span>`
      : "";

    html += `
      <div class="rule-card" data-index="${i}">
        <div class="rule-left">
          <div class="rule-header">
            <span class="rule-title">${escapeHtml(r.name)}</span>
            <span class="rule-tag ${r.applyTo === "tasks" ? "task-tag" : "habit-tag"}">
              ${r.applyTo === "tasks" ? "Task" : "Habit"}
            </span>
          </div>
          <p class="rule-desc">${escapeHtml(r.desc || "")}</p>
          ${actionText ? `<p class="small"><strong>Badge:</strong> ${escapeHtml(actionText)} ${swatchHtml}</p>` : ""}
        </div>
        <div class="rule-right">
          <img src="./assets/images/trash-regular.svg" class="delete" data-index="${i}" width="16">
          <img src="./assets/images/edit-regular.svg" class="edit" data-index="${i}" width="16">
          <label class="switch">
            <input type="checkbox" ${r.enabled ? "checked" : ""} data-index="${i}">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;
  });
  section.innerHTML = html;

  // Reattach event listeners (same as renderRules)
  section.querySelectorAll(".delete").forEach((btn) => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const allRules = getRules();
      allRules.splice(index, 1);
      saveRules(allRules);
      renderRules();
      showToast("Rule deleted!", "error");
    };
  });

  section.querySelectorAll(".rule-right input[type='checkbox']").forEach((chk) => {
    chk.onchange = () => {
      const index = Number(chk.dataset.index);
      const allRules = getRules();
      if (allRules[index]) {
        allRules[index].enabled = chk.checked;
        saveRules(allRules);
      }
    };
  });
}

// === show toast ===
function showToast(message, type = "success") {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast-${type}`; // e.g., toast-success, toast-error, toast-info

  // Set inner HTML with icon, message, and close button
  toast.innerHTML = `
    <span class="toast-icon">
      <img src="./assets/images/toast.svg" alt="Toast icon">
    </span>
    <span class="toast-msg">${message}</span>
    <span class="toast-close" title="Close">
      <img src="./assets/images/cancelI.svg" alt="Close">
    </span>
  `;

  // Append toast to the container if exists, otherwise to body
  const container = document.getElementById("toast-container") || document.body;
  container.appendChild(toast);

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


// ===== SUBMIT FORM ON ENTER KEY =====
document.addEventListener("keydown", (e) => {
  const form = document.getElementById("ruleForm");
  const modalActive = document.getElementById("modal")?.classList.contains("active");

  if (modalActive && form && e.key === "Enter") {
    const activeElement = document.activeElement;
    // Prevent triggering submit when inside a textarea
    if (activeElement && activeElement.tagName.toLowerCase() === "textarea") return;

    e.preventDefault(); // Prevent default Enter behavior
    const submitBtn = form.querySelector("#submitBtn");
    if (submitBtn) submitBtn.click();
  }
});

// ===== DELETE MODAL ENTER KEY SUPPORT =====
document.addEventListener("keydown", (e) => {
  const deleteModal = document.getElementById("deleteConfirmModal");
  if (deleteModal && deleteModal.classList.contains("active") && e.key === "Enter") {
    e.preventDefault(); // Prevent accidental form submits
    const confirmBtn = document.getElementById("confirmDelete");
    if (confirmBtn) confirmBtn.click();
  }
});