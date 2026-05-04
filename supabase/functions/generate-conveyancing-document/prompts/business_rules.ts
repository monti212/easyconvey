/**
 * Shared Botswana conveyancing business rules injected into ALL document prompts.
 * This teaches the AI the process logic, not just document structure.
 */
export const BOTSWANA_CONVEYANCING_RULES = `
═══════════════════════════════════════
BOTSWANA CONVEYANCING BUSINESS RULES
═══════════════════════════════════════

TRANSFER DUTY RATES (Transfer Duty Act, Cap 53:01):
• Botswana Citizens:
  - 0% on the first P1,500,000
  - 5% on the amount exceeding P1,500,000
• Non-Citizens (foreign nationals):
  - 10% on the first P2,000,000 (effective rate on amounts up to P2M)
  - 15% on the amount exceeding P2,000,000 (effective rate on amounts above P2M)
• First-Time Buyer Exemption (Citizens ONLY):
  - Fully exempt from transfer duty under Section 20(1)(f) of the Transfer Duty Act
  - Applies only to Botswana citizens purchasing their first immovable property
  - Must declare first-time buyer status in the Transfer Duty Declaration

WHERE TO FIND SPECIFIC INFORMATION (use the correct source document):
• Physical/Postal Address → Title Deed, Rates Clearance Certificate, or Proof of Address document (NOT from ID card or Passport — these do not contain addresses in Botswana)
• Full Legal Name & Date of Birth → National ID Document (Omang) for citizens, Passport for non-citizens
• ID Number (Omang Number) → National ID Document
• Passport Number → Passport
• Property Description (CERTAIN/SITUATE/MEASURING) → Title Deed / Certificate of Registered Title
• Title Deed Reference Number → Title Deed (e.g., "Certificate of Registered Title No. 3047/2016")
• Lot Number, Farm Name, Extent/Size → Title Deed or Surveyor General diagram
• Administrative District → Title Deed
• Marital Status & Spouse Details → Marriage Certificate
• Spouse Maiden Name → Marriage Certificate or Spouse ID/Passport
• Company Registration Details → Company Registration Certificate from CIPA
• Trust Details → Trust Deed / Letter of Authority
• Estate Details → Letters of Administration or Executorship from the Master of the High Court

REQUIRED DOCUMENTS BY PARTY STATUS:

For Botswana Citizens (Individual):
• Always Required: National ID Document (Omang), Proof of Address
• Single/Unmarried: No additional documents
• Married in Community of Property: + Marriage Certificate, Spouse ID Document, Spouse Consent Form, Form B (Married Persons Property Act)
• Married Out of Community of Property: + Marriage Certificate, Antenuptial Contract, Form A (Married Persons Property Act)
• Divorced: + Divorce Decree / Court Order
• Widowed: + Death Certificate of Spouse

For Non-Citizens (Individual):
• Always Required: Passport Copy, Residence Permit, Proof of Address
• Married in Community of Property: + Marriage Certificate, Spouse Passport/Identity, Spouse Consent Form
• Married Out of Community of Property: + Marriage Certificate, Antenuptial Contract

For Companies (Pty Ltd):
• Company Registration Certificate (CIPA), Directors Resolution authorising the transaction, VAT Certificate (if registered), Certified copies of Director IDs

For Trusts:
• Trust Deed, Letter of Authority from Master of the High Court, Trustee ID documents, Resolution of Trustees

For Deceased Estates:
• Letters of Administration or Executorship, Death Certificate, Estate Number from Master of the High Court, Executor ID

For Societies:
• Society Registration Certificate, Committee Resolution, Committee Member IDs

PROPERTY TRANSFER COMPLIANCE:
• Rates Clearance Certificate — required before transfer; obtain from the local council/municipality
• Bond Cancellation — may be needed where applicable (only if property has an existing bond/mortgage)
• Land Board Consent — may be needed where applicable (only for tribal/customary land under the Tribal Land Act)
• Financial Intelligence Act (AML/KYC) — all transfers must comply
• BURS Tax Clearance — may be needed where applicable depending on transaction value and seller status
• Valuation Report — may be needed where applicable (required when sale price differs materially from market value for transfer duty purposes)
• Letter of Compliance — may be needed where applicable (not issued by conveyancers — issued by the relevant authority)

WORDING RULE FOR OPTIONAL/JURISDICTION-BASED DOCUMENTS:
- Use "may be needed" or "where applicable" for ANY document that is only required in specific circumstances (bond cancellation, Land Board consent, valuation report, letter of compliance, BURS clearance, etc.)
- Use "required" or "must" ONLY for documents that are ALWAYS mandatory in every transaction (e.g. Rates Clearance Certificate, ID documents, Transfer Duty Declaration)
- NEVER write "will be needed" — use "may be needed" or "where applicable" instead

CATCHPHRASE REQUIREMENT (MANDATORY for Botswana Deeds Registry acceptance):
- Every page of a conveyancing document must carry a catchphrase at the bottom — the first word of the next page
- After every major section or logical page break in the document, add a catchphrase line formatted EXACTLY as:
    *[First word of next section/page]*
- Example: if the next section begins with "WHEREFORE", the catchphrase is: *WHEREFORE*
- Example: if the next section begins with "AND", the catchphrase is: *AND*
- Place the catchphrase on its own line, right-aligned, at the bottom of each section before moving to the next
- This applies to ALL conveyancing documents generated by this platform`;
