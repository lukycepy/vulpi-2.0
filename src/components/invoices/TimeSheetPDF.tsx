import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice, Organization, Client, TimeEntry, Project, User } from '@prisma/client';

// Register font for Czech characters (reusing same fonts as InvoicePDF)
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
    fontSize: 20,
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
    backgroundColor: '#f9f9f9',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 4,
    paddingBottom: 4,
  },
  colDate: { width: '15%' },
  colUser: { width: '20%' },
  colDesc: { width: '35%' },
  colDuration: { width: '15%', textAlign: 'right' },
  colRate: { width: '15%', textAlign: 'right' },
  
  totalSection: {
    marginTop: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
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
});

interface TimeSheetPDFProps {
  invoice: Invoice & {
    organization: Organization;
    client: Client;
  };
  project: Project;
  timeEntries: (TimeEntry & { user: User })[];
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('cs-CZ');
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const TimeSheetPDF = ({ invoice, project, timeEntries }: TimeSheetPDFProps) => {
  const totalSeconds = timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
  const totalHours = totalSeconds / 3600;
  
  // Calculate total amount if rate is available (simplified)
  // Assuming project hourly rate if entry doesn't have specific logic (schema doesn't have rate on TimeEntry yet)
  const hourlyRate = project.hourlyRate || 0;
  const totalAmount = totalHours * hourlyRate;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.column}>
            <Text style={styles.title}>Výkaz práce</Text>
            <Text style={styles.subtitle}>Příloha k faktuře č. {invoice.number}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Projekt</Text>
            <Text style={[styles.value, styles.bold]}>{project.name}</Text>
            <Text style={styles.label}>Období</Text>
            <Text style={styles.value}>
              {timeEntries.length > 0 ? 
                `${formatDate(timeEntries[timeEntries.length - 1].startTime)} - ${formatDate(timeEntries[0].startTime)}` 
                : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Dodavatel</Text>
            <Text style={[styles.value, styles.bold]}>{invoice.organization.name}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Odběratel</Text>
            <Text style={[styles.value, styles.bold]}>{invoice.client.name}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.label, styles.colDate]}>Datum</Text>
            <Text style={[styles.label, styles.colUser]}>Pracovník</Text>
            <Text style={[styles.label, styles.colDesc]}>Popis</Text>
            <Text style={[styles.label, styles.colDuration]}>Čas</Text>
            {hourlyRate > 0 && <Text style={[styles.label, styles.colRate]}>Sazba</Text>}
          </View>

          {timeEntries.map((entry) => (
            <View key={entry.id} style={styles.tableRow}>
              <Text style={[styles.value, styles.colDate]}>{formatDate(entry.startTime)}</Text>
              <Text style={[styles.value, styles.colUser]}>{entry.user.firstName} {entry.user.lastName}</Text>
              <Text style={[styles.value, styles.colDesc]}>{entry.description}</Text>
              <Text style={[styles.value, styles.colDuration]}>{formatDuration(entry.duration || 0)}</Text>
              {hourlyRate > 0 && (
                <Text style={[styles.value, styles.colRate]}>{hourlyRate} Kč/h</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={{ marginRight: 20 }}>Celkový čas:</Text>
            <Text style={styles.bold}>{formatDuration(totalSeconds)}</Text>
          </View>
          {hourlyRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ marginRight: 20 }}>Celkem k fakturaci:</Text>
              <Text style={styles.bold}>{totalAmount.toFixed(2)} Kč</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Generováno systémem Vulpi</Text>
        </View>
      </Page>
    </Document>
  );
};
