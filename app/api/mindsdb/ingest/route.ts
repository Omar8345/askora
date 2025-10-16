import { NextRequest, NextResponse } from "next/server";

interface IngestRequest {
  repository: string;
}

export async function POST(request: NextRequest) {
  try {
    const { repository }: IngestRequest = await request.json();

    if (!repository || !repository.match(/^[^\/]+\/[^\/]+$/)) {
      return NextResponse.json(
        { error: "Invalid repository format. Expected: owner/repo" },
        { status: 400 }
      );
    }

    const result = await setupRepository(repository);
    return NextResponse.json({
      success: true,
      repository,
      knowledgeBase: result.kbName,
      githubDatabase: result.githubDb,
      agent: result.agentName,
      message:
        "Repository setup complete. Agent can answer questions about code, issues, and PRs.",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

async function setupRepository(repository: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const mindsdbUrl = process.env.MINDSDB_URL || "http://127.0.0.1:47334";
  const mindsdbProject = process.env.MINDSDB_PROJECT || "mindsdb";

  const kbName = `kb_${repository.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const githubDb = `github_${repository.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const agentName = `agent_${repository.replace(/[^a-zA-Z0-9_]/g, "_")}`;

  if (!openaiApiKey) {
    throw new Error(
      "OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable."
    );
  }

  // Check if agent already exists
  try {
    const checkAgent = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/agents/${agentName}`,
      { method: "GET" }
    );
    if (checkAgent.ok) {
      // Agent already exists, return early
      return { kbName, githubDb, agentName };
    }
  } catch (error) {
    // Agent doesn't exist, continue with creation
  }

  try {
    // 1. Create GitHub database connection
    const dbResponse = await fetch(`${mindsdbUrl}/api/sql/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `CREATE DATABASE IF NOT EXISTS ${githubDb} WITH ENGINE='github', PARAMETERS={"repository": "${repository}", "token": "${
          process.env.GITHUB_TOKEN || ""
        }"};`,
      }),
    });

    if (!dbResponse.ok && dbResponse.status !== 409) {
      // 409 means already exists, which is fine
      throw new Error(`Failed to create GitHub database: ${await dbResponse.text()}`);
    }

    // 2. Create knowledge base for codebase
    const kbResponse = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/knowledge_bases`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge_base: { name: kbName } }),
      }
    );

    if (!kbResponse.ok && kbResponse.status !== 409) {
      // 409 means already exists, which is fine
      const errorText = await kbResponse.text();
      if (!errorText.includes("already exists")) {
        throw new Error(`Failed to create knowledge base: ${errorText}`);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to set up repository infrastructure: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  // 3. Create agent with KB and cached GitHub tables
  try {
    const agentResponse = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/agents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: {
            name: agentName,
            model: {
              provider: "openai",
              model_name: "gpt-4-turbo-preview",
              api_key: openaiApiKey,
              temperature: 0.3, // Lower temperature for more focused, accurate responses
              max_tokens: 2000, // Reasonable limit for detailed but concise responses
              top_p: 0.9, // Focus on more likely tokens for better coherence
            },
            data: {
              knowledge_bases: [`${mindsdbProject}.${kbName}`],
            },
            prompt_template: `
You are Askora (askora.dev), an expert AI assistant specialized in analyzing the GitHub repository "${repository}".

## Your Capabilities:
You have access to comprehensive repository data:
- ${mindsdbProject}.${kbName}: Complete codebase, documentation, and README files
- ${githubDb}.pull_requests: All pull request information
- ${githubDb}.issues: Issue tracking and discussions  
- ${githubDb}.commits: Full commit history with messages
- ${githubDb}.branches: Branch structure and information
- ${githubDb}.files: Repository file contents and structure
- ${githubDb}.contributors: Contributor statistics
- ${githubDb}.comments: Comments on issues and PRs
- ${githubDb}.discussions: GitHub discussions
- ${githubDb}.releases: Release notes and versions

## Response Guidelines:
1. **Be Contextually Aware**: Always reference specific files, functions, or code sections when answering
2. **Be Concise but Complete**: Provide thorough answers without unnecessary verbosity
3. **Use Markdown Formatting**: Format code blocks, lists, and links properly
4. **Cite Sources**: When discussing code, mention file names and line numbers if relevant
5. **Be Accurate**: Only provide information you can verify from the repository data
6. **Stay On Topic**: Focus on the repository content - if asked about unrelated topics, politely redirect
7. **Provide Examples**: When explaining code patterns, show actual examples from the repository
8. **Be Helpful**: Suggest related information or next steps when appropriate

## Response Format:
- Use \`\`\`language\`\`\` for code blocks with proper syntax highlighting
- Use bullet points (•) for lists
- Use **bold** for emphasis on key terms
- Include file paths in backticks like \`src/file.ts\`
- Keep responses focused and organized with clear structure

When you don't have enough information or the question is unclear, ask clarifying questions instead of making assumptions.
`,
          },
        }),
      }
    );

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      throw new Error(`Failed to create agent: ${errorText}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to create AI agent: ${
        error instanceof Error ? error.message : "Unknown error"
      }. Please verify your OpenAI API key is valid and has sufficient credits.`
    );
  }

  return { kbName, githubDb, agentName };
}
