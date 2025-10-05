
// --- Constants ---
// WARNING: Exposing an API key in client-side code is a major security risk.
// This key can be stolen and used by others, leading to unexpected charges.
// The recommended and secure practice is to use a backend proxy.
const GEMINI_API_KEY = 'AIzaSyCJHzatK259K03vMB208m6Fg79YoUYED5g';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
const HR_BOT_SYSTEM_INSTRUCTION = "Your name is Vignesh, a personalized HR assistant. Provide structured, concise, and quick answers. Use markdown for formatting (headings, lists, bold). If asked who designed you, and only in that case, state you were designed by Vigneshwaran.";

// --- Web Component: ChatBot ---
class ChatBot extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.converter = new showdown.Converter();
        this.render();

        // Cache DOM elements
        this.chatWindow = this.shadowRoot.querySelector('.chat-window');
        this.input = this.shadowRoot.querySelector('.chat-input input');
        this.sendButton = this.shadowRoot.querySelector('.chat-input button');
        this.thinkingIndicator = this.shadowRoot.querySelector('.thinking-indicator');

        this.addEventListeners();
        this.displayMessage("Hello! I am Vignesh, your HR assistant. How can I help you today?", "bot");
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    background: #fff;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .chat-window {
                    flex-grow: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background-color: #f9f9f9;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .message {
                    padding: 12px 18px;
                    border-radius: 20px;
                    max-width: 80%;
                    line-height: 1.5;
                    word-wrap: break-word;
                    font-size: 0.95rem;
                }
                .user-message {
                    background-color: #008080;
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 5px;
                }
                .bot-message {
                    background-color: #f0f0f0;
                    color: #333;
                    align-self: flex-start;
                    border-bottom-left-radius: 5px;
                }
                .thinking-indicator {
                    display: none;
                    align-self: flex-start;
                    color: #999;
                    font-style: italic;
                    font-size: 0.9rem;
                }
                .chat-input {
                    display: flex;
                    padding: 15px 20px;
                    border-top: 1px solid #ddd;
                    background: #fff;
                }
                .chat-input input {
                    flex-grow: 1;
                    border: 1px solid #ccc;
                    border-radius: 20px;
                    padding: 12px 18px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .chat-input input:focus {
                    border-color: #008080;
                }
                .chat-input button {
                    background-color: #008080;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    margin-left: 10px;
                    cursor: pointer;
                    font-size: 1.5rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: background-color 0.2s, transform 0.2s;
                }
                .chat-input button:hover {
                    background-color: #006666;
                    transform: scale(1.05);
                }
                .chat-input button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                    transform: scale(1);
                }
            </style>
            <div class="chat-window"></div>
            <div class="thinking-indicator">Thinking...</div>
            <div class="chat-input">
                <input type="text" placeholder="Ask an HR question...">
                <button title="Send Message">&#x27A4;</button>
            </div>
        `;
    }

    addEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });
    }

    async handleSendMessage() {
        const userInput = this.input.value.trim();
        if (!userInput) return;

        this.displayMessage(userInput, 'user');
        this.input.value = '';
        this.setThinking(true);

        try {
            const botResponse = await this.getBotResponse(userInput);
            this.displayMessage(botResponse, 'bot');
        } catch (error) {
            console.error("Failed to get bot response:", error);
            const errorMessage = "Sorry, I am having trouble connecting to the AI. Please ensure the API key is valid and has the correct permissions, then try again.";
            this.displayMessage(errorMessage, 'bot');
        } finally {
            this.setThinking(false);
        }
    }

    displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        if (sender === 'bot') {
            messageElement.innerHTML = this.converter.makeHtml(message);
        } else {
            messageElement.textContent = message;
        }
        
        this.chatWindow.appendChild(messageElement);
        this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }

    setThinking(isThinking) {
        this.thinkingIndicator.style.display = isThinking ? 'block' : 'none';
        this.input.disabled = isThinking;
        this.sendButton.disabled = isThinking;
        if (!isThinking) {
            this.input.focus();
        }
    }

    async getBotResponse(userInput) {
        const requestBody = {
            "contents": [{
                "parts": [{
                    "text": `${HR_BOT_SYSTEM_INSTRUCTION} Here is the user's question: ${userInput}`
                }]
            }]
        };

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error Response:', response.status, errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.candidates?.[0]?.finishReason === "SAFETY") {
            return "I cannot answer this question as it violates our safety policy.";
        }
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
             console.error("No text in API response:", JSON.stringify(data, null, 2));
            return "Sorry, I couldn’t generate a response. Please try asking in a different way.";
        }
        return text;
    }
}

// --- Main Execution ---
customElements.define('chat-bot', ChatBot);
