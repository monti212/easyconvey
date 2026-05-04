import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clipboard, Download, FileText, Users, Clock, Banknote, UserCircle, Building, Lock, Shield, ExternalLink, Share2, Loader2, Sparkles, Eye, Printer, StopCircle, PlayCircle, FolderDown, Send, Building2, FileDown } from 'lucide-react';
import { downloadAsWord } from '../../lib/downloadAsWord';
import { useTransactions } from '../../App';
import { pdf } from '@react-pdf/renderer';
import TransactionSummaryPDF from '../../lib/pdf/transactionSummary';
import DeedOfSalePDF from '../../lib/pdf/deedOfSale';
import DocumentStreamViewer from '../DocumentStreamViewer';
import * as casesService from '../../services/cases.service';
import { supabase } from '../../lib/supabase';
import type { Case } from '../../types/database';
import JSZip from 'jszip';

interface Step7Props {
  transactionData: {
    transactionType: string;
    documentUploaded: boolean;
    documentValid: boolean;
    hasBond?: boolean;
    bondDocument?: string;
    sellingPrice: string;
    valuationAmount?: string;
    valuationDocument?: string;
    hasAgent: boolean;
    agentName: string;
    agentContact: string;
    agentEmail?: string;
    agentIdPassport?: string;
    agentCompany?: string;
    agentRegNumber?: string;
    agentTaxId?: string;
    commissionType?: string;
    commissionValue?: string;
    entityType: string;
    gender: string;
    nationality: string;
    maritalStatus: string;
    requiredDocuments: string[];
    uploadedDocuments: string[];
    isFirstTimeBuyer?: boolean; // Added for first time buyer status
    documentFilePaths?: { path: string; bucket: string; name: string; type: string }[];
    documentDataUrls?: { dataUrl: string; name: string; docType: string }[];
  };
  transactionId: string | null;
  supabaseCaseId?: string | null;
  onPrevious: () => void;
  mode?: 'conveyancer' | 'client';
  clientToken?: string;
  onClientSubmitComplete?: () => void;
  onComplete?: () => void;
  onFinalSubmit?: () => Promise<void>;
  firmName?: string;
  lawyerName?: string;
  lawFirms?: { id: string; name: string }[];
  onSendToLawFirm?: (firmId: string, firmName: string) => void;
}

type DocumentType = 'deed_of_sale' | 'deed_of_transfer' | 'transfer_duty' | 'power_of_attorney' | 'declaration_of_purchase' | 'affidavit' | 'bond_registration' | 'missing_information';

const DOC_TYPES: { id: DocumentType; label: string; short: string }[] = [
  { id: 'missing_information', label: 'Missing Information Checklist', short: 'Readiness Check' },
  { id: 'deed_of_sale', label: 'Deed of Sale & Transfer', short: 'Deed of Sale' },
  { id: 'deed_of_transfer', label: 'Deed of Transfer (Registry)', short: 'Deed of Transfer' },
  { id: 'transfer_duty', label: 'Transfer Duty Declaration', short: 'Transfer Duty' },
  { id: 'power_of_attorney', label: 'Power of Attorney to Transfer', short: 'POA & Seller Dec.' },
  { id: 'declaration_of_purchase', label: 'Declaration of Purchaser', short: 'Purchaser Dec.' },
  { id: 'affidavit', label: 'Affidavit', short: 'Affidavit' },
  { id: 'bond_registration', label: 'Bond Registration', short: 'Bond Reg.' },
];

const Step7Summary: React.FC<Step7Props> = ({
  transactionData,
  transactionId,
  supabaseCaseId,
  onPrevious,
  mode = 'conveyancer',
  clientToken,
  onClientSubmitComplete,
  onComplete,
  onFinalSubmit,
  firmName = 'Minchin & Kelly',
  lawyerName = 'Conveyancer',
  lawFirms,
  onSendToLawFirm,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [conveyancerLinkCopied, setConveyancerLinkCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedLawFirm, setSelectedLawFirm] = useState('');
  const [lawFirmSent, setLawFirmSent] = useState(false);
  const { markTransactionComplete } = useTransactions();

  const formatPrice = (value: string) => {
    if (!value) return 'P 0';
    return `P ${new Intl.NumberFormat().format(parseInt(value))}`;
  };

  const getMaritalStatusDisplay = (status: string) => {
    switch (status) {
      case 'single': return 'Single';
      case 'married_in': return 'Married (In Community of Property)';
      case 'married_out': return 'Married (Out of Community of Property)';
      case 'divorced': return 'Divorced';
      case 'widowed': return 'Widowed';
      default: return status;
    }
  };

  const getEntityTypeDisplay = (type: string) => {
    switch (type) {
      case 'individual': return 'Individual';
      case 'company': return 'Company';
      case 'trust': return 'Estate Trust';
      default: return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const transactionReferenceId = React.useMemo(() =>
    transactionId || Math.random().toString(36).substring(2, 10).toUpperCase(),
    [transactionId]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [caseRecord, setCaseRecord] = useState<Case | null>(null);

  // Derive display names for buyer and seller based on current party's role and case record
  const isBuyerRole = transactionData.transactionType !== 'selling';

  // Current party (conveyancer's client) — use OCR-extracted name if no other name available
  const currentPartyDisplayName = transactionData.hasAgent
    ? transactionData.agentName
    : (transactionData as any).companyName
    || (transactionData as any).trustName
    || (transactionData as any).deceasedName
    || (transactionData as any).extractedClientName   // from ID document OCR
    || (transactionData as any).extractedOwnerName    // from title deed OCR
    || 'Pending';

  // Counter-party — use OCR registered owner (= seller) as fallback when they haven't submitted yet
  const counterpartyDisplayName = isBuyerRole
    ? (caseRecord?.seller_data?.clientName
      || caseRecord?.seller_data?.agentName
      || (transactionData as any).extractedOwnerName  // registered owner from deed = seller
      || 'Pending')
    : (caseRecord?.buyer_data?.clientName
      || caseRecord?.buyer_data?.agentName
      || (transactionData as any).extractedClientName
      || 'Pending');

  const resolvedBuyerName = isBuyerRole ? currentPartyDisplayName : counterpartyDisplayName;
  const resolvedSellerName = isBuyerRole ? counterpartyDisplayName : currentPartyDisplayName;

  useEffect(() => {
    let active = true;
    async function fetchCaseData() {
      try {
        if (mode === 'conveyancer' && transactionId) {
          const record = await casesService.getCase(transactionId);
          if (active) setCaseRecord(record);
        } else if (mode === 'client' && clientToken) {
          const result = await casesService.getCaseByToken(clientToken);
          if (active && result && !result.expired) {
            setCaseRecord(result.case_);
          }
        }
      } catch {
        // Graceful fallback: document generation still works with partial data
      }
    }
    fetchCaseData();
    return () => { active = false; };
  }, [mode, transactionId, clientToken]);

  // AI Document Generation state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('deed_of_sale');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<Record<string, string>>({});
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docsLoaded, setDocsLoaded] = useState(false);

  // Sequential generation state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationQueue, setGenerationQueue] = useState<DocumentType[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);
  const [isDownloadingPack, setIsDownloadingPack] = useState(false);

  // Load previously generated documents from DB on mount
  useEffect(() => {
    if (!supabaseCaseId || mode !== 'conveyancer') return;
    let active = true;
    async function loadSavedDocs() {
      try {
        const saved = await casesService.getGeneratedDocuments(supabaseCaseId!);
        if (!active || saved.length === 0) return;
        const docs: Record<string, string> = {};
        for (const doc of saved) {
          if (doc.status === 'completed' && doc.content) {
            docs[doc.document_type] = doc.content;
          }
        }
        if (Object.keys(docs).length > 0) {
          setGeneratedDocuments(prev => ({ ...docs, ...prev }));
        }
      } catch {
        // Table may not exist yet — graceful fallback
      } finally {
        if (active) setDocsLoaded(true);
      }
    }
    loadSavedDocs();
    return () => { active = false; };
  }, [supabaseCaseId, mode]);

  const buildPartyDetails = useCallback((data: any) => {
    if (!data) return null;
    // Priority: explicitly entered clientName > OCR-extracted name > entity-derived name
    const name = data.clientName?.trim()
      || data.extractedClientName?.trim()
      || (data.hasAgent ? data.agentName
        : data.entityType === 'company' ? data.companyName
        : data.entityType === 'trust' ? data.trustName
        : data.entityType === 'estate' ? data.deceasedName
        : data.entityType === 'society' ? data.societyName
        : undefined)
      || 'Not specified';

    const idNum = data.idPassportNumber?.trim()
      || data.extractedIdNumber?.trim()
      || data.agentIdPassport?.trim()
      || data.idNumber?.trim()
      || 'To be confirmed';

    const dob = data.dateOfBirth?.trim()
      || data.extractedDateOfBirth?.trim()
      || 'To be confirmed';

    return {
      clientName: name,
      dateOfBirth: dob,
      idNumber: idNum,
      entityType: data.entityType || 'individual',
      gender: data.gender || 'Not specified',
      nationality: data.nationality || 'Not specified',
      maritalStatus: data.maritalStatus || 'Not specified',
      phone: data.agentContact || data.phone || 'On file',
      email: data.agentEmail || data.email || 'On file',
      isFirstTimeBuyer: data.isFirstTimeBuyer || false,
      hasAgent: data.hasAgent,
      agentName: data.agentName,
      agentCompany: data.agentCompany,
      agentContact: data.agentContact,
      agentEmail: data.agentEmail,
      agentRegNumber: data.agentRegNumber,
      commissionType: data.commissionType,
      commissionValue: data.commissionValue,
      sellingPrice: data.sellingPrice,
      valuationAmount: data.valuationAmount,
      uploadedDocuments: data.uploadedDocuments,
      hasBond: data.hasBond,
      companyName: data.companyName,
      registrationNumber: data.registrationNumber,
      trustName: data.trustName,
      trustNumber: data.trustNumber,
    };
  }, []);

  // Persist a generated document to Supabase (fire-and-forget for background save)
  const saveDocToDb = useCallback((docType: string, docName: string, content: string, status: 'generating' | 'completed' | 'failed', errorMsg?: string) => {
    if (!supabaseCaseId || mode !== 'conveyancer') return;
    casesService.upsertGeneratedDocument(supabaseCaseId, docType, docName, content, status, errorMsg).catch(() => {});
  }, [supabaseCaseId, mode]);

  const generateDocument = useCallback(async (docType: DocumentType, signal?: AbortSignal) => {
    setIsGeneratingDoc(true);
    setSelectedDocType(docType);
    setDocError(null);
    setStreamingContent('');
    setActiveDocument(null);
    setShowDocViewer(true);

    const docName = DOC_TYPES.find(d => d.id === docType)?.label || docType;

    // Mark as generating in DB so other sessions can see it's in progress
    saveDocToDb(docType, docName, '', 'generating');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const currentPartyDetails = buildPartyDetails(transactionData);
      const isBuyer = transactionData.transactionType !== 'selling';

      let buyerDetails: any;
      let sellerDetails: any;
      let buyerName: string;
      let sellerName: string;

      if (isBuyer) {
        buyerDetails = currentPartyDetails;
        buyerName = currentPartyDetails?.clientName || 'Not specified';
        sellerDetails = buildPartyDetails(caseRecord?.seller_data);
        sellerName = sellerDetails?.clientName || 'Not specified';
      } else {
        sellerDetails = currentPartyDetails;
        sellerName = currentPartyDetails?.clientName || 'Not specified';
        buyerDetails = buildPartyDetails(caseRecord?.buyer_data);
        buyerName = buyerDetails?.clientName || 'Not specified';
      }

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-conveyancing-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
        },
        body: JSON.stringify({
          transactionId: transactionReferenceId,
          documentType: docType,
          propertyPrice: transactionData.sellingPrice ? `P ${parseInt(transactionData.sellingPrice).toLocaleString()}` : 'Not specified',
          buyerDetails,
          sellerDetails,
          buyerName,
          sellerName,
          documentPaths: (transactionData.documentFilePaths || []).map(fp => ({ path: fp.path, bucket: fp.bucket })),
          documentImages: (transactionData.documentDataUrls || []).map(d => ({ dataUrl: d.dataUrl, name: d.name, docType: d.docType })),
          stream: true,
          // Conveyancer details — needed for deed of transfer "appeared before me" clause
          conveyancerName: lawyerName || 'Conveyancer',
          conveyancerFirm: firmName || 'Minchin & Kelly',
          // Transaction category for document generation routing
          transactionCategory: (transactionData as any).transactionCategory || 'normal_transfer',
          includeBondRegistration: (transactionData as any).includeBondRegistration || false,
          // OCR-extracted fields from deed upload — primary source for property data
          extractedOwnerName: (transactionData as any).extractedOwnerName || '',
          extractedOwnerIdNumber: (transactionData as any).extractedOwnerIdNumber || '',
          extractedPreviousOwner: (transactionData as any).extractedPreviousOwner || '',
          extractedPurchasePrice: (transactionData as any).extractedPurchasePrice || '',
          extractedHasMortgageBond: (transactionData as any).extractedHasMortgageBond || false,
          extractedMortgageBondNumber: (transactionData as any).extractedMortgageBondNumber || '',
          extractedPlotNumber: (transactionData as any).extractedPlotNumber || '',
          extractedPropertyAddress: (transactionData as any).extractedPropertyAddress || '',
          extractedPropertyDescription: (transactionData as any).extractedPropertyDescription || '',
          extractedTitleDeedNumber: (transactionData as any).extractedTitleDeedNumber || '',
          extractedAdministrativeDistrict: (transactionData as any).extractedAdministrativeDistrict || '',
          extractedExtent: (transactionData as any).extractedExtent || '',
          extractedClientName: (transactionData as any).extractedClientName || '',
          extractedIdNumber: (transactionData as any).extractedIdNumber || '',
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `API request failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        try {
          while (true) {
            if (signal?.aborted) {
              await reader.cancel();
              break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (typeof delta === 'string' && delta) {
                  fullText += delta;
                  setStreamingContent(fullText);
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        } catch (e) {
          if (signal?.aborted) {
            // Save whatever we got so far if aborted mid-stream
            if (fullText) {
              setActiveDocument(fullText);
              setStreamingContent(fullText);
              setGeneratedDocuments(prev => ({ ...prev, [docType]: fullText }));
              saveDocToDb(docType, docName, fullText, 'completed');
            }
            throw new DOMException('Aborted', 'AbortError');
          }
          throw e;
        }

        if (!signal?.aborted) {
          setActiveDocument(fullText);
          setStreamingContent(fullText);
          setGeneratedDocuments(prev => ({ ...prev, [docType]: fullText }));
          // Persist completed document to DB
          saveDocToDb(docType, docName, fullText, 'completed');
        }
      } else {
        const data = await response.json();
        const text = data.document || '';
        setActiveDocument(text);
        setStreamingContent(text);
        setGeneratedDocuments(prev => ({ ...prev, [docType]: text }));
        saveDocToDb(docType, docName, text, 'completed');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Don't show error for user-initiated abort
        return;
      }
      console.error('Error generating document:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to generate document.';
      setDocError(errMsg);
      setShowDocViewer(false);
      saveDocToDb(docType, docName, '', 'failed', errMsg);
    } finally {
      setIsGeneratingDoc(false);
    }
  }, [transactionData, transactionReferenceId, caseRecord, buildPartyDetails, saveDocToDb]);

  // Generate all documents sequentially
  const generateAllDocuments = useCallback(async () => {
    const queue = DOC_TYPES.map(d => d.id);
    setGenerationQueue(queue);
    setCurrentQueueIndex(0);
    setIsGeneratingAll(true);
    stopRequestedRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    for (let i = 0; i < queue.length; i++) {
      if (stopRequestedRef.current || controller.signal.aborted) break;

      setCurrentQueueIndex(i);
      setSelectedDocType(queue[i]);

      try {
        await generateDocument(queue[i], controller.signal);
      } catch {
        // generateDocument handles its own errors; if aborted, stop the loop
        if (controller.signal.aborted) break;
      }
    }

    setIsGeneratingAll(false);
    abortControllerRef.current = null;
    setGenerationQueue([]);
  }, [generateDocument]);

  // Stop all generation
  const stopGeneration = useCallback(() => {
    stopRequestedRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGeneratingAll(false);
    setIsGeneratingDoc(false);
    setGenerationQueue([]);
  }, []);

  // Download all generated documents as a PDF zip pack
  const handleDownloadPack = useCallback(async () => {
    const generatedDocs = Object.entries(generatedDocuments);
    if (generatedDocs.length === 0) return;

    setIsDownloadingPack(true);
    try {
      const zip = new JSZip();

      for (const [docTypeId, content] of generatedDocs) {
        const docTitle = DOC_TYPES.find(d => d.id === docTypeId)?.label || 'Legal Document';
        let blob: Blob;
        try {
          blob = await pdf(
            <DeedOfSalePDF
              transactionId={transactionReferenceId}
              buyerName={resolvedBuyerName}
              sellerName={resolvedSellerName}
              propertyPrice={transactionData.sellingPrice || '0'}
              generatedContent={content}
              documentTitle={docTitle}
              firmName={firmName}
              lawyerName={lawyerName}
            />
          ).toBlob();
        } catch {
          blob = new Blob([content], { type: 'text/plain' });
        }
        const fileName = `${docTypeId}-${transactionReferenceId}.pdf`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-pack-${transactionReferenceId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create document pack:', err);
    } finally {
      setIsDownloadingPack(false);
    }
  }, [generatedDocuments, transactionReferenceId, transactionData, firmName, lawyerName]);

  const handleDocDownload = async () => {
    const content = activeDocument || generatedDocuments[selectedDocType];
    if (!content) return;
    let blob: Blob;
    try {
      const docTitle = DOC_TYPES.find(d => d.id === selectedDocType)?.label || 'Legal Document';
      blob = await pdf(
        <DeedOfSalePDF
          transactionId={transactionReferenceId}
          buyerName={resolvedBuyerName}
          sellerName={resolvedSellerName}
          propertyPrice={transactionData.sellingPrice || '0'}
          generatedContent={content}
          documentTitle={docTitle}
          firmName={firmName}
          lawyerName={lawyerName}
        />
      ).toBlob();
    } catch {
      blob = new Blob([content], { type: 'text/plain' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDocType}-${transactionReferenceId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDocDownloadWord = useCallback(async () => {
    const content = activeDocument || generatedDocuments[selectedDocType];
    if (!content) return;
    const docTitle = DOC_TYPES.find(d => d.id === selectedDocType)?.label || 'Legal Document';
    await downloadAsWord(
      content,
      docTitle,
      `${selectedDocType}-${transactionReferenceId}.docx`,
      firmName,
      transactionReferenceId,
      resolvedBuyerName,
      resolvedSellerName,
    );
  }, [activeDocument, generatedDocuments, selectedDocType, transactionReferenceId, firmName, resolvedBuyerName, resolvedSellerName]);

  const handleDocPrint = () => {
    const content = activeDocument || generatedDocuments[selectedDocType];
    if (!content) return;
    const docTitle = DOC_TYPES.find(d => d.id === selectedDocType)?.label || 'Legal Document';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Convert markdown to basic HTML for printing
      const htmlContent = content
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^[-*+] (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+[.)] (.*$)/gm, '<li>$1</li>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      printWindow.document.write(`<html><head><title>${docTitle} - ${transactionReferenceId}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 11pt; line-height: 1.7; color: #333; max-width: 700px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
  .header .firm { font-size: 8pt; letter-spacing: 4px; text-transform: uppercase; color: #4a3f8a; font-weight: bold; margin-bottom: 4px; }
  .header .republic { font-size: 9pt; letter-spacing: 3px; text-transform: uppercase; color: #999; margin-bottom: 8px; }
  .header .ref { font-size: 8pt; color: #999; }
  h1 { font-size: 14pt; text-align: center; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; margin: 20px 0; }
  h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a2e; border-bottom: 0.5px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 11pt; color: #333; margin-top: 16px; }
  h4 { font-size: 10pt; color: #444; margin-top: 12px; }
  p { text-align: justify; margin-bottom: 8px; }
  li { margin-bottom: 4px; }
  hr { border: none; border-top: 0.5px solid #ddd; margin: 16px 0; }
  strong { color: #1a1a2e; }
  .footer { text-align: center; border-top: 0.5px solid #ddd; padding-top: 12px; margin-top: 40px; font-size: 8pt; color: #999; text-transform: uppercase; letter-spacing: 2px; }
</style></head><body>
<div class="header">
  <div class="firm">${firmName}</div>
  <div class="republic">Republic of Botswana &middot; Property Conveyancing</div>
  <div class="ref">Ref: ${transactionReferenceId} &middot; ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<p>${htmlContent}</p>
<div class="footer">Prepared by ${firmName} | ${lawyerName}</div>
</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSubmitTransaction = async () => {
    if (mode === 'client' && clientToken) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await casesService.submitPartyData(clientToken, transactionData);
        if (!result.success) {
          setSubmitError(result.error || 'Submission failed. Please try again.');
          return;
        }
        setIsSubmitted(true);
        onClientSubmitComplete?.();
      } catch (err: any) {
        setSubmitError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (transactionId) {
        markTransactionComplete(transactionId);
      }
      // Persist completed status to Supabase
      if (onFinalSubmit) {
        await onFinalSubmit();
      }
      setIsSubmitted(true);
    }
  };

  const copyReferenceNumber = () => {
    navigator.clipboard.writeText(transactionReferenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate conveyancer dashboard link (case ID only — conveyancer fetches data from DB)
  const generateConveyancerLink = () => {
    return `${window.location.origin}?conveyancer=${transactionReferenceId}`;
  };

  const copyConveyancerLink = async () => {
    const link = generateConveyancerLink();
    try {
      await navigator.clipboard.writeText(link);
      setConveyancerLinkCopied(true);
      setTimeout(() => setConveyancerLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy conveyancer link:', err);
    }
  };

  const openConveyancerDashboard = () => {
    const link = generateConveyancerLink();
    window.open(link, '_blank');
  };
  
  const handleDownloadSummary = async () => {
    try {
      const blob = await pdf(
        <TransactionSummaryPDF
          transactionId={transactionId || 'UNKNOWN'}
          transactionType={transactionData.transactionType}
          buyerName={resolvedBuyerName}
          sellerName={resolvedSellerName}
          propertyPrice={transactionData.sellingPrice}
          nationality={transactionData.nationality}
          entityType={transactionData.entityType}
          hasAgent={transactionData.hasAgent}
          agentName={transactionData.agentName}
          agentCompany={transactionData.agentCompany}
          uploadedDocuments={transactionData.uploadedDocuments}
          firmName={firmName}
          lawyerName={lawyerName}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-summary-${transactionId || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };
  
  return (
    <div className="py-4 md:py-8 max-w-4xl mx-auto px-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">Submission Failed</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {isSubmitted ? (
        <div className="relative bg-white border border-[#D1D5DB] rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-[0px_6px_12px_rgba(0,0,0,0.08)]">
          {/* Navy header band */}
          <div className="bg-[#0B1F3A] px-5 py-6 md:px-8 md:py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAyMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50"></div>
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#C8A14F]/10 blur-3xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#C8A14F]/20 flex items-center justify-center flex-shrink-0 ring-2 ring-[#C8A14F]/30">
                <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-[#C8A14F]" />
              </div>
              <div>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-white tracking-tight">
                  {mode === 'client' ? 'Successfully Submitted' : 'Transaction Submitted'}
                </h3>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                  {mode === 'client'
                    ? 'Your information has been submitted to the conveyancer. They will review your details and contact you if anything else is needed.'
                    : 'Your property transaction is now live in the conveyancer dashboard.'}
                </p>
              </div>
            </div>
          </div>
          {/* Gold accent line */}
          <div className="h-0.5 bg-gradient-to-r from-[#C8A14F] via-[#C8A14F]/60 to-transparent"></div>
          {/* White body with actions */}
          <div className="px-5 py-4 md:px-8 md:py-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="h-3.5 w-3.5" />
              <span>Encrypted & Secure</span>
              <span className="mx-1 text-gray-300">|</span>
              <Shield className="h-3.5 w-3.5" />
              <span>POPIA Compliant</span>
            </div>
            {mode === 'conveyancer' && onComplete && !lawFirms && (
              <button
                onClick={onComplete}
                className="btn-shine px-4 py-2 text-sm font-medium text-[#0B1F3A] bg-[#C8A14F]/10 border border-[#C8A14F]/30 rounded-lg hover:bg-[#C8A14F]/20 transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative bg-white border border-[#D1D5DB] rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-[0px_4px_8px_rgba(0,0,0,0.05)]">
          <div className="bg-[#0B1F3A] px-5 py-5 md:px-8 md:py-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#C8A14F]/10 blur-3xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-[#C8A14F]" />
              </div>
              <div>
                <h3 className="font-serif text-lg md:text-xl font-bold text-white tracking-tight">Review Your Transaction</h3>
                <p className="text-sm text-gray-300 mt-0.5">
                  Please review all details below before submitting.
                </p>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-[#C8A14F] via-[#C8A14F]/60 to-transparent"></div>
        </div>
      )}

      {/* Send to Law Firm — shown when lawFirms prop is provided and transaction is submitted */}
      {isSubmitted && lawFirms && lawFirms.length > 0 && onSendToLawFirm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6 md:mb-8 shadow-sm">
          {lawFirmSent ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-emerald-800">Sent to Law Firm</h3>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Transaction has been sent to <span className="font-medium">{lawFirms.find(f => f.id === selectedLawFirm)?.name}</span> for conveyancing.
                </p>
                {onComplete && (
                  <button
                    onClick={onComplete}
                    className="mt-3 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#0B1F3A]/5 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-[#0B1F3A]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0B1F3A]">Send to Law Firm</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Select a conveyancing firm to handle this transaction
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedLawFirm}
                  onChange={e => setSelectedLawFirm(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8A14F]/40 focus:border-[#C8A14F]"
                >
                  <option value="">Select a law firm...</option>
                  {lawFirms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const firm = lawFirms.find(f => f.id === selectedLawFirm);
                    if (firm) {
                      onSendToLawFirm(firm.id, firm.name);
                      setLawFirmSent(true);
                    }
                  }}
                  disabled={!selectedLawFirm}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedLawFirm
                      ? 'bg-[#C8A14F] text-white hover:bg-[#b8923f]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Live Transaction Notification — conveyancer mode only */}
      {mode === 'conveyancer' && (
        <div className="flex items-center gap-3 bg-white border border-[#D1D5DB] rounded-xl px-4 py-3 md:px-5 md:py-3.5 mb-6 md:mb-8 shadow-[0px_4px_8px_rgba(0,0,0,0.05)]">
          <div className="relative flex-shrink-0">
            <div className="w-2.5 h-2.5 bg-[#2ECC71] rounded-full"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 bg-[#2ECC71] rounded-full animate-ping opacity-75"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#0B1F3A]">Live Data Integration</p>
            <p className="text-xs text-gray-500 mt-0.5">
              This transaction is live in the conveyancer dashboard with real-time progress tracking.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white overflow-hidden rounded-2xl border border-[#D1D5DB] shadow-[0px_6px_12px_rgba(0,0,0,0.08)] mb-6 md:mb-8">
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-[#D1D5DB] bg-[#FAFAFA]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-[#C8A14F]" />
              </div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-[#0B1F3A] tracking-tight">
                Transaction Summary
              </h3>
            </div>
            <span className="inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#0B1F3A]/10">
              Ref: {transactionReferenceId}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-4 md:px-6 md:py-5">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-8">
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Transaction Type</dt>
                <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">
                  {(transactionData as any).transactionCategory
                    ? (transactionData as any).transactionCategory.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                    : 'Normal Transfer'}
                  {(transactionData as any).includeBondRegistration && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                      + Bond Registration
                    </span>
                  )}
                </dd>
              </div>
            </div>
            
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Submission Date</dt>
                <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{formatDate(new Date())}</dd>
              </div>
            </div>
            
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <Banknote className="h-4 w-4 md:h-5 md:w-5 text-[#C8A14F]" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Property Price</dt>
                <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{formatPrice(transactionData.sellingPrice)}</dd>
              </div>
            </div>
            
            {transactionData.valuationAmount && (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Building className="h-4 w-4 md:h-5 md:w-5 text-[#C8A14F]" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Valuation Amount</dt>
                  <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{formatPrice(transactionData.valuationAmount)}</dd>
                </div>
              </div>
            )}
            
            {/* First Time Buyer Status */}
            {transactionData.transactionType === 'buying' && 
             transactionData.nationality === 'Botswana' && (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Building className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">First Time Buyer</dt>
                  <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">
                    {transactionData.isFirstTimeBuyer ? 'Yes' : 'No'}
                  </dd>
                </div>
              </div>
            )}
            
            {transactionData.hasAgent ? (
              <div className="flex md:col-span-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
                </div>
                <div className="flex-grow">
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Estate Agent</dt>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-1">
                    <dd className="text-base md:text-lg text-gray-900 font-medium">{transactionData.agentName}</dd>
                    <dd className="text-base md:text-lg text-gray-900">{transactionData.agentContact}</dd>
                  </div>
                  {transactionData.agentCompany && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Company:</span> {transactionData.agentCompany}
                      {transactionData.commissionType && transactionData.commissionValue && (
                        <span className="ml-2 px-2 py-0.5 bg-[#0B1F3A]/5 text-[#0B1F3A] rounded-full text-xs">
                          Commission: {transactionData.commissionType === 'percentage' ? `${transactionData.commissionValue}%` : formatPrice(transactionData.commissionValue)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Entity Type</dt>
                  <dd className="mt-1 text-base md:text-lg text-gray-900 font-medium">{getEntityTypeDisplay(transactionData.entityType)}</dd>
                </div>
              </div>
            )}
            
            <div className="flex">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                <UserCircle className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
              </div>
              <div>
                <dt className="text-xs md:text-sm font-medium text-gray-500">Personal Information</dt>
                <div className="mt-1 space-y-1">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Gender:</span> <span className="capitalize">{transactionData.gender}</span>
                  </div>
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Nationality:</span> {transactionData.nationality}
                  </div>
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Marital Status:</span> {getMaritalStatusDisplay(transactionData.maritalStatus)}
                  </div>
                </div>
              </div>
            </div>
            
            {transactionData.hasBond !== undefined && (
              <div className="flex">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B1F3A]/5 flex-shrink-0 flex items-center justify-center mr-2 md:mr-3">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A]" />
                </div>
                <div>
                  <dt className="text-xs md:text-sm font-medium text-gray-500">Bond Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {transactionData.hasBond ? (
                      <div>
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Property has a bond</span>
                        {transactionData.bondDocument && (
                          <div className="mt-1 text-xs">
                            <span className="font-medium">Document uploaded:</span> {transactionData.bondDocument}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">No bond on property</span>
                    )}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>
        
        <div className="px-4 py-4 md:px-6 md:py-5 bg-[#FAFAFA] border-t border-[#D1D5DB]">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h4 className="text-sm md:text-base font-semibold text-[#0B1F3A]">
              Uploaded Documents ({transactionData.uploadedDocuments.length})
            </h4>
            <button
              onClick={onPrevious}
              className="text-xs text-[#C8A14F] hover:text-[#0B1F3A] font-medium flex items-center gap-1 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Edit Documents
            </button>
          </div>
          <ul className="bg-white border border-[#D1D5DB] rounded-lg divide-y divide-[#D1D5DB]">
            {transactionData.uploadedDocuments.slice(0, 4).map((doc, index) => (
              <li key={index} className="px-3 py-2 md:px-4 md:py-3 flex items-center justify-between text-xs md:text-sm hover:bg-gray-50">
                <div className="w-0 flex-1 flex items-center">
                  <FileText className="flex-shrink-0 h-4 w-4 md:h-5 md:w-5 text-[#C8A14F]" />
                  <span className="ml-2 flex-1 w-0 truncate text-gray-700">{doc}</span>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="font-medium text-[#0B1F3A] hover:text-[#C8A14F] transition-colors">
                    View
                  </button>
                </div>
              </li>
            ))}
            {transactionData.uploadedDocuments.length > 4 && (
              <li className="px-3 py-2 md:px-4 md:py-3 text-center text-xs md:text-sm text-gray-500">
                + {transactionData.uploadedDocuments.length - 4} more documents
              </li>
            )}
          </ul>
        </div>
        
        <div className="px-4 py-4 md:px-6 md:py-5 bg-[#0B1F3A]/[0.02] border-t border-[#D1D5DB]">
          <h4 className="text-sm md:text-base font-semibold text-[#0B1F3A] mb-3">
            Data Protection & Privacy
          </h4>
          <div className="flex items-start">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-[#0B1F3A] mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-xs md:text-sm text-gray-600">
                All your data is encrypted at rest and in transit. We comply with data protection regulations including GDPR and the Data Protection Act 2024. Your information will be stored securely and only used for processing your transaction.
              </p>
              <button className="mt-2 text-xs text-[#C8A14F] hover:text-[#0B1F3A] flex items-center transition-colors">
                <Lock className="h-3 w-3 mr-1" />
                View Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conveyancer Dashboard Link Section — conveyancer mode only */}
      {mode === 'conveyancer' && <div className="bg-white border border-[#D1D5DB] rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-[0px_6px_12px_rgba(0,0,0,0.08)]">
        <div className="bg-[#0B1F3A] px-5 py-5 md:px-8 md:py-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#C8A14F]/20 flex items-center justify-center flex-shrink-0 ring-2 ring-[#C8A14F]/30">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-[#C8A14F]" />
            </div>
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-white tracking-tight">Conveyancer Dashboard Access</h3>
              <p className="text-sm text-gray-300 mt-0.5">
                Share this live dashboard link to track progress and generate legal documents.
              </p>
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-[#C8A14F] via-[#C8A14F]/60 to-transparent"></div>
        <div className="px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={copyConveyancerLink}
              className="inline-flex items-center px-4 py-2.5 bg-[#0B1F3A] text-white rounded-lg hover:bg-[#0B1F3A]/90 transition-colors font-medium text-sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {conveyancerLinkCopied ? 'Link Copied!' : 'Copy Conveyancer Link'}
            </button>

            <button
              onClick={openConveyancerDashboard}
              className="inline-flex items-center px-4 py-2.5 border border-[#D1D5DB] text-[#0B1F3A] bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Dashboard
            </button>
          </div>

          <div className="mt-4 bg-[#0B1F3A]/[0.02] rounded-lg p-3 border border-[#D1D5DB]">
            <p className="text-xs text-gray-600">
              <strong className="text-[#0B1F3A]">Features:</strong> Live transaction tracking • AI document generation • Both buyer & seller information • Real-time progress updates
            </p>
          </div>
        </div>
      </div>}

      {/* AI Document Generation — conveyancer mode */}
      {mode === 'conveyancer' && (
        <div className="bg-white rounded-2xl shadow-[0px_6px_12px_rgba(0,0,0,0.08)] border border-[#D1D5DB] mb-6 md:mb-8 overflow-hidden">
          <div className="px-4 py-4 md:px-6 md:py-5 bg-[#0B1F3A] relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="relative flex items-center">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#C8A14F]/20 flex items-center justify-center mr-3 flex-shrink-0">
                <Sparkles className="h-5 w-5 md:h-5 md:w-5 text-[#C8A14F]" />
              </div>
              <div>
                <h3 className="font-serif text-base md:text-lg font-bold text-white tracking-tight">AI Document Generation</h3>
                <p className="text-xs md:text-sm text-gray-300 mt-0.5">Generate legal documents from the transaction details entered so far</p>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-[#C8A14F] via-[#C8A14F]/60 to-transparent"></div>

          <div className="px-4 py-4 md:px-6 md:py-5">
            {/* Generate All / Stop / Download Pack controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {!isGeneratingAll ? (
                  <button
                    onClick={generateAllDocuments}
                    disabled={isGeneratingDoc}
                    className="px-4 py-2 bg-[#0B1F3A] text-white rounded-lg hover:bg-[#0B1F3A]/90 transition-all shadow-md text-sm font-medium inline-flex items-center disabled:opacity-50"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Generate All Documents
                  </button>
                ) : (
                  <button
                    onClick={stopGeneration}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md text-sm font-medium inline-flex items-center animate-pulse"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Generation
                  </button>
                )}
                {Object.keys(generatedDocuments).length > 0 && !isGeneratingAll && (
                  <button
                    onClick={handleDownloadPack}
                    disabled={isDownloadingPack || isGeneratingDoc}
                    className="px-4 py-2 bg-[#C8A14F] text-white rounded-lg hover:bg-[#C8A14F]/90 transition-all shadow-md text-sm font-medium inline-flex items-center disabled:opacity-50"
                  >
                    {isDownloadingPack ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Packaging...</>
                    ) : (
                      <><FolderDown className="h-4 w-4 mr-2" />Download Pack ({Object.keys(generatedDocuments).length})</>
                    )}
                  </button>
                )}
              </div>
              {isGeneratingAll && (
                <span className="text-xs text-[#0B1F3A] font-medium">
                  {currentQueueIndex + 1} of {generationQueue.length} documents
                </span>
              )}
            </div>

            {/* Sequential progress bar */}
            {isGeneratingAll && (
              <div className="mb-4 bg-[#0B1F3A]/[0.03] border border-[#D1D5DB] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#0B1F3A]">Document Generation Progress</span>
                  <span className="text-xs text-[#0B1F3A]/70">
                    {Object.keys(generatedDocuments).length} / {DOC_TYPES.length} complete
                  </span>
                </div>
                <div className="flex gap-1">
                  {DOC_TYPES.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                        generatedDocuments[doc.id]
                          ? 'bg-emerald-500'
                          : idx === currentQueueIndex && isGeneratingDoc
                          ? 'bg-[#C8A14F] animate-pulse'
                          : 'bg-gray-200'
                      }`}
                      title={doc.label}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {DOC_TYPES.map((doc) => (
                    <span
                      key={doc.id}
                      className={`text-[9px] font-medium text-center flex-1 ${
                        generatedDocuments[doc.id]
                          ? 'text-emerald-600'
                          : doc.id === selectedDocType && isGeneratingDoc
                          ? 'text-[#C8A14F]'
                          : 'text-gray-400'
                      }`}
                    >
                      {doc.short}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document type pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DOC_TYPES.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (isGeneratingAll) return; // Don't switch tabs during batch generation
                    setSelectedDocType(doc.id);
                    if (generatedDocuments[doc.id]) {
                      setActiveDocument(generatedDocuments[doc.id]);
                      setStreamingContent(generatedDocuments[doc.id]);
                    } else {
                      setActiveDocument(null);
                      setStreamingContent('');
                    }
                  }}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedDocType === doc.id
                      ? 'bg-[#0B1F3A]/10 text-[#0B1F3A] border-2 border-[#0B1F3A]/30'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  } ${isGeneratingAll ? 'cursor-default' : ''}`}
                >
                  {doc.short}
                  {generatedDocuments[doc.id] ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 ml-1" />
                  ) : doc.id === selectedDocType && isGeneratingDoc ? (
                    <Loader2 className="h-3 w-3 text-[#C8A14F] ml-1 animate-spin" />
                  ) : null}
                </button>
              ))}
            </div>

            {/* Generate / Status area */}
            {!generatedDocuments[selectedDocType] ? (
              <div className="text-center py-6 bg-[#0B1F3A]/[0.02] rounded-xl border border-[#D1D5DB]">
                <Sparkles className="h-8 w-8 text-[#C8A14F] mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  Generate a {DOC_TYPES.find(d => d.id === selectedDocType)?.label} using the transaction information entered. Missing details will be marked for completion.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      const controller = new AbortController();
                      abortControllerRef.current = controller;
                      generateDocument(selectedDocType, controller.signal).finally(() => {
                        abortControllerRef.current = null;
                      });
                    }}
                    disabled={isGeneratingDoc || isGeneratingAll}
                    className="px-5 py-2.5 bg-[#0B1F3A] text-white rounded-lg hover:bg-[#0B1F3A]/90 transition-all shadow-md text-sm font-medium inline-flex items-center disabled:opacity-50"
                  >
                    {isGeneratingDoc ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Generate with AI</>
                    )}
                  </button>
                  {(isGeneratingDoc && !isGeneratingAll) && (
                    <button
                      onClick={() => {
                        abortControllerRef.current?.abort();
                        setIsGeneratingDoc(false);
                      }}
                      className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium inline-flex items-center"
                    >
                      <StopCircle className="h-4 w-4 mr-1.5" />Stop
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {DOC_TYPES.find(d => d.id === selectedDocType)?.label} Generated
                      </p>
                      <p className="text-xs text-emerald-700">
                        {generatedDocuments[selectedDocType].split(/\s+/).filter(Boolean).length.toLocaleString()} words
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateDocument(selectedDocType)}
                      disabled={isGeneratingDoc || isGeneratingAll}
                      className="px-2.5 py-1.5 text-xs bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        setActiveDocument(generatedDocuments[selectedDocType]);
                        setStreamingContent(generatedDocuments[selectedDocType]);
                        setShowDocViewer(true);
                      }}
                      className="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />View
                    </button>
                    <button
                      onClick={handleDocPrint}
                      className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />Print
                    </button>
                    <button
                      onClick={handleDocDownload}
                      className="px-2.5 py-1.5 text-xs bg-[#0B1F3A]/5 text-[#0B1F3A] rounded-lg hover:bg-[#0B1F3A]/10 inline-flex items-center"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />PDF
                    </button>
                    <button
                      onClick={handleDocDownloadWord}
                      className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 inline-flex items-center"
                    >
                      <FileDown className="h-3.5 w-3.5 mr-1" />Word
                    </button>
                  </div>
                </div>
              </div>
            )}

            {docError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <p className="text-sm text-red-700">{docError}</p>
                <button
                  onClick={() => { setDocError(null); generateDocument(selectedDocType); }}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isSubmitted && (
        <div className="mb-6">
          {mode === 'conveyancer' && (
            <p className="text-xs text-gray-500 text-center mb-3">
              Clicking <strong>Save &amp; Submit</strong> saves this transaction to the dashboard under its transaction type. You can return to it at any time.
            </p>
          )}
          <button
            onClick={handleSubmitTransaction}
            disabled={isSubmitting}
            className={`w-full py-3.5 px-6 border-2 border-transparent rounded-xl text-base font-semibold shadow-[0px_6px_12px_rgba(0,0,0,0.08)] text-white bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />Saving...</>
            ) : (
              <><CheckCircle className="inline-block mr-2 h-5 w-5" />{mode === 'client' ? 'Submit Your Information' : 'Save & Submit Transaction'}</>
            )}
          </button>
        </div>
      )}

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
        <button
          onClick={onPrevious}
          disabled={isSubmitted}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>
        
        <button
          onClick={copyReferenceNumber}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Clipboard className="mr-1 md:mr-2 h-4 w-4 text-[#C8A14F]" />
          {copied ? 'Copied!' : 'Copy Reference'}
        </button>
        
        {mode === 'conveyancer' && (
          <>
            <button
              onClick={handleDownloadSummary}
              className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 transition-colors"
            >
              <Download className="mr-1 md:mr-2 h-4 w-4" />
              Download Summary
            </button>

            <button
              onClick={() => setShowRoleModal(true)}
              className="sm:ml-auto inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <Users className="mr-1 md:mr-2 h-4 w-4 text-[#C8A14F]" />
              View as...
            </button>
          </>
        )}
      </div>

      <div className="mt-6 md:mt-8 bg-white rounded-2xl overflow-hidden border border-[#D1D5DB] shadow-[0px_6px_12px_rgba(0,0,0,0.08)]">
        <div className="bg-[#0B1F3A] px-5 py-4 md:px-6 md:py-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative flex items-center gap-3">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-[#C8A14F] flex-shrink-0" />
            <h3 className="font-serif text-base md:text-lg font-bold text-white tracking-tight">Next Steps</h3>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-[#C8A14F] via-[#C8A14F]/60 to-transparent"></div>
        <div className="px-5 py-4 md:px-6 md:py-5">
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            Our team will review your submission and contact you within 2 business days.
            Remember to obtain tax clearance, letter of compliance (where necessary),
            and pay rates clearance to finalize your transaction.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            <div className="bg-[#0B1F3A]/[0.02] p-3 rounded-lg border border-[#D1D5DB] flex flex-col items-center">
              <span className="text-xs font-medium text-gray-500 mb-1">Your Documents</span>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></div>
                <span className="text-sm font-medium text-emerald-700">Complete</span>
              </div>
            </div>
            <div className="bg-[#0B1F3A]/[0.02] p-3 rounded-lg border border-[#D1D5DB] flex flex-col items-center">
              <span className="text-xs font-medium text-gray-500 mb-1">Compliance Checks</span>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#C8A14F] mr-1.5"></div>
                <span className="text-sm font-medium text-[#C8A14F]">In Progress</span>
              </div>
            </div>
            <div className="bg-[#0B1F3A]/[0.02] p-3 rounded-lg border border-[#D1D5DB] flex flex-col items-center">
              <span className="text-xs font-medium text-gray-500 mb-1">External Clearances</span>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300 mr-1.5"></div>
                <span className="text-sm font-medium text-gray-600">Pending</span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-[#0B1F3A]/[0.02] p-3 md:p-4 rounded-lg border border-[#D1D5DB]">
            <p className="text-xs md:text-sm text-gray-600">
              Estimated completion time: <span className="font-medium text-[#0B1F3A]">3-4 weeks</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Document Stream Viewer */}
      <DocumentStreamViewer
        isOpen={showDocViewer}
        isStreaming={isGeneratingDoc}
        content={streamingContent || activeDocument || ''}
        onClose={() => {
          if (isGeneratingAll) stopGeneration();
          setShowDocViewer(false);
        }}
        onDownload={handleDocDownload}
        onDownloadWord={handleDocDownloadWord}
        onPrint={handleDocPrint}
        onStop={isGeneratingDoc ? stopGeneration : undefined}
        caseNumber={transactionReferenceId}
        buyerName={resolvedBuyerName}
        sellerName={resolvedSellerName}
        documentTitle={DOC_TYPES.find(d => d.id === selectedDocType)?.label}
        firmName={firmName}
        lawyerName={lawyerName}
        queueProgress={isGeneratingAll ? { current: currentQueueIndex + 1, total: generationQueue.length } : null}
      />

      {/* Role-Based View Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 md:p-8 m-4 relative overflow-hidden">
            <button 
              onClick={() => setShowRoleModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="relative">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Select Role</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a role to view the dashboard from different perspectives.
              </p>
              
              <div className="grid grid-cols-1 gap-3 mb-5">
                <button
                  className={`flex items-center p-4 rounded-lg border-2 ${
                    selectedRole === 'conveyancer'
                      ? 'border-[#0B1F3A] bg-[#0B1F3A]/5'
                      : 'border-gray-200 hover:border-[#0B1F3A]/30 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRole('conveyancer')}
                >
                  <div className="w-10 h-10 bg-[#0B1F3A]/5 rounded-full flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-[#0B1F3A]" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900">Conveyancer</h4>
                    <p className="text-xs text-gray-500">Full access to documents and transaction status</p>
                  </div>
                </button>
                
                <button
                  className={`flex items-center p-4 rounded-lg border-2 ${
                    selectedRole === 'agent'
                      ? 'border-[#0B1F3A] bg-[#0B1F3A]/5'
                      : 'border-gray-200 hover:border-[#0B1F3A]/30 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRole('agent')}
                >
                  <div className="w-10 h-10 bg-[#0B1F3A]/5 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-[#0B1F3A]" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900">Estate Agent</h4>
                    <p className="text-xs text-gray-500">View-only access to transaction status</p>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => {
                  if (selectedRole) {
                    // In a real app, this would redirect to the appropriate dashboard
                    alert(`Switching to ${selectedRole} view.`);
                    setShowRoleModal(false);
                  }
                }}
                disabled={!selectedRole}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium ${
                  selectedRole ? 'bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step7Summary;