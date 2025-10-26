import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is not set in environment variables.");
        }
        openaiClient = new OpenAI({ apiKey });
    }
    return openaiClient;
};

export const createChatGPTSession = async (model: string, messages: Array<{ role: string; content: string }>) => {
    const openai = getOpenAIClient();
    
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: messages,
            stream: true,
        });
        
        return response;
    } catch (error) {
        if (error instanceof OpenAI.APIError) {
            // Handle specific error cases
            if (error.status === 429) {
                throw new Error("Rate limit exceeded. You have exceeded your current quota for the OpenAI API. Please wait before trying again, or consider upgrading to a paid plan for higher quotas.");
            } else if (error.status === 401) {
                throw new Error("Invalid API key. Please check your OpenAI API key.");
            } else {
                throw new Error(`OpenAI API error: ${error.message}`);
            }
        }
        throw error;
    }
};