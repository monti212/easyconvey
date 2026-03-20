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
• Rates Clearance Certificate must be obtained from the local council/municipality before transfer
• If property has an existing bond/mortgage, a Bond Cancellation must be processed
• For tribal land, Land Board consent is required under the Tribal Land Act
• All transfers must comply with the Financial Intelligence Act (anti-money laundering)
• BURS (Botswana Unified Revenue Service) tax clearance may be required`;
