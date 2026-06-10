const CP1252_REVERSE: Record<string, number> = {
  '\u20ac': 0x80,
  '\u201a': 0x82,
  '\u0192': 0x83,
  '\u201e': 0x84,
  '\u2026': 0x85,
  '\u2020': 0x86,
  '\u2021': 0x87,
  '\u02c6': 0x88,
  '\u2030': 0x89,
  '\u0160': 0x8a,
  '\u2039': 0x8b,
  '\u0152': 0x8c,
  '\u017d': 0x8e,
  '\u2018': 0x91,
  '\u2019': 0x92,
  '\u201c': 0x93,
  '\u201d': 0x94,
  '\u2022': 0x95,
  '\u2013': 0x96,
  '\u2014': 0x97,
  '\u02dc': 0x98,
  '\u2122': 0x99,
  '\u0161': 0x9a,
  '\u203a': 0x9b,
  '\u0153': 0x9c,
  '\u017e': 0x9e,
  '\u0178': 0x9f,
};

const MOJIBAKE_PATTERN = /[\u00c2-\u00c6\u00c3\u00c4\u00c5\u00c6]|\u00e1[\u00ba\u00bb]|\u00e2[\u0080-\u009f\u2018-\u201d\u20ac]|\u00f0[\u009f\u0178]/i;
const REPLACEMENT_CHAR = '\ufffd';

function decodeOnePass(value: string) {
  const bytes = new Uint8Array(
    Array.from(value).map((char) => {
      const mapped = CP1252_REVERSE[char];
      if (mapped !== undefined) return mapped;
      const code = char.charCodeAt(0);
      return code <= 0xff ? code : 0x3f;
    })
  );
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function cleanText(value?: string | null) {
  if (!value) return '';

  let current = value;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!MOJIBAKE_PATTERN.test(current)) break;
    try {
      const decoded = decodeOnePass(current);
      if (decoded.includes(REPLACEMENT_CHAR) && !current.includes(REPLACEMENT_CHAR)) break;
      if (!decoded || decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

export function normalizeText(value?: string | null) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
