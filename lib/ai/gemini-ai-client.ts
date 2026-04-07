import { createPartFromBase64, createUserContent, GoogleGenAI, Modality } from "@google/genai"
import { AI_TRANSCRIPTION_PROMPT } from "@/lib/ai/ai.config"
import { getServerEnv } from "@/lib/env/server"
import type {
  AiClient,
  AiPromptMessage,
  GenerateTextInput,
  GenerateTextResult,
  StreamTextChunk,
  SynthesizeSpeechInput,
  SynthesizeSpeechResult,
  TranscribeAudioInput,
  TranscribeAudioResult,
} from "@/lib/ai/ai.types"

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
const DEFAULT_GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
const DEFAULT_VOICE_NAME = "Kore"

const toSystemInstruction = (messages: AiPromptMessage[]) => {
  const systemMessages = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content.trim())
    .filter(Boolean)

  return systemMessages.length > 0 ? systemMessages.join("\n\n") : undefined
}

const toContents = (messages: AiPromptMessage[]) => {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      if (message.role === "assistant") {
        return `Assistant: ${message.content}`
      }

      return `User: ${message.content}`
    })
    .join("\n\n")
    .trim()
}

export class GeminiAiClient implements AiClient {
  readonly provider = "gemini" as const

  private readonly client: GoogleGenAI
  private readonly defaultModel: string

  constructor() {
    const env = getServerEnv()

    if (!env.AI_API_KEY) {
      throw new Error("AI_API_KEY is not configured")
    }

    this.client = new GoogleGenAI({ apiKey: env.AI_API_KEY })
    this.defaultModel = env.AI_MODEL || DEFAULT_GEMINI_MODEL
  }

  async generateText({
    messages,
    model,
    temperature,
    maxOutputTokens,
  }: GenerateTextInput): Promise<GenerateTextResult> {
    const prompt = toContents(messages)

    if (!prompt) {
      throw new Error("AI generation requires at least one non-system message")
    }

    const systemInstruction = toSystemInstruction(messages)
    const response = await this.client.models.generateContent({
      model: model || this.defaultModel,
      contents: prompt,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxOutputTokens !== undefined ? { maxOutputTokens } : {}),
      },
    })

    return {
      provider: this.provider,
      model: model || this.defaultModel,
      text: response.text || "",
    }
  }

  async *streamText({
    messages,
    model,
    temperature,
    maxOutputTokens,
  }: GenerateTextInput): AsyncGenerator<StreamTextChunk> {
    const prompt = toContents(messages)

    if (!prompt) {
      throw new Error("AI generation requires at least one non-system message")
    }

    const systemInstruction = toSystemInstruction(messages)
    const response = await this.client.models.generateContentStream({
      model: model || this.defaultModel,
      contents: prompt,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxOutputTokens !== undefined ? { maxOutputTokens } : {}),
      },
    })

    for await (const chunk of response) {
      if (chunk.text) {
        yield { text: chunk.text }
      }
    }
  }

  async transcribeAudio({
    audioBase64,
    mimeType,
    prompt,
    model,
  }: TranscribeAudioInput): Promise<TranscribeAudioResult> {
    const response = await this.client.models.generateContent({
      model: model || this.defaultModel,
      contents: createUserContent([
        createPartFromBase64(audioBase64, mimeType),
        prompt || AI_TRANSCRIPTION_PROMPT,
      ]),
    })

    return {
      provider: this.provider,
      model: model || this.defaultModel,
      text: response.text || "",
    }
  }

  async synthesizeSpeech({
    text,
    voiceName,
    model,
  }: SynthesizeSpeechInput): Promise<SynthesizeSpeechResult> {
    const resolvedModel = model || DEFAULT_GEMINI_TTS_MODEL
    const response = await this.client.models.generateContent({
      model: resolvedModel,
      contents: text,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: voiceName || DEFAULT_VOICE_NAME,
      },
    })

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data,
    )
    const audioBase64 = audioPart?.inlineData?.data
    const mimeType = audioPart?.inlineData?.mimeType || "audio/wav"

    if (!audioBase64) {
      throw new Error("Gemini did not return audio output")
    }

    return {
      provider: this.provider,
      model: resolvedModel,
      audioBase64,
      mimeType,
    }
  }
}
