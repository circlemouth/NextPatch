export type ParsedGitHubUrl = {
  rawUrl: string;
  canonicalUrl: string;
  githubHost: string;
  githubOwner: string;
  githubRepo: string;
  githubFullName: string;
  externalUrl?: string;
  externalType?: "issue" | "pull" | "release" | "repository";
  externalId?: string;
};

export function parseGitHubUrl(input: string): ParsedGitHubUrl | null {
  const rawUrl = input.trim();
  if (!rawUrl) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !url.hostname) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const owner = decodeURIComponent(parts[0]);
  const repo = decodeURIComponent(parts[1]).replace(/\.git$/, "");
  if (!isValidGitHubPathPart(owner) || !isValidGitHubPathPart(repo)) {
    return null;
  }

  const canonicalUrl = `https://${url.hostname}/${owner}/${repo}`;
  const parsed: ParsedGitHubUrl = {
    rawUrl,
    canonicalUrl,
    githubHost: url.hostname,
    githubOwner: owner,
    githubRepo: repo,
    githubFullName: `${owner}/${repo}`,
    externalType: "repository"
  };

  if (parts[2] === "issues" && parts[3]) {
    parsed.externalType = "issue";
    parsed.externalId = parts[3];
    parsed.externalUrl = `https://${url.hostname}/${owner}/${repo}/issues/${parts[3]}`;
  }

  if (parts[2] === "pull" && parts[3]) {
    parsed.externalType = "pull";
    parsed.externalId = parts[3];
    parsed.externalUrl = `https://${url.hostname}/${owner}/${repo}/pull/${parts[3]}`;
  }

  if (parts[2] === "releases" && parts[3] === "tag" && parts[4]) {
    parsed.externalType = "release";
    parsed.externalId = decodeURIComponent(parts[4]);
    parsed.externalUrl = `https://${url.hostname}/${owner}/${repo}/releases/tag/${parts[4]}`;
  }

  return parsed;
}

function isValidGitHubPathPart(value: string) {
  return /^[A-Za-z0-9_.-]+$/.test(value);
}
