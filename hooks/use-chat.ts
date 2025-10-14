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

// Mock responses for demo mode
const DEMO_RESPONSES = [
  "This is a **demo repository** for testing purposes. In a real scenario, I would analyze the actual repository structure and provide insights about the codebase.",
  "Here's what I can help you with in **demo mode**:\n\n• Code structure and architecture analysis\n• Functions, classes, and modules exploration\n• Issues and pull requests review\n• Documentation and README understanding\n• Dependencies and configurations overview\n• Best practices and improvement suggestions\n\nFeel free to ask any questions!",
  "In **demo mode**, I'm simulating responses. This feature is perfect for:\n\n• Quick testing without repository setup\n• Demonstrating Askora's capabilities\n• UI and interaction testing\n• Onboarding new users\n\nTry asking different questions to see how the interface responds!",
  "Since this is a **demo repository**, I can show you example responses. In production, I would:\n\n```typescript\n// Analyze actual code like this\nfunction analyzeRepository(repo: string) {\n  const structure = parseCodebase(repo);\n  const insights = generateInsights(structure);\n  return insights;\n}\n```\n\nThis demonstrates the type of code analysis I can provide!",
  "Great question! In a real repository analysis, I would dive deep into the specific files and provide detailed explanations. For now, I'm in **demo mode**, so I'm showing you sample responses to give you a feel for how Askora works.",
];

let demoResponseIndex = 0;

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
        // Handle demo mode with mock responses
        if (isDemoMode) {
          // Simulate a brief delay for realism
          await new Promise((resolve) => setTimeout(resolve, 800));
          
          const mockResponse = DEMO_RESPONSES[demoResponseIndex % DEMO_RESPONSES.length];
          demoResponseIndex++;
          
          addMessage({ role: "assistant", content: mockResponse });
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
      : `Hello! I'm **Askora**, your AI-powered repository analysis assistant. I've successfully analyzed and ingested the **\`${repository}\`** repository. I can help you understand:

• Code structure and architecture
• Functions, classes, and modules
• Issues and pull requests
• Documentation and README files
• Dependencies and configurations
• Best practices and potential improvements

What would you like to explore about this repository?`;

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
