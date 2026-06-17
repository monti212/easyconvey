import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Upload, CheckCircle, AlertCircle, User, Building, Users, ShoppingCart, Tag } from 'lucide-react';
import { useTransactions } from '../App';
import * as casesService from '../services/cases.service';
import { useAuth } from '../hooks/useAuth';
import Step3SellingPrice from './steps/Step3SellingPrice';
import Step4AgentInformation from './steps/Step4AgentInformation';
import Step6SelectClients from './steps/Step6SelectClients';
import Step7Summary from './steps/Step7Summary';
import CompanyDetails from './steps/CompanyDetails';
import TrustDetails from './steps/TrustDetails';
import EstateDetails from './steps/EstateDetails';
import SocietyDetails from './steps/SocietyDetails';
import AgentEntitySelection from './steps/AgentEntitySelection';

interface SharedTransactionData {
  transactionId: string;
  transactionType: string;
  isSharedLink: boolean;
  sharedPricing?: {
    sellingPrice: string;
    valuationAmount: string;
    valuationDocument: string;
  } | null;
}

interface TransactionWizardProps {
  transactionId: string | null;
  initialCaseId?: string | null;
  /** Transaction type chosen up front in the New Case modal — the wizard no longer asks. */
  initialTransactionType?: {
    transactionType?: string;
    transactionCategory?: string;
    includeBondRegistration?: boolean;
  } | null;
  onSharedLink?: (transactionId: string, transactionType: string, sharedPricing?: any) => void;
  sharedTransactionData?: SharedTransactionData;
  mode?: 'conveyancer' | 'client';
  clientToken?: string;
  clientCaseId?: string;
  clientRole?: 'buyer' | 'seller';
  onClientSubmitComplete?: () => void;
  onComplete?: () => void;
  lawFirms?: { id: string; name: string }[];
  onSendToLawFirm?: (firmId: string, firmName: string) => void;
}

const TransactionWizard: React.FC<TransactionWizardProps> = ({
  transactionId,
  initialCaseId,
  initialTransactionType,
  onSharedLink,
  sharedTransactionData,
  mode = 'conveyancer',
  clientToken,
  clientCaseId,
  clientRole,
  onClientSubmitComplete,
  onComplete,
  lawFirms,
  onSendToLawFirm,
}) => {
  const { updateTransactionProgress, updateTransaction, markTransactionComplete } = useTransactions();
  const { orgUser, organization } = useAuth();
  const supabaseCaseId = useRef<string | null>(initialCaseId || null);
  const [currentStep, setCurrentStep] = useState(1);
  // Pop-up shown once, when the conveyancer leaves the Agent Information step
  const [showClearanceNotice, setShowClearanceNotice] = useState(false);
  const clearanceShownRef = useRef(false);
  const [transactionData, setTransactionData] = useState(() => ({
    transactionType: initialTransactionType?.transactionType || '',
    transactionCategory: initialTransactionType?.transactionCategory || 'normal_transfer', // normal_transfer | sectional_title | tribal_grant
    includeBondRegistration: initialTransactionType?.includeBondRegistration || false,
    documentUploaded: false,
    documentValid: false,
    skippedDeedUpload: false,
    hasBond: false,
    bondDocument: '',
    sellingPrice: '',
    valuationAmount: '',
    valuationDocument: '',
    hasAgent: false,
    agentName: '',
    agentContact: '',
    agentEmail: '',
    agentIdPassport: '',
    agentCompany: '',
    agentRegNumber: '',
    agentTaxId: '',
    commissionType: '',
    commissionValue: '',
    entityType: '',
    sellerHasAgent: false,
    sellerAgentName: '',
    sellerAgentCompany: '',
    sellerAgentContact: '',
    sellerCommissionType: '',
    sellerCommissionValue: '',
    sellerEntityType: '',
    // Seller's entity / personal details (buyer's live in the flat fields above)
    sellerEntityData: {} as Record<string, any>,
    // OCR-extracted deed fields
    extractedOwnerName: '',
    extractedOwnerIdNumber: '',
    extractedPreviousOwner: '',
    extractedPlotNumber: '',
    extractedPropertyAddress: '',
    extractedPropertyDescription: '',
    extractedTitleDeedNumber: '',
    extractedAdministrativeDistrict: '',
    extractedExtent: '',
    extractedPurchasePrice: '',
    extractedHasMortgageBond: false,
    extractedMortgageBondNumber: '',
    // OCR-extracted personal info (from ID documents) — single-bucket legacy + party-tagged buckets
    extractedClientName: '',
    extractedIdNumber: '',
    extractedDateOfBirth: '',
    // Party-tagged ID OCR (set by Step 6 based on active-party toggle)
    extractedBuyerName: '',
    extractedBuyerIdNumber: '',
    extractedBuyerDateOfBirth: '',
    extractedSellerName: '',
    extractedSellerIdNumber: '',
    extractedSellerDateOfBirth: '',
    gender: '',
    nationality: '',
    maritalStatus: '',
    requiredDocuments: [] as string[],
    uploadedDocuments: [] as string[],
    documentFilePaths: [] as { path: string; bucket: string; name: string; type: string; party?: 'buyer' | 'seller' }[],
    documentDataUrls: [] as { dataUrl: string; name: string; docType: string; party?: 'buyer' | 'seller' }[],
    uploadedDocumentsByParty: {} as Record<string, 'buyer' | 'seller'>,
    // Buyer/seller chosen on Step 6 from the clients who submitted via share links
    selectedParties: null as { buyer: any; seller: any } | null,
    otherPartyDocuments: [] as string[], // Track other party's documents
    isFirstTimeBuyer: false,  // Added for first time buyer status
    // Company specific fields
    companyName: '',
    registrationNumber: '',
    vatNumber: '',
    incorporationDate: '',
    companyDirectors: [] as { id: string; name: string; idNumber: string; position: string }[],
    // Trust specific fields
    trustName: '',
    trustNumber: '',
    trustDate: '',
    trustees: [] as { id: string; name: string; idNumber: string; contact?: string }[],
    beneficiaries: [] as { id: string; name: string; idNumber: string; contact?: string }[],
    // Estate specific fields
    deceasedName: '',
    dateOfDeath: '',
    estateNumber: '',
    executorName: '',
    executorContact: '',
    // Society specific fields
    societyName: '',
    societyRegNumber: '',
    societyFormationDate: '',
    committeeMembers: [] as { id: string; name: string; idNumber: string; position: string }[],
    societyAddress: '',
    societyContact: '',
    // Shared transaction fields
    originalTransactionId: '',
    isSharedTransaction: false,
    sharedPricing: null as {
      sellingPrice: string;
      valuationAmount: string;
      valuationDocument: string;
    } | null,
    pricingConfirmed: false, // Track if shared pricing has been confirmed
  }));

  // Initialize with shared transaction data if provided
  useEffect(() => {
    if (sharedTransactionData?.isSharedLink) {
      setTransactionData(prev => ({
        ...prev,
        transactionType: sharedTransactionData.transactionType,
        originalTransactionId: sharedTransactionData.transactionId,
        isSharedTransaction: true,
        sharedPricing: sharedTransactionData.sharedPricing || null,
        // Pre-populate pricing fields if shared pricing exists
        ...(sharedTransactionData.sharedPricing && {
          sellingPrice: sharedTransactionData.sharedPricing.sellingPrice,
          valuationAmount: sharedTransactionData.sharedPricing.valuationAmount,
          valuationDocument: sharedTransactionData.sharedPricing.valuationDocument,
        })
      }));
    }
  }, [sharedTransactionData]);

  // In client mode the share link already declares the party's role. Pre-set
  // transactionType so the wizard treats it as a shared transaction and skips
  // the Step 1 buying/selling question entirely.
  useEffect(() => {
    if (mode === 'client' && clientRole) {
      setTransactionData(prev => ({
        ...prev,
        transactionType: clientRole === 'buyer' ? 'buying' : 'selling',
        isSharedTransaction: true,
      }));
    }
  }, [mode, clientRole]);

  const updateTransactionData = (data: Partial<typeof transactionData>) => {
    // Append documentFilePaths and documentDataUrls rather than replacing
    if (data.documentFilePaths && data.documentFilePaths.length > 0) {
      data = { ...data, documentFilePaths: [...transactionData.documentFilePaths, ...data.documentFilePaths] };
    }
    if (data.documentDataUrls && data.documentDataUrls.length > 0) {
      data = { ...data, documentDataUrls: [...transactionData.documentDataUrls, ...data.documentDataUrls] };
    }
    const merged = { ...transactionData, ...data };
    setTransactionData(prev => ({ ...prev, ...data }));

    // Update transaction in global state with latest data
    if (transactionId) {
      updateTransaction(transactionId, {
        fullData: merged,
        type: data.transactionType || transactionData.transactionType,
        nationality: data.nationality || transactionData.nationality,
        isFirstTimeBuyer: data.isFirstTimeBuyer !== undefined ? data.isFirstTimeBuyer : transactionData.isFirstTimeBuyer,
        hasAgent: data.hasAgent !== undefined ? data.hasAgent : transactionData.hasAgent,
        agentName: data.agentName || transactionData.agentName,
        agentCompany: data.agentCompany || transactionData.agentCompany,
        entityType: data.entityType || transactionData.entityType,
        propertyPrice: parseInt(data.sellingPrice || transactionData.sellingPrice) || 0,
        priority: (data.isFirstTimeBuyer || transactionData.isFirstTimeBuyer) ? 'high' : 'medium'
      });
    }

    // Persist to Supabase if user is logged in (skip in client mode — submit on completion only)
    if (mode === 'conveyancer' && organization?.id) {
      persistToSupabase(merged);
    }
  };

  // Replace (not append) the document sets — used by the Step 6 client-selection
  // view, which derives the full document list from the selected buyer & seller.
  const setPartyDocuments = (
    filePaths: typeof transactionData.documentFilePaths,
    dataUrls: typeof transactionData.documentDataUrls,
  ) => {
    setTransactionData(prev => ({ ...prev, documentFilePaths: filePaths, documentDataUrls: dataUrls }));
  };

  const persistToSupabase = async (
    data: typeof transactionData,
    stepOverride?: number,
    statusOverride?: 'initiated' | 'in_progress' | 'completed' | 'cancelled',
  ) => {
    try {
      // Derive client name from entity type
      const clientName = data.hasAgent ? data.agentName
        : data.entityType === 'company' ? data.companyName
        : data.entityType === 'trust' ? data.trustName
        : data.entityType === 'estate' ? data.deceasedName
        : data.entityType === 'society' ? data.societyName
        : 'Client';

      // Derive case_type from transaction category
      // hasBond (Step 2 loan question) is a property flag, NOT the transaction type
      // Only use it if no transactionCategory has been selected yet
      const caseType = data.transactionCategory
        ? (data.includeBondRegistration ? `${data.transactionCategory}_bond` : data.transactionCategory)
        : (data.transactionType || 'normal_transfer');

      const step = stepOverride ?? currentStep;
      const stepName = getCurrentStepName();
      const docPayload = [{ wizardData: data, savedAt: new Date().toISOString(), currentStep: step, stepName }];

      if (!supabaseCaseId.current) {
        // Create new case in Supabase
        const created = await casesService.createCase({
          organization_id: organization!.id,
          case_type: caseType,
          client_name: clientName || 'Client',
          client_email: data.agentEmail || undefined,
          client_phone: data.agentContact || undefined,
          conveyancer_id: orgUser?.id,
          status: 'initiated',
          priority: data.isFirstTimeBuyer ? 'high' : 'medium',
          documents: docPayload,
          notes: transactionId || undefined,
        });
        supabaseCaseId.current = created.id;
      } else {
        // Update existing case — progress status to in_progress once past step 1.
        // statusOverride wins (used to mark the case completed on final submit).
        await casesService.updateCase(supabaseCaseId.current, {
          case_type: caseType,
          client_name: clientName || 'Client',
          client_email: data.agentEmail || undefined,
          client_phone: data.agentContact || undefined,
          status: statusOverride ?? (step > 1 ? 'in_progress' : undefined),
          priority: data.isFirstTimeBuyer ? 'high' : 'medium',
          documents: docPayload,
        });
      }
    } catch (err) {
      console.error('Failed to persist transaction to Supabase:', err);
    }
  };

  const persistCompletion = async () => {
    if (!supabaseCaseId.current) return;
    try {
      // Persist final wizard data AND mark the case completed in one write,
      // so the status can't be downgraded back to in_progress.
      await persistToSupabase(transactionData, 7, 'completed');
    } catch (err) {
      console.error('Failed to mark case as completed in Supabase:', err);
    }
  };

  // Update progress when step changes and persist to Supabase
  useEffect(() => {
    if (transactionId) {
      const stepNames = getNavigationSteps().map(step => step.name);
      const currentStepName = getCurrentStepName();
      const totalSteps = stepNames.length;

      updateTransactionProgress(transactionId, currentStep, currentStepName, totalSteps);
    }

    // Auto-save step progress to Supabase on each step transition
    if (mode === 'conveyancer' && organization?.id && supabaseCaseId.current) {
      persistToSupabase(transactionData, currentStep);
    }
  }, [currentStep, transactionId]);

  // After the conveyancer finishes Agent Information, surface the notice of
  // further requirements (tax/rates clearance, compliance, consents) once.
  useEffect(() => {
    if (mode === 'conveyancer' && currentStep !== 1 && !clearanceShownRef.current) {
      clearanceShownRef.current = true;
      setShowClearanceNotice(true);
    }
  }, [currentStep, mode]);

  // Track client step progress via activity log (skip initial mount)
  const stepStartTimeRef = useRef<number>(Date.now());
  const isFirstStepRender = useRef(true);
  useEffect(() => {
    if (mode !== 'client' || !clientToken || !clientCaseId || !clientRole) return;
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      stepStartTimeRef.current = Date.now();
      return;
    }
    const durationSeconds = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
    casesService.trackLinkActivity({
      token: clientToken,
      case_id: clientCaseId,
      role: clientRole,
      event_type: 'step_viewed',
      step_number: currentStep,
      step_name: getCurrentStepName(),
      duration_seconds: durationSeconds > 0 ? durationSeconds : undefined,
    });
    stepStartTimeRef.current = Date.now();
  }, [currentStep, mode, clientToken, clientCaseId, clientRole]);

  // Detail step for each party. Individuals submit their own personal details
  // via the client/manual submission, so only entity parties get a wizard step.
  const getBuyerDetailStep = (): number | null => {
    switch (transactionData.entityType) {
      case 'company': return 8;
      case 'trust': return 9;
      case 'estate': return 10;
      case 'society': return 11;
      default: return null;
    }
  };

  const getSellerDetailStep = (): number | null => {
    if (transactionData.sellerHasAgent) return null;
    switch (transactionData.sellerEntityType) {
      case 'company': return 14;
      case 'trust': return 15;
      case 'estate': return 16;
      case 'society': return 17;
      default: return null;
    }
  };

  const sellerEntity: Record<string, any> = transactionData.sellerEntityData || {};
  const updateSellerEntity = (data: Record<string, any>) => {
    updateTransactionData({ sellerEntityData: { ...sellerEntity, ...data } });
  };

  const nextStep = () => {
    // From Agent Info (1): a represented buyer picks the agent's entity type
    // first (12); otherwise go straight to the first applicable detail step.
    if (currentStep === 1) {
      if (transactionData.hasAgent) {
        setCurrentStep(12);
        window.scrollTo(0, 0);
        return;
      }
      setCurrentStep(getBuyerDetailStep() ?? getSellerDetailStep() ?? 4);
      window.scrollTo(0, 0);
      return;
    }

    // From Agent Entity Selection (12)
    if (currentStep === 12) {
      setCurrentStep(getBuyerDetailStep() ?? getSellerDetailStep() ?? 4);
      window.scrollTo(0, 0);
      return;
    }

    // After the buyer's entity detail step (8-11), capture the seller's next
    if (currentStep >= 8 && currentStep <= 11) {
      setCurrentStep(getSellerDetailStep() ?? 4);
      window.scrollTo(0, 0);
      return;
    }

    // After the seller's entity detail step (14-17), go to the selling price
    if (currentStep >= 14 && currentStep <= 17) {
      setCurrentStep(4);
      window.scrollTo(0, 0);
      return;
    }

    // If on selling price page (step 4), go to the buyer/seller selection step
    if (currentStep === 4) {
      setCurrentStep(6);
      window.scrollTo(0, 0);
      return;
    }
    
    // Standard navigation for other steps
    setCurrentStep(prev => prev + 1);
    // Scroll to top on mobile when changing steps
    window.scrollTo(0, 0);
  };

  const previousStep = () => {
    console.log('previousStep triggered inside TransactionWizard. currentStep:', currentStep);
    // If on document upload page (step 6) after coming from selling price
    if (currentStep === 6) {
      console.log('Transitioning step from 6 to 4 (Selling Price)');
      setCurrentStep(4); // Go back to selling price
      window.scrollTo(0, 0);
      return;
    }
    
    // If on selling price page (step 4), go back to the last detail step —
    // the seller's if they have one, otherwise the buyer's, else Agent Info.
    if (currentStep === 4) {
      setCurrentStep(getSellerDetailStep() ?? getBuyerDetailStep() ?? (transactionData.hasAgent ? 12 : 1));
      window.scrollTo(0, 0);
      return;
    }

    // If on a seller entity detail step (14-17), go back to the buyer's
    if (currentStep >= 14 && currentStep <= 17) {
      setCurrentStep(getBuyerDetailStep() ?? (transactionData.hasAgent ? 12 : 1));
      window.scrollTo(0, 0);
      return;
    }

    // If on entity-specific pages (8-11)
    if (currentStep >= 8 && currentStep <= 11) {
      if (transactionData.hasAgent) {
        setCurrentStep(12); // Go back to agent entity selection
      } else {
        setCurrentStep(1); // Go back to agent information
      }
      window.scrollTo(0, 0);
      return;
    }
    
    // If on agent entity selection
    if (currentStep === 12) {
      setCurrentStep(1); // Go back to agent information
      window.scrollTo(0, 0);
      return;
    }
    
    // Standard navigation for other steps
    setCurrentStep(prev => prev - 1);
    // Scroll to top on mobile when changing steps
    window.scrollTo(0, 0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step4AgentInformation
            hasAgent={transactionData.hasAgent}
            agentName={transactionData.agentName}
            agentContact={transactionData.agentContact}
            agentEmail={transactionData.agentEmail}
            agentIdPassport={transactionData.agentIdPassport}
            agentCompany={transactionData.agentCompany}
            agentRegNumber={transactionData.agentRegNumber}
            agentTaxId={transactionData.agentTaxId}
            commissionType={transactionData.commissionType}
            commissionValue={transactionData.commissionValue}
            entityType={transactionData.entityType}
            sellingPrice={transactionData.sellingPrice}
            sellerHasAgent={transactionData.sellerHasAgent}
            sellerAgentName={transactionData.sellerAgentName}
            sellerAgentCompany={transactionData.sellerAgentCompany}
            sellerAgentContact={transactionData.sellerAgentContact}
            sellerCommissionType={transactionData.sellerCommissionType}
            sellerCommissionValue={transactionData.sellerCommissionValue}
            sellerEntityType={transactionData.sellerEntityType}
            transactionType={transactionData.transactionType}
            caseId={supabaseCaseId.current}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={() => {}}
          />
        );
      case 4:
        return (
          <Step3SellingPrice
            sellingPrice={transactionData.sellingPrice}
            valuationAmount={transactionData.valuationAmount}
            valuationDocument={transactionData.valuationDocument}
            transactionType={transactionData.transactionType}
            isFirstTimeBuyer={transactionData.isFirstTimeBuyer}
            nationality={transactionData.nationality}
            sharedPricing={transactionData.sharedPricing}
            isSharedTransaction={transactionData.isSharedTransaction}
            pricingConfirmed={transactionData.pricingConfirmed}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 6:
        return (
          <Step6SelectClients
            orgId={organization?.id}
            transactionType={transactionData.transactionType}
            currentTransactionData={transactionData}
            onUpdate={updateTransactionData}
            onSetDocuments={setPartyDocuments}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 7:
        return (
          <Step7Summary
            transactionData={transactionData}
            transactionId={transactionId}
            supabaseCaseId={supabaseCaseId.current}
            onUpdate={updateTransactionData}
            onPrevious={previousStep}
            mode={mode}
            clientToken={clientToken}
            onClientSubmitComplete={onClientSubmitComplete}
            onComplete={onComplete}
            onFinalSubmit={persistCompletion}
            firmName={organization?.name}
            lawyerName={orgUser ? `${orgUser.first_name || ''} ${orgUser.last_name || ''}`.trim() : undefined}
            lawFirms={lawFirms}
            onSendToLawFirm={onSendToLawFirm}
          />
        );
      case 8: // Company Details
        return (
          <CompanyDetails
            companyName={transactionData.companyName}
            registrationNumber={transactionData.registrationNumber}
            vatNumber={transactionData.vatNumber}
            incorporationDate={transactionData.incorporationDate}
            companyDirectors={transactionData.companyDirectors}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 9: // Trust Details
        return (
          <TrustDetails
            trustName={transactionData.trustName}
            trustNumber={transactionData.trustNumber}
            trustDate={transactionData.trustDate}
            trustees={transactionData.trustees}
            beneficiaries={transactionData.beneficiaries}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 10: // Estate Details
        return (
          <EstateDetails
            deceasedName={transactionData.deceasedName}
            dateOfDeath={transactionData.dateOfDeath}
            estateNumber={transactionData.estateNumber}
            executorName={transactionData.executorName}
            executorContact={transactionData.executorContact}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 11: // Society Details
        return (
          <SocietyDetails
            societyName={transactionData.societyName}
            societyRegNumber={transactionData.societyRegNumber}
            societyFormationDate={transactionData.societyFormationDate}
            committeeMembers={transactionData.committeeMembers}
            societyAddress={transactionData.societyAddress}
            societyContact={transactionData.societyContact}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 12: // Agent Entity Selection
        return (
          <AgentEntitySelection
            entityType={transactionData.entityType}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 14: // Seller — Company Details
        return (
          <CompanyDetails
            companyName={sellerEntity.companyName || ''}
            registrationNumber={sellerEntity.registrationNumber || ''}
            vatNumber={sellerEntity.vatNumber || ''}
            incorporationDate={sellerEntity.incorporationDate || ''}
            companyDirectors={sellerEntity.companyDirectors || []}
            onUpdate={updateSellerEntity}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 15: // Seller — Trust Details
        return (
          <TrustDetails
            trustName={sellerEntity.trustName || ''}
            trustNumber={sellerEntity.trustNumber || ''}
            trustDate={sellerEntity.trustDate || ''}
            trustees={sellerEntity.trustees || []}
            beneficiaries={sellerEntity.beneficiaries || []}
            onUpdate={updateSellerEntity}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 16: // Seller — Estate Details
        return (
          <EstateDetails
            deceasedName={sellerEntity.deceasedName || ''}
            dateOfDeath={sellerEntity.dateOfDeath || ''}
            estateNumber={sellerEntity.estateNumber || ''}
            executorName={sellerEntity.executorName || ''}
            executorContact={sellerEntity.executorContact || ''}
            onUpdate={updateSellerEntity}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 17: // Seller — Society Details
        return (
          <SocietyDetails
            societyName={sellerEntity.societyName || ''}
            societyRegNumber={sellerEntity.societyRegNumber || ''}
            societyFormationDate={sellerEntity.societyFormationDate || ''}
            committeeMembers={sellerEntity.committeeMembers || []}
            societyAddress={sellerEntity.societyAddress || ''}
            societyContact={sellerEntity.societyContact || ''}
            onUpdate={updateSellerEntity}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      default:
        return null;
    }
  };

  // Get workflow position. Personal details are submitted by the parties
  // themselves, so the wizard has 4 visible steps; entity detail steps fold
  // into the Agent Information position.
  const getWorkflowPosition = () => {
    if (currentStep === 12 || (currentStep >= 8 && currentStep <= 17)) {
      return 1;
    }
    const map: Record<number, number> = {
      1: 1, // Agent Info
      4: 2, // Selling Price
      6: 3, // Buyer & Seller
      7: 4, // Summary
    };
    return map[currentStep] || currentStep;
  };

  // Get appropriate step name
  const getCurrentStepName = () => {
    if (currentStep === 12 || (currentStep >= 8 && currentStep <= 17)) {
      return 'Agent Information';
    }
    const priceLabel = transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price';
    const steps = ['Agent Information', priceLabel, 'Buyer & Seller', 'Summary'];
    const position = getWorkflowPosition() - 1;
    return position >= 0 && position < steps.length ? steps[position] : 'Unknown Step';
  };

  // Calculate progress percentage — 4 visible steps
  const calculateProgress = () => {
    return (getWorkflowPosition() / 4) * 100;
  };

  // Check if a step is active in the navigation
  const isStepActive = (stepNumber: number) => {
    return getWorkflowPosition() === stepNumber;
  };

  // Check if a step is completed in the navigation
  const isStepComplete = (stepNumber: number) => {
    return getWorkflowPosition() > stepNumber;
  };

  // Get the navigation steps for display
  const getNavigationSteps = () => {
    const priceLabel = transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price';
    return [
      { number: 1, name: 'Agent Information' },
      { number: 2, name: priceLabel },
      { number: 3, name: 'Buyer & Seller' },
      { number: 4, name: 'Summary' }
    ];
  };

  const navigationSteps = getNavigationSteps();

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-soft">
      {/* Important-requirements notice — shown once after Agent Information */}
      {showClearanceNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 md:p-7">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Important Notice</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  The following are also required before the transfer can be completed:
                </p>
              </div>
            </div>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-gray-700 mb-4">
              <li>Tax clearance from the relevant authorities</li>
              <li>Rates clearance certificate from the local municipality</li>
              <li>Letter of Compliance — where applicable</li>
              <li>Land Board Consent — where applicable (tribal land only)</li>
              <li>Bond Cancellation — where applicable (existing mortgage only)</li>
            </ul>
            <p className="text-xs text-gray-500 mb-5">
              Requirements marked "where applicable" depend on the specific transaction and location.
              These can be uploaded on the Summary step as they are obtained.
            </p>
            <button
              onClick={() => setShowClearanceNotice(false)}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Shared Transaction Header */}
      {transactionData.isSharedTransaction && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-4 py-3">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Shared Transaction - You are the {transactionData.transactionType === 'buying' ? 'buyer' : 'seller'}
              </p>
              <p className="text-xs text-green-700">
                Transaction ID: {transactionData.originalTransactionId}
                {transactionData.sharedPricing && (
                  <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs">
                    Pricing Pre-filled
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar - Mobile optimized version */}
      <div className="bg-gradient-to-r from-primary via-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-secondary opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary opacity-10 blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Mobile Step Indicator */}
          <div className="md:hidden py-6 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`rounded-full h-8 w-8 flex items-center justify-center shadow-lg ${
                  isStepComplete(1) ? 'bg-success text-white' : 
                  isStepActive(1) ? 'bg-secondary text-primary ring-2 ring-secondary-light' :
                  'bg-gray-200 text-primary'
                }`}>
                  {isStepComplete(1) ? <CheckCircle className="h-4 w-4" /> : <span>1</span>}
                </div>
                <div className="mx-2 h-0.5 w-4 bg-secondary/30"></div>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                  isStepActive(navigationSteps.length) ? 'bg-secondary text-primary ring-2 ring-secondary-light' : 
                  isStepComplete(navigationSteps.length) ? 'bg-success text-white' :
                  'bg-gray-200 text-primary'
                }`}>
                  <span>{navigationSteps.length}</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-gray-100 font-medium text-sm">
                  Step {getWorkflowPosition()} of {navigationSteps.length}
                </span>
                <p className="text-xs text-gray-200 mt-1">{getCurrentStepName()}</p>
              </div>
              <div className="w-24">
                <div className="bg-primary-light rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-secondary h-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex justify-between items-center py-6 relative">
            {/* Connecting line — runs through the centre of the step circles */}
            <div
              className="absolute h-0.5 bg-secondary/30"
              style={{ left: '0', right: '0', top: '2.75rem', zIndex: 0 }}
            ></div>

            {navigationSteps.map((step, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center shadow-lg ${
                  isStepComplete(step.number) ? 'bg-success text-white' :
                  isStepActive(step.number) ? 'bg-secondary text-primary ring-4 ring-secondary/30' :
                  'bg-gray-200 text-primary'
                } transition-all duration-300`}>
                  {isStepComplete(step.number) ? <CheckCircle className="h-5 w-5" /> : <span>{step.number}</span>}
                </div>
                <span className={`mt-2 text-xs ${isStepActive(step.number) ? 'text-gray-100 font-medium' : 'text-gray-300'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-4 md:p-6 lg:p-8">
        {/* Which party's entity details are being captured on this step */}
        {(currentStep >= 8 && currentStep <= 17 && currentStep !== 12) && (
          <div className={`max-w-3xl mx-auto mb-4 rounded-lg px-4 py-2 text-sm font-semibold border ${
            currentStep >= 14
              ? 'bg-primary/5 border-primary/20 text-primary'
              : 'bg-secondary/15 border-secondary/40 text-primary'
          }`}>
            Capturing the {currentStep >= 14 ? 'SELLER' : 'BUYER'}'s details
          </div>
        )}
        {renderStep()}
      </div>

      {/* Actions */}
      <div className="bg-background border-t border-border px-4 py-3 md:px-6 md:py-4 flex justify-between">
        <button 
          onClick={() => {
            console.log('Save and exit clicked. Triggering onComplete callback');
            if (onComplete) {
              onComplete();
            } else {
              setCurrentStep(1);
            }
          }}
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Save and exit
        </button>
      </div>
    </div>
  );
};

export default TransactionWizard;