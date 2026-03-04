import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice, Organization, Client } from '@prisma/client';

// Register font for Czech characters
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Roboto',
    fontSize: 12,
  },
  sender: {
    fontSize: 10,
    marginBottom: 40,
    borderBottom: '1px solid #ccc',
    paddingBottom: 10,
  },
  recipient: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
  },
  recipientAddress: {
    fontSize: 14,
    marginLeft: 20,
    marginTop: 5,
  },
  meta: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontSize: 10,
    color: '#666',
  },
});

interface AddressLabelPDFProps {
  invoice: Invoice;
  organization: Organization;
  client: Client;
}

export const AddressLabelPDF = ({ invoice, organization, client }: AddressLabelPDFProps) => (
  <Document>
    {/* 100mm x 150mm = approx 283pt x 425pt (1mm = 2.83465pt) */}
    <Page size={[283, 425]} style={styles.page}>
      <View style={styles.sender}>
        <Text style={{ fontWeight: 'bold' }}>Odesílatel:</Text>
        <Text>{organization.name}</Text>
        <Text>{organization.address}</Text>
      </View>

      <View>
        <Text style={{ fontSize: 10, color: '#666', marginLeft: 20 }}>Adresát:</Text>
        <Text style={styles.recipient}>{client.name}</Text>
        <Text style={styles.recipientAddress}>{client.address}</Text>
      </View>

      <View style={styles.meta}>
        <Text>Ref: {invoice.variableSymbol || invoice.number}</Text>
        <Text>Tel: {client.phone || '-'}</Text>
      </View>
    </Page>
  </Document>
);
