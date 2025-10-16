const access = localStorage.getItem("access");
const role = localStorage.getItem("role");

if (!access || role !== "freelancer") {
  window.location.href = "auth.html";
}

const statusFilter = document.getElementById("filter-status");
const sortFilter = document.getElementById("sort-by");

statusFilter.addEventListener('change', () => loadApplications());
sortFilter.addEventListener('change', () => loadApplications());


function renderStatusBadge(status) {
  let colorClasses = "";
  let label = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case "applied": colorClasses = "bg-blue-100 text-blue-800"; break;
    case "reviewed": colorClasses = "bg-yellow-100 text-yellow-800"; break;
    case "accepted": colorClasses = "bg-green-100 text-green-800"; break;
    case "rejected": colorClasses = "bg-red-100 text-red-800"; break;
    default: colorClasses = "bg-gray-100 text-gray-800";
  }

  return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses}">
    ${label}
  </span>`;
}


const reviewModal = document.getElementById('review-modal');
const reviewModalTitle = document.getElementById('review-modal-title');
const ratingValueInput = document.getElementById('rating-value');
const reviewCommentInput = document.getElementById('review-comment');
const stars = document.querySelectorAll('#star-rating span');
const modalReviewSubmitBtn = document.getElementById('modal-review-submit');
const modalReviewCancelBtn = document.getElementById('modal-review-cancel');

let currentReviewJobId = null;
let currentRevieweeId = null; // To store the ID of the recruiter being reviewed

function openReviewModal(jobId, jobTitle, revieweeId) {
    currentReviewJobId = jobId;
    currentRevieweeId = revieweeId;
    reviewModalTitle.textContent = `Reviewing: "${jobTitle}"`;
    resetStars(); // Reset stars to default state
    reviewCommentInput.value = '';
    reviewModal.classList.remove('hidden');
}

function closeReviewModal() {
    reviewModal.classList.add('hidden');
}

modalReviewCancelBtn.addEventListener('click', closeReviewModal);
modalReviewSubmitBtn.addEventListener('click', submitReview);

// --- Star Rating Interaction Logic ---
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
        // The mouseout event from moving off the star will call resetStars, fixing the color
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

        if (!res.ok) {
            const errData = await res.json();
            // Try to give a more specific error from the backend if possible
            const errorMessage = Object.values(errData).join(' ') || "Failed to submit review. You may have already reviewed this job.";
            throw new Error(errorMessage);
        }

        showNotification("Review submitted successfully!", "success");
        closeReviewModal();
        loadApplications(); // Refresh the application list to hide the button

    } catch (err) {
        showNotification(err.message, "error");
    } finally {
        modalReviewSubmitBtn.disabled = false;
        modalReviewSubmitBtn.textContent = 'Submit Review';
    }
}


async function loadApplications() {
    const appsList = document.getElementById("applicationsList");
    appsList.innerHTML = `<p class="text-gray-600 col-span-full text-center">Loading applications...</p>`;

    const params = new URLSearchParams({
        status: document.getElementById("filter-status").value,
        ordering: document.getElementById("sort-by").value,
    });

    try {
        const res = await fetch(`${API}/jobs/application/my/?${params.toString()}`, {
            headers: { Authorization: `Bearer ${access}` }
        });
        if (!res.ok) throw new Error("Failed to load applications ❌");
        const apps = await res.json();
        if (apps.length === 0) {
            appsList.innerHTML = `<p class="col-span-full text-center">No applications found.</p>`;
            return;
        }

        appsList.innerHTML = apps.map(app => `
            <div class="border p-5 rounded-xl bg-white shadow-sm">
                <div class="flex justify-between items-start">
                    <div>
                        <a href="job-detail.html?id=${app.job_id}" class="text-lg font-bold hover:underline">${app.job_title}</a>
                        <p class="text-gray-600 text-sm">Recruiter: ${app.recruiter_company}</p>
                    </div>
                    ${renderStatusBadge(app.status)}
                </div>
                <div class="mt-4 pt-4 border-t flex justify-between items-center">
                    <p class="text-sm text-gray-500">Applied: ${new Date(app.created_at).toLocaleDateString()}</p>
                    ${app.status === 'accepted' && !app.has_been_reviewed ? `<button class="bg-green-600 text-white text-sm py-1 px-3 rounded-lg hover:bg-green-700" onclick="openReviewModal(${app.job_id}, '${app.job_title.replace(/'/g, "\\'")}', ${app.recruiter_user_id})">Leave Review</button>` : ''}
                </div>
            </div>`
        ).join("");
    } catch (err) {
        showNotification(err.message, "error");
    }
}

loadApplications();