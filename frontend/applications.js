const access = localStorage.getItem("access");
const role = localStorage.getItem("role");

if (!access || role !== "recruiter") {
  window.location.href = "auth.html";
}

// Render status badge
function renderStatusBadge(status) {
  let colorClasses = "";
  let label = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case "applied":
      colorClasses = "bg-blue-100 text-blue-800";
      break;
    case "reviewed":
      colorClasses = "bg-yellow-100 text-yellow-800";
      break;
    case "accepted":
      colorClasses = "bg-green-100 text-green-800";
      break;
    case "rejected":
      colorClasses = "bg-red-100 text-red-800";
      break;
    default:
      colorClasses = "bg-gray-100 text-gray-800";
  }

  return `<span class="status-label px-2 py-1 rounded-full text-sm font-semibold ${colorClasses}">
    ${label}
  </span>`;
}

function renderActionButtons(app) {
  // If the application has been accepted AND the recruiter has not reviewed them yet
  if (app.status === "accepted" && !app.recruiter_has_reviewed) {
    return `
      <div class="mt-4 buttons-container">
        <button class="bg-green-600 text-white text-sm py-1 px-3 rounded-lg hover:bg-green-700" 
                onclick="openReviewModal(${app.job_id}, '${app.freelancer_name.replace(/'/g, "\\'")}', ${app.freelancer_user_id})">
           Review Freelancer
        </button>
      </div>
    `;
  }

  // If the application is still pending
  if (app.status === "applied" || app.status === "reviewed") {
    return `
      <div class="mt-4 space-x-2 buttons-container">
        ${
          app.status !== "reviewed"
            ? `<button class="status-btn bg-gray-200 px-3 py-1 rounded hover:bg-gray-300" data-status="reviewed">Mark Reviewed</button>`
            : ""
        }
        <button class="status-btn bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700" data-status="accepted">Accept</button>
        <button class="status-btn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-status="rejected">Reject</button>
      </div>
    `;
  }

  // If rejected or already reviewed, show nothing
  return "";
}



async function loadApplications() {
  try {
    const res = await fetch(`${API}/jobs/application/recruiter/`, {
      headers: { Authorization: "Bearer " + access },
    });

    if (!res.ok) throw new Error("Failed to load applications ❌");

    const apps = await res.json();
    const appsList = document.getElementById("applicationsList");

    if (apps.length === 0) {
      appsList.innerHTML = `<p class="text-gray-600">No applications yet.</p>`;
      return;
    }

    appsList.innerHTML = apps
      .map((app) => {
        const name = app.freelancer_name || app.freelancer_email || "Unknown";
        return `
        <div class="application-card border p-5 rounded-xl bg-white shadow-sm animate-fade-in" data-id="${
          app.id
        }">
          <h3 class="text-lg font-semibold text-gray-800">${name}</h3>
          <p class="text-gray-600"><b>Email:</b> ${app.freelancer_email}</p>
          <p class="text-gray-600"><b>Applied for:</b> ${app.job_title}</p>
          
          <p class="text-gray-600">
  <b>Resume:</b>
  ${app.resume
    ? `<a href="${app.resume}" target="_blank" class="text-blue-600 hover:underline">Download Resume</a>
       
       <button class="analyze-btn bg-blue-100 text-blue-700 text-xs font-semibold py-1 px-2 rounded-full ml-2 hover:bg-blue-200"
               data-id="${app.id}">
         Analyze with AI ✨
       </button>
      `
    : "N/A"
  }
</p>
<div class="analysis-result-container mt-4" id="analysis-result-${app.id}"></div>
          <p class="text-gray-600"><b>Status:</b> ${renderStatusBadge(
            app.status
          )}</p>
          <p class="text-sm text-gray-500"><i>Applied on: ${new Date(
            app.created_at
          ).toLocaleString()}</i></p>

          ${renderActionButtons(app)}
        </div>
      `;
      })
      .join("");
  } catch (err) {
    showNotification(err.message, "error");
  }
}


// Handle status updates
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("status-btn")) {
    const card = e.target.closest(".application-card");
    const appId = card.dataset.id;
    const newStatus = e.target.dataset.status;

    try {
      const res = await fetch(`${API}/jobs/application/${appId}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + access,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error("Failed to update status ❌ " + JSON.stringify(err));
      }

      const updated = await res.json();

      // Update badge
      card.querySelector(".status-label").outerHTML = renderStatusBadge(
        updated.status
      );

      // Update buttons
      const buttonsContainer = card.querySelector(".buttons-container");
      if (buttonsContainer) {
        buttonsContainer.outerHTML = renderActionButtons(updated.status);
      }

      showNotification(`Application marked as ${updated.status} ✅`, "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  }
});

const reviewModal = document.getElementById('review-modal');
const reviewModalTitle = document.getElementById('review-modal-title');
const ratingValueInput = document.getElementById('rating-value');
const reviewCommentInput = document.getElementById('review-comment');
const stars = document.querySelectorAll('#star-rating span');
const modalReviewSubmitBtn = document.getElementById('modal-review-submit');
const modalReviewCancelBtn = document.getElementById('modal-review-cancel');

let currentReviewJobId = null;
let currentRevieweeId = null; // To store the ID of the freelancer being reviewed

function openReviewModal(jobId, revieweeName, revieweeId) {
    currentReviewJobId = jobId;
    currentRevieweeId = revieweeId;
    reviewModalTitle.textContent = `Reviewing: "${revieweeName}"`;
    resetStars();
    reviewCommentInput.value = '';
    reviewModal.classList.remove('hidden');
}

function closeReviewModal() {
    reviewModal.classList.add('hidden');
}

modalReviewCancelBtn.addEventListener('click', closeReviewModal);
modalReviewSubmitBtn.addEventListener('click', submitReview);

// Star Rating Interaction Logic
stars.forEach(star => {
    star.addEventListener('mouseover', (e) => {
        const hoverValue = e.target.dataset.value;
        stars.forEach(s => {
            s.classList.toggle('text-yellow-400', s.dataset.value <= hoverValue);
            s.classList.toggle('text-gray-300', s.dataset.value > hoverValue);
        });
    });
    star.addEventListener('mouseout', resetStars);
    star.addEventListener('click', (e) => {
        ratingValueInput.value = e.target.dataset.value;
    });
});

function resetStars() {
    const currentRating = ratingValueInput.value;
    stars.forEach(star => {
        star.classList.toggle('text-yellow-400', star.dataset.value <= currentRating);
        star.classList.toggle('text-gray-300', star.dataset.value > currentRating);
    });
}

async function submitReview() {
    const rating = ratingValueInput.value;
    const comment = reviewCommentInput.value;
    if (rating === '0') {
        showNotification("Please select a star rating.", "error");
        return;
    }

    modalReviewSubmitBtn.disabled = true;
    modalReviewSubmitBtn.textContent = 'Submitting...';

    try {
        const res = await fetch(`${API}/profiles/reviews/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access}`
            },
            body: JSON.stringify({
                job: currentReviewJobId,
                reviewee: currentRevieweeId,
                rating: parseInt(rating),
                comment: comment,
            })
        });
        if (!res.ok) throw new Error("Failed to submit review. You may have already reviewed this freelancer for this job.");
        
        showNotification("Review submitted successfully!", "success");
        closeReviewModal();
        loadApplications(); // Refresh the list
    } catch (err) {
        showNotification(err.message, "error");
    } finally {
        modalReviewSubmitBtn.disabled = false;
        modalReviewSubmitBtn.textContent = 'Submit Review';
    }
}


loadApplications();

document.getElementById("logout").addEventListener("click", () => {
  logout();
});

document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('analyze-btn')) return;

    const button = e.target;
    const appId = button.dataset.id;
    const resultContainer = document.getElementById(`analysis-result-${appId}`);
    
    button.disabled = true;
    resultContainer.innerHTML = `<p class="text-sm text-gray-500">Analyzing... This may take a moment.</p>`;

    try {
        const res = await fetch(`${API}/jobs/application/${appId}/analyze-resume/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${access}` },
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to analyze resume.');
        }

        const analysis = await res.json();
        
        // Render the results in a user-friendly format
        resultContainer.innerHTML = `
            <div class="mt-4 border-t pt-4 bg-blue-50 p-4 rounded-lg">
                <h4 class="font-bold text-gray-800">AI Resume Analysis</h4>
                <div class="my-2">
                    <span class="font-semibold">Match Score:</span>
                    <span class="font-bold text-lg text-blue-600">${analysis.match_score}%</span>
                </div>
                <p class="text-sm text-gray-700"><span class="font-semibold">Summary:</span> ${analysis.summary}</p>
                <div class="mt-2">
                    <p class="text-sm font-semibold text-green-700">Matched Skills:</p>
                    <p class="text-sm text-gray-600">${analysis.matched_skills.join(', ') || 'None'}</p>
                </div>
                <div class="mt-2">
                    <p class="text-sm font-semibold text-red-700">Missing Skills:</p>
                    <p class="text-sm text-gray-600">${analysis.missing_skills.join(', ') || 'None'}</p>
                </div>
            </div>
        `;

    } catch (err) {
        resultContainer.innerHTML = `<p class="text-sm text-red-500">Error: ${err.message}</p>`;
        button.disabled = false;
    }
});