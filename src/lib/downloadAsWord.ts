import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  LevelFormat,
  TabStopType,
  PageBreak,
  HorizontalPositionAlign,
  FrameAnchorType,
  FrameWrap,
  HeightRule,
  VerticalPositionAlign,
} from 'docx';
import { normalizeGeneratedLegalDocument } from './normalizeGeneratedLegalDocument';

function parseMarkdownLine(line: string): TextRun[] {
  const runs: TextRun[] = [];
  // Split on bold (**text**) markers
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  const pushTextWithOrdinalSuperscript = (text: string, bold = false) => {
    const ordinalPattern = /\b(\d{1,2})(st|nd|rd|th)\b/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = ordinalPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        runs.push(new TextRun({ text: text.slice(lastIndex, match.index), bold }));
      }
      runs.push(new TextRun({ text: match[1], bold }));
      runs.push(new TextRun({ text: match[2], bold, superScript: true }));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      runs.push(new TextRun({ text: text.slice(lastIndex), bold }));
    }
  };

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      pushTextWithOrdinalSuperscript(part.slice(2, -2), true);
    } else if (part) {
      pushTextWithOrdinalSuperscript(part);
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: '' })];
}

// Indent depth of a numbered/lettered clause line (null = plain prose)
function clauseDepth(text: string): number | null {
  const numeric = text.match(/^(\d+(?:\.\d+)+)[.)]?\s/);
  if (numeric) return (numeric[1].match(/\./g) || []).length;
  if (/^(\([a-zA-Z0-9]{1,4}\)|[a-zA-Z][.)])\s/.test(text)) return 1;
  return null;
}

const PAGE_MARGIN = 2126;
const LABEL_TAB = 2130;
const CATCHWORD_FRAME_WIDTH = 2600;
const CATCHWORD_FRAME_HEIGHT = 260;

function normalizeDeedContent(content: string): string {
  return normalizeGeneratedLegalDocument(content)
    .replace(/\[\[PAGE_BREAK\]\][\s\n]*(?=\[\[CATCHWORD\]\])/g, '')
    .replace(/(\[\[CATCHWORD\]\][^\n]*)(?:\n\s*)+\[\[PAGE_BREAK\]\]/g, '$1')
    .replace(/(\[\[CATCHWORD\]\]\s*.*\/\s*(?:CERTAIN|THE)\b[^\n]*)(?:\n\s*)+/gi, '$1\n')
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
  if (/^(?:\[\[C\]\]\s*)?(?:\*\*CERTAIN:\*\*|CERTAIN:)\s+/i.test(trimmed)) return '.... / CERTAIN';
  if (/\bThe\s+property\s+shall\s+only\s+be\s+used\b/i.test(trimmed)) return '.... / THE';
  if (/^In\s+my\s+presence\b/i.test(trimmed)) return '.... / IN';
  if (/^(?:\[\[C\]\]\s*)?(?:#+\s*)?ENDORSEMENTS\b/i.test(trimmed)) return '.... / ENDORSEMENTS';
  return null;
}

function catchwordKey(text: string): string {
  return text.replace(/^.*\/\s*/, '').trim().toUpperCase();
}

function shouldBreakAfterCatchword(text: string): boolean {
  return /\/\s*(?:CERTAIN|IN|ENDORSEMENTS)\b/i.test(text);
}

function createCatchwordParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '\t' }), ...parseMarkdownLine(text)],
    alignment: AlignmentType.RIGHT,
    tabStops: [{ type: TabStopType.RIGHT, position: 9024 }],
    frame: {
      type: 'alignment',
      alignment: { x: HorizontalPositionAlign.RIGHT, y: VerticalPositionAlign.BOTTOM },
      anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.MARGIN },
      width: CATCHWORD_FRAME_WIDTH,
      height: CATCHWORD_FRAME_HEIGHT,
      wrap: FrameWrap.NONE,
      rule: HeightRule.EXACT,
    },
    spacing: { before: 0, after: 0 },
  });
}

export async function downloadAsWord(
  content: string,
  documentTitle: string,
  filename: string,
  firmName = 'Minchin & Kelly',
  caseNumber = '',
  buyerName = '',
  sellerName = '',
) {
  const lines = normalizeDeedContent(content).split('\n');
  const children: Paragraph[] = [];
  let previousWasPageBreak = false;
  const emittedCatchwords = new Set<string>();

  const pushParagraph = (paragraph: Paragraph, options: { pageBreak?: boolean } = {}) => {
    children.push(paragraph);
    previousWasPageBreak = Boolean(options.pageBreak);
  };

  const pushDeedTransferHeadingGap = () => {
    for (let i = 0; i < 5; i++) {
      pushParagraph(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 240 } }));
    }
  };

  const pushRequiredCatchword = (text: string) => {
    const requiredCatchword = requiredCatchwordForLine(text);
    if (!requiredCatchword || emittedCatchwords.has(catchwordKey(requiredCatchword))) return;
    pushParagraph(createCatchwordParagraph(requiredCatchword));
    emittedCatchwords.add(catchwordKey(requiredCatchword));
    if (shouldBreakAfterCatchword(requiredCatchword)) {
      pushParagraph(new Paragraph({ children: [new PageBreak()] }), { pageBreak: true });
    }
  };

  // Parse markdown content
  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed
      && trimmed !== '[[PAGE_BREAK]]'
      && trimmed !== '[[BR]]'
      && !trimmed.startsWith('[[CATCHWORD]]')
    ) {
      pushRequiredCatchword(trimmed);
    }

    if (trimmed.startsWith('#### ')) {
      pushParagraph(new Paragraph({ text: trimmed.slice(5), heading: HeadingLevel.HEADING_4, alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 } }));
    } else if (trimmed.startsWith('### ')) {
      pushParagraph(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 } }));
    } else if (trimmed.startsWith('## ')) {
      pushParagraph(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 } }));
    } else if (trimmed.startsWith('# ')) {
      if (/^DEED OF TRANSFER NO\.?$/i.test(trimmed.slice(2).trim())) {
        pushDeedTransferHeadingGap();
      }
      pushParagraph(new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 160 } }));
    } else if (trimmed === '[[PAGE_BREAK]]') {
      if (!previousWasPageBreak && children.length > 0) {
        pushParagraph(new Paragraph({ children: [new PageBreak()] }), { pageBreak: true });
      }
    } else if (trimmed.startsWith('[[CATCHWORD]]')) {
      const text = trimmed.replace(/^\[\[CATCHWORD\]\]\s*/, '');
      if (isNumberedClauseCatchword(text)) continue;
      if (emittedCatchwords.has(catchwordKey(text))) continue;
      pushParagraph(createCatchwordParagraph(text));
      emittedCatchwords.add(catchwordKey(text));
      if (shouldBreakAfterCatchword(text)) {
        pushParagraph(new Paragraph({ children: [new PageBreak()] }), { pageBreak: true });
      }
    } else if (trimmed === '[[BR]]') {
      if (!previousWasPageBreak) {
        pushParagraph(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 240 } }));
      }
    } else if (trimmed.startsWith('---')) {
      pushParagraph(new Paragraph({
        border: { bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6 } },
        spacing: { before: 120, after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '' })],
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      pushParagraph(new Paragraph({ bullet: { level: 0 }, children: parseMarkdownLine(trimmed.slice(2)), alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 } }));
    } else if (/^\d+[.)]\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+[.)]\s/, '');
      pushParagraph(new Paragraph({ numbering: { reference: 'default-numbering', level: 0 }, children: parseMarkdownLine(text), alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 } }));
    } else if (trimmed === '') {
      if (!previousWasPageBreak) {
        pushParagraph(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 60 } }));
      }
    } else {
      const markerMatch = trimmed.match(/^\[\[(C|R)\]\]\s*(.*)/);
      const depth = clauseDepth(trimmed);
      if (markerMatch) {
        if (isNumberedClauseCatchword(markerMatch[2])) continue;
        if (markerMatch[1] === 'R' && isCatchphrase(markerMatch[2])) {
          pushParagraph(createCatchwordParagraph(markerMatch[2]));
          emittedCatchwords.add(catchwordKey(markerMatch[2]));
          pushParagraph(new Paragraph({ children: [new PageBreak()] }), { pageBreak: true });
        } else {
          if (markerMatch[1] === 'C' && /^DEED OF TRANSFER NO\.?$/i.test(markerMatch[2].trim())) {
            pushDeedTransferHeadingGap();
          }
          // Explicit alignment marker from the AI
          pushParagraph(new Paragraph({
            children: parseMarkdownLine(markerMatch[2]),
            alignment: markerMatch[1] === 'C' ? AlignmentType.CENTER : AlignmentType.RIGHT,
            spacing: { after: 80 },
          }));
        }
      } else if (depth !== null) {
        // Numbered/lettered clause — left-aligned and indented by depth
        pushParagraph(new Paragraph({
          children: parseMarkdownLine(trimmed),
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: depth * 360 },
          spacing: { after: 80 },
        }));
      } else if (trimmed.startsWith('**')) {
        // Line opening with a bold label (CERTAIN:, SITUATE: …) — use hanging indent and tab stop
        const colonMatch = trimmed.match(/^(\*\*.*?\*\*:?)\s+(.*)/);
        if (colonMatch) {
          pushParagraph(new Paragraph({
            children: [
              ...parseMarkdownLine(colonMatch[1]),
              new TextRun({ text: '\t' }),
              ...parseMarkdownLine(colonMatch[2]),
            ],
            tabStops: [{ type: TabStopType.LEFT, position: LABEL_TAB }],
            indent: { left: LABEL_TAB, hanging: LABEL_TAB },
            spacing: { after: 80 },
            alignment: AlignmentType.JUSTIFIED,
          }));
        } else {
          pushParagraph(new Paragraph({ children: parseMarkdownLine(trimmed), spacing: { after: 80 }, alignment: AlignmentType.LEFT }));
        }
      } else {
        pushParagraph(new Paragraph({
          children: parseMarkdownLine(trimmed),
          spacing: { after: 80 },
          alignment: isSignatureOrRegistryLine(trimmed) ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        }));
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [{ reference: 'default-numbering', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT }] }],
    },
    sections: [{
      properties: {
        page: { margin: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN } },
      },
      // No default headers; the AI emits '[[R]] Prepared by me' as part of the document body
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
