import type { DocumentConfig } from "./deed_of_sale.ts";

export function getDeedOfTransferConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating a Deed of Transfer for registration at the Deeds Registry of Botswana.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Deed of Transfer in the EXACT format used by the Deeds Registry of Botswana
- This is the ACTUAL TRANSFER DOCUMENT registered at the Deeds Registry — NOT a sale agreement
- The conveyancer appears before the Registrar of Deeds on behalf of the seller via Power of Attorney
- Use the EXACT formal legal language and structure shown in the required format below
- Use actual party details provided — do NOT use placeholder names or bracketed placeholders
- Property descriptions must use the formal CERTAIN / SITUATE / MEASURING / AS WILL MORE FULLY APPEAR / WHICH PROPERTY / SUBJECT TO format
- All amounts must be stated in figures AND words (e.g., "P1,150,000.00 (One Million One Hundred and Fifty Thousand Pula)")
- If the sale price differs from the valuation, state BOTH: "sold ... for the sum of [SALE PRICE] but valued at [VALUATION] for transfer duty purposes"
- Reference the full chain of title (Certificate of Registered State Title → subsequent deeds → last deed in favour of seller)

MARITAL STATUS HANDLING (CRITICAL — apply the correct format for the SELLER):
- If "single" or "Single":
  → State "(Bachelor)" for male or "(Spinster)" for female after the date of birth
- If "married_in" or "Married in Community of Property":
  → Include spouse full name, born (maiden name), date of birth
  → State "Married in community of property to [SPOUSE NAME]"
  → State "Which marriage is governed by the Laws of Botswana"
  → Both spouses' Power of Attorney may be required
- If "married_out" or "Married Out of Community of Property":
  → Include spouse full name, born (maiden name), date of birth
  → State "Married out of community of property to [SPOUSE NAME]"
  → Reference the Antenuptial Contract
- If "divorced":
  → State "(Divorced)" after the date of birth
- If "widowed":
  → State "(Widow/Widower of the late [DECEASED SPOUSE NAME])" after the date of birth

BUYER TYPE HANDLING:
- If buyer is a Company (Pty Ltd):
  → Use full registered company name with "(PROPRIETARY) LIMITED"
  → Add "its successors-in-title or assigns" after the company name
  → Include ENDORSEMENTS section at the end: "[COMPANY NAME] is authorized to acquire immovable property in terms of Section 25 of the Companies Act"
- If buyer is an Individual:
  → Include full name, date of birth, marital status (same format as seller)
  → Add "his/her heirs, executors, administrators or assigns" after the name
- If buyer is a Trust:
  → Use trust name and trustee details
- If buyer is a Deceased Estate:
  → Reference Letters of Administration/Executorship

PROPERTY CONDITIONS:
- Include ALL conditions from the State Grant or Fixed Period State Grant
- Standard conditions include: 99-year ownership period, residential use restriction, maintenance obligations, mineral rights reserved to State, Government construction rights, service connection responsibility
- These come from the title deed and should be extracted from uploaded documents where available

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information
- Title deeds are the PRIMARY source for property descriptions, chain of title, conditions, and lot details
- Uploaded documents override form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document`,

    prompt: `Generate a complete Deed of Transfer for registration at the Botswana Deeds Registry for the following property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE — FOLLOW THIS EXACT FORMAT:
═══════════════════════════════════════

# DEED OF TRANSFER

passed by

**[SELLER FULL NAME IN CAPS]**

in favour of

**[BUYER NAME IN CAPS]**
[If company: **(PROPRIETARY) LIMITED**]

in respect of

**LOT [NUMBER] [LOCATION]**

---

Prepared by me

Conveyancer

## DEED OF TRANSFER NO. ___________

**Be it hereby made known:**

THAT **[CONVEYANCER FULL NAME IN CAPS]** appeared before me, the Registrar of Deeds for Botswana at **GABORONE**, he the said Appearer, being duly authorised thereto by a Power of Attorney granted to him by

**[SELLER FULL NAME IN CAPS]**
(Born on the [ordinal date] day of [month] [year])
[Marital status — see MARITAL STATUS HANDLING rules: e.g. "(Bachelor)", "(Spinster)", or married details]

which Power of Attorney is dated the **[ordinal date]** day of **[month] [year]** and was signed at **[place]**

AND the said Appearer declared that his Principal has truly and legally sold and that he, the Appearer in his capacity aforesaid, did by these presents, cede and transfer in full and free property to and on behalf of

**[BUYER NAME IN CAPS]**
[If company: **(PROPRIETARY) LIMITED**]

[If individual: his/her heirs, executors, administrators or assigns]
[If company: its successors-in-title or assigns]

the following property, that is to say:

CERTAIN:\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0piece of land being Lot [number] [location];

SITUATE:\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0in the [location/extension/area];

MEASURING:\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0[size] m\u00b2 ([size in words] Square Metres);

AS WILL MORE
FULLY APPEAR:\u00a0\u00a0\u00a0\u00a0from General Plan D.S.L. No. [number] surveyed by Land Surveyor [name] in [dates] and approved by the Director of Surveys and Lands on the [date];

WHICH PROPERTY:\u00a0\u00a0was held under Certificate of Registered State Title No. [number] dated [date] and subsequent deeds the last of which being [Deed type] No. [number] dated [date] made in favour of **[SELLER NAME IN CAPS]**;

SUBJECT TO:\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0the conditions contained in Certificate of Rights to Minerals No. [number] dated [date];

AND FURTHER
SUBJECT TO:\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0the reservations and conditions namely:-

1. This Deed of Transfer shall vest ownership of the property in the purchaser for a period of 99 years from the date of Registration of **Deed of Fixed Period State Grant No. [number]** in the Deeds Registry, dated **[date]** made in favour of **[original grantee name]** (Born xx/xx/[year]) [marital status] and the Purchaser shall have the right to cede, assign, transfer, lease, sell, mortgage or otherwise deal with the property during the period of ownership, always provided that at the end of the 99 year period referred to above the property together with all the improvements thereon (in whose name soever they may then be registered) shall revert to the State absolutely without compensation payable for improvements or otherwise.

2. The property shall only be used for the following purpose - residential and may not be used for any other purpose except with the written permission of the Government.

3. The purchaser or his successors in title or assigns shall maintain the buildings, their replacement and improvements on the property in good order and repair throughout the period of the Grant and on determination of the Grant shall surrender the said property with all buildings and erections thereon in good repair and condition. No compensation shall be payable by the State for any improvements on the property.

4. All mineral rights in and upon the property are reserved to the State and the Government may at any time deal with such rights in accordance with any law then in force relating to the prospecting for and mining of minerals.

5. The Government or any lawfully established public authority authorised thereto by the Government shall at all times have the power of constructing on or through any part of the property pipe lines, aqueducts, drains or telephone or telegraph lines required for public purposes. No compensation shall be payable by the Government or other authority aforesaid in the exercise of any of its rights under this paragraph except in respect of the value of any damage to improvements actually sustained by reason of the exercise of these rights.

6. Connection of services to individual plots shall be the responsibility of the Purchaser.

WHEREFORE the Appearer, renouncing all the right, title and interest which his Principal heretofore had to the premises did in consequence also acknowledge it to be entirely dispossessed of and disentitled to the same and that by virtue of these presents, the said

**[BUYER NAME IN CAPS]**
[If company: **(PROPRIETARY) LIMITED**]

AND, finally, acknowledging that the property was sold on the **[ordinal date]** day of **[month] [year]** for the sum of **[SALE PRICE IN FIGURES] ([SALE PRICE IN WORDS])** [if valuation differs: but valued at **[VALUATION IN FIGURES] ([VALUATION IN WORDS])** for transfer duty purposes].

---

In witness whereof I, the said Registrar, together with the Appearer q.q. have subscribed to these presents, and have caused the Seal of Office to be affixed hereto.

THUS DONE AND EXECUTED at the Office of the Registrar of Deeds for Botswana at **GABORONE** on this _______ day of _________________ in the Year of Our Lord **[year in words] ([year in figures])**.

In my presence

\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0______________________________
\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0Registrar of Deeds Botswana

\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0______________________________
\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0q.q. his Principal

Registered in the Register of
kept at
on the above date.

---

[If buyer is a Company (Pty Ltd), include this section:]

## ENDORSEMENTS

**[COMPANY NAME] (Proprietary) Limited** is authorized to acquire immovable property in terms of Section 25 of the Companies Act

---

CRITICAL REMINDERS:
- Replace ALL placeholders with actual data from the transaction details and uploaded documents
- If a data point is not available, write "To be confirmed" — never output a bracket placeholder
- The 6 numbered conditions are STANDARD for State Grant properties — include them verbatim
- If the property has different conditions (e.g. commercial use, freehold), adapt accordingly based on uploaded title deed
- The chain of title (WHICH PROPERTY clause) must trace from the original State Title through all subsequent transfers to the seller
- Sale price and valuation may differ — include both if valuation is provided
- For company buyers, ALWAYS include the Section 25 Companies Act endorsement
- The Appearer (conveyancer) acts via Power of Attorney granted by the seller — reference the POA date and place
- Use ordinal dates: "16th day of October 1994" not "16 October 1994"`,
  };
}
