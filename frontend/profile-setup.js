document.addEventListener("DOMContentLoaded", () => {
  const ICONS = {
    envelope:
      "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75",
    phone:
      "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z",
    link: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244",
    codeBracket:
      "M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5",
    userCircle:
      "M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  };

  const { access, role } = getAuth();
  if (!access || !role) {
    window.location.href = "./auth.html";
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${access}`,
  };

  const createIconListItem = (iconPath, value, isLink = false) => {
    if (!value) return "";
    let linkHref = value;
    if (isLink && !/^https?:\/\//i.test(value)) {
      linkHref = "https://" + value;
    }
    const displayValue = isLink
      ? `<a href="${linkHref}" target="_blank" class="text-blue-600 hover:underline break-all">${value.replace(
          /^(https?:\/\/)/,
          ""
        )}</a>`
      : `<span class="break-all">${value}</span>`;
    return `
      <li class="flex items-start space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-1"><path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}" /></svg>
        <span class="text-gray-700">${displayValue}</span>
      </li>
    `;
  };

  function renderStarRating(rating, size = "text-xl") {
    if (!rating)
      return '<span class="text-sm text-gray-500">No reviews yet</span>';

    let starsHtml = `<div class="flex items-center">`;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      starsHtml += `<span class="text-yellow-400 ${size}">★</span>`;
    }
    if (halfStar) {
      starsHtml += `<span class="text-yellow-400 ${size}">½</span>`; // Or use a proper half-star icon
    }
    for (let i = 0; i < 5 - fullStars - (halfStar ? 1 : 0); i++) {
      starsHtml += `<span class="text-gray-300 ${size}">★</span>`;
    }
    starsHtml += `<span class="ml-2 text-sm font-semibold text-gray-700">${rating.toFixed(
      1
    )} out of 5</span></div>`;
    return starsHtml;
  }

  // Fetches and renders the list of reviews
  async function loadAndRenderReviews(userId, containerId) {
    const reviewContainer = document.getElementById(containerId);
    if (!reviewContainer) return;

    try {
      const res = await fetch(`${API}/profiles/user/${userId}/reviews/`, {
        headers: { Authorization: `Bearer ${getAuth().access}` },
      });
      if (!res.ok) throw new Error("Could not load reviews.");

      const reviews = await res.json();

      if (reviews.length > 0) {
        reviewContainer.innerHTML = reviews
          .map(
            (review) => `
                <div class="border-t py-4">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-gray-800">${
                          review.reviewer_name
                        }</span>
                        <span class="text-xs text-gray-500">${new Date(
                          review.created_at
                        ).toLocaleDateString()}</span>
                    </div>
                    <div class="mt-1">${renderStarRating(
                      review.rating,
                      "text-lg"
                    )}</div>
                    <p class="text-gray-600 mt-2">${review.comment || ""}</p>
                </div>
            `
          )
          .join("");
      } else {
        reviewContainer.innerHTML =
          '<p class="text-gray-500">This user has not received any reviews yet.</p>';
      }
    } catch (err) {
      reviewContainer.innerHTML =
        '<p class="text-red-500">Could not load reviews.</p>';
    }
  }

  async function loadProfile() {
    try {
      if (role === "recruiter") {
        const res = await fetch(`${API}/profiles/profile/recruiter/me/`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          renderRecruiterView(data);
        } else {
          throw new Error(`Server responded with status: ${res.status}`);
        }
      } else {
        const res = await fetch(`${API}/profiles/profile/freelancer/me/`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          renderFreelancerView(data);
        } else {
          throw new Error(`Server responded with status: ${res.status}`);
        }
      }
    } catch (err) {
      console.error("An error occurred while loading the profile:", err);
      showAlert("Failed to load profile. See console for details.", "error");
    }
  }

  function renderRecruiterView(data) {
    const view = document.getElementById("recruiter-view");
    const form = document.getElementById("recruiter-form");
    if (!view || !form) return;
    view.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
      <div class="flex flex-col md:flex-row items-start md:items-center">
        <div class="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
          ${
            data.company_logo
              ? `<img src="${data.company_logo}" alt="Company Logo" class="w-full h-full object-cover rounded-lg">`
              : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18h18a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 21.75 21H2.25A2.25 2.25 0 0 1 0 18.75V5.25A2.25 2.25 0 0 1 2.25 3Z" /></svg>`
          }
        </div>
        <div>
          <h2 class="text-3xl font-bold text-gray-800">${
            data.company_name || "Company Name N/A"
          }</h2>
          <p class="text-lg text-gray-600 mt-1">${
            data.industry || "Industry not specified"
          }</p>
          <div class="flex items-center text-gray-500 mt-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            <span>${data.location || "Location not specified"}</span>
          </div>
        </div>
        <div class="w-full md:w-auto md:ml-auto mt-4 md:mt-0">
          <button id="edit-recruiter" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Edit Profile</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">About Company</h3>
            <p class="text-gray-700 whitespace-pre-line">${
              data.about || "No description provided."
            }</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">Contact & Links</h3>
            <ul class="space-y-3">
              ${createIconListItem(ICONS.envelope, data.email)}
              ${createIconListItem(ICONS.phone, data.phone)}
              ${createIconListItem(ICONS.link, data.company_website, true)}
              ${createIconListItem(ICONS.userCircle, data.linkedin_url, true)}
            </ul>
        </div>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Reviews Received</h3>
                    <div id="recruiter-reviews-container">
                        <p class="text-gray-500">Loading reviews...</p>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                </div>
        </div>

    </div>
    `;
    view.classList.remove("hidden");
    form.classList.add("hidden");
    document.getElementById("edit-recruiter").onclick = () => {
      form.company_name.value = data.company_name || "";
      form.company_website.value = data.company_website || "";
      form.location.value = data.location || "";
      form.about.value = data.about || "";
      form.industry.value = data.industry || "";
      form.phone.value = data.phone || "";
      form.email.value = data.email || "";
      form.linkedin_url.value = data.linkedin_url || "";
      view.classList.add("hidden");
      form.classList.remove("hidden");
    };
    const cancelRecruiter = document.getElementById("cancel-recruiter");
    if (cancelRecruiter) {
      cancelRecruiter.onclick = (e) => {
        e.preventDefault();
        renderRecruiterView(data);
      };
    }
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        const res = await fetch(`${API}/profiles/profile/recruiter/me/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${access}` },
          body: fd,
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(JSON.stringify(errData));
        }
        const updated = await res.json();
        showAlert("Profile updated ✅");
        renderRecruiterView(updated);
      } catch (err) {
        showAlert(err.message, "error");
      }
    };
    loadAndRenderReviews(data.user_id, 'recruiter-reviews-container');
  }

  function renderFreelancerView(data) {
    const view = document.getElementById("freelancer-view");
    const form = document.getElementById("freelancer-form");
    if (!view || !form) return;
    const skillsHTML =
      data.skills?.length > 0
        ? data.skills
            .map(
              (skill) =>
                `<span class="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium mr-2 mb-2 px-3 py-1 rounded-full">${skill.name}</span>`
            )
            .join("")
        : '<p class="text-gray-500">No skills listed.</p>';
    view.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
      <div class="flex flex-col md:flex-row items-start md:items-center">
        <div class="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
          ${
            data.profilepic_url
              ? `<img src="${data.profilepic_url}" alt="Profile Picture" class="w-full h-full object-cover rounded-lg">`
              : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18h18a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 21.75 21H2.25A2.25 2.25 0 0 1 0 18.75V5.25A2.25 2.25 0 0 1 2.25 3Z" /></svg>`
          }
        </div>
        <div>
          <h2 class="text-3xl font-bold text-gray-800">${
            data.name || "N/A"
          }</h2>
          <p class="text-lg text-gray-600 mt-1">${
            data.experience_display || "Experience not specified"
          }</p>
          <div class="flex items-center text-gray-500 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            <span>${data.location || "Location not specified"}</span>
          </div>
        </div>
        <div class="w-full md:w-auto md:ml-auto mt-4 md:mt-0">
          <button id="edit-freelancer" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Edit Profile</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Skills</h3>
          <div>${skillsHTML}</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Details</h3>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div><dt class="font-medium text-gray-500">Education</dt><dd class="text-gray-800 mt-1">${
              data.education || "N/A"
            }</dd></div>
            <div><dt class="font-medium text-gray-500">Date of Birth</dt><dd class="text-gray-800 mt-1">${
              data.dob || "N/A"
            }</dd></div>
            <div><dt class="font-medium text-gray-500">Availability</dt><dd class="text-gray-800 mt-1">${
              data.availability_display || "N/A"
            }</dd></div>
            <div><dt class="font-medium text-gray-500">Expected Hourly Rate</dt><dd class="text-gray-800 mt-1">${
              data.expected_salary ? `$${data.expected_salary} USD` : "N/A"
            }</dd></div>
          </dl>
        </div>
      </div>
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Contact & Links</h3>
          <ul class="space-y-3">
            ${createIconListItem(ICONS.envelope, data.email)}
            ${createIconListItem(ICONS.phone, data.phone)}
            ${createIconListItem(ICONS.link, data.portfolio_url, true)}
            ${createIconListItem(ICONS.codeBracket, data.github_url, true)}
            ${createIconListItem(ICONS.userCircle, data.linkedin_url, true)}
          </ul>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Resume</h3>
          ${
            data.resume
              ? `<a href="${data.resume}" target="_blank" class="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Download Resume</a>`
              : '<p class="text-gray-500">No resume uploaded.</p>'
          }
        </div>
      </div>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Reviews Received</h3>
                    <div id="freelancer-reviews-container">
                        <p class="text-gray-500">Loading reviews...</p>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                </div>
      </div>
    </div>
    `;
    view.classList.remove("hidden");
    form.classList.add("hidden");
    const editBtn = document.getElementById("edit-freelancer");
    if (editBtn) {
      editBtn.onclick = () => {
        form.name.value = data.name || "";
        form.dob.value = data.dob || "";
        form.phone.value = data.phone || "";
        form.email.value = data.email || "";
        form.location.value = data.location || "";
        form.education.value = data.education || "";
        form.experience.value = data.experience || "";
        form.portfolio_url.value = data.portfolio_url || "";
        form.github_url.value = data.github_url || "";
        form.linkedin_url.value = data.linkedin_url || "";
        form.expected_salary.value = data.expected_salary || "";
        form.availability.value = data.availability || "";
        const resumeDisplay = document.getElementById("current-resume-display");
        if (data.resume) {
          resumeDisplay.innerHTML = `
            <p class="mb-1">
              <b>Current Resume:</b> 
              <a href="${data.resume}" target="_blank" class="text-blue-600 hover:underline">View File</a>
            </p>
            <p class="text-xs text-gray-500">Upload a new file below only if you want to replace it.</p>
          `;
        } else {
          resumeDisplay.innerHTML = "";
        }
        const selectedIds = data.skills
          ? data.skills.map((s) => s.id.toString())
          : [];
        loadSkillsOptions(selectedIds);
        view.classList.add("hidden");
        form.classList.remove("hidden");
      };
    }
    const cancelFreelancer = document.getElementById("cancel-freelancer");
    if (cancelFreelancer) {
      cancelFreelancer.onclick = (e) => {
        e.preventDefault();
        renderFreelancerView(data);
      };
    }
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const selectedSkills = Array.from(
        document.querySelectorAll("#skills-menu input[type='checkbox']:checked")
      ).map((cb) => cb.value);
      fd.delete("skills");
      selectedSkills.forEach((id) => fd.append("skill_ids", id));
      try {
        const res = await fetch(`${API}/profiles/profile/freelancer/me/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${access}` },
          body: fd,
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(JSON.stringify(errData));
        }
        const updated = await res.json();
        showAlert("Profile updated ✅");
        renderFreelancerView(updated);
      } catch (err) {
        showAlert(err.message, "error");
      }
    };
    loadAndRenderReviews(data.user_id, 'freelancer-reviews-container');
  }

  async function loadSkillsOptions(selectedIds = []) {
    try {
      const res = await fetch(`${API}/profiles/skills/`);
      if (res.ok) {
        const skills = await res.json();
        const menu = document.getElementById("skills-menu");
        const label = document.getElementById("skills-label");
        const hiddenInput = document.getElementById("skills-hidden");
        if (!menu || !label || !hiddenInput) return;
        menu.innerHTML = "";
        skills.forEach((skill) => {
          const isChecked = selectedIds.includes(skill.id.toString());
          const option = document.createElement("label");
          option.className =
            "flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer";
          option.innerHTML = `<input type="checkbox" value="${
            skill.id
          }" class="form-checkbox h-4 w-4 text-blue-600 mr-2" ${
            isChecked ? "checked" : ""
          }><span>${skill.name}</span>`;
          menu.appendChild(option);
        });
        function updateSelection() {
          const checked = Array.from(
            menu.querySelectorAll("input[type='checkbox']:checked")
          ).map((cb) => ({
            id: cb.value,
            name: cb.nextElementSibling.textContent,
          }));
          label.textContent =
            checked.length > 0
              ? checked.map((c) => c.name).join(", ")
              : "Select skills";
          hiddenInput.value = checked.map((c) => c.id).join(",");
        }
        menu.querySelectorAll("input[type='checkbox']").forEach((cb) => {
          cb.addEventListener("change", updateSelection);
        });
        updateSelection();
      }
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  }

  loadSkillsOptions();
  loadProfile();
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("skills-toggle");
  const menu = document.getElementById("skills-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      menu.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.add("hidden");
      }
    });
  }
});
