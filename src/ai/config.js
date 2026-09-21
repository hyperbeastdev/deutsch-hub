const env = import.meta.env ?? {};

export const AI_CONFIG = Object.freeze({
  hosted: Object.freeze({
    provider: "groq",
    model: "openai/gpt-oss-20b",
    proxyUrl: env.VITE_GROQ_PROXY_URL || "",
  }),
});
