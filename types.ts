export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface Message {
  role: MessageRole;
  content: string;
  videoUrl?: string;
  isGeneratingVideo?: boolean;
  imageUrl?: string;
  originalImageUrl?: string;
  isEditingImage?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  model: string;
}

export interface PromptTemplate {
    title: string;
    prompt: string;
}