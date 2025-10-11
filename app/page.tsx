"use client";
import { Footer } from "@/components/footer";
import { AskoraIcon } from "@/components/askora-icon";
import { Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const router = useRouter();

  interface FormSubmitEvent extends React.FormEvent<HTMLFormElement> {}

  const handleSubmit = (e: FormSubmitEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      router.push(`/onboarding?repo=${encodeURIComponent(repoUrl)}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-background via-background/98 to-card/30 flex flex-col select-none"
      onContextMenu={handleContextMenu}
    >
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 bg-gradient-to-br from-background/80 via-card/20 to-background/90 backdrop-blur-sm">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-[#7c3aed]/10 blur-3xl animate-pulse"></div>
          <div
            className="absolute right-1/4 top-40 h-80 w-80 rounded-full bg-[#1A8596]/10 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute left-1/3 bottom-20 h-72 w-72 rounded-full bg-[#f472b6]/8 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary/3 to-[#1A8596]/3 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className="mb-10 flex items-center justify-center gap-3">
          <AskoraIcon className="h-16 w-16" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Askora
          </h1>
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <h2 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Askora —{" "}
            <span
              className="bg-gradient-to-r from-[#7c3aed] via-[#f472b6] to-[#1A8596] bg-clip-text text-transparent animate-gradient-x"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #7c3aed 0%, #f472b6 50%, #1A8596 100%)",
                backgroundSize: "200% 200%",
                backgroundPosition: "0% 50%",
                animation: "gradient-x 4s ease-in-out infinite",
              }}
            >
              Your Code, Answered
            </span>
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Paste a GitHub repository URL below and start chatting with your
            codebase.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto flex flex-col sm:flex-row items-center gap-4 max-w-xl"
          >
            <input
              type="url"
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste a GitHub repo URL (e.g. https://github.com/vercel/next.js)"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-base text-foreground focus:outline-none focus:ring-2 focus:ring-[#1A8596] transition"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#7c3aed] via-[#f472b6] to-[#1A8596] text-white font-semibold hover:from-[#6d28d9] hover:via-[#ec4899] hover:to-[#187a87] transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
              style={{
                backgroundSize: "200% 200%",
                backgroundPosition: "0% 50%",
                animation: "gradient-x 4s ease-in-out infinite",
              }}
            >
              Digest & Chat
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
