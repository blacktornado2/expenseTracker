export type MonthlyDatum = {
  month: number;
  year: number;
  spent: number;
  income: number;
  cats: Record<string, number>;
};

type SeedTemplate = {
  offsetMonths: number;
  spent: number;
  income: number;
  cats: Record<string, number>;
};

const SEED_TEMPLATES: SeedTemplate[] = [
  { offsetMonths: 5, spent: 18200, income: 42000, cats: { groceries: 6200, dining: 3400, transport: 2600, shopping: 4000, bills: 2000 } },
  { offsetMonths: 4, spent: 21500, income: 42000, cats: { groceries: 7000, dining: 4200, transport: 2300, shopping: 5500, bills: 2500 } },
  { offsetMonths: 3, spent: 19800, income: 42000, cats: { groceries: 6500, dining: 3100, transport: 2900, shopping: 4800, bills: 2500 } },
  { offsetMonths: 2, spent: 23400, income: 45000, cats: { groceries: 7200, dining: 5000, transport: 3100, shopping: 5600, bills: 2500 } },
  { offsetMonths: 1, spent: 17600, income: 42000, cats: { groceries: 5800, dining: 2900, transport: 2400, shopping: 4000, bills: 2500 } },
];

export function getSeedMonths(referenceDate: Date = new Date()): MonthlyDatum[] {
  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();

  return SEED_TEMPLATES.map((template) => {
    const totalMonths = refYear * 12 + refMonth - template.offsetMonths;
    return {
      month: ((totalMonths % 12) + 12) % 12,
      year: Math.floor(totalMonths / 12),
      spent: template.spent,
      income: template.income,
      cats: template.cats,
    };
  }).sort((a, b) => (a.year - b.year) || (a.month - b.month));
}
