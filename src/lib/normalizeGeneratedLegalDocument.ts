const REGISTRAR_LINE = '..................................... Registrar of Deeds Botswana';

function normalizeRegistryBlock(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!/^Registered\s+in\s+the\s+Register\s+of\s*$/i.test(lines[i].trim())) {
      continue;
    }

    let keptAtIndex = i + 1;
    while (keptAtIndex < lines.length && lines[keptAtIndex].trim() === '') keptAtIndex++;
    if (!/^kept\s+at\s*$/i.test(lines[keptAtIndex]?.trim() || '')) {
      continue;
    }

    let dateIndex = keptAtIndex + 1;
    while (dateIndex < lines.length && lines[dateIndex].trim() === '') dateIndex++;

    if (/^on\s+the\s+above\s+date\.?$/i.test(lines[dateIndex]?.trim() || '')) {
      lines.splice(i, dateIndex - i + 1, 'Registered in the Register of', 'kept at', 'on the above date.');
      continue;
    }

    if (/^on\s+the\b/i.test(lines[dateIndex]?.trim() || '') && /\bday\s+of\b/i.test(lines[dateIndex])) {
      lines.splice(i, dateIndex - i + 1, 'Registered in the Register of', 'kept at', 'on the above date.');
    }
  }

  return lines.join('\n');
}

function normalizePowerOfAttorneyPreparedBlock(content: string): string {
  if (!/POWER OF ATTORNEY TO GIVE TRANSFER/i.test(content)) return content;

  const lines = content.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!/POWER OF ATTORNEY TO GIVE TRANSFER/i.test(lines[i])) continue;

    const previousWindow = lines.slice(Math.max(0, i - 6), i).join('\n');
    if (/Prepared by me[\s\S]{0,120}Conveyancer/i.test(previousWindow)) continue;

    lines.splice(i, 0, '[[R]] Prepared by me', '', '[[R]] Conveyancer', '');
    i += 4;
  }

  return lines.join('\n');
}

function removePageBreaksBetweenNumberedClauses(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  const previousContentLine = (index: number): string => {
    for (let i = index - 1; i >= 0; i--) {
      const text = lines[i].trim();
      if (text && text !== '[[BR]]') return text;
    }
    return '';
  };

  const nextContentLine = (index: number): string => {
    for (let i = index + 1; i < lines.length; i++) {
      const text = lines[i].trim();
      if (text && text !== '[[BR]]') return text;
    }
    return '';
  };

  return lines.filter((line, index) => {
    if (line.trim() !== '[[PAGE_BREAK]]') return true;
    return !/^\d{1,2}[.)]?\s/.test(previousContentLine(index))
      || !/^\d{1,2}[.)]?\s/.test(nextContentLine(index));
  }).join('\n');
}

export function normalizeGeneratedLegalDocument(content: string): string {
  return removePageBreaksBetweenNumberedClauses(
    normalizePowerOfAttorneyPreparedBlock(normalizeRegistryBlock(content))
      .replace(/^\[\[CATCHWORD\]\]\s*[.\s]*\/\s*\d+[.)]?\s*.*(?:\n)?/gmi, '')
      .replace(/^\[\[R\]\]\s*[.\s]*\/\s*\d+[.)]?\s*.*(?:\n)?/gmi, ''),
  )
    .replace(/^(\s*)(\d{1,2})(\s+)(?=[A-Z])/gm, '$1$2. ')
    .replace(/\n[.\s]{8,}\n\s*Registrar of Deeds Botswana/gi, `\n${REGISTRAR_LINE}`)
    .replace(
      /Registered\s+in\s+the\s+Register\s+of\s*\n\s*kept\s+at\s*\n\s*on\s+the\s+[\s\S]{0,160}?\bday\s+of\b[\s\S]{0,160}?(?:20\d{0,2})?/gi,
      'Registered in the Register of\nkept at\non the above date.',
    );
}
