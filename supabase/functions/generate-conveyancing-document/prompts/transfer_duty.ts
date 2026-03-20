import type { DocumentConfig } from "./deed_of_sale.ts";

export function getTransferDutyConfig(transactionBlock: string): DocumentConfig {
  return {
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
  };
}
