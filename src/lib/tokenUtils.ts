const HOMOGLYPH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\u20AE/g, "T"],
];

const TOKEN_SYMBOL_NORMALIZATION: Record<string, string> = {
  "USDT": "USDT",
  "USDT0": "USDT",
  "USD₮0": "USDT",
  "USD₮": "USDT",
};

export const normalizeTokenSymbol = (symbol?: string | null): string => {
  if (!symbol) return "";
  let result = symbol.trim();

  for (const [pattern, replacement] of HOMOGLYPH_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  const mapped = TOKEN_SYMBOL_NORMALIZATION[result.toUpperCase()];
  return mapped || result;
};
