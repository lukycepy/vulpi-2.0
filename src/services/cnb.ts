
/**
 * Service for fetching exchange rates from CNB (Czech National Bank)
 * URL: https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt
 */

export interface ExchangeRate {
  country: string;
  currency: string;
  amount: number;
  code: string;
  rate: number;
}

export async function fetchCNBRates(date?: Date): Promise<ExchangeRate[]> {
  const dateStr = date 
    ? `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
    : ""; // CNB uses current date if not specified, or we need to format it strictly dd.MM.yyyy

  const url = `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt${dateStr ? `?date=${dateStr}` : ""}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }

    const text = await response.text();
    return parseCNBRates(text);
  } catch (error) {
    console.error("CNB Service Error:", error);
    return [];
  }
}

export async function getExchangeRate(currencyCode: string, date?: Date): Promise<number | null> {
  if (currencyCode === "CZK") return 1;

  const rates = await fetchCNBRates(date);
  const rate = rates.find(r => r.code === currencyCode);
  
  if (!rate) return null;
  return rate.rate / rate.amount;
}

function parseCNBRates(data: string): ExchangeRate[] {
  const lines = data.trim().split("\n");
  const rates: ExchangeRate[] = [];

  // Skip header (first 2 lines)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split("|");
    if (parts.length < 5) continue;

    // Format: země|měna|množství|kód|kurz
    // Example: Austrálie|dolar|1|AUD|15,205
    
    try {
      const country = parts[0];
      const currency = parts[1];
      const amount = parseInt(parts[2]);
      const code = parts[3];
      const rateStr = parts[4].replace(",", "."); // Fix decimal separator
      const rate = parseFloat(rateStr);

      if (!isNaN(rate)) {
        rates.push({ country, currency, amount, code, rate });
      }
    } catch (e) {
      console.warn("Failed to parse CNB line:", line, e);
    }
  }

  return rates;
}
