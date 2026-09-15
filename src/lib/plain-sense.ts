/**
 * Prefer simple public-domain English for the verse explainer.
 * BBE is intentionally plain; WEB/BSB are modern fallbacks.
 */

export const PLAIN_SENSE_VERSIONS = ["bbe", "web", "bsb"] as const;

export type PlainSenseSource = {
  id: string;
  label: string;
  name: string;
  text: string;
};

type ParallelLike = {
  id: string;
  label: string;
  name: string;
  text: string | null;
};

export function pickPlainSense(
  parallels: ParallelLike[],
  currentVersion: string,
): PlainSenseSource | null {
  const preferred =
    currentVersion === "bbe"
      ? (["web", "bsb", "bbe"] as const)
      : PLAIN_SENSE_VERSIONS;

  for (const id of preferred) {
    const row = parallels.find((item) => item.id === id && item.text?.trim());
    if (row?.text) {
      return {
        id: row.id,
        label: row.label,
        name: row.name,
        text: row.text.trim(),
      };
    }
  }

  const other = parallels.find(
    (item) => item.id !== currentVersion && item.text?.trim(),
  );
  if (other?.text) {
    return {
      id: other.id,
      label: other.label,
      name: other.name,
      text: other.text.trim(),
    };
  }

  return null;
}
