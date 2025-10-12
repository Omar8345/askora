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

  if (!openaiApiKey) throw new Error("OPENAI_API_KEY required");

  // 1. Create GitHub database connection
  await fetch(`${mindsdbUrl}/api/sql/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `CREATE DATABASE ${githubDb} WITH ENGINE='github', PARAMETERS={"repository": "${repository}", "token": "${
        process.env.GITHUB_TOKEN || ""
      }"};`,
    }),
  });

  // 2. Create knowledge base for codebase
  await fetch(`${mindsdbUrl}/api/projects/${mindsdbProject}/knowledge_bases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knowledge_base: { name: kbName } }),
  });

  // 3. Create agent with KB and cached GitHub tables
  await fetch(`${mindsdbUrl}/api/projects/${mindsdbProject}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: {
        name: agentName,
        model: {
          provider: "openai",
          model_name: "gpt-5",
          api_key: openaiApiKey,
        },
        data: {
          knowledge_bases: [`${mindsdbProject}.${kbName}`],
        },
        prompt_template: `
You are Askora (askora.dev), an assistant analyzing the GitHub repository "${repository}".
You can use:

- ${mindsdbProject}.${kbName}: Repository codebase and documentation
- ${githubDb}.pull_requests: Pull requests data
- ${githubDb}.issues: Issues data  
- ${githubDb}.commits: Commit history
- ${githubDb}.branches: Branch information
- ${githubDb}.files: Repository files
- ${githubDb}.contributors: Contributor data
- ${githubDb}.comments: Comments on issues/PRs
- ${githubDb}.discussions: GitHub discussions
- ${githubDb}.releases: Release information
- ${githubDb}.files: Repository files

Answer questions concisely and accurately in markdown.
`,
      },
    }),
  });

  return { kbName, githubDb, agentName };
}
