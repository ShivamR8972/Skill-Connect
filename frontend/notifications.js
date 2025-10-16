// In a new file: notifications.js

document.addEventListener("DOMContentLoaded", () => {
    const { access, role } = getAuth();
    if (!access) {
        window.location.href = "auth.html";
        return;
    }
    renderNavbar();

    const notificationListContainer = document.getElementById('notification-page-list');

    async function loadNotifications() {
    const notificationListContainer = document.getElementById('notification-page-list');
    try {
        const res = await fetch(`${API}/profiles/notifications/`, {
            headers: { Authorization: `Bearer ${getAuth().access}` }
        });
        if (!res.ok) throw new Error('Could not load notifications.');
        
        const notifications = await res.json();

        if (notifications.length === 0) {
            notificationListContainer.innerHTML = '<p class="p-6 text-center text-gray-500">You have no notifications.</p>';
            return;
        }

        notificationListContainer.innerHTML = notifications.map(n => `
            <a href="#" 
               class="notification-item block p-4 hover:bg-gray-50 ${!n.is_read ? 'unread' : ''}"
               data-id="${n.id}"
               data-read="${n.is_read}">
                
                <p class="font-semibold text-gray-800">${n.message}</p>
                
                <p class="text-sm text-gray-500 mt-1">${new Date(n.created_at).toLocaleString()}</p>
            </a>
        `).join('');

    } catch (err) {
        notificationListContainer.innerHTML = `<p class="p-6 text-center text-red-500">${err.message}</p>`;
    }
}

    // Event listener to mark a notification as read when clicked
    notificationListContainer.addEventListener('click', async (e) => {
        const item = e.target.closest('.notification-item');
        
        // Proceed only if the item exists and is unread
        if (!item || item.dataset.read === 'true') {
            return;
        }

        const notificationId = item.dataset.id;
        
        try {
            // Send the request in the background
            fetch(`${API}/profiles/notifications/${notificationId}/read/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${access}` }
            });

            // Immediately update the UI for a fast user experience
            item.classList.remove('unread');
            item.dataset.read = 'true';
            
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    });

    loadNotifications();
});