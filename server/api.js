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

// Helper: call OpenAI Responses API (gpt-5.2)
async function callOpenAI(apiKey, instructions, input, options = {}) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      instructions,
      input,
      ...options,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    error.status = response.status;
    error.details = errorData;
    throw error;
  }

  const data = await response.json();
  return data.output_text || '';
}

// Generate conveyancing document via OpenAI Responses API
app.post('/api/generate-document', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured on server' });

  const { transactionId, propertyPrice, buyerDetails, sellerDetails, buyerName, sellerName } = req.body;
  if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });

  try {
    const instructions = 'You are a legal document generator specializing in property conveyancing documents for Botswana. Generate professional, legally compliant conveyancing documents.';

    const input = `Generate a comprehensive conveyancing document for a property transaction in Botswana with the following details:

Transaction ID: ${transactionId}
Property Price: ${propertyPrice || 'Not specified'}

BUYER INFORMATION:
${buyerDetails ? JSON.stringify(buyerDetails, null, 2) : 'Buyer: ' + (buyerName || 'Not specified')}

SELLER INFORMATION:
${sellerDetails ? JSON.stringify(sellerDetails, null, 2) : 'Seller: ' + (sellerName || 'Not specified')}

Please generate a complete conveyancing document including:
1. Deed of Sale/Transfer
2. All necessary clauses for Botswana property law
3. Buyer and seller obligations
4. Payment terms
5. Transfer conditions
6. Legal warranties
7. Signature blocks

Format it as a professional legal document with proper headings, clauses, and legal language appropriate for Botswana conveyancing.`;

    const generatedText = await callOpenAI(apiKey, instructions, input, { temperature: 0.1 });
    res.json({ document: generatedText || 'Failed to generate document' });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(error.status || 500).json({ error: 'Failed to generate document', details: error.message });
  }
});

// Analyze uploaded deed via pdf-parse + GPT-5.2
app.post('/api/analyze-deed', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let extractedText = '';

    // Try to extract text from PDF using pdf-parse
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text || '';
      } catch (err) {
        console.warn('pdf-parse failed, using filename-based analysis:', err.message);
      }
    }

    // If no text extracted, use file metadata
    if (!extractedText) {
      extractedText = `File: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`;
    }

    const instructions = `You are a Botswana property title deed analyst. Analyze the provided document text and return a JSON object with these fields:
- isValid (boolean): whether this appears to be a valid title deed
- landType (string): one of "Urban Residential", "Tribal Land", "Communal Land", "Commercial", "State Land", or "Unknown"
- hasCaveats (boolean): whether caveats/restrictions are detected
- hasBonds (boolean): whether existing bonds/mortgages are detected
- hasSubdivisions (boolean): whether subdivision mentions are found
- ownerName (string): full registered owner name extracted from the deed, or "Unknown"
- plotNumber (string): plot/erf/stand number extracted from the deed, or "Unknown"
- propertyAddress (string): full property address or location description, or "Unknown"
- propertyDescription (string): legal description of property (e.g. "Certain piece of land situate..."), or "Unknown"
- administrativeDistrict (string): district or town the property is in, or "Unknown"
- extent (string): size/extent of the property (e.g. "450 square metres"), or "Unknown"
- titleDeedNumber (string): certificate of registered title number, or "Unknown"
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

// Analyze ID / Passport / identity document via pdf-parse + GPT
app.post('/api/analyze-id', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let extractedText = '';
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text || '';
      } catch (err) {
        console.warn('pdf-parse failed for ID doc:', err.message);
      }
    }
    if (!extractedText) {
      extractedText = `File: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`;
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
