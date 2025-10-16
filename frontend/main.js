// main.js - shared utilities for all pages

// API base
const API = "http://127.0.0.1:8000/";

function renderNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const role = localStorage.getItem("role");

  if (role === "recruiter") {
    navbar.innerHTML = `
    <button id="notification-link" onclick="window.location.href='notifications.html'" class="text-gray-700 hover:text-blue-600">Notifications</button>
    <button onclick="window.location.href='recruiter_dashboard.html'" class="text-gray-700 hover:text-blue-600">Dashboard</button>
    <button onclick="window.location.href='post-job.html'" class="text-gray-700 hover:text-blue-600">Post Job</button>
    <button onclick="window.location.href='my-jobs.html'" class="text-gray-700 hover:text-blue-600">My Jobs</button>
    <button onclick="window.location.href='applications.html'" class="text-gray-700 hover:text-blue-600">Applications</button>
    <button onclick="window.location.href='profile-setup.html'" class="text-gray-700 hover:text-blue-600">Profile (${role})</button>
    <button id="logout" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Logout</button>
    `;
  } else if (role === "freelancer") {
    navbar.innerHTML = `
    <button id="notification-link" onclick="window.location.href='notifications.html'" class="text-gray-700 hover:text-blue-600">Notifications</button>
    <button onclick="window.location.href='freelancer_dashboard.html'" class="text-gray-700 hover:text-blue-600">Dashboard</button>
    <button onclick="window.location.href='jobs.html'" class="text-gray-700 hover:text-blue-600">Browse Jobs</button>
    <button onclick="window.location.href='my-applications.html'" class="text-gray-700 hover:text-blue-600">My Applications</button>
    <button onclick="window.location.href='profile-setup.html'" class="text-gray-700 hover:text-blue-600">Profile (${role})</button>
    <button id="logout" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Logout</button>
    `;
  } else {
    navbar.innerHTML = `
      <a href="./companies.html" class="text-gray-600 hover:text-blue-600">Companies</a>
      <a href="./index.html#features" class="text-gray-600 hover:text-blue-600">Features</a>
      <a href="./index.html#about" class="text-gray-600 hover:text-blue-600">About</a>
      <a href="./auth.html" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Login / Register</a>
    `;
  }

  // Logout handler
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "auth.html";
    });
  }
}

// Call this when page loads
renderNavbar();

// Get access token + role
function getAuth() {
  return {
    access: localStorage.getItem("access"),
    role: localStorage.getItem("role"),
  };
}

// Clear session & redirect
function logout() {
  localStorage.clear();
  window.location.href = "./auth.html";
}

function showAlert(message, type = "success") {
  const existing = document.querySelectorAll(".custom-alert");
  existing.forEach((el) => el.remove());

  const alertBox = document.createElement("div");
  alertBox.className = `custom-alert fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition transform duration-500 ease-in-out z-50 ${
    type === "error" ? "bg-red-600" : "bg-green-600"
  }`;

  alertBox.textContent = message;
  document.body.appendChild(alertBox);

  // Show animation
  alertBox.style.opacity = "0";
  alertBox.style.transform = "translateY(-10px)";
  requestAnimationFrame(() => {
    alertBox.style.opacity = "1";
    alertBox.style.transform = "translateY(0)";
  });

  // Auto-remove
  setTimeout(() => {
    alertBox.style.opacity = "0";
    alertBox.style.transform = "translateY(-10px)";
    setTimeout(() => alertBox.remove(), 500);
  }, 3000);
}

// Global notification system
function showNotification(message, type = "success") {
  const containerId = "notification-container";
  let container = document.getElementById(containerId);

  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "fixed bottom-5 right-5 space-y-3 z-50";
    document.body.appendChild(container);
  }

  const notif = document.createElement("div");
  notif.className = `
    px-4 py-3 rounded-lg shadow-md text-white 
    ${type === "success" ? "bg-green-600" : "bg-red-600"}
    animate-fade-in
  `;
  notif.textContent = message;

  container.appendChild(notif);

  // Auto remove after 3s
  setTimeout(() => {
    notif.classList.add("opacity-0", "transition", "duration-500");
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}

async function handleNotifications() {
    const { access, role } = getAuth();
    // MODIFIED: Run for any logged-in user
    if (!role || !access) return;

    const badge = document.getElementById('notification-link');
    if (!badge) return;

    try {
        const res = await fetch(`${API}/profiles/notifications/`, {
            headers: { Authorization: `Bearer ${access}` }
        });
        const notifications = await res.json();
        const unreadCount = notifications.filter(n => !n.is_read).length;

        if (unreadCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (err) {
        console.error("Could not fetch notification status for badge.");
    }
}