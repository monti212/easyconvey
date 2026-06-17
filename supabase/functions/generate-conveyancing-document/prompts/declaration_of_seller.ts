import type { DocumentConfig } from "./deed_of_sale.ts";

export function getDeclarationOfSellerConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating a Declaration of Seller for a property transfer transaction.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Declaration of Seller exactly matching the formal format below
- Do NOT use markdown section headings (no ### headers). The document flows as continuous prose
- Use the actual party details provided — do NOT use placeholder names or bracketed placeholders
- DATA RESOLUTION ORDER (apply IN ORDER for every field — do not skip steps):
  1. Use the explicit value from the BUYER/SELLER information block if it is non-empty AND not the literal string "To be confirmed".
  2. Otherwise, use the matching value from the "DOCUMENT OCR EXTRACTED DATA" block (this block is the registered owner / property source of truth).
  3. Otherwise, extract the value directly from any attached document images.
  4. ONLY if all three sources fail, write "OUTSTANDING — [field description]". Never use a bracket placeholder like [NAME] or [DOB].
- FILENAMES ARE NOT DATA. Never copy a filename or party-tag into the output as a field value.
- The 9 numbered items and the subsequent "I declare further" paragraphs are STANDARD and must always be included verbatim — do not paraphrase them.

ENTITY AND MARITAL STATUS HANDLING:
- For INDIVIDUALS, apply the marital status rule:
  - If "married_in" or "Married in Community of Property", write "Married in community of property to [SPOUSE NAME] (Born [SPOUSE MAIDEN] on [DOB]) Which marriage is governed by the Laws of Botswana".
  - If "married_out", same but "Married out of community of property to...".
  - If "single", write "(BACHELOR)" or "(SPINSTER)".
  - If "divorced", write "(DIVORCED)".
  - If "widowed", write "(WIDOW/WIDOWER of the late...)".
  - If "Not specified" or missing, do NOT write OUTSTANDING, just omit the marital status line.

DATE OF SALE:
- Use the "Date of Sale" from the transaction block or OCR extracted data. Do NOT write OUTSTANDING if it is not present; default to the GENERATION DATE if missing.`,

    prompt: `Generate a complete Declaration of Seller for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT FORMAT — FOLLOW THIS EXACT STRUCTURE AND ALIGNMENT:
═══════════════════════════════════════

[[C]] **DECLARATION OF SELLER**

I, the undersigned,

[[C]] **[SELLER FULL NAME IN CAPS]**
[[C]] (Born on the [DOB])
[[C]] [MARITAL STATUS per rules, e.g. (BACHELOR) or (SPINSTER)]
[[C]] (the "Seller")

do solemnly and sincerely declare that the sum of 

**P[PRICE IN FIGURES] ([PRICE IN WORDS])**

is the full and entire purchase money for which I have sold to 

[[C]] **[PURCHASER FULL NAME IN CAPS]**
[[C]] (Born on the [DOB])
[[C]] [MARITAL STATUS per rules, e.g. (BACHELOR) or (SPINSTER)]
[[C]] (the "Purchaser")

for the following property, that is to say:

CERTAIN:       piece of land being [FULL LEGAL DESCRIPTION OF PLOT], [DISTRICT/CITY];
SITUATE:       in [ADMINISTRATIVE DISTRICT / AREA];
MEASURING:     [EXTENT IN FIGURES AND WORDS];

WHICH PROPERTY: is held under **Deed Of Transfer No. [TITLE DEED NUMBER]** dated **[TITLE DEED DATE]** made in favour of **[REGISTERED OWNER IN CAPS]**;

SUBJECT TO:    all such conditions as the aforesaid Deed.

AND I declare that I sold the same to the Purchaser on the **[DATE OF SALE]** and not before, and that there is not any agreement, condition, or understanding between the Purchaser and me, the Seller, whereby the Purchaser has paid or is to pay to or to any other person whomsoever for or in respect of or in connection with the purchase by the Purchaser of the said property, any sum of money over and above the aforesaid sum, save and except certain charges or payments which fall under or costs within one or more of the heads or items of charges or payments following:

1 The costs of any survey of the said property which shall have been made prior to and for the purpose of the said sale and of any survey of such property which may be made after the sale and the cost of all diagrams and sub-division and of the plan of the property exhibited at the time of the sale;
2 The charges made by the Auctioneer for the conditions of the sale;
3 The commission, if any, paid by the Purchaser to any auctioneer, broker, or agent, by or through whom the sale of the property may have been effected, not exceeding five per centum of the amount of the purchase money;
4 The auction duty, if any, payable upon the said sale;
5 The transfer duty payable thereon;
6 The cost of all deeds necessary for effecting transfer of the property and of the mortgage deed, if any, and of all necessary stamps;
7 The charges of conveyancers and agents incurred in effecting the transfer of the said property;
8 The quitrent, if any, which shall be payable upon the property sold to any committee, consistory or any other body for religious, educational or charitable purposes, not being rent already due and in arrear at the time of such sale;
9 The quitrent, if any, payable to Government upon the property sold.

AND I declare further that the Seller has not received nor is he to receive, nor has any other person received, nor is any other person to receive, for his use or benefit, or at the Seller's instance and request, any valuable consideration beside the said sum of **P[PRICE IN FIGURES] ([PRICE IN WORDS])** save and except in so far as any of the charges above specified are to be paid by the said Purchaser and which might be held, or taken to be, payable for him or on his behalf.

AND I declare further that the Purchaser is the only person who has ever purchased the Property from the Seller and that the Seller has never sold the same to any other person.

AND I make this solemn declaration conscientiously, believing the same to be true.

[[R]] **[SELLER FULL NAME IN CAPS]**

DECLARED BEFORE ME AT **[PLACE OF EXECUTION OR GABORONE]** ON THIS _______ DAY OF _________________ 20[YEAR]

[[R]] ....................................
[[R]] **COMMISSIONER OF OATHS**`,
  };
}
