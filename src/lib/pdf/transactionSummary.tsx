import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: '40%', fontWeight: 'bold', color: '#444' },
  value: { width: '60%' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#999' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#eee', marginVertical: 10 },
});

interface TransactionSummaryProps {
  transactionId: string;
  transactionType: string;
  buyerName?: string;
  sellerName?: string;
  propertyPrice?: string;
  nationality?: string;
  entityType?: string;
  hasAgent?: boolean;
  agentName?: string;
  agentCompany?: string;
  uploadedDocuments?: string[];
  generatedAt?: string;
}

export default function TransactionSummaryPDF(props: TransactionSummaryProps) {
  const {
    transactionId,
    transactionType,
    buyerName = 'N/A',
    sellerName = 'N/A',
    propertyPrice = 'N/A',
    nationality = 'N/A',
    entityType = 'N/A',
    hasAgent = false,
    agentName = '',
    agentCompany = '',
    uploadedDocuments = [],
    generatedAt = new Date().toISOString(),
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction Summary Report</Text>
          <Text style={styles.subtitle}>Easy Convey - Botswana Property Conveyancing</Text>
          <Text style={{ fontSize: 9, color: '#999', marginTop: 4 }}>
            Generated: {new Date(generatedAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.row}><Text style={styles.label}>Transaction ID:</Text><Text style={styles.value}>{transactionId}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Type:</Text><Text style={styles.value}>{transactionType}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Property Price:</Text><Text style={styles.value}>P {parseInt(propertyPrice || '0').toLocaleString()}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}><Text style={styles.label}>Buyer:</Text><Text style={styles.value}>{buyerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Seller:</Text><Text style={styles.value}>{sellerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Entity Type:</Text><Text style={styles.value}>{entityType}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nationality:</Text><Text style={styles.value}>{nationality}</Text></View>
        </View>

        {hasAgent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estate Agent</Text>
            <View style={styles.row}><Text style={styles.label}>Agent Name:</Text><Text style={styles.value}>{agentName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Company:</Text><Text style={styles.value}>{agentCompany}</Text></View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Documents ({uploadedDocuments.length})</Text>
          {uploadedDocuments.length === 0 ? (
            <Text style={{ color: '#999' }}>No documents uploaded</Text>
          ) : (
            uploadedDocuments.map((doc, i) => (
              <Text key={i} style={{ marginBottom: 2 }}>- {doc}</Text>
            ))
          )}
        </View>

        <View style={styles.divider} />
        <Text style={{ fontSize: 9, color: '#666', textAlign: 'center' }}>
          This is an automatically generated summary. It does not constitute a legal document.
        </Text>

        <Text style={styles.footer}>
          Easy Convey - Powered by OrionX | All rights reserved {new Date().getFullYear()}
        </Text>
      </Page>
    </Document>
  );
}
