/**
 * Turn long classic commentary notes into a short verse explainer preview.
 * Full text stays available behind an expand control in the UI.
 */

const DEFAULT_MAX_WORDS = 55;

function stripLeadingLemma(text: string): string {
  // JFB often opens with a quoted lemma then "--" before the note.
  const match = text.match(/^(.{1,120}?)(?:--|—)\s*(.+)$/);
  if (!match) return text;
  const rest = (match[2] ?? "").trim();
  return rest.length >= 24 ? rest : text;
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (!parts) return [text];
  return parts.map((part) => part.trim()).filter(Boolean);
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type CommentaryExcerpt = {
  preview: string;
  needsExpand: boolean;
};

export function commentaryExcerpt(
  text: string,
  maxWords = DEFAULT_MAX_WORDS,
): CommentaryExcerpt {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return { preview: "", needsExpand: false };

  if (wordCount(raw) <= maxWords) {
    return { preview: raw, needsExpand: false };
  }

  const body = stripLeadingLemma(raw);
  const sentences = splitSentences(body);
  let preview = "";

  for (const sentence of sentences) {
    const next = preview ? `${preview} ${sentence}` : sentence;
    if (preview && wordCount(next) > maxWords) break;
    preview = next;
    if (wordCount(preview) >= Math.min(32, maxWords)) break;
  }

  if (!preview) {
    preview = body.split(/\s+/).slice(0, maxWords).join(" ");
  }

  // Soft ellipsis when we cut mid-note and the preview has no terminal punctuation.
  if (!/[.!?]"?$/.test(preview)) {
    preview = `${preview.replace(/[,:;–-]\s*$/, "")}…`;
  }

  const needsExpand = wordCount(raw) > wordCount(preview) + 12;
  return { preview, needsExpand };
}
