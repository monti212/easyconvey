import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const colors = {
  primary: '#1a1a2e',
  accent: '#4a3f8a',
  gold: '#c9a84c',
  goldLight: '#e6d59e',
  gray: '#666666',
  grayLight: '#999999',
  grayBorder: '#d4d4d4',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: { paddingTop: 60, paddingBottom: 70, paddingHorizontal: 50, fontSize: 10, fontFamily: 'Helvetica' },
  // Header
  pageHeader: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
  },
  pageHeaderFirm: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pageHeaderRef: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.grayLight,
  },
  // Title block
  titleBlock: { textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.primary, textTransform: 'uppercase', letterSpacing: 3 },
  subtitle: { fontSize: 9, color: colors.grayLight, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' },
  timestamp: { fontSize: 8, color: colors.grayLight, marginTop: 6 },
  // Sections
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
  },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: '38%', fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#555' },
  value: { width: '62%', fontSize: 10, color: '#333' },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.grayBorder,
  },
  footerText: { fontSize: 7, fontFamily: 'Helvetica', color: colors.grayLight },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#eee', marginVertical: 10 },
  disclaimer: { fontSize: 8, color: '#888', textAlign: 'center', marginTop: 12 },
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
  firmName?: string;
  lawyerName?: string;
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
    firmName = 'Minchin & Kelly',
    lawyerName = 'Conveyancer',
  } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Running header */}
        <View style={styles.pageHeader} fixed>
          <Text style={styles.pageHeaderFirm}>{firmName}</Text>
          <Text style={styles.pageHeaderRef}>Ref: {transactionId}</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Transaction Summary</Text>
          <Text style={styles.subtitle}>Property Conveyancing &middot; Republic of Botswana</Text>
          <Text style={styles.timestamp}>
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
            <Text style={{ color: '#999', fontSize: 9 }}>No documents uploaded</Text>
          ) : (
            uploadedDocuments.map((doc, i) => (
              <Text key={i} style={{ marginBottom: 3, fontSize: 9, color: '#444' }}>{'\u2022'} {doc}</Text>
            ))
          )}
        </View>

        <View style={styles.divider} />
        <Text style={styles.disclaimer}>
          This is an automatically generated summary. It does not constitute a legal document.
        </Text>

        {/* Running footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>
            Prepared by {firmName} | {lawyerName}
          </Text>
          <Text style={styles.footerText}>
            {new Date().getFullYear()} | All rights reserved
          </Text>
        </View>
      </Page>
    </Document>
  );
}
