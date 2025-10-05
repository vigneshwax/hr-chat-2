# Vignesh - HR Assistant

## Overview

This project is a web-based, personalized HR helpdesk application. The chatbot, named Vignesh, is a personalized HR assistant. It is designed to answer employee questions about company policies, benefits, and other HR-related topics. The application is built using modern web technologies, with a focus on a clean, responsive user interface and a secure, scalable architecture.

## Design and Features

### Visual Design

*   **Layout:** The application has a single-view interface. A simple header displays the application's name, "Vignesh - HR Assistant", and the main content area is dedicated entirely to the chatbot.
*   **Color Scheme:** The primary color is a professional and calming teal (`#008080`). The chatbot uses this for user messages and accents, with a clean white and light gray theme for the overall interface.
*   **Typography:** The "Inter" font family is used for its excellent readability on screens.
*   **Chat Interface:** The chatbot interface is modern and intuitive, featuring styled messages, a "thinking" indicator, and a responsive design that works well on all screen sizes.

### Features

*   **AI-Powered Chatbot:** The core of the application is the `chat-bot` web component, which encapsulates all chat functionality.
*   **Markdown Rendering:** Bot responses are now parsed for markdown and rendered as formatted HTML, allowing for styled text (headings, lists, bolding).
*   **Personalized Identity & Communication Style:**
    *   The chatbot's persona is "Vignesh," a personalized HR assistant.
    *   Responses are structured, concise, and use markdown for clarity.
    *   The chatbot will only state it was "designed by Vigneshwaran" if specifically asked.
    *   The initial greeting is short and direct.
*   **Gemini API Integration:** The chatbot uses the Google Gemini API (`gemini-pro-latest` model) to provide intelligent, structured, and context-aware responses.
*   **Robust Error Handling:** The application includes specific error handling. If the API connection fails, it displays a user-friendly message that suggests checking the API key's validity and permissions.
*   **Clean Codebase:** The entire project (`HTML`, `CSS`, and `JavaScript`) has been reviewed and cleaned.

## Current Plan: Implement Markdown Rendering

The user reported that markdown in bot responses was not rendering correctly.

**Steps Taken:**

1.  **Added `showdown` Library:** The `showdown` markdown-to-HTML library was added to `index.html` via a CDN.
2.  **Updated Rendering Logic:** The `displayMessage` function in `main.js` was modified. It now uses `showdown` to convert markdown in bot messages to HTML before displaying them, ensuring proper formatting.
3.  **Updated `blueprint.md`:** This blueprint has been updated to document the new markdown rendering capability.
