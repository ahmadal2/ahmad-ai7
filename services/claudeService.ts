import Anthropic from "@anthropic-ai/sdk";
import { Message, MessageRole } from "../types";

let anthropic: Anthropic | null = null;

const getAnthropic = (): Anthropic => {
    if (!anthropic) {
        if (!process.env.CLAUDE_API_KEY) {
            throw new Error("CLAUDE_API_KEY is not set in environment variables.");
        }
        anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
        });
    }
    return anthropic;
};

export const createClaudeChatSession = async (model: string, history: Message[], prompt: string) => {
    const anthropic = getAnthropic();
    
    // Convert history to Claude format
    const messages: Anthropic.MessageParam[] = history.map(msg => ({
        role: msg.role === MessageRole.USER ? "user" as const : "assistant" as const,
        content: msg.content,
    }));

    // Add the current prompt
    messages.push({
        role: "user" as const,
        content: prompt,
    });

    try {
        const response = await anthropic.messages.create({
            model: model,
            messages: messages,
            max_tokens: 1024,
        });

        // Check the type of content before accessing text
        if (response.content[0].type === 'text') {
            return response.content[0].text;
        } else {
            throw new Error("Unexpected response format from Claude API");
        }
    } catch (error) {
        if (error instanceof Anthropic.APIError) {
            if (error.status === 429) {
                throw new Error("Rate limit exceeded. You have exceeded your current quota for the Claude API. Please wait before trying again, or consider upgrading to a paid plan for higher quotas.");
            } else if (error.status === 401) {
                throw new Error("Invalid API key. Please check your CLAUDE_API_KEY in the environment variables.");
            } else if (error.status === 400) {
                throw new Error("Bad request. Please check your input and try again.");
            }
        }
        throw error;
    }
};

export const transcribeAudioWithClaude = async (audioBase64: string, mimeType: string): Promise<string> => {
    // Claude doesn't have built-in audio transcription
    // This would require a separate service like Whisper or Google Speech-to-Text
    throw new Error("Audio transcription is not supported with Claude. Please use a different model or service for audio transcription.");
};