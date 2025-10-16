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
  const agentName = `agent_${repository
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()}`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const messages = [
        ...conversationHistory,
        {
          question: query,
          answer: "",
        },
      ];

      // Add timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `${mindsdbUrl}/api/projects/${mindsdbProject}/agents/${agentName}/completions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.text();

        if (response.status === 404) {
          throw new Error(
            `Agent '${agentName}' does not exist. Please ingest the repository first to create the agent.`
          );
        }

        if (response.status === 500) {
          throw new Error(
            `Agent encountered an error. This may happen if the knowledge base is still processing. Please try again in a moment.`
          );
        }

        throw new Error(
          `Failed to query agent (${response.status}): ${errorData}`
        );
      }

      const data = await response.json();

      if (data && data.answer && data.answer.trim()) {
        return data.answer;
      }

      if (data.message && data.message.content && data.message.content.trim()) {
        return data.message.content;
      }

      if (data.error) {
        throw new Error(`Agent error: ${data.error}`);
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(
        "The agent could not provide an answer. This might happen if:\n• The knowledge base is still being processed\n• The repository content hasn't been fully indexed\n\nPlease wait a few minutes and try again, or re-ingest the repository."
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(
            "Request timed out after 30 seconds. The agent may be processing a complex query. Please try again."
          );
        }

        if (error.message.includes("fetch") && error instanceof TypeError) {
          throw new Error(
            "Cannot connect to MindsDB server. Please ensure MindsDB is running."
          );
        }

        if (
          error.message.includes("does not exist") ||
          error.message.includes("timed out")
        ) {
          throw error;
        }

        lastError = error;

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError || new Error("Failed to query agent after multiple attempts");
}
