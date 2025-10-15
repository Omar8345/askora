"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Send } from "lucide-react";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Message Askora",
  isLoading = false,
  disabled = false,
  className,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea
  const autoGrow = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  React.useEffect(() => {
    autoGrow();
  }, [value, autoGrow]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative max-w-3xl mx-auto">
        {/* Outer container mimicking ChatGPT style */}
        <div className={cn(
          "rounded-2xl border border-border/60 bg-background/80 shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring",
          "transition-colors"
        )}>
          <div className="flex items-end gap-2 p-2">
            {/* Left utility button (non-functional placeholder) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="More actions"
              disabled={isLoading || disabled}
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Textarea */}
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading || disabled}
                rows={1}
                className={cn(
                  "resize-none border-0 bg-transparent px-3 py-3 pr-10",
                  "focus-visible:ring-0 outline-none shadow-none min-h-[48px] max-h-40",
                )}
                onInput={autoGrow as any}
              />

              {/* Spinner overlay while loading */}
              {isLoading && (
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Send button */}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim() || isLoading || disabled}
              size="icon"
              className={cn(
                "shrink-0 rounded-xl",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Helper text */}
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}

export default ChatInput;
