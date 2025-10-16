document.addEventListener("DOMContentLoaded", () => {
    // --- DOM ELEMENT SELECTIONS ---
    const chatContainer = document.getElementById('chatbot-container');
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    const { access } = getAuth(); // Get the user's JWT access token from main.js

    // --- INITIALIZATION ---
    // If the user is not logged in, hide the chatbot completely.
    if (!access) {
        if (chatContainer) chatContainer.style.display = 'none';
        return;
    }

    // --- EVENT LISTENERS ---

    // Toggle chat window visibility
    toggleBtn.addEventListener('click', () => {
        const isHidden = chatWindow.classList.contains('hidden');
        if (isHidden) {
            chatWindow.classList.remove('hidden');
            setTimeout(() => { // Allow display property to apply before transform
                chatWindow.classList.remove('scale-95', 'opacity-0');
            }, 10);
        } else {
            chatWindow.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                chatWindow.classList.add('hidden');
            }, 300); // Match CSS transition duration
        }
    });

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message when Enter key is pressed
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- CORE FUNCTIONS ---

    /**
     * Handles sending the user's message to the backend and displaying the AI's response.
     */
    async function sendMessage() {
        const userMessage = input.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user'); // Display user's message
        input.value = '';
        input.disabled = true; // Disable input while waiting for a response
        sendBtn.disabled = true;

        // Display a "thinking" indicator for better user experience
        addMessage("...", 'bot-thinking');

        try {
            // Call our own secure backend endpoint
            const res = await fetch(`${API}profiles/chatbot/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access}`
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!res.ok) {
                throw new Error('The AI service is currently unavailable. Please try again later.');
            }
            
            const data = await res.json();
            const botResponse = data.reply;

            // Remove "thinking" indicator before adding the real response
            const thinkingBubble = messagesContainer.querySelector('.thinking');
            if (thinkingBubble) {
                thinkingBubble.parentElement.remove();
            }
            
            addMessage(botResponse, 'bot');

        } catch (error) {
            // If an error occurs, remove the "thinking" bubble and show the error message
            const thinkingBubble = messagesContainer.querySelector('.thinking');
            if (thinkingBubble) {
                thinkingBubble.parentElement.remove();
            }
            addMessage(error.message, 'bot');
        } finally {
            // Re-enable the input field regardless of success or failure
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    /**
     * Creates and appends a new chat bubble to the message container.
     * @param {string} text - The message text to display.
     * @param {string} sender - The sender type ('user', 'bot', or 'bot-thinking').
     */
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-2';
        
        const bubble = document.createElement('div');
        bubble.textContent = text;
        bubble.className = 'rounded-lg p-2 inline-block max-w-xs animate-fade-in';

        if (sender === 'user') {
            messageDiv.className += ' text-right';
            bubble.classList.add('bg-blue-600', 'text-white');
        } else if (sender === 'bot-thinking') {
            bubble.classList.add('bg-gray-200', 'text-gray-800', 'thinking');
        } else { // 'bot'
            bubble.classList.add('bg-gray-200', 'text-gray-800');
        }

        messageDiv.appendChild(bubble);
        messagesContainer.appendChild(messageDiv);

        // Auto-scroll to the bottom to show the latest message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});