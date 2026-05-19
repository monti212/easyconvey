import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
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

  // Cover header
  children.push(
    new Paragraph({
      text: firmName.toUpperCase(),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: 'Republic of Botswana · Property Conveyancing',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Republic of Botswana · Property Conveyancing', color: '666666', size: 18 })],
    }),
  );

  if (caseNumber) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: `Ref: ${caseNumber}  ·  ${buyerName} ↔ ${sellerName}`, color: '999999', size: 16 })],
      }),
    );
  }

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
    } else if (trimmed.startsWith('---')) {
      children.push(new Paragraph({
        border: { bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6 } },
        spacing: { before: 120, after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '' })],
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: parseMarkdownLine(trimmed.slice(2)), alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
    } else if (/^\d+[.)]\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+[.)]\s/, '');
      children.push(new Paragraph({ numbering: { reference: 'default-numbering', level: 0 }, children: parseMarkdownLine(text), alignment: AlignmentType.LEFT, spacing: { after: 60 } }));
    } else if (trimmed === '') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 60 } }));
    } else {
      children.push(new Paragraph({ children: parseMarkdownLine(trimmed), spacing: { after: 80 }, alignment: AlignmentType.CENTER }));
    }
  }

  // Footer
  children.push(
    new Paragraph({
      border: { top: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6 } },
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Prepared by ${firmName}  ·  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, color: '999999', size: 16 })],
    }),
  );

  const doc = new Document({
    numbering: {
      config: [{ reference: 'default-numbering', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }] }],
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
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
