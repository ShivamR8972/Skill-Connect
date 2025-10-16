document.addEventListener("DOMContentLoaded", () => {
  const { access, role } = getAuth();
  if (!access || role !== "freelancer") {
    window.location.href = "auth.html";
    return;
  }
  renderNavbar();

  // Get Job ID from the URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  
  if (!jobId) {
    document.getElementById('job-detail-container').innerHTML = `<p class="text-red-500 text-center">No job ID provided. Please go back to the job list.</p>`;
    return;
  }

  const applyModal = document.getElementById('apply-modal');
  const modalTitle = document.getElementById('modal-title');
  const coverLetterInput = document.getElementById('cover-letter-input');
  const modalSubmitBtn = document.getElementById('modal-submit-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  let currentJobId = null;

  function openApplyModal(jobId, jobTitle) {
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
          if (!res.ok) throw new Error("Failed to apply ❌");

          showNotification("Application submitted successfully ✅", "success");
          closeApplyModal();
          // Reload page to show the "Applied" status on the button
          setTimeout(() => window.location.reload(), 1000);

      } catch (err) {
          showNotification(err.message, "error");
      } finally {
          modalSubmitBtn.disabled = false;
          modalSubmitBtn.textContent = 'Submit Application';
      }
  }


  // --- Fetch and Render Job Details ---
  async function loadJobDetails() {
    try {
      const res = await fetch(`${API}/jobs/job/${jobId}/`, {
        headers: { Authorization: "Bearer " + access }
      });

      if (!res.ok) {
        throw new Error('Job not found or an error occurred.');
      }
      
      const job = await res.json();
      renderJob(job);

    } catch (err) {
      document.getElementById('job-detail-container').innerHTML = `<p class="text-red-500 text-center">${err.message}</p>`;
    }
  }

  // --- Dynamically Build and Insert the HTML ---
  function renderJob(job) {
    const container = document.getElementById('job-detail-container');
    
    // Hide loading state
    document.getElementById('loading-state').style.display = 'none';

    // Skill badges HTML
    const skillsHtml = job.skills.map(skill => 
      `<span class="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">${skill.name}</span>`
    ).join('');

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <h1 class="text-4xl font-extrabold text-gray-900">${job.title}</h1>
          <p class="text-lg text-gray-600 mt-2">Posted by: <span class="font-semibold">${job.recruiter_company || 'A Recruiter'}</span></p>

          ${job.picture ? `<img src="${job.picture}" alt="${job.title}" class="w-full h-80 object-cover rounded-lg mt-6 mb-8">` : ''}

          <h2 class="text-2xl font-bold text-gray-800 mt-8 border-b pb-2 mb-4">Job Description</h2>
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${job.requirements}</p>

          <h2 class="text-2xl font-bold text-gray-800 mt-8 border-b pb-2 mb-4">Key Responsibilities</h2>
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${job.key_responsibilities}</p>
        </div>

        <div class="lg:col-span-1">
          <div class="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h3 class="text-xl font-bold text-gray-800">Job Overview</h3>
            <div class="mt-4 space-y-3">
              <p><strong>Pay:</strong> <span class="text-green-600 font-semibold">$${job.pay_per_hour}/hr</span></p>
              <p><strong>Work Mode:</strong> ${job.work_mode_display}</p>
              ${job.location ? `<p><strong>Location:</strong> ${job.location}</p>` : ''}
            </div>
            
            <h3 class="text-xl font-bold text-gray-800 mt-6 pt-4 border-t">Required Skills</h3>
            <div class="mt-4 flex flex-wrap gap-2">
              ${skillsHtml || 'N/A'}
            </div>

            <div class="mt-8 border-t pt-6">
              <button id="apply-btn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // --- Handle Apply Button Logic ---
    const applyBtn = document.getElementById('apply-btn');
    if (job.already_applied) {
      applyBtn.textContent = 'Applied';
      applyBtn.disabled = true;
    } else {
      applyBtn.addEventListener('click', () => openApplyModal(job.id, job.title));
    }
  }

  // --- Initial Call ---
  loadJobDetails();
});