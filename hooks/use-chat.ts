import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, repository: string) => {
      if (!content.trim() || isLoading) return;

      addMessage({ role: "user", content: content.trim() });
      setIsLoading(true);

      try {
        const conversationHistory: Array<{ question: string; answer: string }> =
          [];
        const filteredMessages = messages.filter((msg) => msg.id !== "welcome"); // Exclude welcome message

        for (let i = 0; i < filteredMessages.length; i += 2) {
          const userMsg = filteredMessages[i];
          const assistantMsg = filteredMessages[i + 1];

          if (userMsg?.role === "user" && assistantMsg?.role === "assistant") {
            conversationHistory.push({
              question: userMsg.content,
              answer: assistantMsg.content,
            });
          }
        }

        const response = await fetch("/api/mindsdb/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repository,
            query: content.trim(),
            conversationHistory,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const data = await response.json();
        addMessage({ role: "assistant", content: data.response });
      } catch (err) {
        addMessage({
          role: "assistant",
          content:
            "I'm sorry, I encountered an error while processing your request. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, isLoading, messages]
  );

  const initializeChat = useCallback((repository: string) => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm **Askora**, your AI-powered repository analysis assistant. I've successfully analyzed and ingested the **\`${repository}\`** repository. I can help you understand:

• Code structure and architecture
• Functions, classes, and modules
• Issues and pull requests
• Documentation and README files
• Dependencies and configurations
• Best practices and potential improvements

What would you like to explore about this repository?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    addMessage,
    initializeChat,
  };
};
