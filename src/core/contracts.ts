import { z } from "zod";

export const SourceKindSchema = z.enum([
  "plain_text",
  "markdown",
  "json",
  "javascript",
  "typescript",
  "python",
  "log",
  "mcp_tool_schema",
]);

export type SourceKind = z.infer<typeof SourceKindSchema>;

export const AnalyzeInputSchema = z
  .object({
    text: z.string().min(1).max(262_144),
    sourceKind: SourceKindSchema.default("plain_text"),
    task: z.string().max(2_000).optional(),
    includeDraft: z.boolean().default(false),
  })
  .strict();

export const CompareInputSchema = z
  .object({
    original: z.string().min(1).max(262_144),
    candidate: z.string().max(262_144),
  })
  .strict();

export const EvidenceSchema = z.object({
  startLine: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
});

export const FindingSchema = z.object({
  code: z.enum([
    "duplicate_prose",
    "oversized_context",
    "verbose_json",
    "verbose_log",
    "tool_schema_bloat",
  ]),
  title: z.string(),
  message: z.string(),
  recommendation: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  risk: z.enum(["low", "medium", "high"]),
  evidence: z.array(EvidenceSchema),
});

export const TokenizationSchema = z.object({
  encoding: z.literal("o200k_base"),
  precision: z.literal("encoding_count"),
  note: z.string(),
});

export const ChangeSchema = z.object({
  kind: z.literal("duplicate_prose_removed"),
  startLine: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  removedCharacters: z.number().int().positive(),
});

export const DraftSchema = z.object({
  text: z.string(),
  tokens: z.number().int().nonnegative(),
  savedTokens: z.number().int(),
  reductionPercent: z.number(),
  requiresReview: z.literal(true),
  changes: z.array(ChangeSchema),
});

export const AnalysisResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  tokenization: TokenizationSchema,
  original: z.object({
    tokens: z.number().int().nonnegative(),
    bytes: z.number().int().nonnegative(),
    lines: z.number().int().positive(),
  }),
  findings: z.array(FindingSchema),
  draftStatus: z.enum([
    "not_requested",
    "not_eligible",
    "no_safe_change",
    "available",
  ]),
  draft: DraftSchema.nullable(),
  warnings: z.array(z.string()),
});

export const ComparisonResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  tokenization: TokenizationSchema,
  originalTokens: z.number().int().nonnegative(),
  candidateTokens: z.number().int().nonnegative(),
  deltaTokens: z.number().int(),
  reductionPercent: z.number(),
  outcome: z.enum(["reduced", "unchanged", "increased"]),
  warnings: z.array(z.string()),
});

export type AnalyzeInput = z.input<typeof AnalyzeInputSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
export type Finding = z.infer<typeof FindingSchema>;
