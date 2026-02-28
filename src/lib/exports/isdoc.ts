import { Invoice, InvoiceItem, Organization, Client, BankDetail } from "@prisma/client";

type InvoiceWithDetails = Invoice & {
  organization: Organization;
  client: Client;
  items: InvoiceItem[];
  bankDetail?: BankDetail | null;
};

export function generateISDOC(invoice: InvoiceWithDetails): string {
  // Helper to escape XML characters
  const escape = (str: string | null | undefined) => {
    if (!str) return "";
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  };

  const issueDate = invoice.issuedAt.toISOString().split('T')[0];
  const dueDate = invoice.dueAt.toISOString().split('T')[0];
  const taxPointDate = issueDate; // Simplified

  const totalAmount = invoice.totalAmount;
  const totalVat = invoice.totalVat;
  const totalGross = totalAmount + totalVat;

  // Group items by VAT rate for TaxTotal
  const taxSubTotals = new Map<number, { taxable: number, tax: number, inclusive: number }>();

  invoice.items.forEach(item => {
    const rate = item.vatRate;
    const net = item.totalAmount;
    const tax = net * (rate / 100);
    const gross = net + tax;

    if (!taxSubTotals.has(rate)) {
      taxSubTotals.set(rate, { taxable: 0, tax: 0, inclusive: 0 });
    }
    const current = taxSubTotals.get(rate)!;
    current.taxable += net;
    current.tax += tax;
    current.inclusive += gross;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://isdoc.cz/namespace/2013/invoice" version="6.0.1">
  <DocumentType>1</DocumentType>
  <ID>${escape(invoice.number)}</ID>
  <IssuingSystem>Vulpi App</IssuingSystem>
  <IssueDate>${issueDate}</IssueDate>
  <TaxPointDate>${taxPointDate}</TaxPointDate>
  <VATApplicable>true</VATApplicable>
  <ElectronicPossibilityAgreementReference>true</ElectronicPossibilityAgreementReference>
  <Note>${escape(invoice.notes)}</Note>
  <LocalCurrencyCode>${invoice.currency}</LocalCurrencyCode>
  <CurrRate>1</CurrRate>
  <RefCurrRate>1</RefCurrRate>

  <AccountingSupplierParty>
    <Party>
      <PartyIdentification>
        <ID>${escape(invoice.organization.taxId)}</ID>
      </PartyIdentification>
      <PartyName>
        <Name>${escape(invoice.organization.name)}</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>${escape(invoice.organization.address)}</StreetName>
        <Country>
          <IdentificationCode>CZ</IdentificationCode>
          <Name>Česká republika</Name>
        </Country>
      </PostalAddress>
      <PartyTaxScheme>
        <CompanyID>${escape(invoice.organization.vatId)}</CompanyID>
        <TaxScheme>VAT</TaxScheme>
      </PartyTaxScheme>
      <Contact>
        <Telephone>${escape(invoice.organization.phone)}</Telephone>
        <ElectronicMail>${escape(invoice.organization.email)}</ElectronicMail>
      </Contact>
    </Party>
  </AccountingSupplierParty>

  <AccountingCustomerParty>
    <Party>
      <PartyIdentification>
        <ID>${escape(invoice.client.taxId)}</ID>
      </PartyIdentification>
      <PartyName>
        <Name>${escape(invoice.client.name)}</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>${escape(invoice.client.address)}</StreetName>
        <Country>
          <IdentificationCode>CZ</IdentificationCode>
          <Name>Česká republika</Name>
        </Country>
      </PostalAddress>
      <PartyTaxScheme>
        <CompanyID>${escape(invoice.client.vatId)}</CompanyID>
        <TaxScheme>VAT</TaxScheme>
      </PartyTaxScheme>
    </Party>
  </AccountingCustomerParty>

  <InvoiceLines>
    ${invoice.items.map((item, index) => {
      const lineNet = item.totalAmount;
      const lineVatRate = item.vatRate;
      const lineVat = lineNet * (lineVatRate / 100);
      const lineGross = lineNet + lineVat;
      
      return `
    <InvoiceLine>
      <ID>${index + 1}</ID>
      <InvoicedQuantity unitCode="${item.unit || 'ks'}">${item.quantity}</InvoicedQuantity>
      <LineExtensionAmount>${lineNet.toFixed(2)}</LineExtensionAmount>
      <LineExtensionAmountTaxInclusive>${lineGross.toFixed(2)}</LineExtensionAmountTaxInclusive>
      <LineExtensionTaxAmount>${lineVat.toFixed(2)}</LineExtensionTaxAmount>
      <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
      <UnitPriceTaxInclusive>${(item.unitPrice * (1 + lineVatRate/100)).toFixed(2)}</UnitPriceTaxInclusive>
      <ClassifiedTaxCategory>
        <Percent>${lineVatRate}</Percent>
        <VATCalculationMethod>0</VATCalculationMethod>
        <VATApplicable>true</VATApplicable>
      </ClassifiedTaxCategory>
      <Item>
        <Description>${escape(item.description)}</Description>
      </Item>
    </InvoiceLine>`;
    }).join('')}
  </InvoiceLines>

  <TaxTotal>
    ${Array.from(taxSubTotals.entries()).map(([rate, totals]) => `
    <TaxSubTotal>
      <TaxableAmount>${totals.taxable.toFixed(2)}</TaxableAmount>
      <TaxAmount>${totals.tax.toFixed(2)}</TaxAmount>
      <TaxInclusiveAmount>${totals.inclusive.toFixed(2)}</TaxInclusiveAmount>
      <AlreadyClaimedTaxableAmount>0</AlreadyClaimedTaxableAmount>
      <AlreadyClaimedTaxAmount>0</AlreadyClaimedTaxAmount>
      <AlreadyClaimedTaxInclusiveAmount>0</AlreadyClaimedTaxInclusiveAmount>
      <DifferenceTaxableAmount>${totals.taxable.toFixed(2)}</DifferenceTaxableAmount>
      <DifferenceTaxAmount>${totals.tax.toFixed(2)}</DifferenceTaxAmount>
      <DifferenceTaxInclusiveAmount>${totals.inclusive.toFixed(2)}</DifferenceTaxInclusiveAmount>
      <TaxCategory>
        <Percent>${rate}</Percent>
        <VATApplicable>true</VATApplicable>
      </TaxCategory>
    </TaxSubTotal>`).join('')}
    <TaxAmount>${totalVat.toFixed(2)}</TaxAmount>
  </TaxTotal>

  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${totalAmount.toFixed(2)}</TaxExclusiveAmount>
    <TaxInclusiveAmount>${totalGross.toFixed(2)}</TaxInclusiveAmount>
    <AlreadyClaimedAmount>0</AlreadyClaimedAmount>
    <DifferenceAmount>${totalGross.toFixed(2)}</DifferenceAmount>
    <PayableRoundingAmount>0</PayableRoundingAmount>
    <PaidDepositsAmount>0</PaidDepositsAmount>
    <PayableAmount>${totalGross.toFixed(2)}</PayableAmount>
  </LegalMonetaryTotal>

  <PaymentMeans>
    <Payment>
      <PaidAmount>${totalGross.toFixed(2)}</PaidAmount>
      <PaymentMeansCode>42</PaymentMeansCode>
      <Details>
        <PaymentDueDate>${dueDate}</PaymentDueDate>
        <ID>${escape(invoice.variableSymbol || invoice.number)}</ID>
        <BankContact>
          <BankName>${escape(invoice.bankDetail?.bankName)}</BankName>
          <ID>${escape(invoice.bankDetail?.accountNumber)}</ID>
          <SWIFT>${escape(invoice.bankDetail?.swift)}</SWIFT>
          <IBAN>${escape(invoice.bankDetail?.iban)}</IBAN>
        </BankContact>
      </Details>
    </Payment>
  </PaymentMeans>
</Invoice>`;
}
