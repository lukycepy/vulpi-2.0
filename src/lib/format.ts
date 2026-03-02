
export function formatCurrency(amount: number, currency: string = "CZK", options?: { numberFormat?: string }) {
  const numberFormat = options?.numberFormat || "SPACE_COMMA";
  
  const locale = numberFormat === "COMMA_DOT" ? "en-US" : "cs-CZ";
  
  // Normalize currency code
  let safeCurrency = currency.toUpperCase().trim();
  if (safeCurrency === "KČ") safeCurrency = "CZK";
  if (safeCurrency === "€") safeCurrency = "EUR";
  if (safeCurrency === "$") safeCurrency = "USD";
  
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions, timezone?: string) {
  if (!date) return "";
  const d = new Date(date);
  
  // Removed cookie reading from here. Pass timezone explicitly if needed.
  // In client components, default browser timezone is used if not provided.
  // In server components, timezone must be provided if needed.
  
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: timezone,
    ...options
  };

  return new Intl.DateTimeFormat("cs-CZ", opts).format(d);
}

export function formatDateTime(date: Date | string, timezone?: string) {
    return formatDate(date, { hour: '2-digit', minute: '2-digit' }, timezone);
}

export function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
