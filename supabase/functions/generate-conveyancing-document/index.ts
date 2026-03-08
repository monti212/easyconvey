import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("UHURU_API_KEY");
    const model = Deno.env.get("U35_model") || "gpt-5.2";
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured", details: "UHURU_API_KEY secret is not set in Supabase Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      transactionId,
      propertyPrice,
      buyerDetails,
      sellerDetails,
      buyerName,
      sellerName,
      stream: wantStream,
    } = await req.json();

    const instructions = `You are an expert Botswana property conveyancing attorney generating a legally binding Deed of Sale and Transfer Agreement.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE, COMPREHENSIVE, LEGALLY BINDING conveyancing agreement — NOT a summary or template
- Use proper legal language, numbered clauses, sub-clauses, and formal legal structure
- This must be suitable for actual use in a Botswana property transaction
- Include ALL standard clauses expected in a Botswana Deed of Sale
- Format using Markdown: use # for title, ## for parts, ### for sections, **bold** for defined terms, numbered lists for clauses
- The document should be at minimum 3000 words covering every aspect of the transaction
- Use the actual party details provided — do NOT use placeholder names
- Reference the Deeds Registry Act (Cap 33:02), Transfer Duty Act (Cap 53:01), and Tribal Land Act where applicable`;

    const input = `Generate a complete Deed of Sale and Transfer Agreement for the following Botswana property transaction:

TRANSACTION REFERENCE: ${transactionId}

═══════════════════════════════════════
BUYER (PURCHASER) INFORMATION:
═══════════════════════════════════════
Full Name: ${buyerDetails?.clientName || buyerName || "Not specified"}
Entity Type: ${buyerDetails?.entityType || "Individual"}
Gender: ${buyerDetails?.gender || "Not specified"}
Nationality: ${buyerDetails?.nationality || "Motswana"}
Marital Status: ${buyerDetails?.maritalStatus || "Not specified"}
ID Number: ${buyerDetails?.idNumber || "To be verified"}
Contact Phone: ${buyerDetails?.phone || "On file"}
Contact Email: ${buyerDetails?.email || "On file"}
First-time Buyer: ${buyerDetails?.isFirstTimeBuyer ? "Yes" : "No"}

${buyerDetails?.hasAgent ? `BUYER'S ESTATE AGENT:
Agent Name: ${buyerDetails.agentName || "Not specified"}
Agency: ${buyerDetails.agentCompany || "Not specified"}
Agent Contact: ${buyerDetails.agentContact || "Not specified"}
Agent Email: ${buyerDetails.agentEmail || "Not specified"}
Registration No: ${buyerDetails.agentRegNumber || "Not specified"}
Commission: ${buyerDetails.commissionValue || "Not specified"}% (${buyerDetails.commissionType || "percentage"})
` : "No estate agent involved on buyer side."}

═══════════════════════════════════════
SELLER (TRANSFEROR) INFORMATION:
═══════════════════════════════════════
Full Name: ${sellerDetails?.clientName || sellerName || "Not specified"}
Entity Type: ${sellerDetails?.entityType || "Individual"}
Gender: ${sellerDetails?.gender || "Not specified"}
Nationality: ${sellerDetails?.nationality || "Motswana"}
Marital Status: ${sellerDetails?.maritalStatus || "Not specified"}
ID Number: ${sellerDetails?.idNumber || "To be verified"}

═══════════════════════════════════════
PROPERTY & FINANCIAL DETAILS:
═══════════════════════════════════════
Property Price: ${propertyPrice || "Not specified"}
Valuation Amount: ${buyerDetails?.valuationAmount ? `P ${parseInt(buyerDetails.valuationAmount).toLocaleString()}` : "Not specified"}

DOCUMENTS ON FILE:
Buyer Documents: ${buyerDetails?.uploadedDocuments?.join(", ") || "Pending"}
Seller Documents: ${sellerDetails?.uploadedDocuments?.join(", ") || "Pending"}

═══════════════════════════════════════
REQUIRED AGREEMENT STRUCTURE:
═══════════════════════════════════════

Generate the FULL agreement with these parts:

# DEED OF SALE AND TRANSFER AGREEMENT

## PART A — PRELIMINARY
1. Date of Agreement
2. Definitions and Interpretation (define Purchase Price, Property, Transfer Date, Effective Date, Business Day, Conveyancer, etc.)
3. Parties to the Agreement (full details of Buyer and Seller)

## PART B — SALE AGREEMENT
4. Sale of Property (description, what is included — fixtures, improvements)
5. Purchase Price and Payment Terms (amount, deposit if any, balance, method of payment, trust account details)
6. Conditions Precedent (bond approval if applicable, compliance certificates)
7. Transfer Duty and Costs (who bears what — Transfer Duty Act Cap 53:01 obligations)
8. Risk and Insurance (when risk passes to buyer, insurance obligations)
9. Occupational Rent (if buyer occupies before transfer, or seller remains after)

## PART C — TRANSFER PROVISIONS
10. Transfer Process (Deeds Registry Act Cap 33:02 compliance, conveyancer appointment)
11. Title Deed and Ownership Warranty (seller warrants clear title, no encumbrances)
12. Existing Bonds and Encumbrances (cancellation of existing bonds)
13. Municipal/Council Compliance (rates clearance, building regulations)
14. Property Inspection and Condition (voetstoots clause — as-is, defect disclosure)

## PART D — OBLIGATIONS AND WARRANTIES
15. Seller's Warranties (ownership, no pending litigation, no undisclosed defects, tax compliance)
16. Buyer's Warranties (financial capacity, legal capacity)
17. Anti-Money Laundering Compliance (Financial Intelligence Act obligations)
18. Environmental Compliance (Environmental Assessment Act if applicable)

## PART E — DEFAULT AND REMEDIES
19. Breach and Remedies (material breach definition, cure period, penalties)
20. Cancellation Rights (conditions for cancellation, consequences)
21. Penalty and Forfeiture (deposit forfeiture, rouwkoop — cancellation penalty)
22. Force Majeure

## PART F — GENERAL PROVISIONS
23. Dispute Resolution (mediation, arbitration, jurisdiction — High Court of Botswana)
24. Notices and Communication (formal notice requirements, addresses)
25. Entire Agreement and Amendments (no verbal amendments, variation clause)
26. Governing Law (Laws of Botswana)
27. Severability
28. Costs (each party's legal costs)
29. Cession and Assignment
30. Confidentiality

## PART G — EXECUTION
31. Signature Blocks for Buyer, Seller, and Witnesses
32. Conveyancer's Certificate

Generate the COMPLETE text for every single clause with proper legal language. This is NOT a template — fill in all actual details from the transaction data provided.`;

    // If streaming is requested, use SSE
    if (wantStream) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions,
          input,
          temperature: 0.15,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ error: err.error?.message || `OpenAI error: ${response.status}`, details: JSON.stringify(err) }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Forward the SSE stream
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming: wait for full response
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        temperature: 0.15,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err.error?.message || `OpenAI error: ${response.status}`, details: JSON.stringify(err) }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const document = data.output_text || "";

    return new Response(
      JSON.stringify({ document }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
