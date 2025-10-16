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

  const kbName = `kb_${repository
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()}`;
  const githubDb = `github_${repository
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()}`;
  const agentName = `agent_${repository
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()}`;

  if (!openaiApiKey) throw new Error("OPENAI_API_KEY required");

  try {
    // 1. Create GitHub database connection
    const dbResponse = await fetch(`${mindsdbUrl}/api/sql/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `CREATE DATABASE ${githubDb} WITH ENGINE='github', PARAMETERS={"repository": "${repository}"${
          process.env.GITHUB_TOKEN
            ? `, "token": "${process.env.GITHUB_TOKEN}"`
            : ""
        }};`,
      }),
    });

    if (!dbResponse.ok) {
      const error = await dbResponse.text();
      throw new Error(`Failed to create GitHub database: ${error}`);
    }

    // Wait for database to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Create knowledge base for codebase
    const kbResponse = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/knowledge_bases`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge_base: { name: kbName } }),
      }
    );

    if (!kbResponse.ok) {
      const error = await kbResponse.text();
      throw new Error(`Failed to create knowledge base: ${error}`);
    }

    // 3. Insert repository content into knowledge base
    const insertResponse = await fetch(
      `${mindsdbUrl}/api/projects/${mindsdbProject}/knowledge_bases/${kbName}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledge_base: {
            urls: [`https://github.com/${repository}`],
            crawl_depth: 2,
          },
        }),
      }
    );

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      throw new Error(`Failed to insert data into knowledge base: ${error}`);
    }

    // Wait for KB to process content
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Create agent with KB and cached GitHub tables
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
              model_name: "gpt-4.1",
              api_key: openaiApiKey,
            },
            data: {
              knowledge_bases: [`${mindsdbProject}.${kbName}`],
              tables: [
                `${githubDb}.pull_requests`,
                `${githubDb}.issues`,
                `${githubDb}.commits`,
                `${githubDb}.branches`,
                `${githubDb}.files`,
                `${githubDb}.contributors`,
                `${githubDb}.comments`,
                `${githubDb}.discussions`,
                `${githubDb}.releases`,
              ],
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

Answer questions concisely and accurately in markdown.
`,
          },
        }),
      }
    );

    if (!agentResponse.ok) {
      const error = await agentResponse.text();
      throw new Error(`Failed to create agent: ${error}`);
    }

    return { kbName, githubDb, agentName };
  } catch (error) {
    try {
      await fetch(`${mindsdbUrl}/api/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `DROP AGENT ${agentName};`,
        }),
      });

      await fetch(`${mindsdbUrl}/api/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `DROP KNOWLEDGE_BASE ${kbName};`,
        }),
      });

      await fetch(`${mindsdbUrl}/api/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `DROP DATABASE ${githubDb};`,
        }),
      });
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
    throw error;
  }
}
