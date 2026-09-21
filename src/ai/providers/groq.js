import Groq from "groq-sdk";
import { AI_CONFIG } from "../config.js";
import { AIError, AI_ERROR_CODES, normalizeProviderError } from "../errors.js";

export function createGroqProvider({ client, config = AI_CONFIG.hosted } = {}) {
  let groq = client;

  const getClient = () => {
    if (groq) return groq;
    if (!config.proxyUrl) {
      throw new AIError({
        code: AI_ERROR_CODES.CONFIGURATION,
        message: "VITE_GROQ_PROXY_URL is not configured",
        provider: config.provider,
        model: config.model,
      });
    }

    groq = new Groq({
      apiKey: "proxy-key",
      baseURL: config.proxyUrl,
      dangerouslyAllowBrowser: true,
    });
    return groq;
  };

  return {
    name: config.provider,
    model: config.model,
    async complete({ messages, temperature, responseFormat }) {
      try {
        return await getClient().chat.completions.create({
          messages,
          model: config.model,
          temperature,
          ...(responseFormat ? { response_format: responseFormat } : {}),
        });
      } catch (error) {
        throw normalizeProviderError(error, { provider: config.provider, model: config.model });
      }
    },
  };
}
