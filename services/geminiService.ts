import { GoogleGenAI, Chat, GenerationConfig, Operation, GenerateVideosResponse, Modality } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { Message, MessageRole } from "../types";

let ai: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
    if (!ai) {
        // Use process.env.GEMINI_API_KEY which is defined in vite.config.ts
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

// For Veo, we create a new instance each time to ensure the latest key is used.
const getVeoAi = (): GoogleGenAI => {
    // Use process.env.GEMINI_API_KEY which is defined in vite.config.ts
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};


const formatHistory = (history: Message[]) => {
    return history.map(msg => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.content }],
    })).slice(0, -1); // Exclude the last empty assistant message
};


// Fix for error on line 60: 'systemInstruction' does not exist in type 'CreateChatParameters'. It should be inside the 'config' object.
export const createChatSession = (model: string, history: Message[]): Chat => {
    const genAI = getAi();
    let effectiveModel = model;
    // Fix for error on line 44: 'systemInstruction' does not exist in type 'GenerationConfig'.
    // The Gemini API expects systemInstruction inside the config object, but the `GenerationConfig`
    // type from the SDK might not include it. We use a type intersection to create a compatible
    // config object that includes `systemInstruction` while still allowing other `GenerationConfig` properties.
    const config: Partial<GenerationConfig> & { systemInstruction?: string } = {
        systemInstruction: SYSTEM_PROMPT
    };

    if (model === 'gemini-2.5-pro-thinking') {
        effectiveModel = 'gemini-2.5-pro';
        config.thinkingConfig = { thinkingBudget: 32768 };
    }
    
    // Handle non-Gemini models - they are not connected to Claude API key or any other external service
    if (model === 'claude-3-sonnet-free' || model === 'chatgpt-5-free') {
        // These models are listed for display purposes only and are not actually implemented
        // They would require separate API services and keys which are not included in this application
        throw new Error(`Model ${model} is not supported in this demo application. This application only supports Google Gemini models.`);
    }
    if (model === 'claude-3-5-sonnet-20241022' || model === 'claude-3-opus-20240229') {
        // These models are handled by the Claude service, not Gemini
        throw new Error(`Model ${model} is handled by the Claude service, not the Gemini service.`);
    }
    
    // Placeholder for other models - currently they will fail as they are not Google models
    if (model === 'chatgpt-4-free') {
        // In a real app, you would have separate services for these models.
        // For this example, we'll just let it use the Gemini SDK which will likely error out,
        // or you could default to a Gemini model. Let's show a clear error.
        throw new Error(`Model ${model} is not supported by the standard chat service.`);
    }

    return genAI.chats.create({
        model: effectiveModel,
        config,
        history: formatHistory(history),
    });
};

export async function* generateVideo(prompt: string, aspectRatio: '16:9' | '9:16'): AsyncGenerator<string> {
    const ai = getVeoAi();
    // Fix for error: '"@google/genai"' has no exported member named 'GenerateVideosOperationResponse'.
    let operation: Operation<GenerateVideosResponse> = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
            resolution: '720p',
        }
    });

    yield 'processing';

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      try {
        operation = await ai.operations.getVideosOperation({ operation: operation });
      } catch (e) {
        if (e instanceof Error) {
          // Handle rate limit errors specifically
          if (e.message.includes("429") || e.message.includes("quota") || e.message.includes("RESOURCE_EXHAUSTED")) {
            throw new Error("Rate limit exceeded. You have exceeded your current quota for the Gemini API. Please wait before trying again, or consider upgrading to a paid plan for higher quotas.");
          } else if (e.message.includes("Requested entity was not found.")) {
            throw new Error("API key not found. Please select a valid API key.");
          }
        }
        throw e; // Re-throw other errors
      }
    }
    
    if (operation.error) {
      // Handle rate limit errors in operation errors
      const errorMessage = String(operation.error.message);
      if (errorMessage && 
          (errorMessage.includes("429") || 
           errorMessage.includes("quota") || 
           errorMessage.includes("RESOURCE_EXHAUSTED"))) {
        throw new Error("Rate limit exceeded. You have exceeded your current quota for the Gemini API. Please wait before trying again, or consider upgrading to a paid plan for higher quotas.");
      }
      // Fix for error on line 88: Argument of type 'unknown' is not assignable to parameter of type 'string'.
      // Assuming the line number was misreported and refers to this line.
      // Using String() makes this call more robust in case the message property is not a string at runtime.
      throw new Error(errorMessage);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed to produce a download link.");
    }

    const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    yield videoUrl;
}

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAi();
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: prompt,
    };

    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, textPart] },
          config: {
              responseModalities: [Modality.IMAGE],
          },
      });

      for (const part of response.candidates?.[0]?.content?.parts) {
          if (part.inlineData) {
              return part.inlineData.data; // Return the new base64 image data
          }
      }

      throw new Error("Image generation failed to produce an image.");
    } catch (e) {
      if (e instanceof Error) {
        // Handle rate limit errors specifically
        if (e.message.includes("429") || e.message.includes("quota") || e.message.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("Rate limit exceeded. You have exceeded your current quota for the Gemini API. Please wait before trying again, or consider upgrading to a paid plan for higher quotas.");
        }
      }
      throw e; // Re-throw other errors
    }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    const ai = getAi();
    const audioPart = {
        inlineData: {
            data: audioBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: "Please transcribe this audio recording.",
    };

    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [audioPart, textPart] },
      });

      return response.text;
    } catch (e) {
      if (e instanceof Error) {
        // Handle rate limit errors specifically
        if (e.message.includes("429") || e.message.includes("quota") || e.message.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("Rate limit exceeded. You have exceeded your current quota for the Gemini API. Please wait before trying again, or consider upgrading to a paid plan for higher quotas.");
        }
      }
      throw e; // Re-throw other errors
    }
};