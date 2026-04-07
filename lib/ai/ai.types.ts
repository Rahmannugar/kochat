export type AiProvider = string;

export type AiPromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextInput = {
  messages: AiPromptMessage[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type GenerateTextResult = {
  provider: AiProvider;
  model: string;
  text: string;
};

export interface AiClient {
  readonly provider: AiProvider;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}
