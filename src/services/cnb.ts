
interface CNBRate {
  currency: string;
  rate: number;
  amount: number;
}

export async function fetchCNBRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      "https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt",
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error("Failed to fetch CNB rates");
    }

    const text = await response.text();
    const lines = text.split("\n").slice(2); // Skip header
    const rates: Record<string, number> = {};

    lines.forEach((line) => {
      const parts = line.split("|");
      if (parts.length >= 5) {
        const amount = parseFloat(parts[2]);
        const code = parts[3];
        const rate = parseFloat(parts[4].replace(",", "."));
        
        if (code && !isNaN(rate) && !isNaN(amount)) {
          rates[code] = rate / amount;
        }
      }
    });

    return rates;
  } catch (error) {
    console.error("Error fetching CNB rates:", error);
    return {};
  }
}
