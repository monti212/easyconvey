import type { DocumentConfig } from "./deed_of_sale.ts";

export function getAffidavitConfig(transactionBlock: string, documentType?: string): DocumentConfig {
  const partyTarget = documentType === 'affidavit_seller' ? 'the SELLER' : documentType === 'affidavit_purchaser' ? 'the PURCHASER' : 'the appropriate party (buyer or seller)';
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating an Affidavit of Birth for a property transaction.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Affidavit of Birth exactly matching the format below.
- Do NOT use markdown section headings (no ### headers). The document flows as continuous prose.
- Use actual party details provided — do NOT use placeholder names.
- DATA RESOLUTION ORDER (apply IN ORDER for every field — do not skip steps):
  1. Use the explicit value from the BUYER/SELLER information block if it is non-empty AND not the literal string "To be confirmed".
  2. Otherwise, use the matching value from the "DOCUMENT OCR EXTRACTED DATA" block.
  3. Otherwise, extract the value directly from any attached document images.
  4. ONLY if all three sources fail, write "OUTSTANDING — [field description]". Never use a bracket placeholder like [NAME].

ENTITY AND MARITAL STATUS HANDLING:
- Determine the Deponent. You MUST generate this affidavit for **${partyTarget}**. Extract the birth details for ${partyTarget}.
- Extract the Deponent's Date of Birth and Place of Birth. If Place of Birth is missing, write "OUTSTANDING — place of birth".
- For Marital Status (Point 3):
  - If "single", you MUST write "BACHELOR" (for men) or "SPINSTER" (for women). Never write "Single".
  - If "married_in", write "Married in community of property".
  - If "married_out", write "Married out of community of property".
  - If "divorced", write "DIVORCEE".
  - If "widowed", write "WIDOW" (for women) or "WIDOWER" (for men).
- Pronoun handling in the attestation clause: use "HE" or "SHE" depending on the Deponent's gender (if known) or "HE/SHE".`,

    prompt: `Generate a complete Affidavit of Birth for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT FORMAT — FOLLOW THIS EXACT STRUCTURE AND ALIGNMENT:
═══════════════════════════════════════

[[C]] **AFFIDAVIT OF BIRTH**
[[BR]]
[[BR]]

I, the undersigned,
[[BR]]

[[C]] **[DEPONENT FULL NAME IN CAPS]**
[[BR]]

hereby make oath and say
1    I was born at **[PLACE OF BIRTH]** on the [DOB e.g. 15 JULY 1983];
2    I have always regarded the above date as my birthday; and
4    I am a [MARITAL STATUS per rules, e.g. BACHELOR / SPINSTER].
[[BR]]
[[BR]]
[[BR]]

[[R]] ..................................
[[R]] **[DEPONENT FULL NAME IN CAPS]**
[[BR]]
[[BR]]

THUS SIGNED AND SWORN TO BEFORE ME AT **[PLACE OF EXECUTION OR GABORONE]** ON THIS _________ DAY OF _____________ 20[YEAR] BY THE DEPONENT WHO ACKNOWLEDGED THAT [HE/SHE] KNOWS AND UNDERSTANDS THE CONTENTS OF THIS AFFIDAVIT.
[[BR]]
[[BR]]
[[BR]]

[[R]] ..................................
[[R]] **COMMISSIONER OF OATHS**`,
  };
}
