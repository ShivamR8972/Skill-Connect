document.addEventListener("DOMContentLoaded", () => {
    const freelancerList = document.getElementById('top-freelancers-list');
    if (!freelancerList) return;

    // Helper function to render star ratings
    function renderStars(rating) {
        if (!rating) return '';
        let stars = '';
        const fullStars = Math.round(rating);
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="text-yellow-400">${i <= fullStars ? '★' : '☆'}</span>`;
        }
        return `<div class="flex justify-center mt-2">${stars}</div>`;
    }

    async function loadTopFreelancers() {
        try {
            const API = "http://127.0.0.1:8000/";
            const res = await fetch(`${API}/profiles/top-freelancers/`);
            if (!res.ok) throw new Error('Could not fetch top freelancers.');

            const freelancers = await res.json();

            if (freelancers.length === 0) {
                freelancerList.innerHTML = '<p class="col-span-full text-gray-500">No rated freelancers yet.</p>';
                return;
            }

            freelancerList.innerHTML = freelancers.map(freelancer => `
                <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center">
                    <img class="w-24 h-24 mx-auto rounded-full object-cover" 
                         src="${freelancer.profilepic_url || 'https://via.placeholder.com/150'}" 
                         alt="${freelancer.name}">
                    <h4 class="mt-4 text-lg font-bold text-gray-900">${freelancer.name}</h4>
                    <p class="text-sm text-gray-600">${freelancer.experience_display}</p>
                    ${renderStars(freelancer.average_rating)}
                </div>
            `).join('');

        } catch (error) {
            freelancerList.innerHTML = '<p class="col-span-full text-red-500">Could not load freelancers at this time.</p>';
            console.error(error);
        }
    }

    loadTopFreelancers();
});