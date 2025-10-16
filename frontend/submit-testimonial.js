document.addEventListener("DOMContentLoaded", () => {
    const { access, role } = getAuth();
    if (!access || !role) {
        window.location.href = `auth.html?next=submit-testimonial.html`;
        return;
    }
    renderNavbar();

    const testimonialBtn = document.getElementById('submit-testimonial-btn');
    const contentTextarea = document.getElementById('testimonial-content');

    testimonialBtn.addEventListener('click', async () => {
        const content = contentTextarea.value;

        if (!content.trim()) {
            showAlert('Please write a testimonial before submitting.', 'error');
            return;
        }

        testimonialBtn.disabled = true;
        testimonialBtn.textContent = 'Submitting...';

        try {
            const res = await fetch(`${API}/profiles/testimonials/submit/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${access}` 
                },
                body: JSON.stringify({ content: content })
            });

            if (!res.ok) throw new Error('Failed to submit testimonial.');

            showAlert('Thank you! Your testimonial has been submitted for review.', 'success');
            contentTextarea.value = '';
            
            setTimeout(() => {
                const dashboardUrl = role === 'freelancer' ? 'freelancer_dashboard.html' : 'recruiter_dashboard.html';
                window.location.href = dashboardUrl;
            }, 1500);

        } catch (err) {
            showAlert(err.message, 'error');
            testimonialBtn.disabled = false;
            testimonialBtn.textContent = 'Submit for Review';
        }
    });
});