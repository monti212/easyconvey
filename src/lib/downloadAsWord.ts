import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Header,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat,
  TabStopType,
  PageBreak,
  HorizontalPositionAlign,
  VerticalPositionAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
} from 'docx';

function parseMarkdownLine(line: string): TextRun[] {
  const runs: TextRun[] = [];
  // Split on bold (**text**) markers
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part) {
      runs.push(new TextRun({ text: part }));
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

export async function downloadAsWord(
  content: string,
  documentTitle: string,
  filename: string,
  firmName = 'Minchin & Kelly',
  caseNumber = '',
  buyerName = '',
  sellerName = '',
) {
  const lines = content.split('\n');
  const children: Paragraph[] = [];

  // Parse markdown content
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#### ')) {
      children.push(new Paragraph({ text: trimmed.slice(5), heading: HeadingLevel.HEADING_4, alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 } }));
    } else if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 } }));
    } else if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 } }));
    } else if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 160 } }));
    } else if (trimmed === '[[PAGE_BREAK]]') {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    } else if (trimmed.startsWith('[[CATCHWORD]]')) {
      const text = trimmed.replace(/^\[\[CATCHWORD\]\]\s*/, '');
      children.push(new Paragraph({
        children: parseMarkdownLine(text),
        frame: {
          position: { x: 0, y: 0 },
          anchor: {
            horizontal: HorizontalPositionAlign.RIGHT,
            horizontalRelative: HorizontalPositionRelativeFrom.MARGIN,
            vertical: VerticalPositionAlign.BOTTOM,
            verticalRelative: VerticalPositionRelativeFrom.MARGIN,
          },
          width: 4000,
          height: 300,
        },
        alignment: AlignmentType.RIGHT,
      }));
    } else if (trimmed === '[[BR]]') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 240 } }));
    } else if (trimmed.startsWith('---')) {
      children.push(new Paragraph({
        border: { bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6 } },
        spacing: { before: 120, after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '' })],
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: parseMarkdownLine(trimmed.slice(2)), alignment: AlignmentType.LEFT, spacing: { after: 60 } }));
    } else if (/^\d+[.)]\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+[.)]\s/, '');
      children.push(new Paragraph({ numbering: { reference: 'default-numbering', level: 0 }, children: parseMarkdownLine(text), alignment: AlignmentType.LEFT, spacing: { after: 60 } }));
    } else if (trimmed === '') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 60 } }));
    } else {
      const markerMatch = trimmed.match(/^\[\[(C|R)\]\]\s*(.*)/);
      const depth = clauseDepth(trimmed);
      if (markerMatch) {
        // Explicit alignment marker from the AI
        children.push(new Paragraph({
          children: parseMarkdownLine(markerMatch[2]),
          alignment: markerMatch[1] === 'C' ? AlignmentType.CENTER : AlignmentType.RIGHT,
          spacing: { after: 80 },
        }));
      } else if (depth !== null) {
        // Numbered/lettered clause — left-aligned and indented by depth
        children.push(new Paragraph({
          children: parseMarkdownLine(trimmed),
          alignment: AlignmentType.LEFT,
          indent: { left: depth * 360 },
          spacing: { after: 80 },
        }));
      } else if (trimmed.startsWith('**')) {
        // Line opening with a bold label (CERTAIN:, SITUATE: …) — use hanging indent and tab stop
        const colonMatch = trimmed.match(/^(\*\*.*?\*\*:?)\s+(.*)/);
        if (colonMatch) {
          children.push(new Paragraph({
            children: [
              ...parseMarkdownLine(colonMatch[1]),
              new TextRun({ text: '\t' }),
              ...parseMarkdownLine(colonMatch[2]),
            ],
            tabStops: [{ type: TabStopType.LEFT, position: 2880 }], // 2880 TWIPs = 2 inches
            indent: { left: 2880, hanging: 2880 },
            spacing: { after: 80 },
            alignment: AlignmentType.LEFT,
          }));
        } else {
          children.push(new Paragraph({ children: parseMarkdownLine(trimmed), spacing: { after: 80 }, alignment: AlignmentType.LEFT }));
        }
      } else {
        children.push(new Paragraph({ children: parseMarkdownLine(trimmed), spacing: { after: 80 }, alignment: AlignmentType.JUSTIFIED }));
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [{ reference: 'default-numbering', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT }] }],
    },
    sections: [{
      properties: {
        page: { margin: { top: 2126, bottom: 2126, left: 2126, right: 2126 } },
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
