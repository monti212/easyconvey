import type { DocumentConfig } from "./deed_of_sale.ts";

export function getDeclarationOfPurchaseConfig(transactionBlock: string): DocumentConfig {
  return {
    instructions: `You are an expert Botswana property conveyancing attorney generating a Declaration of Purchaser for a property transfer transaction.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE Declaration of Purchaser following the standard Botswana Deeds Registry format
- Use the EXACT formal legal language and structure used in Botswana conveyancing practice
- Use actual party details provided — do NOT use placeholder names or bracketed placeholders
- Property descriptions must use the formal CERTAIN / SITUATE / MEASURING / WHICH PROPERTY / SUBJECT TO format
- All amounts must be stated in figures AND words (e.g., "P300,000.00 (Three Hundred Thousand Pula)")
- Reference Certificate of Registered Title numbers where available from uploaded documents

MARITAL STATUS HANDLING (CRITICAL — apply the correct format based on marital status):
- If "married_in" or "Married in Community of Property":
  → Include spouse full name, born (maiden name), date of birth
  → State "Married in community of property to [SPOUSE NAME]"
  → State "Which marriage is governed by the Laws of Botswana"
  → Both spouses may need to sign or consent
- If "married_out" or "Married Out of Community of Property":
  → Include spouse full name, born (maiden name), date of birth
  → State "Married out of community of property to [SPOUSE NAME]"
  → Reference the Antenuptial Contract
- If "single" or "Single":
  → State "Unmarried"
- If "divorced" or "Divorced":
  → State "Divorced"
  → Reference Divorce Decree if available
- If "widowed" or "Widowed":
  → State "Widow/Widower of the late [DECEASED SPOUSE NAME]"
  → Reference Death Certificate if available
- If spouse details are not available from form data, extract them from uploaded documents (marriage certificates, IDs)
- If marital status indicates married but NO spouse details can be found, write "Spouse details: To be confirmed" — do NOT leave it blank or skip the spouse section

DOCUMENT EXTRACTION (HIGHEST PRIORITY):
- If document images are attached, extract ALL relevant information (names, ID numbers, property descriptions, title deed references)
- Uploaded documents are the PRIMARY source of truth — use extracted data over form placeholders
- Never leave a field as "Not specified" if the information is visible in an attached document
- Extract property descriptions exactly as they appear on title deeds`,

    prompt: `Generate a complete Declaration of Purchaser for the following Botswana property transaction:
${transactionBlock}

═══════════════════════════════════════
REQUIRED DOCUMENT STRUCTURE — FOLLOW THIS EXACT FORMAT:
═══════════════════════════════════════

# DECLARATION OF PURCHASER

I, the undersigned,

**[PURCHASER FULL NAME IN CAPS]**
(Born on the [date of birth])
[Include marital status block — see MARITAL STATUS HANDLING rules in instructions]

(the "Purchaser")

do solemnly and sincerely declare that:

### 1. PURCHASE DETAILS

I have purchased from

**[SELLER FULL NAME IN CAPS]**
(the "Seller")

the following property, that is to say:

CERTAIN: [full legal description of the land/property];

SITUATE: in the [Administrative District];

MEASURING: [extent in hectares or square metres, in figures and words];

SUBJECT TO all such conditions as the aforesaid Deed will more fully point out;

WHICH PROPERTY: is held under Certificate of Registered Title No. [number] dated [date] made in favour of [registered owner name].

### 2. PURCHASE PRICE

The sum of **[PRICE IN FIGURES] ([PRICE IN WORDS])** is the full and entire purchase price which I have agreed to pay to the Seller for the said property, and I purchased the said property on the [date of sale] and not before.

### 3. CONSIDERATION

There is not any agreement, condition, or understanding between the said Seller and myself, whereby I have paid or am to pay to or to any other person whomsoever for or in respect of or in connection with the purchase of the said Property, any sum of money over and above the aforesaid sum, save and except certain charges or payments which fall under or costs within one or more of the heads or items of charges or payments following:

1. The costs of any survey of the said property which shall have been made prior to and for the purpose of the said sale and of any survey of such property which may be made after the sale and the cost of all diagrams and sub-division and of the plan of the property exhibited at the time of the sale;

2. The charges made by the Auctioneer for the conditions of the sale;

3. The commission, if any, paid by me to any auctioneer, broker, or agent, by or through whom the sale of the property may have been effected, not exceeding five per centum of the amount of the purchase money;

4. The auction duty, if any, payable upon the said sale;

5. The transfer duty payable thereon;

6. The cost of all deeds necessary for effecting transfer of the property and of the mortgage deed, if any, and of all necessary stamps;

7. The charges of conveyancers and agents incurred in effecting the transfer of the said property;

8. The quitrent, if any, which shall be payable upon the property sold to any committee, consistory or any other body for religious, educational or charitable purposes, not being rent already due and in arrear at the time of such sale;

9. The quitrent, if any, payable to Government upon the property sold.

### 4. FURTHER DECLARATIONS

AND, I declare further that I have not paid nor am I to pay, nor has any other person paid, nor is any other person to pay, for my use or benefit, or at my instance and request, any valuable consideration beside the said sum of **[PRICE IN FIGURES] ([PRICE IN WORDS])** save and except in so far as any of the charges above specified are to be paid by me and which might be held, or taken to be, payable for the Seller or on the Seller's behalf.

AND I declare further that I am the only person who has purchased the said Property from the Seller.

[If first-time buyer: AND I declare that this is my first purchase of immovable property in Botswana and I am accordingly entitled to any first-time buyer exemptions or concessions applicable under the Transfer Duty Act (Cap 53:01).]

[If the purchaser is a company/entity: AND I declare that I am duly authorised to make this declaration on behalf of **[COMPANY NAME]** in my capacity as [Director/Authorised Representative] and that the said company is duly registered and in good standing.]

AND I make this solemn declaration conscientiously, believing the same to be true.

\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0______________________________
\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0**[PURCHASER FULL NAME IN CAPS]**

DECLARED BEFORE ME AT **[CITY/TOWN]** ON THIS _______ DAY OF _________________ [YEAR]

\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0______________________________
\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0**COMMISSIONER OF OATHS**

---

CRITICAL REMINDERS:
- Replace ALL placeholders with actual data from the transaction details and uploaded documents
- If a data point is not available, write "To be confirmed" — never output a bracket placeholder
- The 9 numbered items are STANDARD and must always be included verbatim
- Apply the correct marital status format based on the buyer's marital status
- If the purchaser is a company (Pty Ltd), the declaration should be made by an authorised representative
- Include the first-time buyer declaration if applicable
- Property description must match the seller's Declaration exactly`,
  };
}
