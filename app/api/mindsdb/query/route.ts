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

  try {
    const messages = [
      ...conversationHistory,
      {
        question: query,
        answer: "",
      },
    ];

    const response = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/agents/${agentName}/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      if (response.status === 404) {
        throw new Error(
          `Agent ${agentName} does not exist. Please re-ingest the repository to create the agent.`
        );
      }

      throw new Error(`Failed to query agent: ${errorData}`);
    }

    const data = await response.json();

    if (data && data.answer && data.answer.trim()) {
      return data.answer;
    }

    if (data.message) {
      const response = data.message.content;
      if (response && response.trim()) {
        return response;
      }
    }

    if (data.error) {
      throw new Error(`MindsDB agent error: ${data.error}`);
    }

    throw new Error(
      "The agent could not provide an answer at this time. This might happen if:\n• The knowledge base is still being processed\n• The repository content hasn't been fully indexed\n• Try asking a simpler or more specific question\n\nPlease wait a few minutes and try again, or re-ingest the repository."
    );
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "MindsDB server is not accessible. Please ensure MindsDB is running."
      );
    }

    throw error;
  }
}
