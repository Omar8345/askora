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

// Mock response for demo mode
const DEMO_RESPONSE = "This is a **demo repository** for testing purposes. In a real scenario, I would analyze the actual repository structure and provide insights about the codebase.";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, repository: string, isDemoMode: boolean = false) => {
      if (!content.trim() || isLoading) return;

      addMessage({ role: "user", content: content.trim() });
      setIsLoading(true);

      try {
        // Handle demo mode with mock response
        if (isDemoMode) {
          // Simulate a brief delay for realism
          await new Promise((resolve) => setTimeout(resolve, 800));
          
          addMessage({ role: "assistant", content: DEMO_RESPONSE });
          return;
        }

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
        const errorMessage = err instanceof Error 
          ? err.message 
          : "I encountered an unexpected error while processing your request.";
        
        addMessage({
          role: "assistant",
          content: `⚠️ **Error**: ${errorMessage}\n\nPlease try again or rephrase your question.`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, isLoading, messages]
  );

  const initializeChat = useCallback((repository: string, isDemoMode: boolean = false) => {
    const welcomeMessage = isDemoMode
      ? `Hello! I'm **Askora**, your AI-powered repository analysis assistant. You're currently in **demo mode** with the **\`${repository}\`** repository. This is a testing environment with mock responses. I can help you understand:

• Code structure and architecture
• Functions, classes, and modules
• Issues and pull requests
• Documentation and README files
• Dependencies and configurations
• Best practices and potential improvements

What would you like to explore? (Note: Responses are simulated for demonstration purposes)`
      : `Hello! I'm **Askora**, your AI-powered repository analysis assistant. I've successfully analyzed and ingested the **\`${repository}\`** repository.

**I can help you with:**
• Understanding code structure, functions, and classes
• Explaining specific files or components
• Analyzing issues, pull requests, and commits
• Reviewing documentation and README files
• Examining dependencies and configurations
• Identifying patterns and suggesting improvements

**💡 Tips for better responses:**
• Be specific: "What does the \`main\` function in \`app.py\` do?" works better than "Tell me about the code"
• Ask one thing at a time: Break complex questions into smaller parts
• Reference files or features: "How does authentication work?" or "Explain the API routes"

What would you like to explore first?`;

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage,
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
