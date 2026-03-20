import type { DocumentConfig } from "./deed_of_sale.ts";

export function getComplianceCertificateConfig(transactionBlock: string): DocumentConfig {
  return {
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
  };
}
