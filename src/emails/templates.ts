
export const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #e11d48; text-decoration: none; }
    .content { margin-bottom: 30px; }
    .footer { text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px; }
    .info-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    .info-table td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { color: #666; font-weight: bold; width: 40%; }
    .value { text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://vulpi.cz" class="logo">VULPI</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Tento e-mail byl vygenerován automaticky systémem Vulpi.</p>
      <p>&copy; ${new Date().getFullYear()} Vulpi. Všechna práva vyhrazena.</p>
    </div>
  </div>
</body>
</html>
`;

export const getInvoiceEmailTemplate = (
  clientName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  downloadUrl?: string,
  trackingUrl?: string
) => {
  const content = `
    <h2>Nová faktura č. ${invoiceNumber}</h2>
    <p>Vážený kliente ${clientName},</p>
    <p>zasíláme Vám fakturu za poskytnuté služby. Faktura je přiložena v příloze tohoto e-mailu ve formátu PDF.</p>
    
    <table class="info-table">
      <tr>
        <td class="label">Číslo faktury:</td>
        <td class="value">${invoiceNumber}</td>
      </tr>
      <tr>
        <td class="label">Částka k úhradě:</td>
        <td class="value">${amount}</td>
      </tr>
      <tr>
        <td class="label">Datum splatnosti:</td>
        <td class="value">${dueDate}</td>
      </tr>
    </table>

    <p>Prosíme o úhradu do data splatnosti.</p>
    
    ${downloadUrl ? `<div style="text-align: center;"><a href="${downloadUrl}" class="button">Stáhnout fakturu</a></div>` : ''}
    
    <p>S pozdravem,<br>Tým Vulpi</p>
    ${trackingUrl ? `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />` : ''}
  `;
  return getBaseTemplate(content);
};

export const getReminderEmailTemplate = (
  clientName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  daysOverdue: number,
  variableSymbol: string,
  trackingUrl?: string
) => {
  const isPreReminder = daysOverdue < 0;
  const title = isPreReminder ? `Blíží se splatnost faktury č. ${invoiceNumber}` : `Upomínka: Faktura č. ${invoiceNumber} po splatnosti`;
  
  let message = "";
  if (isPreReminder) {
    message = `<p>dovolujeme si Vás upozornit, že se blíží splatnost faktury č. <strong>${invoiceNumber}</strong>.</p>`;
  } else {
    message = `<p>evidujeme u Vás neuhrazenou fakturu č. <strong>${invoiceNumber}</strong>, která je nyní <strong>${daysOverdue} dní po splatnosti</strong>.</p>`;
  }

  const content = `
    <h2>${title}</h2>
    <p>Vážený kliente ${clientName},</p>
    ${message}
    
    <table class="info-table">
      <tr>
        <td class="label">Číslo faktury:</td>
        <td class="value">${invoiceNumber}</td>
      </tr>
      <tr>
        <td class="label">Variabilní symbol:</td>
        <td class="value">${variableSymbol}</td>
      </tr>
      <tr>
        <td class="label">Částka k úhradě:</td>
        <td class="value">${amount}</td>
      </tr>
      <tr>
        <td class="label">Datum splatnosti:</td>
        <td class="value">${dueDate}</td>
      </tr>
    </table>

    <p>Pokud jste platbu již odeslali, považujte prosím tuto zprávu za bezpředmětnou.</p>
    <p>Fakturu naleznete v příloze.</p>
    
    <p>S pozdravem,<br>Tým Vulpi</p>
    ${trackingUrl ? `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />` : ''}
  `;
  return getBaseTemplate(content);
};

export const getPaymentConfirmationTemplate = (
  clientName: string,
  invoiceNumber: string,
  amount: string,
  trackingUrl?: string
) => {
  const content = `
    <h2>Potvrzení o úhradě</h2>
    <p>Vážený kliente ${clientName},</p>
    <p>potvrzujeme přijetí platby k faktuře č. <strong>${invoiceNumber}</strong>.</p>
    
    <table class="info-table">
      <tr>
        <td class="label">Uhrazená částka:</td>
        <td class="value">${amount}</td>
      </tr>
      <tr>
        <td class="label">Stav faktury:</td>
        <td class="value" style="color: green; font-weight: bold;">UHRAZENO</td>
      </tr>
    </table>

    <p>Děkujeme za včasnou úhradu a těšíme se na další spolupráci.</p>
    
    <p>S pozdravem,<br>Tým Vulpi</p>
    ${trackingUrl ? `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />` : ''}
  `;
  return getBaseTemplate(content);
};
