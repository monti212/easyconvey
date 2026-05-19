import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

// Load .env.local first (has server-side secrets), then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.API_PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Client info (real IP for audit logging)
app.get('/api/client-info', (req, res) => {
  res.json({
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  });
});

// Helper: call OpenAI Chat Completions API
async function callOpenAI(apiKey, instructions, input, options = {}) {
  const { model = 'gpt-4o', max_tokens = 4096, temperature = 0.1, ...rest } = options;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: input },
      ],
      temperature,
      max_tokens,
      ...rest,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || `AI API error: ${response.status}`);
    error.status = response.status;
    error.details = errorData;
    throw error;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Comprehensive conveyancing document generation (streaming, replaces Supabase edge function) ───
app.post('/api/generate-document', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured on server' });

  const {
    transactionId, documentType = 'deed_of_sale', propertyPrice,
    buyerDetails, sellerDetails, buyerName, sellerName,
    conveyancerName, conveyancerFirm,
    transactionCategory, includeBondRegistration,
    extractedOwnerName, extractedOwnerIdNumber, extractedPreviousOwner,
    extractedPlotNumber, extractedPropertyAddress, extractedPropertyDescription,
    extractedTitleDeedNumber, extractedAdministrativeDistrict, extractedExtent,
    extractedPurchasePrice, extractedHasMortgageBond, extractedMortgageBondNumber,
    extractedClientName, extractedIdNumber, extractedDateOfBirth,
    stream: wantStream,
  } = req.body;

  if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });

  // Resolve names with OCR fallbacks
  const resolvedSellerName = sellerDetails?.clientName || sellerDetails?.agentName
    || sellerDetails?.companyName || extractedOwnerName || sellerName || 'OUTSTANDING — Seller name required';
  const resolvedBuyerName = buyerDetails?.clientName || buyerDetails?.agentName
    || buyerDetails?.companyName || extractedClientName || buyerName || 'OUTSTANDING — Buyer name required';
  const resolvedSellerIdNumber = sellerDetails?.idNumber || extractedOwnerIdNumber || 'OUTSTANDING — Seller ID required';
  const resolvedBuyerIdNumber = buyerDetails?.idNumber || extractedIdNumber || 'OUTSTANDING — Buyer ID required';

  const transactionBlock = `
TRANSACTION REFERENCE: ${transactionId}
TRANSACTION CATEGORY: ${transactionCategory ? transactionCategory.replace(/_/g, ' ').toUpperCase() : 'NORMAL TRANSFER'}${includeBondRegistration ? ' + BOND REGISTRATION' : ''}

═══════════════════════════════════════
CONVEYANCER (APPEARER) DETAILS:
═══════════════════════════════════════
Conveyancer Name: ${conveyancerName || 'OUTSTANDING — Conveyancer name required'}
Law Firm: ${conveyancerFirm || 'OUTSTANDING — Firm name required'}
Office Location: Gaborone, Botswana

${(extractedOwnerName || extractedPlotNumber || extractedTitleDeedNumber) ? `═══════════════════════════════════════
TITLE DEED — OCR EXTRACTED DATA (HIGHEST PRIORITY — use this over all other sources):
═══════════════════════════════════════
${extractedOwnerName ? `Registered Owner / SELLER Full Name: ${extractedOwnerName}` : ''}
${extractedOwnerIdNumber ? `Registered Owner / SELLER ID Number: ${extractedOwnerIdNumber}` : ''}
${extractedPreviousOwner ? `Previous Owner (chain of title): ${extractedPreviousOwner}` : ''}
${extractedPlotNumber ? `Plot / Stand Number: ${extractedPlotNumber}` : ''}
${extractedTitleDeedNumber ? `Title Deed / Certificate No: ${extractedTitleDeedNumber}` : ''}
${extractedPropertyAddress ? `Property Address: ${extractedPropertyAddress}` : ''}
${extractedPropertyDescription ? `Property Description (CERTAIN/SITUATE): ${extractedPropertyDescription}` : ''}
${extractedAdministrativeDistrict ? `Administrative District: ${extractedAdministrativeDistrict}` : ''}
${extractedExtent ? `Extent / Size: ${extractedExtent}` : ''}
${extractedPurchasePrice ? `Purchase Price from Deed: ${extractedPurchasePrice}` : ''}
${extractedHasMortgageBond ? `Mortgage Bond Registered: Yes${extractedMortgageBondNumber ? ` — Bond No: ${extractedMortgageBondNumber}` : ''}` : ''}
${extractedClientName ? `Buyer Name (from ID document): ${extractedClientName}` : ''}
${extractedIdNumber ? `Buyer ID Number (from ID document): ${extractedIdNumber}` : ''}
` : ''}
═══════════════════════════════════════
SELLER (TRANSFEROR) INFORMATION:
═══════════════════════════════════════
Full Legal Name: ${resolvedSellerName}
ID / Passport Number: ${resolvedSellerIdNumber}
Date of Birth: ${sellerDetails?.dateOfBirth || 'OUTSTANDING — Date of birth required'}
Entity Type: ${sellerDetails?.entityType || 'Individual'}
Gender: ${sellerDetails?.gender || 'Not specified'}
Nationality: ${sellerDetails?.nationality || 'Motswana'}
Marital Status: ${sellerDetails?.maritalStatus || 'Not specified'}

═══════════════════════════════════════
BUYER (PURCHASER) INFORMATION:
═══════════════════════════════════════
Full Legal Name: ${resolvedBuyerName}
ID / Passport Number: ${resolvedBuyerIdNumber}
Date of Birth: ${buyerDetails?.dateOfBirth || extractedDateOfBirth || 'OUTSTANDING — Date of birth required'}
Entity Type: ${buyerDetails?.entityType || 'Individual'}
Gender: ${buyerDetails?.gender || 'Not specified'}
Nationality: ${buyerDetails?.nationality || 'Motswana'}
Marital Status: ${buyerDetails?.maritalStatus || 'Not specified'}
First-time Buyer: ${buyerDetails?.isFirstTimeBuyer ? 'Yes' : 'No'}

═══════════════════════════════════════
PROPERTY & FINANCIAL DETAILS:
═══════════════════════════════════════
Property Price: ${propertyPrice || extractedPurchasePrice || 'OUTSTANDING — Price required'}
${buyerDetails?.valuationAmount ? `Valuation Amount: P ${parseInt(buyerDetails.valuationAmount).toLocaleString()}` : ''}
`;

  const BOTSWANA_RULES = `
BOTSWANA CONVEYANCING BUSINESS RULES:
• Transfer Duty: Citizens 0% on first P1,500,000 then 5%; Non-citizens 10% up to P2M then 15%
• First-Time Buyer Exemption: Citizens only, Section 20(1)(f) Transfer Duty Act
• Rates Clearance required before transfer
• Land Board Consent may be needed where applicable (tribal land only)
• Bond Cancellation may be needed where applicable (only if existing bond)
• All transfers comply with Financial Intelligence Act

WORDING RULE: Use "may be needed where applicable" for conditional documents. Never "will be needed".

CATCHPHRASE REQUIREMENT (mandatory for Deeds Registry acceptance):
After each major section, add a right-aligned italicised catchphrase showing the first word of the next section.
Example: at end of a section before one starting "WHEREFORE", add:   *WHEREFORE*

CRITICAL DATA RULE:
- NEVER output bracket placeholders like [NAME] or [DATE] in the final document
- NEVER output "To be confirmed" — use OUTSTANDING — [description] for missing data
- Use OCR EXTRACTED DATA as the HIGHEST PRIORITY source for all property and party details
- If seller name is in the OCR section, use it — do NOT output OUTSTANDING for it`;

  const docInstructions = {
    deed_of_transfer: `You are an expert Botswana property conveyancing attorney generating a Deed of Transfer for the Deeds Registry. Generate a COMPLETE Deed of Transfer in the EXACT format used by the Deeds Registry of Botswana. Use ALL actual party details from the transaction data. NEVER output bracket placeholders or "To be confirmed" — use OUTSTANDING only for genuinely missing data. Property descriptions use CERTAIN/SITUATE/MEASURING/AS WILL MORE FULLY APPEAR/WHICH PROPERTY/SUBJECT TO format. Amounts in figures AND words.`,
    deed_of_sale: `You are an expert Botswana property conveyancing attorney. Generate a COMPLETE, legally binding Deed of Sale and Transfer Agreement (minimum 3000 words). Use proper legal language, numbered clauses. Include all standard Botswana Deed of Sale clauses. Use actual party details from the transaction data.`,
    transfer_duty: `You are an expert Botswana property conveyancing attorney. Generate a complete Transfer Duty Declaration under the Transfer Duty Act (Cap 53:01). Include buyer/seller details, property description, purchase price, applicable rate, and any exemption claims.`,
    power_of_attorney: `You are an expert Botswana property conveyancing attorney. Generate a complete Power of Attorney to Transfer, authorising the conveyancer to appear before the Registrar of Deeds on behalf of the seller.`,
    declaration_of_purchase: `You are an expert Botswana property conveyancing attorney. Generate a complete Declaration of Purchaser in the Botswana Deeds Registry format, matching the exact format used for acceptance.`,
    affidavit: `You are an expert Botswana property conveyancing attorney. Generate a complete Affidavit supporting the property transaction, sworn before a Commissioner of Oaths.`,
    bond_registration: `You are an expert Botswana property conveyancing attorney. Generate a complete Mortgage Bond Registration document for the property.`,
    missing_information: `You are an expert Botswana property conveyancing attorney. Perform a complete transaction readiness review. List every missing field, flag compliance issues, and provide a prioritised action list.`,
  };

  const instructions = (docInstructions[documentType] || docInstructions.deed_of_sale) + '\n\n' + BOTSWANA_RULES;

  const prompt = documentType === 'deed_of_transfer'
    ? `Generate a complete Deed of Transfer for registration at the Botswana Deeds Registry:\n${transactionBlock}\n\nFollow the standard Botswana Deeds Registry format exactly. Include: cover page, DEED OF TRANSFER body with CERTAIN/SITUATE/MEASURING/AS WILL MORE FULLY APPEAR/WHICH PROPERTY/SUBJECT TO clauses, the 6 standard State Grant conditions, WHEREFORE clause, execution block, POWER OF ATTORNEY TO GIVE TRANSFER, DECLARATION OF PURCHASER, DECLARATION OF SELLER, and AFFIDAVIT OF BIRTH for both parties.`
    : `Generate a complete ${(docInstructions[documentType] ? documentType : 'deed_of_sale').replace(/_/g, ' ')} for the following Botswana property transaction:\n${transactionBlock}`;

  try {
    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: instructions },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 16000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
        return res.end();
      }

      const reader = response.body;
      let buffer = '';
      reader.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) res.write(line + '\n\n');
        }
      });
      reader.on('end', () => { res.write('data: [DONE]\n\n'); res.end(); });
      reader.on('error', () => res.end());
    } else {
      const text = await callOpenAI(apiKey, instructions, prompt, { temperature: 0.1, model: 'gpt-4o', max_tokens: 16000 });
      res.json({ document: text || 'Failed to generate document' });
    }
  } catch (error) {
    console.error('Error generating document:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate document', details: error.message });
  }
});

// Analyze uploaded deed via pdf-parse + AI
app.post('/api/analyze-deed', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No AI API key configured on server' });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let extractedText = '';

    // Try to extract text from PDF using pdf-parse
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = (pdfData.text || '').trim();
      } catch (err) {
        console.warn('pdf-parse failed:', err.message);
      }
    }

    // Scanned / image-based PDF — no extractable text — accept for manual review
    if (!extractedText || extractedText.length < 50) {
      return res.json({
        isValid: true,
        landType: 'Pending Review',
        hasCaveats: false,
        hasBonds: false,
        hasSubdivisions: false,
        ownerName: 'Unknown',
        ownerIdNumber: 'Unknown',
        previousOwnerName: 'Unknown',
        plotNumber: 'Unknown',
        propertyAddress: 'Unknown',
        propertyDescription: 'Unknown',
        administrativeDistrict: 'Unknown',
        extent: 'Unknown',
        titleDeedNumber: 'Unknown',
        purchasePrice: 'Unknown',
        hasMortgageBond: false,
        mortgageBondNumber: 'Unknown',
        errors: [],
        scannedDocument: true,
      });
    }

    const instructions = `You are a Botswana property title deed analyst. Analyze the provided document text and return a JSON object with these fields:
- isValid (boolean): whether this appears to be a valid title deed
- landType (string): one of "Urban Residential", "Tribal Land", "Communal Land", "Commercial", "State Land", or "Unknown"
- hasCaveats (boolean): whether caveats/restrictions are detected
- hasBonds (boolean): whether existing bonds/mortgages are detected
- hasSubdivisions (boolean): whether subdivision mentions are found
- ownerName (string): full registered owner name extracted from the deed, or "Unknown"
- ownerIdNumber (string): ID/passport number of the registered owner extracted from the deed, or "Unknown"
- previousOwnerName (string): name of the previous owner (the seller in the last transfer) if visible, or "Unknown"
- plotNumber (string): plot/erf/stand number extracted from the deed, or "Unknown"
- propertyAddress (string): full property address or location description, or "Unknown"
- propertyDescription (string): legal description of property (e.g. "Certain piece of land situate..."), or "Unknown"
- administrativeDistrict (string): district or town the property is in, or "Unknown"
- extent (string): size/extent of the property (e.g. "450 square metres"), or "Unknown"
- titleDeedNumber (string): certificate of registered title number or deed number, or "Unknown"
- purchasePrice (string): purchase price stated in the deed, or "Unknown"
- hasMortgageBond (boolean): whether a mortgage bond is registered against the property
- mortgageBondNumber (string): mortgage bond number if registered, or "Unknown"
- errors (array of strings): any issues found with the document

Return ONLY valid JSON, no markdown or explanation.`;

    const input = `Analyze this title deed document:\n\n${extractedText.substring(0, 8000)}`;

    const content = await callOpenAI(apiKey, instructions, input, { temperature: 0.1 });

    try {
      // Try to parse JSON from response (strip markdown fences if present)
      const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanJson);
      res.json(analysis);
    } catch {
      // If GPT response isn't valid JSON, return a structured fallback
      res.json({
        isValid: true,
        landType: 'Unknown',
        hasCaveats: false,
        hasBonds: false,
        hasSubdivisions: false,
        ownerName: 'Unknown',
        plotNumber: 'Unknown',
        errors: [],
        rawAnalysis: content,
      });
    }
  } catch (error) {
    console.error('Error analyzing deed:', error);
    res.status(error.status || 500).json({ error: 'Failed to analyze deed', details: error.message });
  }
});

// Analyze ID / Passport / identity document via pdf-parse + AI
app.post('/api/analyze-id', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No AI API key configured on server' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let extractedText = '';
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = (pdfData.text || '').trim();
      } catch (err) {
        console.warn('pdf-parse failed for ID doc:', err.message);
      }
    }
    // Scanned document — return empty result gracefully
    if (!extractedText || extractedText.length < 30) {
      return res.json({ fullName: 'Unknown', idNumber: 'Unknown', dateOfBirth: 'Unknown', nationality: 'Unknown', gender: 'unknown', expiryDate: 'Unknown', documentType: 'Unknown', scannedDocument: true });
    }

    const instructions = `You are an identity document analyst. Extract data from the provided document text (ID card, passport, or similar) and return a JSON object with:
- fullName (string): full legal name on the document, or "Unknown"
- idNumber (string): ID number, passport number, or national registration number, or "Unknown"
- dateOfBirth (string): date of birth in format YYYY-MM-DD, or "Unknown"
- nationality (string): nationality listed, or "Unknown"
- gender (string): "male", "female", or "unknown"
- expiryDate (string): document expiry date if present, or "Unknown"
- documentType (string): "National ID", "Passport", "Residence Permit", or "Unknown"

Return ONLY valid JSON, no markdown or explanation.`;

    const content = await callOpenAI(apiKey, instructions, `Analyze this identity document:\n\n${extractedText.substring(0, 4000)}`, { temperature: 0.1 });

    try {
      const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      res.json(JSON.parse(cleanJson));
    } catch {
      res.json({ fullName: 'Unknown', idNumber: 'Unknown', dateOfBirth: 'Unknown', nationality: 'Unknown', gender: 'unknown', expiryDate: 'Unknown', documentType: 'Unknown' });
    }
  } catch (error) {
    console.error('Error analyzing ID:', error);
    res.status(error.status || 500).json({ error: 'Failed to analyze document', details: error.message });
  }
});

// Analyze document quality via OpenAI Responses API
app.post('/api/analyze-document', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured on server' });

  const { fileName, fileType, fileSize, docType } = req.body;

  try {
    const instructions = 'You are a document compliance analyst for property conveyancing in Botswana. Analyze document metadata and provide quality assessment. Always respond with valid JSON only.';

    const input = `Analyze this document submission for a property conveyancing transaction:
File Name: ${fileName}
File Type: ${fileType}
File Size: ${fileSize} bytes
Document Category: ${docType || 'General'}

Based on the file metadata, provide a JSON response with:
- quality: "good", "medium", or "poor"
- reason: brief explanation
- suggestions: array of improvement suggestions`;

    const content = await callOpenAI(apiKey, instructions, input, { temperature: 0.3 });

    try {
      const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanJson);
      res.json(analysis);
    } catch {
      res.json({ quality: 'good', reason: 'Document received successfully', suggestions: [] });
    }
  } catch (error) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ quality: 'good', reason: 'Analysis unavailable', suggestions: [] });
  }
});

// Send share link to other party via email
app.post('/api/send-share-link', async (req, res) => {
  const { email, link, transactionId, transactionType, hasPricing } = req.body;
  if (!email || !link) return res.status(400).json({ error: 'email and link are required' });

  // Log the share action
  console.log(`Share link requested: ${email} for transaction ${transactionId} (${transactionType})`);

  // If Resend API key is configured, send a real email
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Minchin & Kelly <noreply@minchinandkelly.co.bw>',
          to: [email],
          subject: `You've been invited to a property transaction on Minchin & Kelly`,
          html: `
            <h2>Property Transaction Invitation</h2>
            <p>You have been invited to participate in a property ${transactionType} transaction${hasPricing ? ' with pricing details included' : ''}.</p>
            <p>Transaction ID: <strong>${transactionId}</strong></p>
            <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0B1F3A;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Start Your Transaction</a></p>
            <p style="color:#666;font-size:12px;margin-top:24px;">Minchin & Kelly — Botswana Property Conveyancing</p>
          `,
        }),
      });

      if (response.ok) {
        return res.json({ success: true, message: `Email sent to ${email}` });
      }
      const errorData = await response.json().catch(() => ({}));
      console.warn('Resend API error:', errorData);
      return res.json({ success: true, message: 'Link generated (email delivery pending)', fallback: true });
    } catch (err) {
      console.warn('Email send failed:', err.message);
      return res.json({ success: true, message: 'Link generated (email service unavailable)', fallback: true });
    }
  }

  // No email service configured — return success with the link
  res.json({ success: true, message: 'Share link generated successfully (no email service configured)', link });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
