import { countTokens } from "gpt-tokenizer/encoding/o200k_base";

export const TOKENIZATION = {
  encoding: "o200k_base" as const,
  precision: "encoding_count" as const,
  note: "Counted with o200k_base. Actual provider billing and message framing can differ.",
};

export function countTextTokens(text: string): number {
  const count = countTokens(text);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Tokenizer returned an invalid count.");
  }
  return count;
}
