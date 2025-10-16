const access = localStorage.getItem("access");
const role = localStorage.getItem("role");

if (!access || role !== "freelancer") {
  window.location.href = "auth.html";
}

let currentPage = 1;
let isLoading = false;
let hasMoreJobs = true;


function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

const applyModal = document.getElementById('apply-modal');
const modalTitle = document.getElementById('modal-title');
const coverLetterInput = document.getElementById('cover-letter-input');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
let currentJobId = null;

function openApplyModal(jobId, jobTitle) {
    event.stopPropagation(); // Prevent the parent link from firing
    event.preventDefault();
    currentJobId = jobId;
    modalTitle.textContent = `Apply for "${jobTitle}"`;
    coverLetterInput.value = '';
    applyModal.classList.remove('hidden');
}

function closeApplyModal() {
    applyModal.classList.add('hidden');
}

modalCancelBtn.addEventListener('click', closeApplyModal);
modalSubmitBtn.addEventListener('click', submitApplication);

async function submitApplication() {
    if (!currentJobId) return;

    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = 'Submitting...';

    const coverLetter = coverLetterInput.value;

    try {
        const res = await fetch(`${API}/jobs/application/apply/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + access,
            },
            body: JSON.stringify({
                job: currentJobId,
                cover_letter: coverLetter,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error("Failed to apply ❌ " + JSON.stringify(err));
        }

        showNotification("Application submitted successfully ✅", "success");
        closeApplyModal();
        setTimeout(() => loadJobs(false), 1000); // Reload jobs to update status

    } catch (err) {
        showNotification(err.message, "error");
    } finally {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = 'Submit Application';
    }
}



async function loadJobs(shouldAppend = false) {
  if (isLoading) return;
  isLoading = true;

  if (!shouldAppend) {
    currentPage = 1;
    hasMoreJobs = true;
  }
  
  const jobsList = document.getElementById("jobsList");
  const loadMoreContainer = document.getElementById('load-more-container');


  if (!shouldAppend) {
    jobsList.innerHTML = `<p class="text-gray-600 col-span-full text-center">Loading jobs...</p>`;
  } else {
    document.getElementById('load-more-btn')?.remove();
  }
  loadMoreContainer.innerHTML = '';

  try {
    const params = collectFilterParams();
    params.append('page', currentPage);
    
    const res = await fetch(`${API}/jobs/job/?${params.toString()}`, {
      headers: { Authorization: "Bearer " + access },
    });

    if (!res.ok) throw new Error("Failed to load jobs ❌");

    const jobs = await res.json();
    
    if (jobs.length === 0) {
      hasMoreJobs = false;
      if (!shouldAppend) {
        jobsList.innerHTML = `<p class="text-gray-600 col-span-full text-center">No jobs found with these filters.</p>`;
      }
      return;
    }

    const jobsHtml = jobs.map(job => `
      <a href="job-detail.html?id=${job.id}" class="block border p-5 rounded-xl bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 animate-fade-in">
        <div class="flex items-center gap-5">
          <div class="w-20 h-20 flex-shrink-0">
            ${job.picture ? `<img src="${job.picture}" alt="${job.title}" class="w-full h-full rounded-lg object-cover">` : `<div class="w-full h-full rounded-lg bg-gray-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>`}
          </div>
          <div class="flex-grow min-w-0">
            <h3 class="text-lg font-bold text-gray-800 truncate">${job.title}</h3>
            <p class="text-gray-600 text-sm mt-1">Pay: <span class="font-semibold text-green-600">$${job.pay_per_hour}/hr</span></p>
            <p class="text-gray-600 text-sm">Location: ${job.location_display}</p>
            <p class="text-gray-600 text-sm truncate">Skills: ${job.skills.map(s => s.name).join(", ") || "N/A"}</p>
          </div>
        </div>
      </a>`
    ).join("");

    if (shouldAppend) {
      jobsList.innerHTML += jobsHtml;
    } else {
      jobsList.innerHTML = jobsHtml;
    }


    if (jobs.length < 10) {
        hasMoreJobs = false;
    }

    if (hasMoreJobs) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'load-more-btn';
      loadMoreBtn.textContent = 'Load More';
      loadMoreBtn.className = 'bg-blue-600 text-white py-2 px-8 rounded-lg hover:bg-blue-700 transition';
      loadMoreBtn.onclick = () => {
        currentPage++;
        loadJobs(true);
      };
      loadMoreContainer.appendChild(loadMoreBtn);
    }
    
  } catch (err) {
    showNotification(err.message, "error");
    jobsList.innerHTML = `<p class="text-red-500 col-span-full text-center">An error occurred while loading jobs.</p>`;
  } finally {
    isLoading = false;
  }
}

function collectFilterParams() {
  const params = new URLSearchParams();
  const keyword = document.getElementById("search-keyword").value;
  const minPay = document.getElementById("minPay").value;
  const location = document.getElementById("location").value;
  const skillsHidden = document.getElementById("skills-hidden").value;

  if (keyword) params.append("search", keyword);
  if (minPay) params.append("min_pay", minPay);
  if (location) params.append("location", location);
  if (skillsHidden) {
    skillsHidden.split(",").forEach(id => params.append("skills", id));
  }
  return params;
}

document.getElementById("search-keyword").addEventListener("input", debounce(() => loadJobs(false), 500));
document.getElementById("minPay").addEventListener("input", debounce(() => loadJobs(false), 500));
document.getElementById("location").addEventListener("change", () => loadJobs(false));

document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("search-keyword").value = "";
  document.getElementById("minPay").value = "";
  document.getElementById("location").value = "";
  document.getElementById("skills-hidden").value = "";
  document.getElementById("skills-label").textContent = "Select Skills";
  document.querySelectorAll("#skills-menu input:checked").forEach(cb => cb.checked = false);
  loadJobs(false);
});

async function loadSkillsOptions() {
  try {
    const res = await fetch(`${API}/profiles/skills/`, { headers: { Authorization: "Bearer " + access } });
    if (!res.ok) throw new Error("Failed to load skills");

    const skills = await res.json();
    const menu = document.getElementById("skills-menu");
    const label = document.getElementById("skills-label");
    const hiddenInput = document.getElementById("skills-hidden");
    menu.innerHTML = "";

    skills.forEach(skill => {
      const option = document.createElement("label");
      option.className = "flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer";
      option.innerHTML = `<input type="checkbox" value="${skill.id}" class="form-checkbox h-4 w-4 text-blue-600 mr-2"><span>${skill.name}</span>`;
      menu.appendChild(option);
    });

    function updateSelection() {
      const checked = Array.from(menu.querySelectorAll("input:checked")).map(cb => ({
        id: cb.value, name: cb.nextElementSibling.textContent,
      }));
      label.textContent = checked.length > 0 ? checked.map(c => c.name).join(", ") : "Select Skills";
      hiddenInput.value = checked.map(c => c.id).join(",");
      
      loadJobs(false);
    }

    menu.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
      checkbox.addEventListener("change", updateSelection);
    });
  } catch (err) {
    console.error(err);
  }
}


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

loadJobs();
loadSkillsOptions();