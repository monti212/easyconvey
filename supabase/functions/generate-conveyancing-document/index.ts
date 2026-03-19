import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Image extensions that OpenAI vision API can process
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("UHURU_API_KEY");
    const model = Deno.env.get("U35_model") || "gpt-5.2";
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured", details: "UHURU_API_KEY secret is not set in Supabase Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      transactionId,
      documentType = 'deed_of_sale',
      propertyPrice,
      buyerDetails,
      sellerDetails,
      buyerName,
      sellerName,
      documentPaths,
      documentImages,
      stream: wantStream,
    } = await req.json();

    // ─── Fetch document URLs from Supabase Storage ───────────────────
    const imageUrls: string[] = [];
    const pdfDocNames: string[] = [];

    // Add base64 data URLs directly (bypasses storage — most reliable)
    if (documentImages && documentImages.length > 0) {
      for (const img of documentImages) {
        if (img.dataUrl && img.dataUrl.startsWith('data:image/')) {
          imageUrls.push(img.dataUrl);
        }
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey && documentPaths && documentPaths.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      for (const docPath of documentPaths) {
        const path: string = docPath.path || docPath;
        const bucket: string = docPath.bucket || "documents";

        try {
          // Generate a signed URL (valid for 1 hour)
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);

          if (error || !data?.signedUrl) continue;

          if (isImageFile(path)) {
            imageUrls.push(data.signedUrl);
          } else {
            // Track PDF/other docs by name
            const filename = path.split("/").pop() || path;
            pdfDocNames.push(filename);
          }
        } catch {
          // Skip files that can't be accessed
        }
      }
    }

    // ─── Resolve buyer/seller names from various data shapes ─────────
    const resolveBuyerName = () => {
      if (buyerDetails?.clientName) return buyerDetails.clientName;
      if (buyerDetails?.hasAgent && buyerDetails?.agentName) return buyerDetails.agentName;
      if (buyerDetails?.companyName) return buyerDetails.companyName;
      if (buyerDetails?.trustName) return buyerDetails.trustName;
      if (buyerDetails?.deceasedName) return buyerDetails.deceasedName;
      if (buyerDetails?.societyName) return buyerDetails.societyName;
      return buyerName || "Not specified";
    };

    const resolveSellerName = () => {
      if (sellerDetails?.clientName) return sellerDetails.clientName;
      if (sellerDetails?.hasAgent && sellerDetails?.agentName) return sellerDetails.agentName;
      if (sellerDetails?.companyName) return sellerDetails.companyName;
      if (sellerDetails?.trustName) return sellerDetails.trustName;
      return sellerName || "Not specified";
    };

    // ─── Transaction details block (shared across all document types) ──
    const transactionBlock = `
TRANSACTION REFERENCE: ${transactionId}

═══════════════════════════════════════
BUYER (PURCHASER) INFORMATION:
═══════════════════════════════════════
Full Name: ${resolveBuyerName()}
Entity Type: ${buyerDetails?.entityType || "Individual"}
Gender: ${buyerDetails?.gender || "Not specified"}
Nationality: ${buyerDetails?.nationality || "Motswana"}
Marital Status: ${buyerDetails?.maritalStatus || "Not specified"}
ID Number: ${buyerDetails?.idNumber || buyerDetails?.agentIdPassport || "To be verified"}
Contact Phone: ${buyerDetails?.phone || buyerDetails?.agentContact || "On file"}
Contact Email: ${buyerDetails?.email || buyerDetails?.agentEmail || "On file"}
First-time Buyer: ${buyerDetails?.isFirstTimeBuyer ? "Yes" : "No"}
${buyerDetails?.companyName ? `Company Name: ${buyerDetails.companyName}\nRegistration No: ${buyerDetails.registrationNumber || "Not specified"}` : ""}
${buyerDetails?.trustName ? `Trust Name: ${buyerDetails.trustName}\nTrust No: ${buyerDetails.trustNumber || "Not specified"}` : ""}
${buyerDetails?.hasBond !== undefined ? `Bond on Property: ${buyerDetails.hasBond ? "Yes" : "No"}` : ""}

${buyerDetails?.hasAgent ? `BUYER'S ESTATE AGENT:
Agent Name: ${buyerDetails.agentName || "Not specified"}
Agency: ${buyerDetails.agentCompany || "Not specified"}
Agent Contact: ${buyerDetails.agentContact || "Not specified"}
Agent Email: ${buyerDetails.agentEmail || "Not specified"}
Agent ID/Passport: ${buyerDetails.agentIdPassport || "Not specified"}
Registration No: ${buyerDetails.agentRegNumber || "Not specified"}
Tax ID: ${buyerDetails.agentTaxId || "Not specified"}
Commission: ${buyerDetails.commissionValue || "Not specified"}% (${buyerDetails.commissionType || "percentage"})
` : "No estate agent involved on buyer side."}

═══════════════════════════════════════
SELLER (TRANSFEROR) INFORMATION:
═══════════════════════════════════════
Full Name: ${resolveSellerName()}
Entity Type: ${sellerDetails?.entityType || "Individual"}
Gender: ${sellerDetails?.gender || "Not specified"}
Nationality: ${sellerDetails?.nationality || "Motswana"}
Marital Status: ${sellerDetails?.maritalStatus || "Not specified"}
ID Number: ${sellerDetails?.idNumber || sellerDetails?.agentIdPassport || "To be verified"}

═══════════════════════════════════════
PROPERTY & FINANCIAL DETAILS:
═══════════════════════════════════════
Property Price: ${propertyPrice || "Not specified"}
Valuation Amount: ${buyerDetails?.valuationAmount ? `P ${parseInt(buyerDetails.valuationAmount).toLocaleString()}` : "Not specified"}

DOCUMENTS ON FILE:
Buyer Documents: ${buyerDetails?.uploadedDocuments?.join(", ") || "Pending"}
Seller Documents: ${sellerDetails?.uploadedDocuments?.join(", ") || "Pending"}
${pdfDocNames.length > 0 ? `PDF Documents Available: ${pdfDocNames.join(", ")}` : ""}
${imageUrls.length > 0 ? `
═══════════════════════════════════════
ATTACHED DOCUMENT IMAGES (${imageUrls.length} document(s)):
═══════════════════════════════════════
CRITICAL: The attached images are scans/photos of actual legal documents (IDs, title deeds, passports, marriage certificates, etc.).
You MUST carefully analyze each image and extract ALL relevant information including but not limited to:
- Full legal names of all parties (buyer, seller, spouse, witnesses)
- ID numbers, passport numbers, date of birth
- Physical and postal addresses
- Property description: lot number, plot number, location, extent/size, district
- Title deed reference numbers
- Land board details, tribal territory
- Any existing bonds, mortgages, encumbrances, or caveats
- Servitudes or conditions of title
- Municipal/council reference numbers
- Marriage certificate details (date, place, regime)
- Any other legally relevant details visible in the documents

Use the extracted information to populate the generated document with REAL data instead of placeholders.
Where information from uploaded documents conflicts with form data, prefer the document-extracted data as it is from the primary source.` : ""}`;

    // ─── Document type specific instructions and prompts ──────────────
    const documentConfigs: Record<string, { instructions: string; prompt: string }> = {
      deed_of_sale: {
        instructions: `You are an expert Botswana property conveyancing attorney generating a legally binding Deed of Sale and Transfer Agreement.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, COMPREHENSIVE, LEGALLY BINDING conveyancing agreement — NOT a summary or template
- Use proper legal language, numbered clauses, sub-clauses, and formal legal structure
- This must be suitable for actual use in a Botswana property transaction
- Include ALL standard clauses expected in a Botswana Deed of Sale
- Format using Markdown: use # for title, ## for parts, ### for sections, **bold** for defined terms, numbered lists for clauses
- The document should be at minimum 3000 words covering every aspect of the transaction
- Use the actual party details provided — do NOT use placeholder names
- Reference the Deeds Registry Act (Cap 33:02), Transfer Duty Act (Cap 53:01), and Tribal Land Act where applicable

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached (ID documents, title deeds, passports, marriage certificates, etc.), you MUST extract all information from them
- Extract full legal names, ID/passport numbers, dates of birth, addresses, property descriptions, lot numbers, title deed references, and any other relevant details
- The uploaded documents are the PRIMARY source of truth — use extracted data to fill in party names, ID numbers, property descriptions, and all other details
- Where the form data says "Not specified" or "To be verified", look for the answer in the attached documents
- Never leave a field as "Not specified" if the information can be found in an attached document`,
        prompt: `Generate a complete Deed of Sale and Transfer Agreement for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED AGREEMENT STRUCTURE:
═══════════════════════════════════════

Generate the FULL agreement with these parts:

# DEED OF SALE AND TRANSFER AGREEMENT

## PART A — PRELIMINARY
1. Date of Agreement
2. Definitions and Interpretation (define Purchase Price, Property, Transfer Date, Effective Date, Business Day, Conveyancer, etc.)
3. Parties to the Agreement (full details of Buyer and Seller)

## PART B — SALE AGREEMENT
4. Sale of Property (description, what is included — fixtures, improvements)
5. Purchase Price and Payment Terms (amount, deposit if any, balance, method of payment, trust account details)
6. Conditions Precedent (bond approval if applicable, compliance certificates)
7. Transfer Duty and Costs (who bears what — Transfer Duty Act Cap 53:01 obligations)
8. Risk and Insurance (when risk passes to buyer, insurance obligations)
9. Occupational Rent (if buyer occupies before transfer, or seller remains after)

## PART C — TRANSFER PROVISIONS
10. Transfer Process (Deeds Registry Act Cap 33:02 compliance, conveyancer appointment)
11. Title Deed and Ownership Warranty (seller warrants clear title, no encumbrances)
12. Existing Bonds and Encumbrances (cancellation of existing bonds)
13. Municipal/Council Compliance (rates clearance, building regulations)
14. Property Inspection and Condition (voetstoots clause — as-is, defect disclosure)

## PART D — OBLIGATIONS AND WARRANTIES
15. Seller's Warranties (ownership, no pending litigation, no undisclosed defects, tax compliance)
16. Buyer's Warranties (financial capacity, legal capacity)
17. Anti-Money Laundering Compliance (Financial Intelligence Act obligations)
18. Environmental Compliance (Environmental Assessment Act if applicable)

## PART E — DEFAULT AND REMEDIES
19. Breach and Remedies (material breach definition, cure period, penalties)
20. Cancellation Rights (conditions for cancellation, consequences)
21. Penalty and Forfeiture (deposit forfeiture, rouwkoop — cancellation penalty)
22. Force Majeure

## PART F — GENERAL PROVISIONS
23. Dispute Resolution (mediation, arbitration, jurisdiction — High Court of Botswana)
24. Notices and Communication (formal notice requirements, addresses)
25. Entire Agreement and Amendments (no verbal amendments, variation clause)
26. Governing Law (Laws of Botswana)
27. Severability
28. Costs (each party's legal costs)
29. Cession and Assignment
30. Confidentiality

## PART G — EXECUTION
31. Signature Blocks for Buyer, Seller, and Witnesses
32. Conveyancer's Certificate

Generate the COMPLETE text for every single clause with proper legal language. This is NOT a template — fill in all actual details from the transaction data provided.`,
      },

      transfer_duty: {
        instructions: `You are an expert Botswana property conveyancing attorney generating a Transfer Duty Declaration under the Transfer Duty Act (Cap 53:01).

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, legally binding Transfer Duty Declaration form
- Include all required statutory declarations per the Transfer Duty Act (Cap 53:01)
- Use proper legal language and formal structure
- Format using Markdown: use # for title, ## for sections, **bold** for defined terms
- The document should comprehensively cover all transfer duty obligations
- Use actual party details provided — do NOT use placeholder names
- Include calculation of applicable transfer duty rates
- Reference exemptions where applicable (e.g., first-time buyer exemptions, citizen rates vs non-citizen rates)

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information (names, ID numbers, property descriptions, lot numbers, addresses)
- Uploaded documents are the PRIMARY source of truth — use extracted data over form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document`,
        prompt: `Generate a complete Transfer Duty Declaration for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE:
═══════════════════════════════════════

# TRANSFER DUTY DECLARATION

## 1. DECLARANT INFORMATION
- Full legal name, ID number, capacity (buyer/authorised representative)

## 2. TRANSACTION DETAILS
- Nature of transaction (sale, donation, exchange, etc.)
- Date of agreement
- Transaction reference number

## 3. PROPERTY DESCRIPTION
- Full property description (lot number, location, extent)
- Title deed reference
- Land board/district

## 4. CONSIDERATION AND VALUATION
- Purchase price / consideration
- Fair market valuation
- Declared value for transfer duty purposes
- Basis of valuation

## 5. TRANSFER DUTY CALCULATION
- Applicable rate schedule per Transfer Duty Act (Cap 53:01)
- Citizen vs non-citizen rates
- Calculation breakdown
- Any applicable exemptions (first-time buyer, government transfer, etc.)
- Total transfer duty payable

## 6. EXEMPTION CLAIMS (if applicable)
- Statutory basis for exemption
- Supporting documentation referenced

## 7. DECLARATIONS
- Declaration that information is true and correct
- Declaration of relationship between parties (if any)
- Declaration of no other consideration
- Penalty provisions for false declarations

## 8. UNDERTAKINGS
- Undertaking to pay transfer duty before registration
- Undertaking to provide additional information if required

## 9. SIGNATURES
- Declarant signature block
- Commissioner of Oaths / Notary Public attestation
- Conveyancer's certification

Generate the COMPLETE text with proper legal language. Use the actual transaction details provided.`,
      },

      power_of_attorney: {
        instructions: `You are an expert Botswana property conveyancing attorney generating a Power of Attorney for a property transfer transaction.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, legally binding Power of Attorney document
- Use proper legal language suitable for registration at the Deeds Registry
- Format using Markdown: use # for title, ## for sections, **bold** for defined terms
- The document must comply with Botswana law and Deeds Registry requirements
- Use actual party details provided — do NOT use placeholder names
- Include specific powers related to property transfer, signing of documents, and dealings with the Deeds Registry
- Reference the Deeds Registry Act (Cap 33:02) where applicable

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information (names, ID numbers, property descriptions, addresses)
- Uploaded documents are the PRIMARY source of truth — use extracted data over form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document`,
        prompt: `Generate a complete Power of Attorney for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE:
═══════════════════════════════════════

# POWER OF ATTORNEY

## 1. PRINCIPAL (GRANTOR)
- Full legal name, ID number, address, capacity
- Statement of legal capacity to grant power

## 2. ATTORNEY (AGENT)
- Full legal name, ID number, address
- Capacity and qualifications (if conveyancer)

## 3. RECITALS
- Background to the transaction
- Reason for granting power of attorney
- Reference to the underlying sale agreement

## 4. GRANT OF POWER
- Specific powers granted:
  a. To sign the Deed of Transfer
  b. To appear before the Registrar of Deeds
  c. To sign all documents necessary for transfer
  d. To attend to transfer duty payments
  e. To obtain rates clearance certificates
  f. To receive and give receipts
  g. To handle bond cancellation/registration documents
  h. To do all things necessary to effect transfer

## 5. CONDITIONS AND LIMITATIONS
- Scope limitations
- Duration / expiry
- Revocation provisions
- Whether power survives incapacity

## 6. RATIFICATION
- Ratification of all acts done under this power
- Indemnity provisions

## 7. GOVERNING LAW
- Laws of Botswana
- Deeds Registry Act compliance

## 8. EXECUTION
- Principal's signature (before witnesses)
- Two witnesses' signatures
- Commissioner of Oaths / Notary Public attestation
- Date and place of execution

Generate the COMPLETE text with proper legal language. Use actual transaction details provided.`,
      },

      affidavit: {
        instructions: `You are an expert Botswana property conveyancing attorney generating a sworn Affidavit supporting a property transaction.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, legally binding Affidavit
- Use proper legal language and sworn statement format
- Format using Markdown: use # for title, ## for sections, **bold** for defined terms
- The affidavit must comply with Botswana law
- Use actual party details provided — do NOT use placeholder names
- Include all material facts relevant to the property transaction
- Reference applicable legislation where relevant

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information (names, ID numbers, property descriptions, addresses)
- Uploaded documents are the PRIMARY source of truth — use extracted data over form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document`,
        prompt: `Generate a complete Affidavit for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE:
═══════════════════════════════════════

# AFFIDAVIT

## HEADING
- In the matter of the property transfer between [Buyer] and [Seller]
- Reference to transaction number

## 1. DEPONENT INFORMATION
- Full name, ID number, address, occupation
- Statement of capacity (buyer, seller, or conveyancer)

## 2. OATH / AFFIRMATION
- Formal sworn statement preamble

## 3. FACTUAL DECLARATIONS
- Identity and personal details of deponent
- Nature of the transaction
- Property description and details
- Purchase price and payment arrangements
- Marital status declarations (community of property implications)
- Citizenship and residency status
- First-time buyer status (if applicable)
- Source of funds declaration
- No pending litigation affecting the property
- No undisclosed defects or encumbrances
- Compliance with Financial Intelligence Act (anti-money laundering)
- Tax compliance status
- That all information provided is true and correct

## 4. PROPERTY SPECIFIC DECLARATIONS
- Confirmation of property inspection
- Awareness of property condition
- Any servitudes or restrictions
- Municipal compliance status

## 5. DECLARATION OF TRUTH
- Statement that contents are true and correct
- Acknowledgment of penalties for false declaration
- That deponent understands the contents

## 6. EXECUTION
- Deponent signature
- Date and place
- Commissioner of Oaths attestation
- Commissioner's stamp and designation
- Full name and address of Commissioner

Generate the COMPLETE text with proper legal language. Use actual transaction details provided.`,
      },

      bond_registration: {
        instructions: `You are an expert Botswana property conveyancing attorney generating a Mortgage Bond Registration document.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, legally binding Mortgage Bond document for registration at the Deeds Registry
- Use proper legal language suitable for the Deeds Registry
- Format using Markdown: use # for title, ## for sections, **bold** for defined terms
- The document must comply with the Deeds Registry Act (Cap 33:02) and Banking Act
- Use actual party details provided — do NOT use placeholder names
- Include standard mortgage bond clauses used in Botswana conveyancing

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information (names, ID numbers, property descriptions, addresses)
- Uploaded documents are the PRIMARY source of truth — use extracted data over form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document`,
        prompt: `Generate a complete Mortgage Bond Registration document for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE:
═══════════════════════════════════════

# MORTGAGE BOND

## 1. PARTIES
- **Mortgagor** (Borrower/Property Owner): Full details
- **Mortgagee** (Lender/Financial Institution): Full details

## 2. RECITALS
- Grant of loan by Mortgagee to Mortgagor
- Purpose of the bond (security for loan)
- Property description
- Reference to underlying sale transaction

## 3. BOND AMOUNT
- Capital amount of the bond
- Currency
- Interest rate and basis of calculation

## 4. PROPERTY DESCRIPTION
- Full legal description of the property
- Title deed reference
- Extent and situation
- Land board/district

## 5. TERMS AND CONDITIONS
### 5.1 Repayment
- Monthly instalments
- Repayment period
- Due dates

### 5.2 Interest
- Rate (fixed/variable)
- Calculation method
- Default interest rate

### 5.3 Insurance
- Property insurance obligations
- Life/credit insurance requirements

### 5.4 Maintenance and Use
- Property maintenance obligations
- Restrictions on use
- No alterations without consent

### 5.5 Rates and Taxes
- Obligation to keep rates and taxes current

## 6. DEFAULT PROVISIONS
- Events of default
- Notice requirements
- Acceleration clause
- Power of sale (parate executie)
- Right to take possession

## 7. ADDITIONAL SECURITY
- Cession of insurance policies
- Suretyship (if applicable)
- Life policy cession

## 8. GENERAL PROVISIONS
- No further encumbrances without consent
- Variation and amendment provisions
- Severability
- Governing law (Laws of Botswana)
- Jurisdiction (High Court of Botswana)
- Costs (for whose account)

## 9. SPECIAL CONDITIONS
- Any conditions specific to this transaction

## 10. EXECUTION
- Mortgagor signature block (before witnesses)
- Two witnesses
- Conveyancer's certificate for registration
- Date and place of execution

Generate the COMPLETE text with proper legal language. Use actual transaction details provided.`,
      },

      compliance_certificate: {
        instructions: `You are an expert Botswana property conveyancing attorney generating a Compliance Certificate for a property transfer.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Compliance Certificate covering all regulatory requirements for property transfer in Botswana
- Use proper legal language and formal certificate format
- Format using Markdown: use # for title, ## for sections, **bold** for defined terms
- Reference all applicable legislation and regulations
- Use actual party details provided — do NOT use placeholder names
- Cover municipal, environmental, building, and regulatory compliance

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information (names, ID numbers, property descriptions, addresses)
- Uploaded documents are the PRIMARY source of truth — use extracted data over form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document`,
        prompt: `Generate a complete Compliance Certificate for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE:
═══════════════════════════════════════

# COMPLIANCE CERTIFICATE

## 1. CERTIFICATE DETAILS
- Certificate reference number
- Date of issue
- Transaction reference
- Property description

## 2. PARTIES
- Seller/Transferor details
- Buyer/Transferee details
- Conveyancer details

## 3. MUNICIPAL / COUNCIL COMPLIANCE
- Rates and taxes clearance status
- Outstanding amounts (if any)
- Municipal account reference
- Service charges status (water, electricity, sewerage)
- Confirmation of clearance certificate obtained or to be obtained

## 4. BUILDING AND PLANNING COMPLIANCE
- Building plans approval status
- Any unauthorised structures
- Zoning compliance
- Town and Country Planning Act compliance
- Building Control Act compliance

## 5. ENVIRONMENTAL COMPLIANCE
- Environmental Assessment Act compliance
- Environmental impact assessment status (if applicable)
- Waste management compliance
- Any environmental restrictions

## 6. LAND BOARD COMPLIANCE (if tribal land)
- Tribal Land Act compliance
- Land Board consent for transfer
- Tribal authority approval status

## 7. DEEDS REGISTRY COMPLIANCE
- Deeds Registry Act (Cap 33:02) compliance
- Title search confirmation
- No caveats or interdicts registered
- Existing bonds/encumbrances status

## 8. TAX COMPLIANCE
- Transfer Duty Act (Cap 53:01) compliance
- Capital gains tax status
- Income tax clearance (if applicable)
- BURS compliance status

## 9. FINANCIAL INTELLIGENCE COMPLIANCE
- Financial Intelligence Act compliance
- Customer due diligence completed
- Source of funds verified
- No suspicious transaction indicators

## 10. CONVEYANCER'S CERTIFICATION
- Conveyancer's declaration that all compliance requirements have been checked
- List of outstanding items (if any)
- Recommendations
- Professional indemnity confirmation

## 11. EXECUTION
- Conveyancer's signature and stamp
- Practice number
- Date
- Firm details

Generate the COMPLETE text with proper legal language. Use actual transaction details provided.`,
      },
    };

    // ─── Build the instructions ──────────────────────────────────────
    const config = documentConfigs[documentType] || documentConfigs.deed_of_sale;
    const instructions = config.instructions;
    const textPrompt = config.prompt;

    // ─── Build Chat Completions messages array ──────────────────────
    const chatUrl = Deno.env.get("UHURU_API_URL") || "https://api.openai.com/v1/chat/completions";

    // Build user content parts (text + optional images for vision)
    const contentParts: any[] = [
      { type: "text", text: textPrompt },
    ];

    if (imageUrls.length > 0) {
      for (const url of imageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url },
        });
      }
    }

    const messages = [
      { role: "system", content: instructions },
      { role: "user", content: contentParts },
    ];

    // ─── Call API (Chat Completions format) ──────────────────────────
    if (wantStream) {
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.15,
          max_tokens: 32768,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ error: err.error?.message || `API error: ${response.status}`, details: JSON.stringify(err) }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Forward the SSE stream directly
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming: wait for full response
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.15,
        max_tokens: 32768,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err.error?.message || `API error: ${response.status}`, details: JSON.stringify(err) }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const document = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ document }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
