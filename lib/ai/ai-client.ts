import { getServerEnv } from "@/lib/env/server";
import { GeminiAiClient } from "@/lib/ai/gemini-ai-client";
import type { AiClient, AiProvider } from "@/lib/ai/ai.types";

let cachedClient: AiClient | undefined;

const resolveProvider = (): AiProvider => {
  const env = getServerEnv();
  return env.AI_PROVIDER || "gemini";
};

export const createAiClient = (provider = resolveProvider()): AiClient => {
  switch (provider) {
    case "gemini":
      return new GeminiAiClient();
    default:
      throw new Error(`"${provider}" AI is not implemented yet`);
  }
};

export const getAiClient = () => {
  if (!cachedClient) {
    cachedClient = createAiClient();
  }

  return cachedClient;
};
