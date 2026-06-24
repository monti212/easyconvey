import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { normalizeGeneratedLegalDocument } from '../normalizeGeneratedLegalDocument';

// ─── Styles ──────────────────────────────────────────────────────────────────

const colors = {
  primary: '#1a1a2e',
  accent: '#4a3f8a',
  accentLight: '#6c5ce7',
  gold: '#c9a84c',
  goldLight: '#e6d59e',
  gray: '#666666',
  grayLight: '#999999',
  grayBorder: '#d4d4d4',
  white: '#ffffff',
  bg: '#f8f7f4',
};

const styles = StyleSheet.create({
  // ─── Cover Page ─────────────────────────────────
  coverPage: {
    backgroundColor: colors.primary,
    padding: 0,
    position: 'relative',
  },
  coverBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  coverInnerBorder: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 0.5,
    borderColor: colors.gold,
  },
  coverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverTopAccent: {
    width: 60,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 30,
  },
  coverFirmName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 6,
  },
  coverFirmTagline: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: colors.goldLight,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 40,
  },
  coverDivider: {
    width: 200,
    height: 0.5,
    backgroundColor: colors.gold,
    marginBottom: 40,
  },
  coverRepublic: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.goldLight,
    letterSpacing: 5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.grayLight,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 50,
  },
  coverDetailsBox: {
    borderWidth: 0.5,
    borderColor: colors.gold,
    padding: 24,
    width: '80%',
    marginBottom: 50,
  },
  coverDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coverDetailLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.goldLight,
    width: '35%',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  coverDetailValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    width: '65%',
  },
  coverBottomAccent: {
    width: 60,
    height: 2,
    backgroundColor: colors.gold,
    marginTop: 10,
  },
  coverPreparedBy: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.grayLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 30,
  },
  coverLawyerName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.goldLight,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 1,
  },
  coverDate: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.grayLight,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },

  // ─── Content Pages ──────────────────────────────
  page: {
    paddingTop: 106,
    paddingBottom: 106,
    paddingHorizontal: 106,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
    color: '#333333',
  },
  pageHeader: {
    position: 'absolute',
    top: 20,
    left: 55,
    right: 55,
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
  pageFooter: {
    position: 'absolute',
    bottom: 25,
    left: 55,
    right: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.grayBorder,
  },
  pageFooterText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.grayLight,
  },
  pageNumber: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: colors.grayLight,
  },

  // ─── Markdown Content ───────────────────────────
  h1: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 20,
    marginTop: 10,
  },
  h2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginTop: 14,
    marginBottom: 6,
  },
  h4: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#444444',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
    lineHeight: 1.7,
    marginBottom: 8,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 12,
  },
  listBullet: {
    width: 16,
    fontSize: 10,
    color: '#555555',
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
    lineHeight: 1.7,
    textAlign: 'justify',
  },
  hr: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
    marginVertical: 16,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: '60%',
    marginTop: 30,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#444',
    fontFamily: 'Helvetica',
  },
});

// ─── Markdown Parser ─────────────────────────────────────────────────────────

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'list-item' | 'hr' | 'blank' | 'page-break' | 'br' | 'catchword';
  text: string;
  ordered?: boolean;
  index?: number;
  indent?: number;
  align?: 'center' | 'right';
}

// Indent depth of a numbered/lettered clause line (null = plain prose)
function clauseDepth(text: string): number | null {
  const numeric = text.match(/^(\d+(?:\.\d+)+)[.)]?\s/);
  if (numeric) return (numeric[1].match(/\./g) || []).length;
  if (/^(\([a-zA-Z0-9]{1,4}\)|[a-zA-Z][.)])\s/.test(text)) return 1;
  return null;
}

function isCatchphrase(text: string): boolean {
  return /^[.\s]*\/\s*[A-Z][A-Z\s]+$/.test(text.trim());
}

function isNumberedClauseCatchword(text: string): boolean {
  return /^[.\s]*\/\s*\d+[.)]?\s*/.test(text.trim());
}

function isSignatureOrRegistryLine(text: string): boolean {
  return /^(In my presence|Registered in the Register of|kept at|on the above date\.?)/i.test(text.trim())
    || /^[.\s]{8,}.*Registrar of Deeds Botswana/i.test(text.trim())
    || /^Registrar of Deeds Botswana$/i.test(text.trim());
}

function requiredCatchwordForLine(text: string): string | null {
  const trimmed = text.trim();
  if (/^(?:\[\[C\]\]\s*)?(?:#+\s*)?ENDORSEMENTS\b/i.test(trimmed)) return '.... / ENDORSEMENTS';
  return null;
}

function catchwordKey(text: string): string {
  return text.replace(/^.*\/\s*/, '').trim().toUpperCase();
}

function shouldBreakAfterCatchword(text: string): boolean {
  return /\/\s*ENDORSEMENTS\b/i.test(text);
}

function normalizeGeneratedContent(markdown: string): string {
  return normalizeGeneratedLegalDocument(markdown)
    .replace(/\[\[PAGE_BREAK\]\][\s\n]*(?=\[\[CATCHWORD\]\])/g, '')
    .replace(/(\[\[CATCHWORD\]\][^\n]*)(?:\n\s*)+\[\[PAGE_BREAK\]\]/g, '$1')
    .replace(/(\[\[R\]\]\s*[.\s]*\/\s*[A-Z][A-Z\s]+)(?:\n\s*)+\[\[PAGE_BREAK\]\]/g, '$1')
    .replace(/\[\[PAGE_BREAK\]\][\s\n]*(?:\[\[BR\]\][\s\n]*)*\[\[PAGE_BREAK\]\]/g, '[[PAGE_BREAK]]')
    .replace(/\[\[PAGE_BREAK\]\][\s\n]+(?=\[\[PAGE_BREAK\]\])/g, '[[PAGE_BREAK]]')
    .replace(
      /(\*\*SUBJECT TO:\*\*[\s\S]*?)(?:\n\s*)+(and further subject to the following (?:reservations and )?conditions\s+namely:-)/gi,
      (_match, before, after) => `${before.trimEnd()} ${after}`,
    )
    .replace(
      /(\*\*SUBJECT TO:\*\*[\s\S]*?conditions contained in[\s\S]*?)(?:\n\s*)+(and further subject to the following (?:reservations and )?conditions\s+namely:-)/gi,
      (_match, before, after) => `${before.trimEnd()} ${after}`,
    );
}

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const lines = normalizeGeneratedContent(markdown).split('\n');
  const blocks: ParsedBlock[] = [];
  const emittedCatchwords = new Set<string>();
  let i = 0;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ') });
      paragraphBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') {
      flushParagraph();
      i++;
      continue;
    }

    const requiredCatchword = requiredCatchwordForLine(trimmed);
    if (requiredCatchword && !emittedCatchwords.has(catchwordKey(requiredCatchword))) {
      flushParagraph();
      blocks.push({ type: 'catchword', text: requiredCatchword });
      emittedCatchwords.add(catchwordKey(requiredCatchword));
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: 'hr', text: '' });
      i++;
      continue;
    }

    // Headings
    const h4Match = trimmed.match(/^####\s+(.*)/);
    if (h4Match) { flushParagraph(); blocks.push({ type: 'h4', text: h4Match[1] }); i++; continue; }
    const h3Match = trimmed.match(/^###\s+(.*)/);
    if (h3Match) { flushParagraph(); blocks.push({ type: 'h3', text: h3Match[1] }); i++; continue; }
    const h2Match = trimmed.match(/^##\s+(.*)/);
    if (h2Match) { flushParagraph(); blocks.push({ type: 'h2', text: h2Match[1] }); i++; continue; }
    const h1Match = trimmed.match(/^#\s+(.*)/);
    if (h1Match) { flushParagraph(); blocks.push({ type: 'h1', text: h1Match[1] }); i++; continue; }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)/);
    if (ulMatch) {
      flushParagraph();
      blocks.push({ type: 'list-item', text: ulMatch[1], ordered: false });
      i++;
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (olMatch) {
      flushParagraph();
      blocks.push({ type: 'list-item', text: olMatch[2], ordered: true, index: parseInt(olMatch[1]) });
      i++;
      continue;
    }

    // Explicit alignment marker emitted by the AI ([[C]] centre, [[R]] right)
    const markerMatch = trimmed.match(/^\[\[(C|R)\]\]\s*(.*)/);
    if (markerMatch) {
      flushParagraph();
      if (isNumberedClauseCatchword(markerMatch[2])) {
        i++;
        continue;
      }
      if (markerMatch[1] === 'R' && isCatchphrase(markerMatch[2])) {
        blocks.push({ type: 'catchword', text: markerMatch[2] });
        emittedCatchwords.add(catchwordKey(markerMatch[2]));
      } else {
        blocks.push({ type: 'paragraph', text: markerMatch[2], align: markerMatch[1] === 'C' ? 'center' : 'right' });
      }
      i++;
      continue;
    }

    // Page break
    const pbMatch = trimmed.match(/^\[\[PAGE_BREAK\]\]/);
    if (pbMatch) {
      flushParagraph();
      blocks.push({ type: 'page-break', text: '' });
      i++;
      continue;
    }

    // Line break [[BR]]
    if (trimmed === '[[BR]]') {
      flushParagraph();
      blocks.push({ type: 'br', text: '' });
      i++;
      continue;
    }

    // Catchword [[CATCHWORD]]
    const catchwordMatch = trimmed.match(/^\[\[CATCHWORD\]\]\s*(.*)/);
    if (catchwordMatch) {
      flushParagraph();
      if (isNumberedClauseCatchword(catchwordMatch[1])) {
        i++;
        continue;
      }
      if (emittedCatchwords.has(catchwordKey(catchwordMatch[1]))) {
        i++;
        continue;
      }
      blocks.push({ type: 'catchword', text: catchwordMatch[1] });
      emittedCatchwords.add(catchwordKey(catchwordMatch[1]));
      i++;
      continue;
    }

    // Numbered/lettered clause line (1.1, 2.3.1, a., (i)) — left-indented block
    const cd = clauseDepth(trimmed);
    if (cd !== null) {
      flushParagraph();
      blocks.push({ type: 'paragraph', text: trimmed, indent: cd });
      i++;
      continue;
    }

    // Regular text → paragraph buffer
    paragraphBuffer.push(trimmed);
    i++;
  }

  flushParagraph();
  return blocks.filter((block, index) => {
    const previous = blocks[index - 1];
    if (block.type !== 'page-break') return true;
    return index > 0 && previous?.type !== 'page-break' && previous?.type !== 'catchword';
  });
}

/** Render inline markdown (bold, italic) within a Text element */
function renderInlineText(text: string): React.ReactNode[] {
  // Split on **bold** and *italic* patterns
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // ***bold italic***
      parts.push(<Text key={match.index} style={{ fontFamily: 'Helvetica-BoldOblique' }}>{match[2]}</Text>);
    } else if (match[3]) {
      // **bold**
      parts.push(<Text key={match.index} style={styles.bold}>{match[3]}</Text>);
    } else if (match[5]) {
      // __bold__
      parts.push(<Text key={match.index} style={styles.bold}>{match[5]}</Text>);
    } else if (match[4]) {
      // *italic*
      parts.push(<Text key={match.index} style={styles.italic}>{match[4]}</Text>);
    } else if (match[6]) {
      // _italic_
      parts.push(<Text key={match.index} style={styles.italic}>{match[6]}</Text>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// ─── Component ───────────────────────────────────────────────────────────────

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
  firmName?: string;
  lawyerName?: string;
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
    firmName = 'Minchin & Kelly',
    lawyerName = 'Conveyancer',
  } = props;

  const priceFormatted = `P ${parseInt(propertyPrice || '0').toLocaleString()}`;
  const title = documentTitle || 'Deed of Sale & Transfer Agreement';

  // ─── Render parsed markdown blocks ──────────────────
  const renderBlocks = (blocks: ParsedBlock[]) => {
    return blocks.map((block, idx) => {
      switch (block.type) {
        case 'h1':
          return <Text key={idx} style={styles.h1}>{renderInlineText(block.text)}</Text>;
        case 'h2':
          return <Text key={idx} style={styles.h2}>{renderInlineText(block.text)}</Text>;
        case 'h3':
          return <Text key={idx} style={styles.h3}>{renderInlineText(block.text)}</Text>;
        case 'h4':
          return <Text key={idx} style={styles.h4}>{renderInlineText(block.text)}</Text>;
        case 'paragraph': {
          let pStyle: any = styles.paragraph;
          if (block.align === 'center') pStyle = [styles.paragraph, { textAlign: 'center' as const }];
          else if (block.align === 'right') pStyle = [styles.paragraph, { textAlign: 'right' as const }];
          else if (block.indent) pStyle = [styles.paragraph, { textAlign: 'justify' as const, marginLeft: block.indent * 18 }];
          else if (block.text.trimStart().startsWith('**')) pStyle = [styles.paragraph, { textAlign: 'justify' as const }];
          else if (isSignatureOrRegistryLine(block.text)) pStyle = [styles.paragraph, { textAlign: 'left' as const }];
          return <Text key={idx} style={pStyle}>{renderInlineText(block.text)}</Text>;
        }
        case 'list-item':
          return (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>
                {block.ordered ? `${block.index}.` : '\u2022'}
              </Text>
              <Text style={styles.listContent}>{renderInlineText(block.text)}</Text>
            </View>
          );
        case 'hr':
          return <View key={idx} style={styles.hr} />;
        case 'page-break':
          return <View key={idx} break />;
        case 'br':
          return <Text key={idx}>{"\n"}</Text>;
        case 'catchword':
          return (
            <React.Fragment key={idx}>
              <Text style={{ position: 'absolute', bottom: 106, right: 106, textAlign: 'right', ...styles.paragraph }}>
                {renderInlineText(block.text)}
              </Text>
              {shouldBreakAfterCatchword(block.text) ? <View break /> : null}
            </React.Fragment>
          );
        default:
          return null;
      }
    });
  };

  // ─── AI-generated content ────────────────────────────
  if (generatedContent) {
    const blocks = parseMarkdownToBlocks(generatedContent);

    return (
      <Document>
        <Page size="A4" style={styles.page} wrap>
          {/* Running header */}
          <View style={styles.pageHeader} fixed>
            <Text style={styles.pageHeaderFirm}>{firmName}</Text>
            <Text style={styles.pageHeaderRef}>Ref: {transactionId}</Text>
          </View>

          {/* Document content */}
          <View>
            {renderBlocks(blocks)}
          </View>

          {/* Running footer */}
          <View style={styles.pageFooter} fixed>
            <Text style={styles.pageFooterText}>
              Prepared by {firmName} | {lawyerName}
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber - 1} of ${totalPages - 1}`}
            />
          </View>
        </Page>
      </Document>
    );
  }

  // ─── Fallback: default deed template ─────────────────
  return (
    <Document>
      <CoverPage />
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader} fixed>
          <Text style={styles.pageHeaderFirm}>{firmName}</Text>
          <Text style={styles.pageHeaderRef}>Ref: {transactionId}</Text>
        </View>

        <Text style={styles.h1}>Deed of Sale</Text>
        <Text style={styles.h2}>Parties to the Agreement</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>THE SELLER:</Text> {sellerName} (hereinafter referred to as "the Seller")
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>THE PURCHASER:</Text> {buyerName} (hereinafter referred to as "the Purchaser")
        </Text>

        <Text style={styles.h2}>1. Property Description</Text>
        <Text style={styles.paragraph}>
          The Seller hereby sells to the Purchaser, who hereby purchases, the following property situated at:
        </Text>
        <Text style={{ ...styles.paragraph, fontFamily: 'Helvetica-Bold' }}>{propertyAddress}</Text>

        <Text style={styles.h2}>2. Purchase Price</Text>
        <Text style={styles.paragraph}>
          The purchase price of the property shall be <Text style={styles.bold}>{priceFormatted}</Text> (Botswana Pula), payable in the manner set out in Clause 3 below.
        </Text>

        <Text style={styles.h2}>3. Payment Terms</Text>
        <Text style={styles.paragraph}>3.1 The purchase price shall be paid in full upon transfer of the property.</Text>
        <Text style={styles.paragraph}>3.2 Payment shall be made by electronic funds transfer to the conveyancer's trust account.</Text>
        <Text style={styles.paragraph}>3.3 All transfer costs, including transfer duty, shall be borne by the Purchaser unless otherwise agreed.</Text>

        <Text style={styles.h2}>4. Transfer and Possession</Text>
        <Text style={styles.paragraph}>4.1 Transfer of the property shall be effected by the appointed conveyancer as soon as reasonably possible.</Text>
        <Text style={styles.paragraph}>4.2 The Purchaser shall take possession of the property on the date of registration of transfer.</Text>
        <Text style={styles.paragraph}>4.3 The Seller shall deliver vacant possession free of any encumbrances not disclosed herein.</Text>

        <Text style={styles.h2}>5. Warranties</Text>
        <Text style={styles.paragraph}>5.1 The Seller warrants that they are the lawful owner of the property and have full authority to sell.</Text>
        <Text style={styles.paragraph}>5.2 The Seller warrants that the property is free from any undisclosed encumbrances or defects in title.</Text>
        <Text style={styles.paragraph}>5.3 The property is sold voetstoots (as is) regarding its physical condition.</Text>

        <Text style={styles.h2}>6. General</Text>
        <Text style={styles.paragraph}>6.1 This agreement constitutes the entire agreement between the parties.</Text>
        <Text style={styles.paragraph}>6.2 This agreement shall be governed by the laws of the Republic of Botswana.</Text>
        <Text style={styles.paragraph}>6.3 Any disputes shall be resolved through mediation before resort to litigation.</Text>

        <Text style={styles.h2}>Signatures</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
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

        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>
            Prepared by {firmName} | {lawyerName}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber - 1} of ${totalPages - 1}`}
          />
        </View>
      </Page>
    </Document>
  );
}
