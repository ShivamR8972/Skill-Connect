const access = localStorage.getItem("access");
const role = localStorage.getItem("role");

if (!access || role !== "recruiter") {
  window.location.href = "auth.html";
}

function editJob(jobId) {
  window.location.href = `post-job.html?edit=${jobId}`;
}

async function loadJobs() {
  try {
    const res = await fetch(`${API}/jobs/job/my/`, {
      headers: { Authorization: "Bearer " + access },
    });

    if (!res.ok) throw new Error("Failed to load jobs ❌");

    const jobs = await res.json();
    const jobsList = document.getElementById("jobsList");

    if (jobs.length === 0) {
      jobsList.innerHTML = `<p class="text-gray-600">You haven't posted any jobs yet.</p>`;
      return;
    }

    jobsList.innerHTML = jobs
      .map(
        (job) => `
  <div class="job-card border p-5 rounded-xl bg-white shadow-sm">
    <h3 class="text-xl font-semibold text-gray-800">${job.title}</h3>
    <p class="text-gray-700"><b>Pay:</b> $${job.pay_per_hour}/hr</p>
    <p class="text-gray-700"><b>Skills:</b> 
      ${
        job.skills && job.skills.length > 0
          ? job.skills.map((s) => s.name).join(", ")
          : "N/A"
      }
    </p>
    <p class="text-gray-700"><b>Location:</b> ${job.location_display}</p>
    <p class="text-gray-700"><b>Requirements:</b> ${job.requirements}</p>
    <p class="text-sm text-gray-500"><i>Posted on: ${new Date(
      job.created_at
    ).toLocaleString()}</i></p>

    <div class="mt-4 text-right">
      <button onclick="editJob(${job.id})" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Edit</button>
      <button class="delete-job bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              data-id="${job.id}">
        Delete
      </button>
    </div>
  </div>`
      )
      .join("");
  } catch (err) {
    showNotification(err.message, "error");
  }
}

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-job")) {
    const jobId = e.target.dataset.id;

    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`${API}/jobs/job/${jobId}/delete/`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + access },
      });

      if (res.status === 204) {
        showNotification("Job deleted ✅", "success");
        e.target.closest(".job-card").remove();
      } else {
        const err = await res.json();
        throw new Error("Failed to delete ❌ " + JSON.stringify(err));
      }
    } catch (err) {
      showNotification(err.message, "error");
    }
  }
});

loadJobs();

document.getElementById("logout").addEventListener("click", () => {
  logout();
});