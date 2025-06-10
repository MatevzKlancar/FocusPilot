import OpenAI from "openai";
import type { OpenAIClient } from "./client.js";
import { agentTools, executeTool, type ToolContext } from "./tools.js";
import { FOCUSPILOT_SYSTEM_PROMPT } from "./prompts.js";

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface AgentResponse {
  message: string;
  toolCalls?: Array<{
    name: string;
    params: any;
    result: any;
  }>;
}

export class FocusPilotAgent {
  constructor(
    private openaiClient: OpenAIClient,
    private toolContext: ToolContext
  ) {}

  async processMessage(
    userMessage: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: FOCUSPILOT_SYSTEM_PROMPT },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    try {
      const completion = (await this.openaiClient.createChatCompletion({
        model: "gpt-4",
        messages,
        tools: agentTools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      })) as OpenAI.Chat.Completions.ChatCompletion;

      const choice = completion.choices[0];
      if (!choice?.message) {
        throw new Error("No response from OpenAI");
      }

      const response: AgentResponse = {
        message: choice.message.content || "",
        toolCalls: [],
      };

      // Handle tool calls if any
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type === "function") {
            try {
              const params = JSON.parse(toolCall.function.arguments);
              const result = await executeTool(
                toolCall.function.name,
                params,
                this.toolContext
              );

              response.toolCalls?.push({
                name: toolCall.function.name,
                params,
                result,
              });

              // Tools now return contextual data instead of pre-written messages
              // The API layer will handle contextual response generation
            } catch (error) {
              console.error(
                `Tool execution error for ${toolCall.function.name}:`,
                error
              );
              response.message += `\n\nSorry, I had trouble executing that action. Let me try to help you in another way.`;
            }
          }
        }
      }

      return response;
    } catch (error) {
      console.error("Agent processing error:", error);
      return {
        message:
          "I'm having some technical difficulties right now. Please try again in a moment.",
      };
    }
  }

  async streamMessage(
    userMessage: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<AsyncIterable<string>> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: FOCUSPILOT_SYSTEM_PROMPT },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    try {
      const stream = (await this.openaiClient.createStreamingChatCompletion({
        model: "gpt-4",
        messages,
        tools: agentTools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      })) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      return this.processStream(stream);
    } catch (error) {
      console.error("Agent streaming error:", error);
      // Return a simple async generator with error message
      return (async function* () {
        yield "I'm having some technical difficulties right now. Please try again in a moment.";
      })();
    }
  }

  private async *processStream(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  ): AsyncIterable<string> {
    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (choice?.delta?.content) {
        yield choice.delta.content;
      }

      // Handle tool calls in streaming mode
      if (choice?.delta?.tool_calls) {
        // For now, we'll handle tool calls after the stream completes
        // In a more sophisticated implementation, you might want to
        // execute tools during streaming
      }
    }
  }

  // Utility method to get context for the agent
  async getContext(): Promise<string> {
    try {
      const todayTasks = await this.toolContext.tasksService.getTodayTasks(
        this.toolContext.userId
      );

      const contextParts = [
        `Today's date: ${new Date().toISOString().split("T")[0]}`,
        `User has ${todayTasks.length} tasks due today`,
      ];

      if (todayTasks.length > 0) {
        const completed = todayTasks.filter((task) => task.completed_at).length;
        const pending = todayTasks.length - completed;

        contextParts.push(
          `Tasks completed: ${completed}`,
          `Tasks pending: ${pending}`
        );
      }

      return contextParts.join("\n");
    } catch (error) {
      console.error("Error getting context:", error);
      return "Unable to fetch current context";
    }
  }
}
