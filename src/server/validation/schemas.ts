import { z } from "zod";

export const repositorySchema = z.object({
  name: z.string().trim().min(1, "＊リポジトリ名を入力してください。"),
  htmlUrl: z.string().trim().optional(),
  description: z.string().trim().optional(),
  productionStatus: z
    .enum(["planning", "development", "active_production", "maintenance", "paused"])
    .default("development"),
  criticality: z.enum(["high", "medium", "low"]).default("medium"),
  currentFocus: z.string().trim().optional()
});

export const workItemSchema = z.object({
  repositoryId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["task", "bug", "idea", "implementation", "future_feature", "memo"]),
  title: z.string().trim().min(1, "＊タイトルを入力してください。"),
  body: z.string().trim().optional(),
  priority: z.enum(["p0", "p1", "p2", "p3", "p4"]).default("p2"),
  privacyLevel: z.enum(["normal", "confidential", "secret", "no_ai"]).default("normal"),
  isPinned: z.boolean().default(false),
  externalUrl: z.string().trim().optional()
});

export const quickCaptureSchema = z.object({
  repositoryId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["task", "bug", "idea", "implementation", "future_feature", "memo", "auto"]).default("auto"),
  title: z.string().trim().optional(),
  body: z.string().trim().min(1, "＊本文を入力してください。"),
  privacyLevel: z.enum(["normal", "confidential", "secret", "no_ai"]).default("normal"),
  isPinned: z.boolean().default(false),
  sourceType: z.enum(["manual", "chatgpt"]).default("manual")
});

export const classifyMemoSchema = z.object({
  memoId: z.string().uuid(),
  targetType: z.enum(["task", "bug", "idea", "implementation", "future_feature"]),
  repositoryId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "＊タイトルを入力してください。"),
  body: z.string().trim().optional(),
  priority: z.enum(["p0", "p1", "p2", "p3", "p4"]).default("p2")
});
