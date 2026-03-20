import type { DocumentConfig } from "./deed_of_sale.ts";

export function getAffidavitConfig(transactionBlock: string): DocumentConfig {
  return {
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
  };
}
