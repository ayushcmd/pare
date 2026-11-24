export type ParagraphSpan = {
  start: number;
  end: number;
  separatorStart: number;
  startLine: number;
  endLine: number;
  text: string;
};

function lineAt(text: string, offset: number): number {
  let line = 0;
  for (let index = 0; index < offset; index += 1) {
    if (text[index] === "\n") line += 1;
  }
  return line;
}

export function findParagraphs(text: string): ParagraphSpan[] {
  const separators = [...text.matchAll(/(?:\r?\n[\t ]*){2,}/g)];
  const paragraphs: ParagraphSpan[] = [];
  let cursor = 0;
  let separatorStart = 0;

  for (const separator of [...separators, undefined]) {
    const boundary = separator?.index ?? text.length;
    const raw = text.slice(cursor, boundary);
    const leading = raw.search(/\S/);
    const trailing = raw.search(/\s*$/);

    if (leading >= 0) {
      const start = cursor + leading;
      const end = cursor + trailing;
      paragraphs.push({
        start,
        end,
        separatorStart,
        startLine: lineAt(text, start),
        endLine: lineAt(text, Math.max(start, end - 1)),
        text: text.slice(start, end),
      });
    }

    if (!separator) break;
    separatorStart = boundary;
    cursor = boundary + separator[0].length;
  }

  return paragraphs;
}
