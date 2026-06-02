import Anthropic from "@anthropic-ai/sdk";

export const MODEL =
  process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function extractToolInput<T>(
  response: Anthropic.Message,
  toolName: string
): T {
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === toolName
  );

  if (!toolUseBlock) {
    const textBlocks = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    throw new Error(
      `Tool "${toolName}" was not called by the model. Response: ${textBlocks.slice(0, 500)}`
    );
  }

  return toolUseBlock.input as T;
}
