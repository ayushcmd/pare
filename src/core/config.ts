export const CORE_LIMITS = {
  maxTextBytes: 256 * 1024,
  maxTaskBytes: 2 * 1024,
  maxFindings: 20,
  maxParagraphs: 2_000,
  minDuplicateParagraphCharacters: 80,
  oversizedTokenThreshold: 2_000,
  verboseLogLineThreshold: 100,
  verboseJsonArrayThreshold: 50,
  verboseToolDescriptionCharacters: 600,
} as const;

export function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function assertWithinCoreLimits(text: string, task?: string): void {
  if (utf8Bytes(text) > CORE_LIMITS.maxTextBytes) {
    throw new RangeError(
      "Input exceeds PARE's current 256 KiB analysis limit.",
    );
  }

  if (task && utf8Bytes(task) > CORE_LIMITS.maxTaskBytes) {
    throw new RangeError(
      "Task description exceeds PARE's current 2 KiB limit.",
    );
  }
}
