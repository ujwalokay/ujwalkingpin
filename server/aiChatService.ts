import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are a helpful AI assistant for a gaming center management system. You help staff with:

1. **Bookings & Operations**: Answer questions about seat availability, pricing, booking management, and operational procedures
2. **Customer Service**: Help draft messages to customers, suggest responses to common queries
3. **Analytics & Reports**: Provide insights on revenue, popular time slots, capacity utilization
4. **Loyalty Programs**: Explain loyalty tiers, points calculation, and reward redemption
5. **Food Orders**: Help with food menu items, pricing, and order management
6. **Troubleshooting**: Assist with common issues and provide guidance

Be concise, professional, and actionable. When asked about specific data, acknowledge that you can provide general guidance and the staff should check the system for real-time data.`;

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  if (!openai) {
    throw new Error("AI chat is not configured. Please set the OPENAI_API_KEY environment variable.");
  }

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 2048,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    if (error.status === 401) {
      throw new Error("OpenAI API key is invalid or expired");
    } else if (error.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again later.");
    } else {
      throw new Error("Failed to generate AI response. Please try again.");
    }
  }
}
