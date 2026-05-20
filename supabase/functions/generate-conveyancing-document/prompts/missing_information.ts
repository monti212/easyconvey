import type { DocumentConfig } from "./deed_of_sale.ts";

export function getMissingInformationConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney performing a thorough readiness review of a property transfer transaction. Your task is to generate a comprehensive MISSING INFORMATION & OUTSTANDING DOCUMENTS CHECKLIST.

CRITICAL INSTRUCTIONS:
- Review ALL submitted transaction data carefully
- Identify every field that is "Not specified", "To be verified", "Pending", empty, or clearly incomplete
- Apply the Botswana conveyancing business rules (provided below) to determine what documents SHOULD exist based on the party's nationality, marital status, entity type, and transaction type
- Compare required documents against uploaded documents to flag what's missing
- For each missing item, state WHERE to obtain it (which source document or authority)
- Flag compliance issues, exemption eligibility, and potential blockers
- Be thorough — a missed item could delay or block the transfer at the Deeds Registry

DOCUMENT ANALYSIS:
- If document images are attached, analyze them and note what information WAS successfully extracted
- Highlight any data conflicts between form data and document-extracted data
- Note documents that appear to be poor quality or partially illegible`,

    prompt: `Perform a complete transaction readiness review for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
GENERATE THE FOLLOWING CHECKLIST:
═══════════════════════════════════════

# TRANSACTION READINESS CHECKLIST

Reference
[Transaction ID]

Date of Review
[Today's date]

Status
[READY FOR TRANSFER / ITEMS OUTSTANDING / CRITICAL ITEMS MISSING]

---

## 1. PARTY INFORMATION STATUS

### Buyer/Purchaser
Review each field and mark as ✅ Complete, ⚠️ Incomplete, or ❌ Missing:
- Full Legal Name
- Date of Birth
- ID Number / Passport Number
- Physical Address (note: must come from Title Deed or Proof of Address, NOT from ID)
- Postal Address
- Contact Phone
- Contact Email
- Nationality (and whether citizen or non-citizen rates apply)
- Marital Status (and whether spouse details are complete if married)
- Entity Type (individual/company/trust/estate/society)
- First-Time Buyer Status (if citizen — affects transfer duty exemption)

### Seller/Transferor
Same fields as above, plus:
- Registered owner name (must match Title Deed exactly)

---

## 2. PROPERTY INFORMATION STATUS
- Property Description (CERTAIN/SITUATE/MEASURING) — from Title Deed
- Certificate of Registered Title number and date
- Administrative District
- Extent/Size
- Existing bonds, mortgages, or encumbrances
- Caveats or interdicts
- Purchase Price (figures and words)
- Valuation Amount (if applicable)

---

## 3. REQUIRED DOCUMENTS CHECKLIST

Based on the party details provided, list ALL documents that SHOULD be on file. For each:
- State whether it has been uploaded ✅ or is outstanding ❌
- Note where to obtain it if missing

### Buyer Documents Required:
[List based on nationality + marital status + entity type rules]

### Seller Documents Required:
[List based on nationality + marital status + entity type rules]

### Transaction Documents Required:
- Title Deed ✅/❌
- Sale Agreement / Offer to Purchase ✅/❌
- Rates Clearance Certificate ✅/❌
- Transfer Duty Declaration ✅/❌
- Bond Cancellation documents (if applicable) ✅/❌
- Land Board Consent (if tribal land) ✅/❌
- Valuation Report (if applicable) ✅/❌

---

## 4. COMPLIANCE FLAGS

### Transfer Duty
- Applicable rate: [Citizen/Non-citizen rates]
- First-time buyer exemption: [Eligible/Not eligible/Not applicable]
- Estimated transfer duty: [Calculate based on purchase price and applicable rates]

### Regulatory Compliance
- Financial Intelligence Act (AML/KYC): [Status]
- BURS Tax Clearance: [Required/Not required]
- Land Board Consent: [Required/Not required]
- Municipal Compliance: [Status]

### Potential Issues
- [Flag any data conflicts, missing consents, unresolved bonds, etc.]

---

## 5. RECOMMENDED NEXT STEPS

Prioritised list of actions the conveyancer should take, ordered by urgency:
1. [Most critical missing item]
2. [Next priority]
...

---

## 6. SUMMARY

| Category | Complete | Outstanding | Critical |
|----------|----------|-------------|----------|
| Buyer Info | X/Y | X items | X items |
| Seller Info | X/Y | X items | X items |
| Documents | X/Y | X items | X items |
| Compliance | X/Y | X items | X items |

**Overall Readiness: [X]% — [READY / NOT READY]**

---

CRITICAL REMINDERS:
- Be specific about WHERE to obtain each missing document or piece of information
- Calculate transfer duty based on actual purchase price and applicable rates
- If the buyer is a first-time Botswana citizen buyer, explicitly note the exemption
- If married, check that ALL spouse-related documents are present
- If entity (company/trust/estate), check entity-specific documents
- Physical addresses come from Title Deeds or Proof of Address documents — NOT from ID cards or passports
- Flag if the registered owner on the Title Deed doesn't match the seller's name provided`,
  };
}
