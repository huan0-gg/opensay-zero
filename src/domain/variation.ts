const PRICES = ['four eighty', 'five twenty', 'three ninety', 'five fifty'];

export interface Variation {
  price: string;
  enabled: boolean;
  apply: (text: string) => string;
}

/**
 * D3 / variation / final sessions swap the coffee price so the learner cannot
 * replay a memorised number. Everything else is authored, not generated.
 */
export function createVariation(enabled: boolean, seed = 0): Variation {
  const index = Math.abs(Math.trunc(seed)) % PRICES.length;
  const price = enabled ? PRICES[index] : 'four fifty';
  return {
    price,
    enabled,
    apply: (text: string) => (enabled ? text.split('four fifty').join(price) : text),
  };
}
