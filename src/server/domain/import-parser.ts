export type ImportCandidate = {
  targetType: "task" | "bug" | "idea" | "implementation" | "future_feature" | "memo";
  title: string;
  body: string;
  confidence: "low" | "medium" | "high";
};

export type ImportParseResult = {
  format: "json" | "markdown" | "plain_text" | "invalid_json";
  candidates: ImportCandidate[];
  error?: string;
};

export function parseImportContent(input: string): ImportParseResult {
  const jsonBlock = extractJsonBlock(input);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock) as unknown;
      return parseImportJson(parsed);
    } catch (error) {
      return {
        format: "invalid_json",
        candidates: [],
        error: error instanceof Error ? error.message : "JSON解析に失敗しました。"
      };
    }
  }

  const markdownCandidates = parseMarkdownCandidates(input);
  if (markdownCandidates.length > 0) {
    return { format: "markdown", candidates: markdownCandidates };
  }

  return { format: "plain_text", candidates: [] };
}

function parseImportJson(value: unknown): ImportParseResult {
  if (!isImportObject(value)) {
    return { format: "json", candidates: [], error: "nextpatch.import.v1 形式ではありません。" };
  }

  return {
    format: "json",
    candidates: value.items.map((item) => ({
      targetType: mapKind(item.kind),
      title: item.title,
      body: item.body,
      confidence: item.confidence ?? "medium"
    }))
  };
}

function parseMarkdownCandidates(input: string) {
  const lines = input.split(/\r?\n/);
  const candidates: ImportCandidate[] = [];

  for (const line of lines) {
    const match = line.match(/^[-*]\s+\[(task|bug|idea|memo|implementation|future_feature)\]\s+(.+)$/i);
    if (match) {
      candidates.push({
        targetType: mapKind(match[1]),
        title: match[2].trim(),
        body: "",
        confidence: "low"
      });
    }
  }

  return candidates;
}

function extractJsonBlock(input: string) {
  const fenced = input.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1];
  }

  const trimmed = input.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  return null;
}

function isImportObject(value: unknown): value is {
  schema_version: "nextpatch.import.v1";
  items: Array<{
    kind: string;
    title: string;
    body: string;
    confidence?: "low" | "medium" | "high";
  }>;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.schema_version === "nextpatch.import.v1" && Array.isArray(candidate.items);
}

function mapKind(kind: string): ImportCandidate["targetType"] {
  switch (kind) {
    case "bug":
      return "bug";
    case "idea":
      return "idea";
    case "future_plan":
      return "future_feature";
    case "tech_candidate":
      return "implementation";
    case "note":
      return "memo";
    case "implementation":
    case "future_feature":
    case "memo":
    case "task":
      return kind;
    default:
      return "task";
  }
}
