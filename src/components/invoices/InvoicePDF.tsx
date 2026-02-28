
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Invoice, Organization, Client, InvoiceItem, BankDetail } from '@prisma/client';

// Register font for Czech characters
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

Font.register({
  family: 'Roboto-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 30,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
    width: '48%',
  },
  label: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  bold: {
    fontFamily: 'Roboto-Bold',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 4,
    paddingBottom: 4,
  },
  colDesc: { width: '35%' },
  colQty: { width: '10%', textAlign: 'right' },
  colUnit: { width: '15%', textAlign: 'right' },
  colDisc: { width: '10%', textAlign: 'right' },
  colVat: { width: '10%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  totalSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontFamily: 'Roboto-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  qrCode: {
    width: 100,
    height: 100,
    marginTop: 10,
  },
  qrSection: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  watermark: {
    position: 'absolute',
    top: 300,
    left: 100,
    transform: 'rotate(-45deg)',
    fontSize: 60,
    color: '#ff0000',
    opacity: 0.1,
    width: 400,
    textAlign: 'center',
  },
  recapTable: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    fontSize: 8,
    color: '#666',
  }
});

interface InvoicePDFProps {
  invoice: Invoice & {
    organization: Organization;
    client: Client;
    items: InvoiceItem[];
    bankDetail: BankDetail | null;
  };
  qrCodeUrl?: string;
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('cs-CZ');
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(amount);
};

export const InvoicePDF = ({ invoice, qrCodeUrl }: InvoicePDFProps) => {
  const isVatPayer = invoice.vatMode !== 'NON_PAYER';
  const isReverseCharge = invoice.vatMode === 'REVERSE_CHARGE';
  const isOSS = invoice.vatMode === 'OSS';
  const isForeignCurrency = invoice.currency !== 'CZK';
  const exchangeRate = invoice.exchangeRate || 1;
  const isOverdue = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && new Date(invoice.dueAt) < new Date();
  
  // Document Title
  let title = 'Faktura';
  if (invoice.type === 'PROFORMA') title = 'Zálohová faktura';
  else if (invoice.type === 'NABIDKA') title = 'Cenová nabídka';
  else if (invoice.type === 'DOBROPIS') title = 'Opravný daňový doklad';
  else if (invoice.type === 'DODACI_LIST') title = 'Dodací list';

  // Calculate Discounts
  const hasItemDiscounts = invoice.items.some(i => i.discount > 0);
  const docDiscountPct = invoice.discount || 0;

  // VAT Recapitulation Logic
  // Group by VAT rate
  const vatGroups = invoice.items.reduce((acc, item) => {
    const rate = item.vatRate;
    if (!acc[rate]) acc[rate] = { base: 0, vat: 0 };
    
    // item.totalAmount is the line total (discounted unit price * qty)
    // We need to apply document discount to this base for accurate VAT calc in recap
    const baseAmount = item.totalAmount * (1 - docDiscountPct / 100);
    
    acc[rate].base += baseAmount;
    if (!isReverseCharge && isVatPayer) {
       // Recalculate VAT from the discounted base
       acc[rate].vat += baseAmount * (rate / 100);
    }
    return acc;
  }, {} as Record<number, { base: number; vat: number }>);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isOverdue && (
            <View style={styles.watermark}>
                <Text>NEUHRAZENO</Text>
            </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>číslo: {invoice.number}</Text>
            {invoice.relatedId && (
                <Text style={[styles.subtitle, { fontSize: 8 }]}>K dokladu ID: {invoice.relatedId}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.value}>{invoice.organization.name}</Text>
          </View>
        </View>

        {/* Supplier & Subscriber */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={[styles.label, styles.bold, { marginBottom: 6, fontSize: 12 }]}>Dodavatel</Text>
            <Text style={[styles.value, styles.bold]}>{invoice.organization.name}</Text>
            <Text style={styles.value}>{invoice.organization.address}</Text>
            
            <View style={{ marginTop: 8 }}>
              <Text style={styles.value}>IČ: {invoice.organization.taxId}</Text>
              {invoice.organization.vatId && <Text style={styles.value}>DIČ: {invoice.organization.vatId}</Text>}
            </View>

            {invoice.bankDetail && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Bankovní spojení:</Text>
                <Text style={styles.value}>{invoice.bankDetail.accountNumber}/{invoice.bankDetail.bankCode}</Text>
                <Text style={styles.value}>{invoice.bankDetail.bankName}</Text>
                {invoice.bankDetail.iban && <Text style={styles.value}>IBAN: {invoice.bankDetail.iban}</Text>}
                {invoice.bankDetail.swift && <Text style={styles.value}>SWIFT: {invoice.bankDetail.swift}</Text>}
              </View>
            )}
            
            <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Plátce DPH:</Text>
                <Text style={styles.value}>{isVatPayer ? 'ANO' : 'NE'}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={[styles.label, styles.bold, { marginBottom: 6, fontSize: 12 }]}>Odběratel</Text>
            <Text style={[styles.value, styles.bold]}>{invoice.client.name}</Text>
            <Text style={styles.value}>{invoice.client.address}</Text>

            <View style={{ marginTop: 8 }}>
              {invoice.client.taxId && <Text style={styles.value}>IČ: {invoice.client.taxId}</Text>}
              {invoice.client.vatId && <Text style={styles.value}>DIČ: {invoice.client.vatId}</Text>}
            </View>

            <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.label}>Datum vystavení:</Text>
                  <Text style={styles.value}>{formatDate(invoice.issuedAt)}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Datum splatnosti:</Text>
                  <Text style={styles.value}>{formatDate(invoice.dueAt)}</Text>
                </View>
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Variabilní symbol:</Text>
                <Text style={styles.value}>{invoice.variableSymbol || '-'}</Text>
              </View>
              {isVatPayer && (
                 <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>DUZP:</Text>
                    <Text style={styles.value}>{formatDate(invoice.issuedAt)}</Text>
                 </View>
              )}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.bold]}>Položka</Text>
            <Text style={[styles.colQty, styles.bold]}>Mn.</Text>
            <Text style={[styles.colUnit, styles.bold]}>Cena/j</Text>
            <Text style={[styles.colDisc, styles.bold]}>Sleva</Text>
            {isVatPayer && <Text style={[styles.colVat, styles.bold]}>DPH</Text>}
            <Text style={[styles.colTotal, styles.bold]}>Celkem</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{formatCurrency(item.unitPrice, invoice.currency)}</Text>
              <Text style={styles.colDisc}>{item.discount > 0 ? `${item.discount} %` : '-'}</Text>
              {isVatPayer && <Text style={styles.colVat}>{item.vatRate}%</Text>}
              <Text style={styles.colTotal}>{formatCurrency(item.totalAmount, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          {docDiscountPct > 0 && (
             <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>Sleva na doklad:</Text>
               <Text style={styles.totalValue}>{docDiscountPct} %</Text>
             </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Celkem bez DPH:</Text>
            {/* Base is Total Amount - Total VAT. Wait, invoice.totalAmount includes VAT. */}
            <Text style={styles.totalValue}>{formatCurrency(invoice.totalAmount - invoice.totalVat, invoice.currency)}</Text>
          </View>
          
          {isVatPayer && (
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>DPH:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.totalVat, invoice.currency)}</Text>
            </View>
          )}
          
          <View style={[styles.totalRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 4 }]}>
            <Text style={[styles.totalLabel, styles.bold, { fontSize: 12 }]}>K úhradě:</Text>
            <Text style={[styles.totalValue, styles.bold, { fontSize: 12 }]}>{formatCurrency(invoice.totalAmount, invoice.currency)}</Text>
          </View>
        </View>
        
        {/* Reverse Charge Note */}
        {isReverseCharge && (
            <View style={{ marginTop: 10, padding: 5, border: '1px solid #ccc' }}>
                <Text style={{ fontSize: 9 }}>Daň odvede zákazník (Režim přenesení daňové povinnosti / Reverse Charge).</Text>
            </View>
        )}
        
        {/* OSS Note */}
        {isOSS && (
            <View style={{ marginTop: 10, padding: 5, border: '1px solid #ccc' }}>
                <Text style={{ fontSize: 9 }}>Daň odváděna v režimu OSS.</Text>
            </View>
        )}

        {/* VAT Recapitulation (Invoice Currency) */}
        {isVatPayer && (
            <View style={styles.recapTable}>
                <Text style={[styles.bold, { fontSize: 9, marginBottom: 5 }]}>Rekapitulace DPH ({invoice.currency})</Text>
                <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 }]}>
                    <Text style={{ width: '20%', fontSize: 8 }}>Sazba DPH</Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>Základ</Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>DPH</Text>
                    <Text style={{ width: '20%', fontSize: 8, textAlign: 'right' }}>Celkem</Text>
                </View>
                {Object.entries(vatGroups).map(([rate, { base, vat }]) => (
                    <View key={rate} style={styles.row}>
                        <Text style={{ width: '20%', fontSize: 8 }}>{rate} %</Text>
                        <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>{formatCurrency(base, invoice.currency)}</Text>
                        <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>{formatCurrency(vat, invoice.currency)}</Text>
                        <Text style={{ width: '20%', fontSize: 8, textAlign: 'right' }}>{formatCurrency(base + vat, invoice.currency)}</Text>
                    </View>
                ))}
                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 2 }]}>
                    <Text style={{ width: '20%', fontSize: 8, fontFamily: 'Roboto-Bold' }}>Celkem</Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>
                        {formatCurrency(Object.values(vatGroups).reduce((sum, g) => sum + g.base, 0), invoice.currency)}
                    </Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>
                        {formatCurrency(Object.values(vatGroups).reduce((sum, g) => sum + g.vat, 0), invoice.currency)}
                    </Text>
                    <Text style={{ width: '20%', fontSize: 8, textAlign: 'right' }}>
                        {formatCurrency(Object.values(vatGroups).reduce((sum, g) => sum + g.base + g.vat, 0), invoice.currency)}
                    </Text>
                </View>
            </View>
        )}

        {/* VAT Recapitulation (CZK) for Foreign Currency */}
        {isForeignCurrency && isVatPayer && (
            <View style={styles.recapTable}>
                <Text style={[styles.bold, { fontSize: 9, marginBottom: 5 }]}>Rekapitulace DPH v CZK (Kurz ČNB: {exchangeRate.toFixed(3)} CZK/{invoice.currency})</Text>
                <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 }]}>
                    <Text style={{ width: '20%', fontSize: 8 }}>Sazba DPH</Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>Základ (CZK)</Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>DPH (CZK)</Text>
                    <Text style={{ width: '20%', fontSize: 8, textAlign: 'right' }}>Celkem (CZK)</Text>
                </View>
                {Object.entries(vatGroups).map(([rate, { base, vat }]) => (
                    <View key={rate} style={styles.row}>
                        <Text style={{ width: '20%', fontSize: 8 }}>{rate} %</Text>
                        <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>{formatCurrency(base * exchangeRate, 'CZK')}</Text>
                        <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>{formatCurrency(vat * exchangeRate, 'CZK')}</Text>
                        <Text style={{ width: '20%', fontSize: 8, textAlign: 'right' }}>{formatCurrency((base + vat) * exchangeRate, 'CZK')}</Text>
                    </View>
                ))}
                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 2 }]}>
                    <Text style={{ width: '20%', fontSize: 8, fontFamily: 'Roboto-Bold' }}>Celkem</Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>
                        {formatCurrency(Object.values(vatGroups).reduce((sum, g) => sum + g.base, 0) * exchangeRate, 'CZK')}
                    </Text>
                    <Text style={{ width: '30%', fontSize: 8, textAlign: 'right' }}>
                        {formatCurrency(Object.values(vatGroups).reduce((sum, g) => sum + g.vat, 0) * exchangeRate, 'CZK')}
                    </Text>
                    <Text style={{ width: '20%', fontSize: 8, textAlign: 'right' }}>
                        {formatCurrency(Object.values(vatGroups).reduce((sum, g) => sum + g.base + g.vat, 0) * exchangeRate, 'CZK')}
                    </Text>
                </View>
            </View>
        )}

        {/* QR Code */}
        {qrCodeUrl && (
          <View style={styles.qrSection}>
            <Text style={styles.label}>QR Platba</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.qrCode} src={qrCodeUrl} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Vystaveno v systému Vulpi • Děkujeme za spolupráci</Text>
        </View>
      </Page>
    </Document>
  );
};
