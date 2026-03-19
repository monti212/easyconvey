import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.5 },
  header: { textAlign: 'center', marginBottom: 30 },
  title: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  subtitle: { fontSize: 11, marginTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  clause: { marginBottom: 10 },
  clauseNumber: { fontWeight: 'bold' },
  signatureBlock: { marginTop: 40 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#000', width: '60%', marginTop: 30, marginBottom: 4 },
  signatureLabel: { fontSize: 9, color: '#444' },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 8, color: '#999', borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 8 },
});

interface DeedOfSaleProps {
  transactionId: string;
  buyerName: string;
  sellerName: string;
  propertyPrice: string;
  propertyAddress?: string;
  entityType?: string;
  generatedContent?: string;
  documentTitle?: string;
  date?: string;
}

export default function DeedOfSalePDF(props: DeedOfSaleProps) {
  const {
    transactionId,
    buyerName,
    sellerName,
    propertyPrice,
    propertyAddress = 'As per title deed',
    generatedContent,
    documentTitle,
    date = new Date().toLocaleDateString('en-BW', { year: 'numeric', month: 'long', day: 'numeric' }),
  } = props;

  const priceFormatted = `P ${parseInt(propertyPrice || '0').toLocaleString()}`;
  const title = documentTitle || 'Deed of Sale';

  // If AI-generated content is provided, render it as the document body
  if (generatedContent) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Republic of Botswana</Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 4 }}>Reference: {transactionId} | Date: {date}</Text>
          </View>
          <View style={styles.section}>
            <Text>{generatedContent}</Text>
          </View>
          <Text style={styles.footer}>
            Prepared by Minchin & Kelly | Powered by OrionX | This document requires proper legal review before execution
          </Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Deed of Sale</Text>
          <Text style={styles.subtitle}>Property Transfer Agreement - Republic of Botswana</Text>
          <Text style={{ fontSize: 9, color: '#666', marginTop: 4 }}>Reference: {transactionId} | Date: {date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIES TO THE AGREEMENT</Text>
          <Text>THE SELLER: {sellerName} (hereinafter referred to as "the Seller")</Text>
          <Text style={{ marginTop: 4 }}>THE PURCHASER: {buyerName} (hereinafter referred to as "the Purchaser")</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. PROPERTY DESCRIPTION</Text>
          <View style={styles.clause}>
            <Text>The Seller hereby sells to the Purchaser, who hereby purchases, the following property situated at:</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{propertyAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. PURCHASE PRICE</Text>
          <View style={styles.clause}>
            <Text>The purchase price of the property shall be <Text style={{ fontWeight: 'bold' }}>{priceFormatted}</Text> (Botswana Pula), payable in the manner set out in Clause 3 below.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. PAYMENT TERMS</Text>
          <View style={styles.clause}>
            <Text>3.1 The purchase price shall be paid in full upon transfer of the property.</Text>
            <Text>3.2 Payment shall be made by electronic funds transfer to the conveyancer's trust account.</Text>
            <Text>3.3 All transfer costs, including transfer duty, shall be borne by the Purchaser unless otherwise agreed.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. TRANSFER AND POSSESSION</Text>
          <View style={styles.clause}>
            <Text>4.1 Transfer of the property shall be effected by the appointed conveyancer as soon as reasonably possible.</Text>
            <Text>4.2 The Purchaser shall take possession of the property on the date of registration of transfer.</Text>
            <Text>4.3 The Seller shall deliver vacant possession free of any encumbrances not disclosed herein.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. WARRANTIES</Text>
          <View style={styles.clause}>
            <Text>5.1 The Seller warrants that they are the lawful owner of the property and have full authority to sell.</Text>
            <Text>5.2 The Seller warrants that the property is free from any undisclosed encumbrances or defects in title.</Text>
            <Text>5.3 The property is sold voetstoots (as is) regarding its physical condition.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. GENERAL</Text>
          <View style={styles.clause}>
            <Text>6.1 This agreement constitutes the entire agreement between the parties.</Text>
            <Text>6.2 This agreement shall be governed by the laws of the Republic of Botswana.</Text>
            <Text>6.3 Any disputes shall be resolved through mediation before resort to litigation.</Text>
          </View>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Seller: {sellerName}</Text>
              <Text style={styles.signatureLabel}>Date: _______________</Text>
            </View>
            <View>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Purchaser: {buyerName}</Text>
              <Text style={styles.signatureLabel}>Date: _______________</Text>
            </View>
          </View>

          <View style={{ marginTop: 30 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Witness 1</Text>
          </View>
          <View style={{ marginTop: 20 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Witness 2</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Prepared by Minchin & Kelly | Powered by OrionX | This document requires proper legal review before execution
        </Text>
      </Page>
    </Document>
  );
}
