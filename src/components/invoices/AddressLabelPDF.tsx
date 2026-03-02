import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Invoice, Organization, Client } from '@prisma/client';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
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
