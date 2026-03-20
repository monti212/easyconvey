import type { DocumentConfig } from "./deed_of_sale.ts";

export function getBondRegistrationConfig(transactionBlock: string): DocumentConfig {
  return {
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
  };
}
