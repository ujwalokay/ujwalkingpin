// Template-based chatbot responses (no real AI needed - just smart pattern matching)

interface ResponseTemplate {
  keywords: string[];
  response: string;
}

const responseTemplates: ResponseTemplate[] = [
  {
    keywords: ['booking', 'seat', 'availability', 'available', 'book'],
    response: "To check seat availability, go to the Dashboard and select a date and time slot. You can see available seats by category (PS5, PC, VR, etc.). To make a booking, fill in customer details and select the available seat."
  },
  {
    keywords: ['price', 'pricing', 'cost', 'how much', 'rate'],
    response: "Pricing varies by device category and duration. You can view and configure pricing in Settings > Pricing Configuration. Common durations are 30 mins, 1 hour, 2 hours, etc."
  },
  {
    keywords: ['food', 'menu', 'order', 'snacks', 'drinks'],
    response: "To manage food orders, go to the Food section. You can add menu items with prices and manage orders. Food items can be added to bookings during checkout."
  },
  {
    keywords: ['loyalty', 'points', 'member', 'tier', 'reward'],
    response: "The loyalty system has 4 tiers: Bronze, Silver, Gold, and Platinum. Members earn points based on their spending (configure in Settings). You can manage members in the AI Loyalty section."
  },
  {
    keywords: ['report', 'revenue', 'stats', 'analytics', 'earning'],
    response: "View reports and analytics in the Reports section. You can see daily, weekly, and monthly revenue, popular time slots, and capacity utilization. AI Load Analytics shows real-time metrics and predictions."
  },
  {
    keywords: ['expense', 'cost', 'spending'],
    response: "Track expenses in the Expenses section. You can add daily operational costs, categorize them, and view spending trends. This helps calculate net profit alongside revenue."
  },
  {
    keywords: ['payment', 'pay', 'collect', 'cash'],
    response: "During checkout, you can select payment method (Cash, UPI, Card). Make sure to collect payment before starting the gaming session. You can update payment status in the booking details."
  },
  {
    keywords: ['pause', 'stop', 'resume', 'end', 'complete'],
    response: "To manage active sessions: PAUSE temporarily stops the timer, RESUME continues it, and COMPLETE ends the session. You can also extend time or add food orders to active bookings."
  },
  {
    keywords: ['customer', 'client', 'user', 'contact'],
    response: "Store customer information in bookings including name, phone number, and email. For regular customers, add them to the loyalty program to track their visits and reward them with points."
  },
  {
    keywords: ['whatsapp', 'message', 'sms', 'notification'],
    response: "WhatsApp integration allows customers to check availability via message. Configure it in Settings with your Twilio credentials. The bot automatically responds to availability queries."
  },
  {
    keywords: ['settings', 'configure', 'setup', 'config'],
    response: "Go to Settings to configure device categories, seat numbers, pricing tiers, and loyalty program rules. Only admins can modify settings. Changes apply immediately."
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greet'],
    response: "Hello! I'm here to help you manage your gaming center. I can assist with bookings, pricing, reports, loyalty programs, and more. What would you like to know?"
  },
  {
    keywords: ['help', 'how', 'what', 'guide'],
    response: "I can help you with:\n• Managing bookings and seat availability\n• Setting up pricing and categories\n• Tracking revenue and expenses\n• Loyalty program management\n• Food orders and menu\n• Reports and analytics\n\nWhat specific topic do you need help with?"
  },
  {
    keywords: ['thank', 'thanks'],
    response: "You're welcome! Let me know if you need any other assistance with managing your gaming center."
  }
];

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const messageLower = userMessage.toLowerCase();
  
  // Find best matching template based on keywords
  let bestMatch: ResponseTemplate | null = null;
  let maxMatches = 0;
  
  for (const template of responseTemplates) {
    const matches = template.keywords.filter(keyword => 
      messageLower.includes(keyword)
    ).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = template;
    }
  }
  
  // Return matched response or default
  if (bestMatch && maxMatches > 0) {
    return bestMatch.response;
  }
  
  // Default response when no keywords match
  return "I understand you're asking about gaming center management. I can help with bookings, pricing, reports, loyalty programs, food orders, and general operations. Could you please be more specific about what you'd like to know?";
}
