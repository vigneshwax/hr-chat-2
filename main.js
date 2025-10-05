
// --- Firebase Configuration ---
// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Global Variables ---
let currentUser = null;
let chatHistoryRef = null;
let hasShownLoginPrompt = false;

// --- Constants ---
// WARNING: Exposing an API key in client-side code is a major security risk.
const GEMINI_API_KEY = 'AIzaSyCJHzatK259K03vMB208m6Fg79YoUYED5g';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
const HR_BOT_SYSTEM_INSTRUCTION = `You are "Vignesh," an AI-powered HR assistant. Adjust your tone based on the user:

1. **Casual chat:** If the user speaks normally, respond casually and friendly, like a human friend. 
2. **Professional HR questions:** If the user asks about HR topics (leave, payroll, benefits, onboarding, forms, policies, performance), respond professionally, clearly, and helpfully. 
3. **Unknown questions:** If unsure, politely escalate. 
4. **Tone rules:** Match the user’s tone. Always be polite, clear, and correct. 
5. **Intro message:** "Hello! I'm Vignesh, your HR assistant. How can I help you today? You can ask me about Benefits, Payroll, Leave Policy, Company Culture, Performance Reviews, and more."`;


// --- Web Component: ChatBot ---
class ChatBot extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.converter = new showdown.Converter();
        this.render();

        this.chatWindow = this.shadowRoot.querySelector('.chat-window');
        this.input = this.shadowRoot.querySelector('.chat-input input');
        this.sendButton = this.shadowRoot.querySelector('.chat-input button');
        this.thinkingIndicator = this.shadowRoot.querySelector('.thinking-indicator');

        this.addEventListeners();
        this.displayMessage("Hello! I'm Vignesh, your HR assistant. How can I help you today?", "bot");
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
                .info-message {
                    background-color: #e6f7ff;
                    color: #333;
                    align-self: center;
                    text-align: center;
                    border-radius: 8px;
                    font-style: italic;
                    padding: 8px 12px;
                    font-size: 0.9rem;
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
                }
                .chat-input button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
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
            if (e.key === 'Enter') this.handleSendMessage();
        });
    }

    async handleSendMessage() {
        const userInput = this.input.value.trim();
        if (!userInput) return;

        if (!currentUser && !hasShownLoginPrompt) {
            this.displayMessage("Log in to save and continue your conversations across sessions.", "info");
            hasShownLoginPrompt = true;
        }

        this.displayMessage(userInput, 'user');
        this.saveMessageToFirestore(userInput, 'user');
        this.input.value = '';
        this.setThinking(true);

        try {
            const botResponse = await this.getBotResponse(userInput);
            this.displayMessage(botResponse, 'bot');
            this.saveMessageToFirestore(botResponse, 'bot');
        } catch (error) {
            console.error("Failed to get bot response:", error);
            const errorMessage = "Sorry, I am having trouble connecting to the AI. Please try again.";
            this.displayMessage(errorMessage, 'bot');
        } finally {
            this.setThinking(false);
        }
    }

    displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        if (sender === 'bot' || sender === 'info') {
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
        if (!isThinking) this.input.focus();
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
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (data.candidates?.[0]?.finishReason === "SAFETY") {
            return "I cannot answer this question as it violates our safety policy.";
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return "Sorry, I couldn’t generate a response. Please try again.";
        }
        return text;
    }

    clearChat() {
        this.chatWindow.innerHTML = '';
    }

    async saveMessageToFirestore(message, sender) {
        if (!chatHistoryRef) return;
        try {
            await chatHistoryRef.add({
                message: message,
                sender: sender,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error saving message to Firestore:", error);
        }
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    customElements.define('chat-bot', ChatBot);
    const chatbot = document.querySelector('chat-bot');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    // --- Firebase Auth State Handling ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            chatHistoryRef = db.collection('users').doc(currentUser.uid).collection('chats');
            
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';

            await loadChatHistory(chatbot);

        } else {
            // User is signed out
            currentUser = null;
            chatHistoryRef = null;

            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            
            // Only clear and show greeting if it's a new session, not on logout
            if (!hasShownLoginPrompt) { // A bit of a hack to detect if it's a new session
                chatbot.clearChat();
                chatbot.displayMessage("Hello! I'm Vignesh, your HR assistant. How can I help you today?", "bot");
            }
        }
    });

    // --- Event Listeners ---
    loginButton.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
    });

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            // After signing out, reset the chat to its initial anonymous state
            const chatbot = document.querySelector('chat-bot');
            chatbot.clearChat();
            chatbot.displayMessage("Hello! I'm Vignesh, your HR assistant. How can I help you today?", "bot");
            hasShownLoginPrompt = false;
        });
    });
});

async function loadChatHistory(chatbot) {
    if (!chatHistoryRef) return;
    
    chatbot.clearChat();
    const snapshot = await chatHistoryRef.orderBy("timestamp").get();
    
    if (snapshot.empty) {
        chatbot.displayMessage("Welcome back! How can I help you today?", "bot");
    } else {
        snapshot.forEach(doc => {
            const data = doc.data();
            chatbot.displayMessage(data.message, data.sender);
        });
    }
}
