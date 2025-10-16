document.addEventListener("DOMContentLoaded", () => {
    const testimonialList = document.getElementById('testimonial-list');
    if (!testimonialList) return;

    // Helper function to render star ratings
    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="text-yellow-400">${i <= rating ? '★' : '☆'}</span>`;
        }
        return `<div class="flex">${stars}</div>`;
    }

    async function loadTestimonials() {
    try {
        const res = await fetch(`${API}/profiles/testimonials/`);
        if (!res.ok) throw new Error('Could not fetch testimonials.');

        const testimonials = await res.json();

        if (testimonials.length === 0) {
            document.getElementById('testimonials').style.display = 'none'; // Hide section if no testimonials
            return;
        }

        testimonialList.innerHTML = testimonials.map(item => `
            <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col">
                <p class="text-gray-700 italic flex-grow">"${item.content}"</p>
                <div class="flex items-center mt-6 pt-4 border-t">
                    <img class="h-12 w-12 rounded-full object-cover mr-4" 
                         src="${item.user_pic_url || 'https://via.placeholder.com/150'}" 
                         alt="${item.user_name}">
                    <div>
                        <p class="font-semibold text-gray-900">${item.user_name}</p>
                        <p class="text-sm text-gray-600">${item.user_title}</p>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        testimonialList.innerHTML = '<p class="col-span-full text-red-500">Could not load testimonials.</p>';
        console.error(error);
    }
}

    loadTestimonials();
});