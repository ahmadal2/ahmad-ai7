# AI Agent Chat

An AI-powered chat application integrated with Google's Gemini API and Anthropic's Claude API.

## Getting Started

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Google Gemini API key
3. (Optional) Set the `CLAUDE_API_KEY` in [.env.local](.env.local) to your Anthropic Claude API key
4. Run the app:
   `npm run dev`

**Note:** This application supports both Google Gemini models and Anthropic Claude models. 
- For Gemini models, you need a Google AI Studio API key
- For Claude models, you need an Anthropic API key

## Features

- Interactive chat interface with input, message rendering, and history display
- Support for Markdown rendering in responses
- Animated AI response indicators
- Modal-based prompt management
- Support for multiple AI models including:
  - Google Gemini Flash and Pro models
  - Anthropic Claude 3.5 Sonnet and Claude 3 Opus
- Designed for deployment in Google AI Studio (linked)
- Built for local development and extensible UI customization