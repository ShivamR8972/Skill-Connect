// In faq-support.js

document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    const { email } = getAuth(); 

    const accordion = document.getElementById('faq-accordion');
    accordion.addEventListener('click', (e) => {
        const question = e.target.closest('.faq-question');
        if (question) {
            const answer = question.nextElementSibling;
            const arrow = question.querySelector('span:last-child');
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                arrow.style.transform = 'rotate(180deg)';
            }
        }
    });

    const supportEmail = 'stat1c8972@gmail.com';
    
    const emailInput = document.getElementById('support-email');
    const subjectInput = document.getElementById('support-subject');
    const messageInput = document.getElementById('support-message');
    const sendMessageBtn = document.getElementById('send-message-btn');

    if (email) {
        emailInput.value = email;
    }
    
    function buildMailtoLink() {
        const subject = subjectInput.value;
        const message = messageInput.value;
        const fromEmail = emailInput.value;

        let body = message;
        if (fromEmail) {
            body += `\n\n------------------\nFrom: ${fromEmail}`;
        }
        
        const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        sendMessageBtn.href = mailtoLink;
    }

    emailInput.addEventListener('input', buildMailtoLink);
    subjectInput.addEventListener('input', buildMailtoLink);
    messageInput.addEventListener('input', buildMailtoLink);

    buildMailtoLink();
});