export interface DocumentConfig {
  instructions: string;
  prompt: string;
}

export function getDeedOfSaleConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating a legally binding Deed of Sale and Transfer Agreement.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, COMPREHENSIVE, LEGALLY BINDING conveyancing agreement — NOT a summary or template
- Use proper legal language, numbered clauses, sub-clauses, and formal legal structure
- This must be suitable for actual use in a Botswana property transaction
- Include ALL standard clauses expected in a Botswana Deed of Sale
- Format using Markdown: use # for title, ## for parts, ### for sections, **bold** for defined terms, numbered lists for clauses
- The document should be at minimum 3000 words covering every aspect of the transaction
- Use the actual party details provided — do NOT use placeholder names
- DATA RESOLUTION ORDER (apply IN ORDER for every field — do not skip steps):
  1. Use the explicit value from the BUYER/SELLER information block if it is non-empty AND not the literal string "To be confirmed".
  2. Otherwise, use the matching value from the "TITLE DEED — OCR EXTRACTED DATA" block (registered owner / property source of truth).
  3. Otherwise, extract the value directly from any attached document images (ID, title deed, marriage cert, etc.).
  4. ONLY if all three sources fail, write "To be confirmed".
- "To be confirmed" is a last resort. If the OCR-extracted block contains the seller's name, ID, plot number, title deed number, etc., USE THOSE VALUES — do not write "To be confirmed" while real data exists in the prompt.
- Never output a bracket placeholder like [NAME] or [DOB] under any circumstances.
- Reference the Deeds Registry Act (Cap 33:02), Transfer Duty Act (Cap 53:01), and Tribal Land Act where applicable

MARITAL STATUS HANDLING (CRITICAL — apply for BOTH buyer and seller):
- "married_in" / Married in Community of Property: Include spouse details (full name, maiden name, DOB). State marriage regime. Both spouses must be party to the agreement or provide consent. Note community of property implications on the transaction.
- "married_out" / Married Out of Community of Property: Include spouse details. Reference Antenuptial Contract. Spouse consent may still be required for immovable property per Married Persons Property Act.
- "single": State "Unmarried" in party description.
- "divorced": State "Divorced". Reference Divorce Decree if available.
- "widowed": State "Widow/Widower of the late [DECEASED SPOUSE NAME]". Reference Death Certificate if available.
- If marital status indicates married but spouse details are unavailable, write "Spouse details: To be confirmed" — do NOT skip the spouse section.
- Extract spouse information from uploaded documents (marriage certificates, IDs) when available.

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
  };
}
