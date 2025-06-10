import OpenAI from "openai";

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  project?: string;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      project: config.project,
    });
  }

  get openai(): OpenAI {
    return this.client;
  }

  async createChatCompletion(params: OpenAI.Chat.ChatCompletionCreateParams) {
    return this.client.chat.completions.create(params);
  }

  async createStreamingChatCompletion(
    params: OpenAI.Chat.ChatCompletionCreateParams
  ) {
    return this.client.chat.completions.create({
      ...params,
      stream: true,
    });
  }

  async createEmbedding(params: OpenAI.Embeddings.EmbeddingCreateParams) {
    return this.client.embeddings.create(params);
  }
}

// Default client instance
let defaultClient: OpenAIClient | null = null;

export function setDefaultOpenAIClient(client: OpenAIClient): void {
  defaultClient = client;
}

export function getDefaultOpenAIClient(): OpenAIClient {
  if (!defaultClient) {
    throw new Error(
      "Default OpenAI client not initialized. Call setDefaultOpenAIClient() first."
    );
  }
  return defaultClient;
}

export function createOpenAIClient(config: OpenAIConfig): OpenAIClient {
  return new OpenAIClient(config);
}
