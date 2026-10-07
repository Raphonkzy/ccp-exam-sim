export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter((t) => t.length > 2))
}

function bigrams(text: string): Map<string, number> {
  const s = normalize(text).replace(/ /g, '')
  const m = new Map<string, number>()
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2)
    m.set(bg, (m.get(bg) ?? 0) + 1)
  }
  return m
}

export function jaccard(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  if (!ta.size || !tb.size) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / (ta.size + tb.size - inter)
}

export function dice(a: string, b: string): number {
  const ba = bigrams(a)
  const bb = bigrams(b)
  let inter = 0
  let total = 0
  for (const v of ba.values()) total += v
  for (const v of bb.values()) total += v
  for (const [k, v] of ba) inter += Math.min(v, bb.get(k) ?? 0)
  return total ? (2 * inter) / total : 0
}

/** Combined similarity in [0,1]; the higher of token Jaccard and bigram Dice. */
export function similarity(a: string, b: string): number {
  return Math.max(jaccard(a, b), dice(a, b))
}
