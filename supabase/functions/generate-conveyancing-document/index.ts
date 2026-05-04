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
      // Transaction category
      transactionCategory,
      includeBondRegistration,
      // OCR-extracted fields from title deed scan
      extractedOwnerName,
      extractedPlotNumber,
      extractedPropertyAddress,
      extractedPropertyDescription,
      extractedTitleDeedNumber,
      extractedAdministrativeDistrict,
      extractedExtent,
      extractedClientName,
      extractedIdNumber,
    } = await req.json();

    // ─── Fetch document URLs from Supabase Storage ───────────────────
    const imageUrls: string[] = [];
    const pdfDocNames: string[] = [];

    // Add base64 data URLs directly (bypasses storage — most reliable)
    if (documentImages && documentImages.length > 0) {
      for (const img of documentImages) {
        if (img.dataUrl && img.dataUrl.startsWith('data:image/')) {
          imageUrls.push(img.dataUrl);
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

      for (const docPath of documentPaths) {
        const path: string = docPath.path || docPath;
        const bucket: string = docPath.bucket || "documents";

        try {
          if (isImageFile(path)) {
            // Download image and convert to base64 data URL
            const { data, error } = await supabase.storage
              .from(bucket)
              .download(path);

            if (error || !data) continue;

            const arrayBuffer = await data.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const ext = path.toLowerCase().split(".").pop() || "jpeg";
            const mimeType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";
            imageUrls.push(`data:${mimeType};base64,${base64}`);
            log("INFO", "Image converted to base64", { path, size: bytes.length });
          } else {
            // Track PDF/other docs by name
            const filename = path.split("/").pop() || path;
            pdfDocNames.push(filename);
          }
        } catch (dlErr) {
          log("WARN", "Failed to download image", { path, error: (dlErr as Error).message });
        }
      }
    }

    // ─── Resolve buyer/seller names from various data shapes ─────────
    const resolveBuyerName = () => {
      if (buyerDetails?.clientName) return buyerDetails.clientName;
      if (buyerDetails?.hasAgent && buyerDetails?.agentName) return buyerDetails.agentName;
      if (buyerDetails?.companyName) return buyerDetails.companyName;
      if (buyerDetails?.trustName) return buyerDetails.trustName;
      if (buyerDetails?.deceasedName) return buyerDetails.deceasedName;
      if (buyerDetails?.societyName) return buyerDetails.societyName;
      return buyerName || "Not specified";
    };

    const resolveSellerName = () => {
      if (sellerDetails?.clientName) return sellerDetails.clientName;
      if (sellerDetails?.hasAgent && sellerDetails?.agentName) return sellerDetails.agentName;
      if (sellerDetails?.companyName) return sellerDetails.companyName;
      if (sellerDetails?.trustName) return sellerDetails.trustName;
      return sellerName || "Not specified";
    };

    // ─── Transaction details block (shared across all document types) ──
    const transactionBlock = `
TRANSACTION REFERENCE: ${transactionId}
TRANSACTION CATEGORY: ${transactionCategory || 'Normal Transfer'}${includeBondRegistration ? ' + Bond Registration' : ''}

${(extractedOwnerName || extractedPlotNumber || extractedPropertyAddress || extractedTitleDeedNumber) ? `═══════════════════════════════════════
TITLE DEED — OCR EXTRACTED DATA (PRIMARY SOURCE — use this for property details):
═══════════════════════════════════════
${extractedOwnerName ? `Registered Owner (Seller): ${extractedOwnerName}` : ''}
${extractedPlotNumber ? `Plot / Stand Number: ${extractedPlotNumber}` : ''}
${extractedTitleDeedNumber ? `Title Deed / Certificate No: ${extractedTitleDeedNumber}` : ''}
${extractedPropertyAddress ? `Property Address: ${extractedPropertyAddress}` : ''}
${extractedPropertyDescription ? `Property Description (CERTAIN/SITUATE): ${extractedPropertyDescription}` : ''}
${extractedAdministrativeDistrict ? `Administrative District: ${extractedAdministrativeDistrict}` : ''}
${extractedExtent ? `Extent / Size: ${extractedExtent}` : ''}
${extractedClientName ? `Client Name (from ID document): ${extractedClientName}` : ''}
${extractedIdNumber ? `ID Number (from ID document): ${extractedIdNumber}` : ''}
` : ''}
═══════════════════════════════════════
BUYER (PURCHASER) INFORMATION:
═══════════════════════════════════════
Full Name: ${resolveBuyerName()}
Entity Type: ${buyerDetails?.entityType || "Individual"}
Gender: ${buyerDetails?.gender || "Not specified"}
Nationality: ${buyerDetails?.nationality || "Motswana"}
Marital Status: ${buyerDetails?.maritalStatus || "Not specified"}
ID Number: ${buyerDetails?.idNumber || buyerDetails?.agentIdPassport || "To be verified"}
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
Full Name: ${resolveSellerName()}
Entity Type: ${sellerDetails?.entityType || "Individual"}
Gender: ${sellerDetails?.gender || "Not specified"}
Nationality: ${sellerDetails?.nationality || "Motswana"}
Marital Status: ${sellerDetails?.maritalStatus || "Not specified"}
ID Number: ${sellerDetails?.idNumber || sellerDetails?.agentIdPassport || "To be verified"}

═══════════════════════════════════════
PROPERTY & FINANCIAL DETAILS:
═══════════════════════════════════════
Property Price: ${propertyPrice || "Not specified"}
Valuation Amount: ${buyerDetails?.valuationAmount ? `P ${parseInt(buyerDetails.valuationAmount).toLocaleString()}` : "Not specified"}

DOCUMENTS ON FILE:
Buyer Documents: ${buyerDetails?.uploadedDocuments?.join(", ") || "Pending"}
Seller Documents: ${sellerDetails?.uploadedDocuments?.join(", ") || "Pending"}
${pdfDocNames.length > 0 ? `PDF Documents Available: ${pdfDocNames.join(", ")}` : ""}
${imageUrls.length > 0 ? `
═══════════════════════════════════════
ATTACHED DOCUMENT IMAGES (${imageUrls.length} document(s)):
═══════════════════════════════════════
CRITICAL: The attached images are scans/photos of actual legal documents (IDs, title deeds, passports, marriage certificates, etc.).
You MUST carefully analyze each image and extract ALL relevant information including but not limited to:
- Full legal names of all parties (buyer, seller, spouse, witnesses)
- ID numbers, passport numbers, date of birth
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
Where information from uploaded documents conflicts with form data, prefer the document-extracted data as it is from the primary source.` : ""}`;

    // ─── Get document type specific instructions and prompts ─────────
    const config = getDocumentConfig(documentType, transactionBlock);
    const instructions = knowledgeBaseContent
      ? `${config.instructions}\n\n${"═".repeat(39)}\nKNOWLEDGE BASE — STRUCTURAL REFERENCE ONLY\n${"═".repeat(39)}\nThe following is an authoritative STRUCTURAL TEMPLATE from the Minchin & Kelly knowledge base showing the correct format, section order, legal phrasing style, and clause structure for Botswana conveyancing documents.\n\nCRITICAL RULES:\n- Use this ONLY as a structural and stylistic guide — learn the format, section headings, clause ordering, and legal language patterns.\n- NEVER copy placeholder text (e.g. "[FULL NAME OF TRANSFEROR]", "[GABORONE / FRANCISTOWN / LOBATSE]") into your output.\n- NEVER reproduce the template content verbatim. Every sentence must be generated fresh using the ACTUAL transaction data provided by the user.\n- Replace ALL bracketed placeholders with real data from the transaction details and uploaded documents.\n- If real data is not available for a field, write "To be confirmed" — never output a bracket placeholder.\n\n${knowledgeBaseContent}`
      : config.instructions;
    const textPrompt = config.prompt;

    // ─── Build Chat Completions messages array ──────────────────────
    const contentParts: any[] = [
      { type: "text", text: textPrompt },
    ];

    if (imageUrls.length > 0) {
      for (const url of imageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url },
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
