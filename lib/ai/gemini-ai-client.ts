import { GoogleGenAI } from "@google/genai"
import { getServerEnv } from "@/lib/env/server"
import type {
  AiClient,
  AiPromptMessage,
  GenerateTextInput,
  GenerateTextResult,
} from "@/lib/ai/ai.types"

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

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
}
