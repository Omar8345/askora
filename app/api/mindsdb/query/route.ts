import { NextRequest, NextResponse } from "next/server";

interface QueryRequest {
  repository: string;
  query: string;
  conversationHistory?: Array<{ question: string; answer: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const { repository, query, conversationHistory }: QueryRequest =
      await request.json();

    if (!repository || !query) {
      return NextResponse.json(
        { error: "Repository and query are required" },
        { status: 400 }
      );
    }

    const response = await queryKnowledgeBase(
      repository,
      query,
      conversationHistory || []
    );
    return NextResponse.json({
      success: true,
      response,
      repository,
      query,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function queryKnowledgeBase(
  repository: string,
  query: string,
  conversationHistory: Array<{ question: string; answer: string }> = []
): Promise<string> {
  const mindsdbUrl = process.env.MINDSDB_URL || "http://127.0.0.1:47334";
  const mindsdbProject = process.env.MINDSDB_PROJECT || "mindsdb";
  const agentName = `agent_${repository.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  
  // Limit conversation history to last 5 exchanges to avoid context overflow
  const recentHistory = conversationHistory.slice(-5);

  try {
    const messages = [
      ...recentHistory,
      {
        question: query,
        answer: "",
      },
    ];

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/agents/${agentName}/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();

      if (response.status === 404) {
        throw new Error(
          `Agent for repository "${repository}" does not exist. Please re-ingest the repository first.`
        );
      }

      if (response.status === 500) {
        throw new Error(
          `The AI agent encountered an internal error. This may be temporary - please try again in a moment.`
        );
      }

      throw new Error(`Failed to query agent: ${errorData}`);
    }

    const data = await response.json();

    // Try multiple response formats from MindsDB
    if (data && data.answer && data.answer.trim()) {
      return data.answer.trim();
    }

    if (data.message && data.message.content && data.message.content.trim()) {
      return data.message.content.trim();
    }

    if (data.content && data.content.trim()) {
      return data.content.trim();
    }

    if (data.error) {
      throw new Error(`AI agent error: ${data.error}`);
    }

    throw new Error(
      "The AI agent could not generate a response. This might happen if:\n\n• The knowledge base is still being indexed (usually takes 2-3 minutes after ingestion)\n• The query is too broad or unclear - try being more specific\n• The repository data is not yet fully processed\n\n**Suggestions:**\n• Wait a few minutes and try again\n• Ask a more specific question (e.g., \"What does the main function do?\" instead of \"Tell me about the code\")\n• Re-ingest the repository if the issue persists"
    );
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Cannot connect to the AI service. Please ensure MindsDB server is running and accessible."
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "The request took too long to process. The repository might be very large or the question too complex. Try:\n• Breaking down your question into smaller parts\n• Asking about specific files or components\n• Waiting a moment and trying again"
      );
    }

    throw error;
  }
}
