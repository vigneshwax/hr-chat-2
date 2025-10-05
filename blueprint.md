# Vignesh - HR AI Assistant

## Overview

This project is a web-based, personalized HR helpdesk application. The chatbot, named Vignesh, is an AI assistant designed to answer employee questions about company policies, benefits, and other HR-related topics. The application is built using modern web technologies, with a focus on providing immediate assistance while offering optional features for persistent, personalized experiences through Firebase integration.

## Backend and Data

*   **Firebase Integration:** The application is connected to a Firebase project to leverage its backend services for optional features.
*   **Firebase Authentication:** User identity is managed through Firebase Authentication, allowing users to *optionally* sign up and log in with their Google accounts to save their chat history.
*   **Firestore Database:** For authenticated users, chat histories are stored in Firestore, a NoSQL document database. Each user has a dedicated collection for their conversation history, ensuring data privacy and a continuous experience across sessions.

## Design and Features

### Visual Design

*   **Layout:** The application features a clean, single-view interface. The header contains the application title and user authentication controls (Login/Logout), while the main content area is dedicated to the chat interface.
*   **Color Scheme:** The primary color is a professional and calming teal (`#008080`), used for accents and user messages.
*   **Typography:** The "Inter" font family is used for its excellent on-screen readability.
*   **Chat Interface:** The chat interface is modern and intuitive, with styled messages, a "thinking" indicator, and a responsive design.

### Features

*   **Anonymous Chat (Guest Mode):** All users can chat with the AI assistant immediately without needing to create an account. The chat is fully functional but the history is not saved.
*   **Optional User Authentication:** Users can choose to log in with their Google account. This enables the chat history feature.
*   **Persistent Chat History for Logged-In Users:** For users who log in, their entire conversation history is automatically saved to Firestore. When they log in again, their previous conversation is loaded.
*   **Informational Prompt:** Anonymous users are shown a one-time, non-intrusive message encouraging them to log in to save their chat history.
*   **AI-Powered Chatbot:** The core of the application is the `chat-bot` web component.
*   **Adaptive Persona:** The chatbot, "Vignesh," adjusts its tone based on the user's input, responding casually to informal chat and professionally to HR-related questions.
*   **Gemini API Integration:** The chatbot uses the Google Gemini API (`gemini-pro-latest` model) for its conversational intelligence.
*   **Markdown Rendering:** The bot's responses are rendered as formatted HTML for clarity.

## Current Plan: Make Login Optional for Chat

The user requested that logging in should not be mandatory to use the chatbot.

**Steps Taken:**

1.  **Enabled Chat for All Users:** Modified `main.js` to enable the chat input field and send button for all users by default.
2.  **Implemented Anonymous Chat Logic:** Updated the `handleSendMessage` function to allow non-authenticated users to chat. A flag (`hasShownLoginPrompt`) was added to show a one-time informational message prompting anonymous users to log in to save their history.
3.  **Conditional Data Persistence:** The `saveMessageToFirestore` function now only saves messages if a user is logged in (`chatHistoryRef` is not null).
4.  **Updated Logout Flow:** The logout process now correctly clears the chat and resets the interface to the anonymous state.
5.  **Updated Blueprint:** This document has been updated to reflect the new "login optional" architecture and features.
