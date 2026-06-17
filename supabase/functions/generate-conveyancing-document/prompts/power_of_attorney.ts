import type { DocumentConfig } from "./deed_of_sale.ts";

export function getPowerOfAttorneyConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating a Power of Attorney to Give Transfer for a property transfer transaction.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Power of Attorney to Give Transfer
- Use the EXACT formal legal language and structure used in Botswana Deeds Registry practice
- Do NOT use markdown section headings (no ### headers). The document flows as continuous prose
- CRITICAL: Do NOT generate a Declaration of Seller document. ONLY generate the Power of Attorney.
- Use actual party details provided — do NOT use placeholder names or bracketed placeholders
- DATA RESOLUTION ORDER (apply IN ORDER for every field — do not skip steps):
  1. Use the explicit value from the BUYER/SELLER information block if it is non-empty AND not the literal string "To be confirmed".
  2. Otherwise, use the matching value from the "TITLE DEED — OCR EXTRACTED DATA" block (registered owner / property source of truth).
  3. Otherwise, extract the value directly from any attached document images.
  4. ONLY if all three sources fail, write "OUTSTANDING — [field description]".
- LABELLED FIELD FORMATTING: Never copy a filename, the words "BUYER"/"SELLER", or a document-type label into the output.

ENTITY AND MARITAL STATUS HANDLING:
- For INDIVIDUALS, apply the marital status rule:
  - If "married_in" or "Married in Community of Property", write "Married in community of property to [SPOUSE NAME] (Born [SPOUSE MAIDEN] on [DOB]) Which marriage is governed by the Laws of Botswana".
  - If "married_out", same but "Married out of community of property to...".
  - If "single", write "(BACHELOR)" or "(SPINSTER)".
  - If "divorced", write "(DIVORCED)".
  - If "widowed", write "(WIDOW/WIDOWER of the late...)".
  - If "Not specified" or missing, omit the marital status line.

DOCUMENT EXTRACTION:
- Uploaded documents are the PRIMARY source of truth. Never leave a field as "Not specified" if the information is visible in an attached document.`,

    prompt: `Generate a complete Power of Attorney to Give Transfer for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE — FOLLOW THIS EXACT FORMAT AND ALIGNMENT:
═══════════════════════════════════════

[[C]] **POWER OF ATTORNEY TO GIVE TRANSFER**

I, the undersigned,

[[C]] **[SELLER FULL NAME IN CAPS]**
[[C]] (Born on the [DOB])
[[C]] [MARITAL STATUS per rules, e.g. (BACHELOR) or (SPINSTER)]

do hereby nominate, constitute and appoint

[[C]] **[CONVEYANCER NAME(S) — use the firm's conveyancers, separated by "and/or"]**

with power of substitution to be my true and lawful attorney and agent and in my name, place and stead to appear before the REGISTRAR OF DEEDS FOR BOTSWANA at Gaborone and then and there as my act and deed to declare that I, on the **[DATE OF SALE]** sold in the sum of **P[PRICE IN FIGURES] ([PRICE IN WORDS])** to

[[C]] **[PURCHASER FULL NAME IN CAPS]**
[[C]] (Born on the [DOB])
[[C]] [MARITAL STATUS per rules, e.g. (BACHELOR) or (SPINSTER)]

CERTAIN:       piece of land being [FULL LEGAL DESCRIPTION OF PLOT], [DISTRICT/CITY];
SITUATE:       in [ADMINISTRATIVE DISTRICT / AREA];
MEASURING:     [EXTENT IN FIGURES AND WORDS];

WHICH PROPERTY: is held under **Deed Of Transfer No. [TITLE DEED NUMBER]** dated **[TITLE DEED DATE]** made in favour of **[REGISTERED OWNER IN CAPS]**;

SUBJECT TO:    all such conditions as the aforesaid Deed.

AND, further to cede and transfer the said ground in full and free property to the said **[PURCHASER NAME IN CAPS]** and to renounce all the right and title and interest I heretofore had in and to the said property, to promise to free and warrant the said property thus transferred and also to clear the same from all encumbrances and hypothecations according to law, to draw, sign and pass, the necessary acts and deeds or other instruments and documents, to make such variations and alterations to such documents and generally for effecting the purposes aforesaid, to do or cause to be done whatsoever shall be requisite as fully and effectually to all intents and purposes as I might or could do if personally present and acting therein; hereby ratifying, allowing and confirming all and whatsoever my said Attorney and Agent shall lawfully do or cause to be done in the premises by virtue of these presents.

[[R]] ___ / SIGNED

SIGNED AT **[PLACE OF EXECUTION OR GABORONE]** ON THE ______ DAY OF ________________ 20[YEAR]

**AS WITNESSES**
1 ....................................
2 ....................................

[[R]] ....................................
[[R]] **[SELLER FULL NAME IN CAPS]**`,
  };
}
