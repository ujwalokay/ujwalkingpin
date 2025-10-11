import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, ChatSession } from "@shared/schema";

interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/ai/chat/sessions"],
    enabled: isOpen,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/ai/chat/sessions", currentSessionId, "messages"],
    enabled: !!currentSessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest<ChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: content,
        }),
      });
      return response;
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/sessions", data.sessionId, "messages"] });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const newChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<ChatSession>("/api/ai/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ title: "New Chat" }),
      });
      return response;
    },
    onSuccess: (session) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/sessions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create new chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  const quickPrompts = [
    "How do I check seat availability?",
    "Explain the loyalty program tiers",
    "What are today's pricing rates?",
    "Help me draft a customer message",
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          data-testid="button-ai-chatbot-toggle"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Ankylo AI Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {!currentSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <Bot className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Welcome to Ankylo AI Assistant</h3>
              <p className="text-sm text-muted-foreground text-center">
                Ask me anything about bookings, pricing, loyalty programs, or operations.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full mt-4">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    data-testid={`button-quick-prompt-${idx}`}
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4"
                    onClick={() => {
                      setMessage(prompt);
                      sendMessageMutation.mutate(prompt);
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
              <Button
                data-testid="button-new-chat"
                onClick={() => newChatMutation.mutate()}
                className="mt-4"
                disabled={newChatMutation.isPending}
              >
                {newChatMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start New Chat"
                )}
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        data-testid={`message-${msg.role}-${msg.id}`}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {sendMessageMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex gap-2 mb-2">
                  <Button
                    data-testid="button-new-chat-sidebar"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentSessionId(null)}
                  >
                    New Chat
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    data-testid="input-chat-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    data-testid="button-send-message"
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
