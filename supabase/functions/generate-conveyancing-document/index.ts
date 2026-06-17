import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { getDocumentConfig } from "./prompts/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: unknown) {
  const entry = { level, ts: new Date().toISOString(), msg, ...(data ? { data } : {}) };
  console.log(JSON.stringify(entry));
}

function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("UHURU_API_KEY");
    const baseUrl = Deno.env.get("UHURU_API_URL") || "";
    // Accept either a base URL (https://api.moonshot.ai/v1) or full endpoint
    const chatUrl = baseUrl
      ? (baseUrl.endsWith("/chat/completions") ? baseUrl : baseUrl.replace(/\/$/, "") + "/chat/completions")
      : "";
    const model = Deno.env.get("U35_model") || "u3.5";

    log("INFO", "Function invoked", { model, chatUrl, hasApiKey: !!apiKey });

    if (!apiKey) {
      log("ERROR", "UHURU_API_KEY secret not set");
      return new Response(
        JSON.stringify({ error: "API key not configured", details: "UHURU_API_KEY secret is not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!baseUrl) {
      log("ERROR", "UHURU_API_URL secret not set");
      return new Response(
        JSON.stringify({ error: "API URL not configured", details: "UHURU_API_URL secret is not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      transactionId,
      documentType = 'deed_of_sale',
      propertyPrice,
      buyerDetails,
      sellerDetails,
      buyerName,
      sellerName,
      documentPaths,
      documentImages,
      stream: wantStream,
      // Conveyancer identity
      conveyancerName,
      conveyancerFirm,
      // Transaction category
      transactionCategory,
      includeBondRegistration,
      // OCR-extracted fields from title deed scan
      extractedOwnerIdNumber,
      extractedPreviousOwner,
      extractedPurchasePrice,
      extractedHasMortgageBond,
      extractedMortgageBondNumber,
      extractedOwnerName,
      extractedPlotNumber,
      extractedPropertyAddress,
      extractedPropertyDescription,
      extractedTitleDeedNumber,
      extractedAdministrativeDistrict,
      extractedExtent,
      extractedClientName,
      extractedIdNumber,
      // Party-tagged ID OCR (Step 6 active-party toggle)
      extractedBuyerName,
      extractedBuyerIdNumber,
      extractedBuyerDateOfBirth,
      extractedSellerName,
      extractedSellerIdNumber,
      extractedSellerDateOfBirth,
      extractedNameOfAppearer,
      extractedPlaceOfExecution,
      extractedMonthAndYearOfPoa,
      extractedSituate,
      extractedUnitsOfMeasurement,
      extractedDslNumber,
      extractedNameOfSurveyor,
      extractedDateOfSurvey,
      extractedDateOfApproval,
      extractedNameOfPreviousDeed,
      extractedPreviousDeedNumber,
      extractedPreviousDeedDateOfRegistration,
      extractedCurrentDeedDateOfRegistration,
      extractedCrmNumber,
      extractedDateOfCrm,
      extractedDfpsgNumber,
      extractedDfpsgDateOfRegistration,
      extractedDfpsgOwnerName,
      extractedDateOfSale,
      extractedPurchaserPlaceOfBirth,
      extractedSellerPlaceOfBirth,
      extractedSellerStatus,
      extractedPurchaserStatus,
    } = await req.json();

    // ─── Fetch document URLs from Supabase Storage ───────────────────
    // Each entry retains the party tag ('buyer' | 'seller' | undefined) so the AI prompt
    // can tell the model exactly which document belongs to whom.
    const imageUrls: { url: string; party?: 'buyer' | 'seller'; type?: string; name?: string }[] = [];
    const pdfDocNames: string[] = [];
    const pdfDocsByParty: { name: string; party?: 'buyer' | 'seller'; type?: string }[] = [];

    // Add base64 data URLs directly (bypasses storage — most reliable)
    if (documentImages && documentImages.length > 0) {
      for (const img of documentImages) {
        if (img.dataUrl && img.dataUrl.startsWith('data:image/')) {
          imageUrls.push({ url: img.dataUrl, party: img.party, type: img.docType, name: img.name });
        }
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // ─── Fetch knowledge base reference for this document type ──────
    let knowledgeBaseContent = "";
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const kbClient = createClient(supabaseUrl, supabaseServiceKey);
        // Look up knowledge base for deed_of_transfer (covers deed_of_sale too)
        // as it teaches the AI the correct Botswana Deeds Registry format
        const lookupTypes = [documentType, "deed_of_transfer"];
        const { data: kbRows } = await kbClient
          .from("document_knowledge_base")
          .select("title, content, notes")
          .in("document_type", lookupTypes)
          .eq("is_active", true);
        if (kbRows && kbRows.length > 0) {
          knowledgeBaseContent = kbRows
            .map((r: { title: string; notes: string; content: string }) =>
              `### KNOWLEDGE BASE: ${r.title}\n${r.notes ? `> ${r.notes}\n\n` : ""}${r.content}`
            )
            .join("\n\n---\n\n");
          log("INFO", "Knowledge base loaded", { count: kbRows.length });
        }
      } catch (kbErr) {
        log("WARN", "Knowledge base fetch failed", { error: (kbErr as Error).message });
      }
    }

    if (supabaseUrl && supabaseServiceKey && documentPaths && documentPaths.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Download every stored document in PARALLEL. The previous serial loop
      // could spend 10+s on a case with a handful of attachments.
      const downloads = await Promise.all(
        documentPaths.map(async (docPath: any) => {
          const path: string = docPath.path || docPath;
          const bucket: string = docPath.bucket || "documents";
          const party: 'buyer' | 'seller' | undefined = docPath.party;
          const type: string | undefined = docPath.type;
          const name: string | undefined = docPath.name;

          if (!isImageFile(path)) {
            const filename = path.split("/").pop() || path;
            return { kind: "pdf" as const, filename, party, type };
          }

          try {
            const { data, error } = await supabase.storage.from(bucket).download(path);
            if (error || !data) return null;
            const arrayBuffer = await data.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const base64 = btoa(binary);
            const ext = path.toLowerCase().split(".").pop() || "jpeg";
            const mimeType =
              ext === "png" ? "image/png" :
              ext === "gif" ? "image/gif" :
              ext === "webp" ? "image/webp" : "image/jpeg";
            log("INFO", "Image converted to base64", { path, size: bytes.length, party });
            return {
              kind: "img" as const,
              url: `data:${mimeType};base64,${base64}`,
              party, type, name,
            };
          } catch (dlErr) {
            log("WARN", "Failed to download image", { path, error: (dlErr as Error).message });
            return null;
          }
        })
      );
      for (const r of downloads) {
        if (!r) continue;
        if (r.kind === "img") {
          imageUrls.push({ url: r.url, party: r.party, type: r.type, name: r.name });
        } else {
          pdfDocNames.push(r.filename);
          pdfDocsByParty.push({ name: r.filename, party: r.party, type: r.type });
        }
      }
    }

    // ─── Resolve buyer/seller names from various data shapes ─────────
    // "To be confirmed" sentinel — treat these as missing so OCR fallbacks can take over
    const isPresent = (v: unknown): v is string =>
      typeof v === "string" && v.trim().length > 0 && v.trim().toLowerCase() !== "to be confirmed";

    const resolveBuyerName = () => {
      if (isPresent(buyerDetails?.clientName)) return buyerDetails.clientName;
      if (buyerDetails?.hasAgent && isPresent(buyerDetails?.agentName)) return buyerDetails.agentName;
      if (isPresent(buyerDetails?.companyName)) return buyerDetails.companyName;
      if (isPresent(buyerDetails?.trustName)) return buyerDetails.trustName;
      if (isPresent(buyerDetails?.deceasedName)) return buyerDetails.deceasedName;
      if (isPresent(buyerDetails?.societyName)) return buyerDetails.societyName;
      // Party-tagged buyer ID OCR first (Step 6 BUYER toggle), then legacy single bucket
      if (isPresent(extractedBuyerName)) return extractedBuyerName;
      if (isPresent(extractedClientName)) return extractedClientName;
      return buyerName || "Not specified";
    };

    const resolveBuyerIdNumber = () => {
      if (isPresent(buyerDetails?.idNumber)) return buyerDetails.idNumber;
      if (isPresent(extractedBuyerIdNumber)) return extractedBuyerIdNumber;
      if (isPresent(extractedIdNumber)) return extractedIdNumber;
      return "To be confirmed";
    };

    const resolveBuyerDateOfBirth = () => {
      if (isPresent(buyerDetails?.dateOfBirth)) return buyerDetails.dateOfBirth;
      if (isPresent(extractedBuyerDateOfBirth)) return extractedBuyerDateOfBirth;
      return "To be confirmed";
    };

    const resolveSellerName = () => {
      if (isPresent(sellerDetails?.clientName)) return sellerDetails.clientName;
      if (sellerDetails?.hasAgent && isPresent(sellerDetails?.agentName)) return sellerDetails.agentName;
      if (isPresent(sellerDetails?.companyName)) return sellerDetails.companyName;
      if (isPresent(sellerDetails?.trustName)) return sellerDetails.trustName;
      // Party-tagged seller ID OCR first, then deed-extracted registered owner
      if (isPresent(extractedSellerName)) return extractedSellerName;
      if (isPresent(extractedOwnerName)) return extractedOwnerName;
      return sellerName || "Not specified";
    };

    const resolveSellerIdNumber = () => {
      if (isPresent(sellerDetails?.idNumber)) return sellerDetails.idNumber;
      if (isPresent(extractedSellerIdNumber)) return extractedSellerIdNumber;
      if (isPresent(extractedOwnerIdNumber)) return extractedOwnerIdNumber;
      return "To be confirmed";
    };

    const resolveSellerDateOfBirth = () => {
      if (isPresent(sellerDetails?.dateOfBirth)) return sellerDetails.dateOfBirth;
      if (isPresent(extractedSellerDateOfBirth)) return extractedSellerDateOfBirth;
      return "To be confirmed";
    };

    // ─── Transaction details block (shared across all document types) ──
    const transactionBlock = `
TRANSACTION REFERENCE: ${transactionId}
GENERATION DATE: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
TRANSACTION CATEGORY: ${transactionCategory ? transactionCategory.replace(/_/g, ' ').toUpperCase() : 'NORMAL TRANSFER'}${includeBondRegistration ? ' + BOND REGISTRATION' : ''}

═══════════════════════════════════════
CONVEYANCER (APPEARER) DETAILS:
═══════════════════════════════════════
Conveyancer Name: ${conveyancerName || 'To be confirmed'}
Law Firm: ${conveyancerFirm || 'To be confirmed'}
Office Location: Gaborone, Botswana

${(extractedOwnerName || extractedPlotNumber || extractedPropertyAddress || extractedTitleDeedNumber || extractedBuyerName || extractedSellerName || extractedClientName) ? `═══════════════════════════════════════
DOCUMENT OCR EXTRACTED DATA (HIGHEST PRIORITY — use this data over all other sources; party-tagged fields are AUTHORITATIVE — never reassign to the wrong party):
═══════════════════════════════════════
${extractedOwnerName ? `Registered Owner / SELLER Full Name: ${extractedOwnerName}` : ''}
${extractedOwnerIdNumber ? `Registered Owner / SELLER ID Number: ${extractedOwnerIdNumber}` : ''}
${extractedPreviousOwner ? `Previous Owner (chain of title seller): ${extractedPreviousOwner}` : ''}
${extractedPlotNumber ? `Plot / Stand Number: ${extractedPlotNumber}` : ''}
${extractedTitleDeedNumber ? `Title Deed / Certificate No: ${extractedTitleDeedNumber}` : ''}
${extractedPropertyAddress ? `Property Address: ${extractedPropertyAddress}` : ''}
${extractedPropertyDescription ? `Property Description (CERTAIN/SITUATE): ${extractedPropertyDescription}` : ''}
${extractedAdministrativeDistrict ? `Administrative District: ${extractedAdministrativeDistrict}` : ''}
${extractedExtent ? `Extent / Size: ${extractedExtent}` : ''}
${extractedPurchasePrice ? `Purchase Price from Deed: ${extractedPurchasePrice}` : ''}
${extractedHasMortgageBond ? `Mortgage Bond Registered: Yes${extractedMortgageBondNumber ? ` — Bond No: ${extractedMortgageBondNumber}` : ''}` : ''}
${extractedBuyerName ? `BUYER Full Name (party-tagged from ID document): ${extractedBuyerName}` : (extractedClientName ? `Buyer Name (from ID document): ${extractedClientName}` : '')}
${extractedBuyerIdNumber ? `BUYER ID / Passport Number (party-tagged from ID document): ${extractedBuyerIdNumber}` : (extractedIdNumber ? `Buyer ID Number (from ID document): ${extractedIdNumber}` : '')}
${extractedBuyerDateOfBirth ? `BUYER Date of Birth (party-tagged from ID document): ${extractedBuyerDateOfBirth}` : ''}
${extractedSellerName ? `SELLER Full Name (party-tagged from ID document): ${extractedSellerName}` : ''}
${extractedSellerIdNumber ? `SELLER ID / Passport Number (party-tagged from ID document): ${extractedSellerIdNumber}` : ''}
${extractedSellerDateOfBirth ? `SELLER Date of Birth (party-tagged from ID document): ${extractedSellerDateOfBirth}` : ''}
${extractedNameOfAppearer ? `Name of Appearer (Conveyancer): ${extractedNameOfAppearer}` : ''}
${extractedPlaceOfExecution ? `Place of Execution: ${extractedPlaceOfExecution}` : ''}
${extractedMonthAndYearOfPoa ? `Month and Year of Power of Attorney: ${extractedMonthAndYearOfPoa}` : ''}
${extractedSituate ? `Property Situate: ${extractedSituate}` : ''}
${extractedUnitsOfMeasurement ? `Units of Measurement: ${extractedUnitsOfMeasurement}` : ''}
${extractedDslNumber ? `DSL / Diagram Number: ${extractedDslNumber}` : ''}
${extractedNameOfSurveyor ? `Name of Surveyor: ${extractedNameOfSurveyor}` : ''}
${extractedDateOfSurvey ? `Date of Survey: ${extractedDateOfSurvey}` : ''}
${extractedDateOfApproval ? `Date of Approval: ${extractedDateOfApproval}` : ''}
${extractedNameOfPreviousDeed ? `Previous Deed Name/Type: ${extractedNameOfPreviousDeed}` : ''}
${extractedPreviousDeedNumber ? `Previous Deed Number: ${extractedPreviousDeedNumber}` : ''}
${extractedPreviousDeedDateOfRegistration ? `Previous Deed Date of Registration: ${extractedPreviousDeedDateOfRegistration}` : ''}
${extractedCurrentDeedDateOfRegistration ? `Current Deed Date of Registration: ${extractedCurrentDeedDateOfRegistration}` : ''}
${extractedCrmNumber ? `CRM Number: ${extractedCrmNumber}` : ''}
${extractedDateOfCrm ? `Date of CRM: ${extractedDateOfCrm}` : ''}
${extractedDfpsgNumber ? `DFPSG Number: ${extractedDfpsgNumber}` : ''}
${extractedDfpsgDateOfRegistration ? `DFPSG Date of Registration: ${extractedDfpsgDateOfRegistration}` : ''}
${extractedDfpsgOwnerName ? `DFPSG Owner Name: ${extractedDfpsgOwnerName}` : ''}
${extractedDateOfSale ? `Date of Sale (from Deed): ${extractedDateOfSale}` : ''}
${extractedPurchaserPlaceOfBirth ? `Purchaser Place of Birth: ${extractedPurchaserPlaceOfBirth}` : ''}
${extractedSellerPlaceOfBirth ? `Seller Place of Birth: ${extractedSellerPlaceOfBirth}` : ''}
${extractedSellerStatus ? `Seller Marital Status (from Deed): ${extractedSellerStatus}` : ''}
${extractedPurchaserStatus ? `Purchaser Marital Status (from Deed): ${extractedPurchaserStatus}` : ''}
` : ''}
═══════════════════════════════════════
BUYER (PURCHASER) INFORMATION:
═══════════════════════════════════════
Full Legal Name: ${resolveBuyerName()}
Date of Birth: ${resolveBuyerDateOfBirth()}
ID / Passport Number: ${resolveBuyerIdNumber()}
Entity Type: ${buyerDetails?.entityType || "Individual"}
Gender: ${buyerDetails?.gender || "Not specified"}
Nationality: ${buyerDetails?.nationality || "Motswana"}
Marital Status: ${buyerDetails?.maritalStatus || "Not specified"}
Contact Phone: ${buyerDetails?.phone || buyerDetails?.agentContact || "On file"}
Contact Email: ${buyerDetails?.email || buyerDetails?.agentEmail || "On file"}
First-time Buyer: ${buyerDetails?.isFirstTimeBuyer ? "Yes" : "No"}
${buyerDetails?.companyName ? `Company Name: ${buyerDetails.companyName}\nRegistration No: ${buyerDetails.registrationNumber || "Not specified"}` : ""}
${buyerDetails?.trustName ? `Trust Name: ${buyerDetails.trustName}\nTrust No: ${buyerDetails.trustNumber || "Not specified"}` : ""}
${buyerDetails?.hasBond !== undefined ? `Bond on Property: ${buyerDetails.hasBond ? "Yes" : "No"}` : ""}

${buyerDetails?.hasAgent ? `BUYER'S ESTATE AGENT:
Agent Name: ${buyerDetails.agentName || "Not specified"}
Agency: ${buyerDetails.agentCompany || "Not specified"}
Agent Contact: ${buyerDetails.agentContact || "Not specified"}
Agent Email: ${buyerDetails.agentEmail || "Not specified"}
Agent ID/Passport: ${buyerDetails.agentIdPassport || "Not specified"}
Registration No: ${buyerDetails.agentRegNumber || "Not specified"}
Tax ID: ${buyerDetails.agentTaxId || "Not specified"}
Commission: ${buyerDetails.commissionValue || "Not specified"}% (${buyerDetails.commissionType || "percentage"})
` : "No estate agent involved on buyer side."}

═══════════════════════════════════════
SELLER (TRANSFEROR) INFORMATION:
═══════════════════════════════════════
Full Legal Name: ${resolveSellerName()}
Date of Birth: ${resolveSellerDateOfBirth()}
ID / Passport Number: ${resolveSellerIdNumber()}
Entity Type: ${sellerDetails?.entityType || "Individual"}
Gender: ${sellerDetails?.gender || "Not specified"}
Nationality: ${sellerDetails?.nationality || "Motswana"}
Marital Status: ${sellerDetails?.maritalStatus || "Not specified"}
${extractedPreviousOwner ? `Previous Owner (chain of title): ${extractedPreviousOwner}` : ''}

═══════════════════════════════════════
PROPERTY & FINANCIAL DETAILS:
═══════════════════════════════════════
Property Price: ${propertyPrice || "Not specified"}
Valuation Amount: ${buyerDetails?.valuationAmount ? `P ${parseInt(buyerDetails.valuationAmount).toLocaleString()}` : "Not specified"}

DOCUMENTS ON FILE:
Buyer Documents: ${buyerDetails?.uploadedDocuments?.join(", ") || "Pending"}
Seller Documents: ${sellerDetails?.uploadedDocuments?.join(", ") || "Pending"}
${pdfDocsByParty.length > 0 ? `
PDF DOCUMENT INVENTORY (these PDF filenames are listed ONLY so you know which documents the user uploaded — FILENAMES ARE NOT DATA. Never copy any part of a filename into the output. Their actual extracted content (if any) is already in the DOCUMENT OCR EXTRACTED DATA block above):
${pdfDocsByParty.map((d, i) => `  ${i + 1}. type=${d.type || "unspecified"} — belongs to ${d.party ? d.party.toUpperCase() : "UNTAGGED"}`).join("\n")}` : ""}
${imageUrls.length > 0 ? `
═══════════════════════════════════════
ATTACHED DOCUMENT IMAGES (${imageUrls.length} document image(s) — ${imageUrls.filter(i => i.party === 'buyer').length} for BUYER, ${imageUrls.filter(i => i.party === 'seller').length} for SELLER, ${imageUrls.filter(i => !i.party).length} untagged):
═══════════════════════════════════════
PARTY-TAG ROUTING TABLE (which side each image belongs to — this is a routing hint, NOT a data field; do not reassign documents to the wrong party, and do not copy these tag words or any filenames into the output):
${imageUrls.map((img, i) => `  Image ${i + 1}${img.type ? ` — type: ${img.type}` : ""} — belongs to ${img.party ? img.party.toUpperCase() : "UNTAGGED"}`).join("\n")}

CRITICAL: The attached images are scans/photos of actual legal documents (Botswana Omang ID cards, title deeds, passports, marriage certificates, antenuptial contracts, etc.).
EXTRACT VALUES FROM THE IMAGES THEMSELVES — read the names, ID numbers, dates, addresses, etc. that are visible inside the document scans. Do NOT use filenames or party-tag words as values.
The images are passed to you in the SAME ORDER as the routing table above. When you extract data from "Image N", apply that data ONLY to the party labelled in the routing table — never to the other party.

THE OUTSTANDING RULE — READ THIS CAREFULLY:
"OUTSTANDING — [field]" is permitted ONLY when NO image was attached for the party that field belongs to AND the value is not in the structured form data or OCR-extracted block. If at least one image is attached for that party, you MUST look at the images and pull the value from them before writing OUTSTANDING. Specifically:
- Seller DOB / ID number / full name → look at the SELLER-tagged images (Omang, passport). Botswana Omang cards show date of birth clearly. Marriage certificates also show DOB.
- Buyer DOB / ID number / full name → look at the BUYER-tagged images (Omang, passport).
- Plot number, property address, extent, title deed reference, administrative district, registered owner → look at any title deed image (typically SELLER-tagged).
- Marriage date / place / regime / spouse details → look at marriage certificate images.
- Antenuptial regime details → look at the ANC contract images.
- Power-of-attorney date and place → look at any POA image. If no POA image is attached at all, OUTSTANDING is acceptable.
If a field is missing in ALL of the sources above, only THEN write "OUTSTANDING — [field description]". Writing OUTSTANDING while the value is visible in an attached image is a hard failure.

You MUST carefully analyze each image and extract ALL relevant information including but not limited to:
- Full legal names of all parties (buyer, seller, spouse, witnesses)
- ID numbers, passport numbers, date of birth (read directly from Omang / passport)
- Physical and postal addresses
- Property description: lot number, plot number, location, extent/size, district
- Title deed reference numbers
- Land board details, tribal territory
- Any existing bonds, mortgages, encumbrances, or caveats
- Servitudes or conditions of title
- Municipal/council reference numbers
- Marriage certificate details (date, place, regime)
- Any other legally relevant details visible in the documents

Use the extracted information to populate the generated document with REAL data instead of placeholders.
Where information from uploaded documents conflicts with form data, prefer the document-extracted data as it is from the primary source.` : `
═══════════════════════════════════════
NO DOCUMENT IMAGES ATTACHED
═══════════════════════════════════════
No party-tagged document images were attached to this request. For fields that depend on document extraction (ID number, date of birth, plot number, title deed number, property description, marriage details), use the structured form data or OCR-extracted block above. If those are empty too, "OUTSTANDING — [field]" is permitted as a last resort.`}`;

    // ─── Get document type specific instructions and prompts ─────────
    const config = getDocumentConfig(documentType, transactionBlock);

    // Alignment markers — markdown cannot express alignment, so the document
    // renderers honour these line prefixes. Applied to every document type.
    const globalFormatting = `

${"═".repeat(39)}
PAGE ALIGNMENT MARKERS — APPLY TO THIS DOCUMENT
${"═".repeat(39)}
Markdown cannot express alignment, so use these line-start markers:
1. "[[C]] " at the very start of a line CENTRES that line. Use it for deed cover lines such as "by", "in favour of", "in respect of", the party-name lines, the lot/property line, and the deed-number line.
2. "[[R]] " at the very start of a line RIGHT-ALIGNS it. Use it for the "Prepared by me" block and the conveyancer name/"Conveyancer" line on a deed cover.
3. Do NOT mark ordinary body paragraphs, numbered/lettered clauses (1, 1.1, 2, a, etc.) or the CERTAIN/SITUATE/MEASURING property block — the renderer automatically justifies body prose, left-indents numbered clauses, and left-aligns bold-labelled lines.
4. When listing Party Names, Dates of Birth, and Marital Status as standalone blocks (e.g. in Declarations), they MUST be centered:
   [[C]] KOKELETSO MARIRI
   [[C]] (Born on the 15 JULY 1983)
   [[C]] (BACHELOR)
5. Catchphrases at the bottom of pages MUST be right-aligned using [[R]]:
   [[R]] ... / CERTAIN
   [[R]] .... / ENDORSEMENTS
   [[R]] ..... / SIGNED
6. Execution blocks (signatures) should be formatted cleanly. E.g.:
   In my presence
   [[R]] ......................................
   [[R]] q.q. his Principal
   ......................................
   Registrar of Deeds Botswana
7. "AS WITNESSES" blocks should have left-aligned witnesses and a right-aligned principal signature line:
   **AS WITNESSES**
   1 ......................................
   2 ......................................
   [[R]] ......................................
   [[R]] KENNETH OBRIEN MPHO MAPOKA
8. "AFFIDAVIT OF BIRTH" MUST have the heading and party block centered, and a specific layout for signatures:
   [[C]] AFFIDAVIT OF BIRTH
   I, the undersigned,
   [[C]] KENNETH OBRIEN MPHO MAPOKA
   hereby make oath and say
   1 I was born at FRANCISTOWN on the 4 AUGUST 1985;
   ...
   [[R]] ......................................
   [[R]] KENNETH OBRIEN MPHO MAPOKA
   THUS SIGNED AND SWORN TO BEFORE ME AT GABORONE ON THIS ________ DAY OF ________ 2024 BY THE DEPONENT WHO ACKNOWLEDGED THAT HE KNOWS AND UNDERSTANDS THE CONTENTS OF THIS AFFIDAVIT.
   [[R]] ......................................
   [[R]] COMMISSIONER OF OATHS

BOTSWANA CONVEYANCING BUSINESS RULES:
• Transfer Duty: Citizens 0% on first P1,500,000 then 5%; Non-citizens 10% up to P2M then 15%
• First-Time Buyer Exemption: Citizens only, Section 20(1)(f) Transfer Duty Act
• Rates Clearance required before transfer
• Land Board Consent may be needed where applicable (tribal land only)
• Bond Cancellation may be needed where applicable (only if existing bond)
• All transfers comply with Financial Intelligence Act

WORDING RULE: Use "may be needed where applicable" for conditional documents. Never "will be needed".`;
    config.instructions = config.instructions + globalFormatting;

    const instructions = knowledgeBaseContent
      ? `${config.instructions}\n\n${"═".repeat(39)}\nKNOWLEDGE BASE — STRUCTURAL REFERENCE ONLY\n${"═".repeat(39)}\nThe following is an authoritative STRUCTURAL TEMPLATE from the Minchin & Kelly knowledge base showing the correct format, section order, legal phrasing style, and clause structure for Botswana conveyancing documents.\n\nCRITICAL RULES:\n- Use this ONLY as a structural and stylistic guide — learn the format, section headings, clause ordering, and legal language patterns.\n- NEVER copy placeholder text (e.g. "[FULL NAME OF TRANSFEROR]", "[GABORONE / FRANCISTOWN / LOBATSE]") into your output.\n- NEVER reproduce the template content verbatim. Every sentence must be generated fresh using the ACTUAL transaction data provided by the user.\n- Replace ALL bracketed placeholders with real data from the transaction details and uploaded documents.\n- For every field, follow the DATA RESOLUTION ORDER from the document-specific instructions: party block → OCR-extracted block → attached image extraction → "To be confirmed" (last resort only). Do NOT write "To be confirmed" while real data exists in the OCR-extracted block or attached images.\n- Never output a bracket placeholder like [NAME] or [DOB] under any circumstances.\n- FILENAMES ARE NOT DATA. The PDF inventory and image routing table list file names / party tags only so you know what was uploaded. Never copy a filename, party-tag word ("BUYER" / "SELLER"), or document type label into the output as a field value. Read values from inside the images and from the OCR-extracted block.\n- LABELLED FIELD FORMATTING. When stating any labelled fact (Plot Number, Date of Birth, ID Number, Reference, Status, etc.) outside the formal CERTAIN/SITUATE/MEASURING tabular property block, put the label on its own line and the value on the next line — no colon. Write "Plot Number\\\\n15583", never "Plot Number: 15583". The statutory CERTAIN/SITUATE/etc. property block keeps its same-line tabular registry format.\n\n${knowledgeBaseContent}`
      : config.instructions;
    const textPrompt = config.prompt;

    // ─── Build Chat Completions messages array ──────────────────────
    const contentParts: any[] = [
      { type: "text", text: textPrompt },
    ];

    if (imageUrls.length > 0) {
      for (const img of imageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url: img.url },
        });
      }
    }

    const messages = [
      { role: "system", content: instructions },
      { role: "user", content: contentParts },
    ];

    log("INFO", "Calling Uhuru API", {
      url: chatUrl,
      model,
      documentType,
      imageCount: imageUrls.length,
      buyerImages: imageUrls.filter((i) => i.party === "buyer").length,
      sellerImages: imageUrls.filter((i) => i.party === "seller").length,
      untaggedImages: imageUrls.filter((i) => !i.party).length,
      pdfInventoryCount: pdfDocsByParty.length,
      stream: !!wantStream,
    });

    // ─── Call Uhuru API (Chat Completions format) ─────────────────────
    if (wantStream) {
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 1,
          max_tokens: 32768,
          stream: true,
        }),
      });

      log("INFO", "Uhuru stream response", { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        log("ERROR", "Uhuru stream error", { status: response.status, body: errText });
        return new Response(
          JSON.stringify({ error: `Uhuru API error: ${response.status}`, details: errText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 1,
        max_tokens: 32768,
      }),
    });

    log("INFO", "Uhuru response", { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      log("ERROR", "Uhuru non-stream error", { status: response.status, body: errText });
      return new Response(
        JSON.stringify({ error: `Uhuru API error: ${response.status}`, details: errText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    log("INFO", "Uhuru response parsed", { hasChoices: !!data.choices?.length });
    const document = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ document }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log("ERROR", "Unhandled exception", { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
