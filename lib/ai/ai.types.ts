export type AiProvider = string;

export type AiPromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamTextChunk = {
  text: string;
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

export type TranscribeAudioInput = {
  audioBase64: string;
  mimeType: string;
  prompt?: string;
  model?: string;
};

export type TranscribeAudioResult = {
  provider: AiProvider;
  model: string;
  text: string;
};

export type SynthesizeSpeechInput = {
  text: string;
  voiceName?: string;
  model?: string;
};

export type SynthesizeSpeechResult = {
  provider: AiProvider;
  model: string;
  audioBase64: string;
  mimeType: string;
};

export interface AiClient {
  readonly provider: AiProvider;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  streamText(input: GenerateTextInput): AsyncGenerator<StreamTextChunk>;
  transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioResult>;
  synthesizeSpeech(input: SynthesizeSpeechInput): Promise<SynthesizeSpeechResult>;
}
