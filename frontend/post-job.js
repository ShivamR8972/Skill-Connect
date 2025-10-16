document.addEventListener("DOMContentLoaded", () => {
  const access = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  if (!access || role !== "recruiter") {
    window.location.href = "auth.html";
    return;
  }

  const form = document.getElementById("postJobForm");
  const urlParams = new URLSearchParams(window.location.search);
  const jobIdToEdit = urlParams.get("edit");
  const isEditMode = !!jobIdToEdit;

  const workModeSelect = document.getElementById("work_mode");
  const locationDiv = document.getElementById("location_div");

  async function initializePage() {
    if (isEditMode) {
      document.title = "Edit Job • Skill Connect";
      document.querySelector("h2").textContent = "Edit Job";
      document.querySelector('button[type="submit"]').textContent =
        "Update Job";

      await loadJobDataForEditing(jobIdToEdit);
    } else {
      await loadSkillsOptions();
    }
  }

  async function loadJobDataForEditing(jobId) {
    try {
      const res = await fetch(`${API}/jobs/job/${jobId}/`, {
        headers: { Authorization: "Bearer " + access },
      });

      if (!res.ok) throw new Error("Failed to fetch job details for editing.");

      const job = await res.json();

      form.title.value = job.title;
      form.pay_per_hour.value = job.pay_per_hour;
      form.requirements.value = job.requirements;
      form.key_responsibilities.value = job.key_responsibilities;
      form.work_mode.value = job.work_mode;

      workModeSelect.dispatchEvent(new Event("change"));
      if (job.location) {
        form.location.value = job.location;
      }

      const selectedSkillIds = job.skills.map((skill) => skill.id.toString());

      await loadSkillsOptions(selectedSkillIds);
    } catch (err) {
      showNotification(err.message, "error");

      setTimeout(() => (window.location.href = "my-jobs.html"), 1500);
    }
  }

  async function loadSkillsOptions(selectedIds = []) {
    try {
      const res = await fetch(`${API}/profiles/skills/`, {
        headers: { Authorization: "Bearer " + access },
      });
      if (!res.ok) throw new Error("Failed to load skills");

      const skills = await res.json();
      const menu = document.getElementById("skills-menu");
      const label = document.getElementById("skills-label");
      const hiddenInput = document.getElementById("skills-hidden");

      menu.innerHTML = "";

      skills.forEach((skill) => {
        const isChecked = selectedIds.includes(skill.id.toString());
        const option = document.createElement("label");
        option.className =
          "flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer";
        option.innerHTML = `
          <input type="checkbox" value="${
            skill.id
          }" class="form-checkbox h-4 w-4 text-blue-600 mr-2" ${
          isChecked ? "checked" : ""
        }>
          <span>${skill.name}</span>
        `;
        menu.appendChild(option);
      });

      function updateSelection() {
        const checked = Array.from(menu.querySelectorAll("input:checked")).map(
          (cb) => ({
            id: cb.value,
            name: cb.nextElementSibling.textContent,
          })
        );
        label.textContent =
          checked.length > 0
            ? checked.map((c) => c.name).join(", ")
            : "Select skills";
        hiddenInput.value = checked.map((c) => c.id).join(",");
      }

      menu.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        checkbox.addEventListener("change", updateSelection);
      });

      updateSelection();
    } catch (err) {
      console.error(err);
    }
  }

  workModeSelect.addEventListener("change", function () {
    const selectedValue = this.value.toLowerCase();
    locationDiv.style.display =
      selectedValue === "inoffice" || selectedValue === "hybrid"
        ? "block"
        : "none";
  });

  const toggle = document.getElementById("skills-toggle");
  const menu = document.getElementById("skills-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("hidden"));
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.add("hidden");
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const url = isEditMode
      ? `${API}/jobs/job/${jobIdToEdit}/edit/`
      : `${API}/jobs/job/create/`;
    const method = isEditMode ? "PATCH" : "POST";

    const selectedSkills = document.getElementById("skills-hidden").value;
    const skillIds = selectedSkills ? selectedSkills.split(",") : [];

    formData.delete("skills");
    skillIds.forEach((id) => formData.append("skills_ids", id));

    try {
      const res = await fetch(url, {
        method: method,
        headers: { Authorization: "Bearer " + access },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          `Failed to ${isEditMode ? "update" : "post"} job ❌ ${JSON.stringify(
            err
          )}`
        );
      }

      showNotification(
        `Job ${isEditMode ? "updated" : "posted"} successfully ✅`,
        "success"
      );

      setTimeout(() => {
        window.location.href = `job-detail.html?id=${jobIdToEdit}`;
      }, 1000);
    } catch (err) {
      showNotification(err.message, "error");
    }
  });

  document.getElementById("logout").addEventListener("click", () => logout());

  initializePage();
});
