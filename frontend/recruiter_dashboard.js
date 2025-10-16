document.addEventListener("DOMContentLoaded", () => {
  const { access, role } = getAuth();
  if (!access || role !== "recruiter") {
    window.location.href = "auth.html";
    return;
  }
  renderNavbar();

  const dateElement = document.getElementById("today-date");
  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function loadDashboardData() {
    const headers = { Authorization: `Bearer ${access}` };
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch(`${API}/jobs/job/my/`, { headers }),
        fetch(`${API}/jobs/application/recruiter/`, { headers }),
      ]);

      if (!jobsRes.ok || !appsRes.ok) throw new Error("Failed to fetch dashboard data.");

      const jobs = await jobsRes.json();
      const applications = await appsRes.json();

      populateStats(jobs, applications);
      populateRecentApplications(applications);
      populateRecentActivity(jobs, applications);
      renderApplicationsPerJobChart(applications);
      renderApplicationStatusChart(applications);
    } catch (error) {
      console.error("Dashboard Error:", error);
      showNotification(error.message, "error");
    }
  }

  function animateNumber(element, target) {
    let current = 0;
    const increment = target / 100;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(interval);
      } else {
        element.textContent = Math.ceil(current);
      }
    }, 15);
  }

  function populateStats(jobs, applications) {
    const totalJobs = jobs.length;
    const totalApps = applications.length;
    const pendingApps = applications.filter(
      (app) => app.status === "applied" || app.status === "reviewed"
    ).length;
    const hiredRejected = applications.filter(
      (app) => app.status === "accepted" || app.status === "rejected"
    ).length;

    animateNumber(document.getElementById("total-jobs"), totalJobs);
    animateNumber(document.getElementById("total-apps"), totalApps);
    animateNumber(document.getElementById("pending-apps"), pendingApps);
    animateNumber(document.getElementById("hired-rejected"), hiredRejected);
  }

  function populateRecentApplications(applications) {
    const tableBody = document.getElementById("recent-applications-body");
    if (!tableBody) return;

    const recentApps = applications
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    if (recentApps.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">No recent applications found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = recentApps
      .map(
        (app) => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">${app.freelancer_name || "N/A"}</td>
        <td class="px-6 py-4 whitespace-nowrap">${app.job_title}</td>
        <td class="px-6 py-4 whitespace-nowrap">${renderStatusBadge(app.status)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(app.created_at).toLocaleDateString()}</td>
      </tr>`
      ).join("");
  }
  
  function populateRecentActivity(jobs, applications) {
      const activityList = document.getElementById("recent-activity");
      if (!activityList) return;

      const jobActivities = jobs.map(j => ({
          date: new Date(j.created_at),
          text: `You posted the job: <strong>${j.title}</strong>`,
          type: 'job'
      }));
      
      const appActivities = applications.map(a => ({
          date: new Date(a.created_at),
          text: `<strong>${a.freelancer_name || 'A freelancer'}</strong> applied to <strong>${a.job_title}</strong>`,
          type: 'application'
      }));

      const allActivities = [...jobActivities, ...appActivities]
          .sort((a, b) => b.date - a.date)
          .slice(0, 7);

      if (allActivities.length === 0) {
          activityList.innerHTML = `<li class="text-center p-4 text-gray-500">No recent activity.</li>`;
          return;
      }
      
      activityList.innerHTML = allActivities.map(activity => `
          <li class="flex items-start space-x-3">
              <div class="flex-shrink-0 h-6 w-6 rounded-full ${activity.type === 'job' ? 'bg-blue-500' : 'bg-green-500'} flex items-center justify-center text-white text-sm font-bold">
                  ${activity.type === 'job' ? 'J' : 'A'}
              </div>
              <div>
                  <p class="text-sm text-gray-700">${activity.text}</p>
                  <p class="text-xs text-gray-400">${activity.date.toLocaleDateString()}</p>
              </div>
          </li>
      `).join('');
  }



  function renderApplicationsPerJobChart(applications) {
    const ctx = document.getElementById("barChart")?.getContext("2d");
    if (!ctx) return;

    const appsPerJob = applications.reduce((acc, app) => {
      acc[app.job_title] = (acc[app.job_title] || 0) + 1;
      return acc;
    }, {});

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(appsPerJob),
        datasets: [{
          label: "# of Applications",
          data: Object.values(appsPerJob),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const STATUS_COLORS = {
  'Applied': 'rgba(59, 130, 246, 0.8)',  // Blue
  'Reviewed': 'rgba(234, 179, 8, 0.8)', // Yellow
  'Accepted': 'rgba(22, 163, 74, 0.8)',  // Green
  'Rejected': 'rgba(220, 38, 38, 0.8)',  // Red
  'Default': 'rgba(107, 114, 128, 0.8)' // Gray for any other status
  };
  function renderApplicationStatusChart(applications) {
    const ctx = document.getElementById("pieChart")?.getContext("2d");
    if (!ctx) return;

    const statusCounts = applications.reduce((acc, app) => {
      const status = app.status.charAt(0).toUpperCase() + app.status.slice(1);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(statusCounts);

    const backgroundColors = labels.map(label => STATUS_COLORS[label] || STATUS_COLORS['Default']);

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: backgroundColors,
          borderColor: '#fff',
          borderWidth: 2,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
}

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
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${colorClasses}">${label}</span>`;
  }

  // --- Initial Call ---
  loadDashboardData();
});