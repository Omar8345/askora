"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import { AskoraIcon } from "@/components/askora-icon";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChat } from "@/hooks/use-chat";

interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [repo, setRepo] = useState<string>("");
  const [input, setInput] = useState("");
  const [isDigesting, setIsDigesting] = useState(true);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, initializeChat } = useChat();

  useEffect(() => {
    const repoParam = searchParams.get("repo");
    if (repoParam) {
      setRepo(repoParam);
      initializeRepo(repoParam);
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeRepo = async (repoUrl: string) => {
    setIsDigesting(true);
    setDigestError(null);

    try {
      // Check if we're in demo mode
      const lowerRepo = repoUrl.toLowerCase();
      const demoMode = lowerRepo === "demo" || lowerRepo === "testing";
      setIsDemoMode(demoMode);

      if (demoMode) {
        // In demo mode, skip API calls and just initialize
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate loading
        setIsInitialized(true);
        initializeChat(repoUrl, true);
        setIsDigesting(false);
        return;
      }

      const repoPath = extractRepoPath(repoUrl);
      if (!repoPath) {
        throw new Error("Invalid GitHub repository URL");
      }

      const githubResponse = await fetch(
        `https://api.github.com/repos/${repoPath}`
      );
      if (!githubResponse.ok) {
        throw new Error("Repository not found on GitHub or is not accessible");
      }

      await ingestRepository(repoPath);

      setIsInitialized(true);
      initializeChat(repoPath);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize repository";
      setDigestError(errorMessage);
    } finally {
      setIsDigesting(false);
    }
  };

  const extractRepoPath = (url: string): string | null => {
    try {
      // Try to parse as a standard URL
      let urlObj;
      try {
        urlObj = new URL(url);
      } catch {
        urlObj = null;
      }

      if (
        urlObj &&
        (urlObj.hostname === "github.com" ||
          urlObj.hostname === "www.github.com")
      ) {
        // Path should be like /owner/repo or /owner/repo/...
        const repoPathMatch = urlObj.pathname.match(
          /^\/([^\/]+\/[^\/]+)(\/|$)/
        );
        return repoPathMatch ? repoPathMatch[1] : null;
      } else if (url.match(/^[^\/]+\/[^\/]+$/)) {
        // Accept plain user/repo as fallback
        return url;
      }
      return null;
    } catch {
      return null;
    }
  };

  const ingestRepository = async (repoPath: string) => {
    const response = await fetch("/api/mindsdb/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repository: repoPath }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to ingest repository");
    }

    return await response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "24px";
      inputRef.current.style.overflowY = "hidden";
    }

    if (isDemoMode) {
      await sendMessage(currentInput, repo, true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return;
    }

    const repoPath = extractRepoPath(repo);
    if (!repoPath) return;

    await sendMessage(currentInput, repoPath, false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const formatMessage = (content: string) => {
    const trimmedContent = content.trim();

    return trimmedContent
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || "text";
        return `<pre class="bg-muted/50 border border-border rounded-md p-3 my-2 overflow-x-auto"><code class="text-sm font-mono language-${language}">${code.trim()}</code></pre>`;
      })
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>'
      )
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#1A8596] hover:text-[#187a87] underline transition-colors">$1</a>'
      )
      .replace(/(^|\n)(?:• .+(?:\n|$))+/g, (match) => {
        const trimmed = match.replace(/^\n+|\n+$/g, "");
        const items = trimmed
          .split("\n")
          .filter((line) => /^•\s+/.test(line))
          .map((line) =>
            line.replace(
              /^•\s+(.+)$/,
              '<div class="flex items-center gap-2 my-1"><span class="text-[#1A8596] leading-none">•</span><span class="leading-relaxed">$1</span></div>'
            )
          )
          .join("");
        return `<div class="my-2">${items}</div>`;
      })
      .replace(/\n{3,}/g, "<br /><br />") // Replace 3+ consecutive newlines with double break
      .replace(/\n/g, "<br />"); // Replace single newlines with single break
  };

  if (isDigesting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-card/30 flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <AskoraIcon className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Askora
            </h1>
          </div>

          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#7c3aed]" />
            <h2 className="text-xl font-semibold text-foreground">
              Digesting Repository
            </h2>
            <p className="text-muted-foreground max-w-md">
              I'm analyzing and ingesting{" "}
              <span className="font-mono text-foreground">
                {extractRepoPath(repo)}
              </span>{" "}
              into the knowledge base. This may take a few moments...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (digestError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-card/30 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <AskoraIcon className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Askora
            </h1>
          </div>

          <Alert className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {digestError}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Unable to access or ingest the repository{" "}
              <span className="font-mono text-foreground">
                {extractRepoPath(repo)}
              </span>
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-[#7c3aed] via-[#f472b6] to-[#1A8596] text-white hover:from-[#6d28d9] hover:via-[#ec4899] hover:to-[#187a87] transition-all duration-300 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-background/98 to-card/30 flex flex-col select-none">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-[#7c3aed]/10 via-[#f472b6]/10 to-[#1A8596]/10 hover:from-[#7c3aed]/20 hover:via-[#f472b6]/20 hover:to-[#1A8596]/20 cursor-pointer transition-all duration-300 border border-transparent hover:border-gradient"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <AskoraIcon className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Askora</span>
              <span className="text-xs text-muted-foreground font-mono">
                {isDemoMode ? `${repo} (Demo Mode)` : extractRepoPath(repo)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#f472b6] to-[#1A8596] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[#7c3aed] text-white ml-auto"
                    : "bg-card border border-border/50"
                }`}
                style={{ WebkitUserSelect: "text", userSelect: "text" }}
              >
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content),
                  }}
                />
                <div
                  className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-white/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#f472b6] to-[#1A8596] flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card border border-border/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex items-end flex-1 bg-background/80 border border-border/40 rounded-3xl px-4 py-2.5 shadow-sm">
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                className="flex-1 resize-none bg-transparent outline-none text-foreground text-base leading-6 px-0 py-0 scrollbar-hide"
                disabled={isLoading}
                rows={1}
                style={{
                  height: "24px",
                  maxHeight: 240,
                  overflowY: "hidden",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "24px";
                  const newHeight = Math.min(target.scrollHeight, 240);
                  target.style.height = newHeight + "px";
                  target.style.overflowY = newHeight >= 240 ? "auto" : "hidden";
                }}
              />

              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="ml-2 h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-black p-0 flex items-center justify-center border-0 transition-colors cursor-pointer"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
}
