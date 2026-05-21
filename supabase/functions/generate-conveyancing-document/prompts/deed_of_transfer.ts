import type { DocumentConfig } from "./deed_of_sale.ts";

export function getDeedOfTransferConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating a Deed of Transfer for registration at the Deeds Registry of Botswana.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Deed of Transfer in the EXACT format used by the Deeds Registry of Botswana (the format is reproduced verbatim below)
- This is the ACTUAL TRANSFER DOCUMENT registered at the Deeds Registry — NOT a sale agreement
- The conveyancer (Appearer) appears before the Registrar of Deeds on behalf of the seller via Power of Attorney
- The structure, line breaks, and section ordering shown below are STATUTORY — do not reorganise, rename sections, or paraphrase boilerplate
- Use actual party details from the transaction data — NEVER output bracketed placeholders like [NAME], [DATE], [NUMBER]

DATA RESOLUTION ORDER (apply IN ORDER for every field — do not skip steps):
  1. Use the explicit value from the BUYER/SELLER information block if it is non-empty AND not the literal string "To be confirmed".
  2. Otherwise, use the matching value from the "DOCUMENT OCR EXTRACTED DATA" block (registered owner / property source of truth).
  3. Otherwise, extract the value directly from any attached document images (party-tagged via the image index).
  4. ONLY if all three sources fail, write "OUTSTANDING — [field description]" (e.g. "OUTSTANDING — seller date of birth"). Never use a bracketed placeholder.

LABELLED FIELD FORMATTING (apply to ALL data fields except the formal CERTAIN/SITUATE/MEASURING/etc. tabular block):
- When you state a labelled value anywhere in the document (Plot Number, Date of Birth, ID Number, Reference, Status, Marital Status, etc.), put the label on its own line and the value on the next line. Do NOT use a colon between them.
- Correct:
    Plot Number
    15583
- Wrong:
    Plot Number: 15583
- The only exception is the formal property-description tabular block (CERTAIN: / SITUATE: / MEASURING: / etc.) and the registry signature blocks — those keep their statutory "LABEL: value" layout because that is the prescribed registry format.

FILENAMES ARE NOT DATA (CRITICAL — read carefully):
- The prompt may list uploaded file names ("title_deed.pdf", "id_smith_john.jpg", etc.) for INVENTORY purposes. These names are file system metadata. They are NOT a source of legal data.
- Never copy any part of a filename into the output. Never derive party names, plot numbers, ID numbers, or dates from a filename.
- ALL legal data must come from (a) the structured BUYER/SELLER fields, (b) the DOCUMENT OCR EXTRACTED DATA block, or (c) the visible content of attached document images.
- If a needed field is not present in (a)/(b)/(c), write "OUTSTANDING — [field description]". Do NOT invent values from filenames.

PARTY-TAG INDEX IS A ROUTING HINT, NOT DATA:
- The "ATTACHED DOCUMENT IMAGES" section labels each image as belonging to BUYER or SELLER. That tag tells you which side a document's contents apply to. The tag itself is not a value to copy into the document.

MARITAL STATUS HANDLING (CRITICAL — apply for the SELLER and where applicable the BUYER):
- "single" / Single → write "(Bachelor)" for male or "(Spinster)" for female immediately after the date-of-birth line
- "married_in" / Married in Community of Property →
    "Married in community of property to [SPOUSE FULL NAME]"
    "(Born [SPOUSE MAIDEN NAME] on the [ordinal] day of [Month] [Year])"
    "Which marriage is governed by the Laws of Botswana"
- "married_out" / Married Out of Community of Property → same as above but "Married out of community of property to …" plus "Antenuptial Contract dated …"
- "divorced" → write "(Divorced)" after the date of birth
- "widowed" → write "(Widow/Widower of the late [DECEASED SPOUSE NAME])" after the date of birth

BUYER ENTITY HANDLING:
- Individual: include full name, date of birth, marital status (same rules as seller). Closing line: "his/her Heirs, executors, administrators or assigns".
- Company (Pty Ltd): use full registered company name with "(PROPRIETARY) LIMITED". Closing line: "its successors-in-title or assigns". Append the ENDORSEMENTS section after the registration block: "[COMPANY NAME] (Proprietary) Limited is authorised to acquire immovable property in terms of Section 25 of the Companies Act".
- Trust: use trust name with "in his capacity as Trustee of [TRUST NAME]".
- Deceased Estate: reference Letters of Administration / Executorship.

PROPERTY DESCRIPTION FORMATTING (the property block uses tabular alignment — keep label and value on the same line, label left-aligned in caps):
- CERTAIN, SITUATE, MEASURING, AS WILL MORE FULLY APPEAR, WHICH PROPERTY, SUBJECT TO, AND SUBJECT TO are the labels (in that order).
- Long labels span two lines like the sample ("AS WILL MORE\\nFULLY APPEAR:").
- AND FURTHER SUBJECT TO is a separate paragraph followed by the numbered conditions list (1. with sub-clauses a–e, then 2., 3., 4., 5., 6.).

NUMBERS AND DATES:
- All amounts must be stated in figures AND words: "P1,150,000.00 (One Million One Hundred and Fifty Thousand Pula)".
- If sale price differs from valuation, state BOTH (sale price first, then "but valued at … for transfer duty purposes"). If they are equal or no valuation, state only the sale price.
- Dates use ordinal day form: "16th day of October 1994" (not "16 October 1994").

FORMATTING:
- The cover page (top): document title, "by", seller name, "in favour of", buyer name, "in respect of", lot description — each centred on its own line. Then a right-aligned "Prepared by me" line, a blank gap, then a right-aligned "Conveyancer" line.
- CATCHWORDS: registry deeds carry a "catchword" at the foot of each section that previews the opening of the next section. Emit these as RIGHT-ALIGNED lines using the exact form "[[R]] …/" followed by the opening words of the section that follows. Place a catchword immediately before: condition 6, the WHEREFORE clause, the THUS DONE AND EXECUTED clause, and (where the deed uses a WHEREAS recital) the WHEREAS section. Examples: "[[R]] …/6. Connection of services", "[[R]] …/WHEREFORE", "[[R]] …/WHEREAS". The "…/" must use the ellipsis character.
- The body uses paragraph prose for the "appeared before me" / "AND the said Appearer declared" / "WHEREFORE the Appearer" sections, and tabular prose for the property description block (CERTAIN/SITUATE/etc.).
- Signature block at the end uses dotted/underscored signature lines (use "______________________________" for the lines).
- Use Markdown bold (**…**) ONLY for party names, plot/lot numbers, deed numbers, and key amounts.
- Do NOT add "passed by" or any wording not present in the registry sample.`,

    prompt: `Generate a complete Deed of Transfer for registration at the Botswana Deeds Registry for the following property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE — REPRODUCE THIS LAYOUT EXACTLY (substitute real values for the sample placeholders, never copy the placeholder words themselves)
═══════════════════════════════════════

[[C]] DEED OF TRANSFER

[[C]] by

[[C]] **[SELLER FULL NAME IN CAPS]**

[[C]] in favour of

[[C]] **[BUYER FULL NAME IN CAPS]**

[[C]] in respect of

[[C]] **LOT [PLOT NUMBER] [LOCATION IN CAPS]**

[[R]] Prepared by me



[[R]] Conveyancer

[[C]] DEED OF TRANSFER NO. ___________

[[C]] **Be it hereby made known:**
THAT **[CONVEYANCER FULL NAME IN CAPS]** appeared before me, the Registrar of Deeds for Botswana at **[PLACE]**, he the said Appearer, being duly authorised thereto by a Power of Attorney granted to him by

**[SELLER FULL NAME IN CAPS]**
(Born on the [ordinal] day of [Month] [Year])
[Apply marital status block here per MARITAL STATUS HANDLING — e.g.:
"Married in community of property to
**[SPOUSE FULL NAME IN CAPS]**
(Born [SPOUSE MAIDEN NAME] on the [ordinal] day of [Month] [Year])
Which marriage is governed by the Laws of Botswana"]

which Power of Attorney is dated the [ordinal] day of [Month] [Year] and was signed at [PLACE];

AND the said Appearer declared that his Principal had truly and legally sold and that he, the Appearer in his capacity aforesaid, did by these presents, cede and transfer in full and free property to and on behalf of

**[BUYER FULL NAME IN CAPS]**
(Born on the [ordinal] day of [Month] [Year])
[Apply marital status block — e.g. "(Spinster)" or "(Bachelor)" or "Married in community of property to …"]

[Closing pronoun line — for individual: "her Heirs, executors, administrators or assigns" or "his Heirs, executors, administrators or assigns"; for company: "its successors-in-title or assigns"], the following property, that is to say:

    **CERTAIN:**                   piece of land being [PLOT ADDRESS], [PLACE];

    **SITUATE:**                   in [AREA], [CITY];

    **MEASURING:**            [PLOT SIZE] m² ([SIZE IN WORDS] Square Metres);

    **AS WILL MORE**
    **FULLY APPEAR:**         from **General Plan D.S.L. No. [NUMBER]** surveyed by Land Surveyor [FULL NAME] in [Month Year] and approved by the Director of Surveys and Lands on the [ordinal] day of [Month] [Year];

    **WHICH PROPERTY:**      was held under **Certificate of Registered State Title No. [NUMBER]** dated [ordinal] day of [Month] [Year] and subsequent Deeds the last of which being **Deed of Transfer No. [NUMBER]** dated [ordinal] day of [Month] [Year] made in favour of **[SELLER FULL NAME IN CAPS]**;

    **SUBJECT TO:**                the conditions contained in **Certificate of Rights to Minerals No. [NUMBER]** dated [ordinal] day of [Month] [Year];

    **AND SUBJECT TO:**       all such conditions as the aforesaid Deed will more fully point out;

AND FURTHER SUBJECT TO the following conditions:

1. a) This Deed of Transfer shall vest ownership of the property in the purchaser for a period of [PERIOD — typically 99 years] from the date of Registration of **Deed of Fixed Period State Grant No. [NUMBER]** dated [ordinal] day of [Month] [Year] made in favour of [ORIGINAL GRANTEE NAME] and the Purchaser shall have the right to cede, assign, transfer, lease, sell, mortgage or otherwise deal with the property during the period of ownership;

   b) Upon expiry of the Deed of Transfer, the purchaser shall be allowed to renew his title for another [PERIOD];

   c) The State shall notify the purchaser of the property of the impending expiry of the property at least five (5) years prior to its lapse;

   d) The purchaser of the property shall be allowed [PERIOD] years before the expiry of transfer to indicate his intention in writing to renew and negotiations should be concluded not later than [PERIOD] years before the expiry of the Deed of Transfer;

   e) Where the purchaser elects not to renew the Deed, the Deed of Transfer shall terminate on the date of expiry and rights and title therein shall revert to the state together with developments;

2. The property shall only be used for the following purpose - residential and may not be used for any other purpose except with the written permission of the Government.

3. The purchaser or his successors in title or assigns shall maintain the buildings, their replacement and improvements on the property in good order and repair throughout the period of the Grant and on determination of the Grant shall surrender the said property with all buildings and erections thereon in good repair and condition.

4. All mineral rights in and upon the property are reserved to the State and the Government may at any time deal with such rights in accordance with any law then in force relating to the prospecting for and mining of minerals.

5. The Government or any lawfully established public authority authorised thereto by the Government shall at all times have the power of constructing on or through any part of the property pipe lines, aqueducts, drains or telephone or telegraph lines required for public purposes. No compensation shall be payable by the Government or other authority aforesaid in the exercise of any of its rights under this paragraph except in respect of the value of any damage to improvements actually sustained by reason of the exercise of these rights.

[[R]] …/6. Connection of services

6. Connection of services to individual plots shall be the responsibility of the Purchaser.

[[R]] …/WHEREFORE

WHEREFORE the Appearer, renouncing all the right, title and interest which his Principal heretofore had to the premises did in consequence also acknowledge him to be entirely dispossessed of and disentitled to the same and that by virtue of these presents, the said

**[BUYER FULL NAME IN CAPS]**
(Born on the [ordinal] day of [Month] [Year])
[Apply marital status block — e.g. "(Spinster)"]

[Closing pronoun line — "her Heirs, executors, administrators or assigns" / "his Heirs, executors, administrators or assigns" / "its successors-in-title or assigns"], now is and henceforth shall be entitled thereto, conformably to local custom; the State, however, reserving its rights.

AND, finally, acknowledging that the property was sold on the [ordinal] day of [Month] [Year] for the sum of **P[SALE PRICE FIGURES] ([SALE PRICE IN WORDS])** [if valuation differs: but valued at **P[VALUATION FIGURES] ([VALUATION IN WORDS])** for transfer duty purposes].

In witness whereof I; the said Registrar, together with the Appearer q.q. have subscribed to these presents, and have caused the Seal of Office to be affixed hereto.

[[R]] …/THUS DONE AND EXECUTED

THUS DONE AND EXECUTED at the Office of the Registrar of Deeds for Botswana at **GABORONE** on this [ordinal] day of [Month] in the Year of Our Lord **[YEAR IN WORDS] (20[YEAR])**.

In my presence

            ______________________________                                              ______________________________

           Registrar of Deeds Botswana                                             q.q. his Principal

Registered in the Register of
kept at
on the above date.

[If buyer is a Company (Pty Ltd), append immediately after the registration line:]

ENDORSEMENTS

**[COMPANY NAME] (Proprietary) Limited** is authorised to acquire immovable property in terms of Section 25 of the Companies Act.

═══════════════════════════════════════
CRITICAL REMINDERS — RE-READ BEFORE OUTPUTTING:
═══════════════════════════════════════
- NEVER output bracketed placeholders ([NAME], [DATE], [NUMBER]) in the final document. Use the real value or "OUTSTANDING — [description]".
- NEVER copy filenames or any part of filenames as data. Filenames listed in the prompt are inventory only.
- For every field, follow the DATA RESOLUTION ORDER: party block → OCR-extracted block → attached image extraction → "OUTSTANDING" (last resort). Do NOT write "OUTSTANDING" while real data exists in the OCR-extracted block or document images.
- The cover page format is fixed: document title, "by", seller, "in favour of", buyer, "in respect of", lot. Then a right-aligned "Prepared by me" / "Conveyancer".
- The 6 numbered conditions are STANDARD for Fixed Period State Grant residential properties — include them verbatim with sub-clauses a–e on condition 1.
- Use ordinal dates ("16th day of October 1994") and figures-and-words for all amounts.
- For company buyers, ALWAYS append the Section 25 Companies Act endorsement.
- The Appearer (conveyancer) acts via Power of Attorney granted by the seller — reference the POA date and place.`,
  };
}
