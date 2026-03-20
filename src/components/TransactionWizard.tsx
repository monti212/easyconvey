import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Upload, CheckCircle, AlertCircle, User, Building, Users } from 'lucide-react';
import { useTransactions } from '../App';
import * as casesService from '../services/cases.service';
import { useAuth } from '../hooks/useAuth';
import Step1TransactionType from './steps/Step1TransactionType';
import Step2UploadDeed from './steps/Step2UploadDeed';
import Step3SellingPrice from './steps/Step3SellingPrice';
import Step4AgentInformation from './steps/Step4AgentInformation';
import Step5PersonalDetails from './steps/Step5PersonalDetails';
import Step6DocumentUpload from './steps/Step6DocumentUpload';
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
  const [transactionData, setTransactionData] = useState({
    transactionType: '',
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
    gender: '',
    nationality: '',
    maritalStatus: '',
    requiredDocuments: [] as string[],
    uploadedDocuments: [] as string[],
    documentFilePaths: [] as { path: string; bucket: string; name: string; type: string }[],
    documentDataUrls: [] as { dataUrl: string; name: string; docType: string }[],
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
  });

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

  const persistToSupabase = async (data: typeof transactionData) => {
    try {
      // Derive client name from entity type
      const clientName = data.hasAgent ? data.agentName
        : data.entityType === 'company' ? data.companyName
        : data.entityType === 'trust' ? data.trustName
        : data.entityType === 'estate' ? data.deceasedName
        : data.entityType === 'society' ? data.societyName
        : 'Client';

      if (!supabaseCaseId.current) {
        // Create new case in Supabase
        const created = await casesService.createCase({
          organization_id: organization!.id,
          case_type: data.transactionType || 'buying',
          client_name: clientName || 'Client',
          client_email: data.agentEmail || undefined,
          client_phone: data.agentContact || undefined,
          conveyancer_id: orgUser?.id,
          status: 'initiated',
          priority: data.isFirstTimeBuyer ? 'high' : 'medium',
          documents: [{ wizardData: data, savedAt: new Date().toISOString() }],
          notes: transactionId || undefined,
        });
        supabaseCaseId.current = created.id;
      } else {
        // Update existing case
        await casesService.updateCase(supabaseCaseId.current, {
          case_type: data.transactionType || 'buying',
          client_name: clientName || 'Client',
          client_email: data.agentEmail || undefined,
          client_phone: data.agentContact || undefined,
          priority: data.isFirstTimeBuyer ? 'high' : 'medium',
          documents: [{ wizardData: data, savedAt: new Date().toISOString() }],
        });
      }
    } catch (err) {
      console.error('Failed to persist transaction to Supabase:', err);
    }
  };

  // Update progress when step changes
  useEffect(() => {
    if (transactionId) {
      const stepNames = getNavigationSteps().map(step => step.name);
      const currentStepName = getCurrentStepName();
      const totalSteps = stepNames.length;

      updateTransactionProgress(transactionId, currentStep, currentStepName, totalSteps);
    }
  }, [currentStep, transactionId]);

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

  const nextStep = () => {
    // If on Agent Info step (1)
    if (currentStep === 1) {
      if (transactionData.hasAgent) {
        // If using an agent, go to agent entity selection
        setCurrentStep(12); // New step for agent entity selection
        window.scrollTo(0, 0);
        return;
      } else if (!transactionData.hasAgent) {
        if (transactionData.entityType === 'individual') {
          // If individual, go to personal details
          setCurrentStep(5);
          window.scrollTo(0, 0);
          return;
        } else if (transactionData.entityType === 'company') {
          setCurrentStep(8); // Company details
          window.scrollTo(0, 0);
          return;
        } else if (transactionData.entityType === 'trust') {
          setCurrentStep(9); // Trust details
          window.scrollTo(0, 0);
          return;
        } else if (transactionData.entityType === 'estate') {
          setCurrentStep(10); // Estate details
          window.scrollTo(0, 0);
          return;
        } else if (transactionData.entityType === 'society') {
          setCurrentStep(11); // Society details
          window.scrollTo(0, 0);
          return;
        }
      }
    }
    
    // If coming from agent entity selection (step 12)
    if (currentStep === 12) {
      if (transactionData.entityType === 'individual') {
        // If individual, go to personal details
        setCurrentStep(5);
        window.scrollTo(0, 0);
        return;
      } else if (transactionData.entityType === 'company') {
        setCurrentStep(8); // Company details
        window.scrollTo(0, 0);
        return;
      } else if (transactionData.entityType === 'trust') {
        setCurrentStep(9); // Trust details
        window.scrollTo(0, 0);
        return;
      } else if (transactionData.entityType === 'estate') {
        setCurrentStep(10); // Estate details
        window.scrollTo(0, 0);
        return;
      } else if (transactionData.entityType === 'society') {
        setCurrentStep(11); // Society details
        window.scrollTo(0, 0);
        return;
      }
    }
    
    // If coming from personal details page after selecting individual
    if (currentStep === 5 && transactionData.entityType === 'individual') {
      // For shared transactions, skip Transaction Type and go directly to Upload Deed
      if (transactionData.isSharedTransaction) {
        setCurrentStep(3); // Go to Upload Deed
      } else {
        setCurrentStep(2); // Go to Transaction Type
      }
      window.scrollTo(0, 0);
      return;
    }
    
    // If coming from entity-specific pages, go to transaction type or upload deed for shared
    if (currentStep >= 8 && currentStep <= 11) {
      if (transactionData.isSharedTransaction) {
        setCurrentStep(3); // Skip Transaction Type for shared transactions
      } else {
        setCurrentStep(2); // Transaction Type
      }
      window.scrollTo(0, 0);
      return;
    }
    
    // If on Upload Deed page (step 3), go to selling price
    if (currentStep === 3) {
      setCurrentStep(4); // Go to Selling Price
      window.scrollTo(0, 0);
      return;
    }
    
    // If on selling price page (step 4), go directly to document upload
    if (currentStep === 4) {
      setCurrentStep(6); // Go to Document Upload
      window.scrollTo(0, 0);
      return;
    }
    
    // Standard navigation for other steps
    setCurrentStep(prev => prev + 1);
    // Scroll to top on mobile when changing steps
    window.scrollTo(0, 0);
  };

  const previousStep = () => {
    // If on document upload page (step 6) after coming from selling price
    if (currentStep === 6) {
      setCurrentStep(4); // Go back to selling price
      window.scrollTo(0, 0);
      return;
    }
    
    // If on selling price page (step 4), go back to upload deed
    if (currentStep === 4) {
      setCurrentStep(3); // Go back to upload deed
      window.scrollTo(0, 0);
      return;
    }
    
    // If on upload deed page (step 3) and it's a shared transaction
    if (currentStep === 3 && transactionData.isSharedTransaction) {
      // Go back to personal details or entity-specific pages
      if (transactionData.hasAgent) {
        if (transactionData.entityType === 'individual') {
          setCurrentStep(5); // Back to personal details
        } else if (transactionData.entityType === 'company') {
          setCurrentStep(8); // Back to company details
        } else if (transactionData.entityType === 'trust') {
          setCurrentStep(9); // Back to trust details
        } else if (transactionData.entityType === 'estate') {
          setCurrentStep(10); // Back to estate details
        } else if (transactionData.entityType === 'society') {
          setCurrentStep(11); // Back to society details
        } else {
          setCurrentStep(12); // Back to agent entity selection if no entity type yet
        }
      } else if (!transactionData.hasAgent && transactionData.entityType === 'individual') {
        setCurrentStep(5); // Go back to personal details
      } else if (!transactionData.hasAgent) {
        if (transactionData.entityType === 'company') {
          setCurrentStep(8); // Company details
        } else if (transactionData.entityType === 'trust') {
          setCurrentStep(9); // Trust details
        } else if (transactionData.entityType === 'estate') {
          setCurrentStep(10); // Estate details
        } else if (transactionData.entityType === 'society') {
          setCurrentStep(11); // Society details
        }
      }
      window.scrollTo(0, 0);
      return;
    }
    
    // If on transaction type page after coming from personal details (individual flow)
    if (currentStep === 2) {
      if (transactionData.hasAgent) {
        // If has agent, go back based on entity type
        if (transactionData.entityType === 'individual') {
          setCurrentStep(5); // Back to personal details
        } else if (transactionData.entityType === 'company') {
          setCurrentStep(8); // Back to company details
        } else if (transactionData.entityType === 'trust') {
          setCurrentStep(9); // Back to trust details
        } else if (transactionData.entityType === 'estate') {
          setCurrentStep(10); // Back to estate details
        } else if (transactionData.entityType === 'society') {
          setCurrentStep(11); // Back to society details
        } else {
          setCurrentStep(12); // Back to agent entity selection if no entity type yet
        }
      } else if (!transactionData.hasAgent && transactionData.entityType === 'individual') {
        setCurrentStep(5); // Go back to personal details
      } else if (!transactionData.hasAgent) {
        if (transactionData.entityType === 'company') {
          setCurrentStep(8); // Company details
        } else if (transactionData.entityType === 'trust') {
          setCurrentStep(9); // Trust details
        } else if (transactionData.entityType === 'estate') {
          setCurrentStep(10); // Estate details
        } else if (transactionData.entityType === 'society') {
          setCurrentStep(11); // Society details
        }
      }
      window.scrollTo(0, 0);
      return;
    }
    
    // If on personal details page (individual flow)
    if (currentStep === 5) {
      if (transactionData.hasAgent) {
        setCurrentStep(12); // Go back to agent entity selection
      } else {
        setCurrentStep(1); // Go back to agent information
      }
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
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={() => {}} // No previous step for the first page
          />
        );
      case 2:
        return (
          <Step1TransactionType
            transactionType={transactionData.transactionType}
            nationality={transactionData.nationality}
            isFirstTimeBuyer={transactionData.isFirstTimeBuyer}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 3:
        return (
          <Step2UploadDeed
            documentUploaded={transactionData.documentUploaded}
            documentValid={transactionData.documentValid}
            skippedDeedUpload={transactionData.skippedDeedUpload}
            transactionType={transactionData.transactionType}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
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
      case 5:
        return (
          <Step5PersonalDetails
            gender={transactionData.gender}
            nationality={transactionData.nationality}
            maritalStatus={transactionData.maritalStatus}
            requiredDocuments={transactionData.requiredDocuments}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        );
      case 6:
        return (
          <Step6DocumentUpload
            requiredDocuments={transactionData.requiredDocuments}
            uploadedDocuments={transactionData.uploadedDocuments}
            otherPartyDocuments={transactionData.otherPartyDocuments}
            documentUploaded={transactionData.documentUploaded}
            documentValid={transactionData.documentValid}
            skippedDeedUpload={transactionData.skippedDeedUpload}
            transactionType={transactionData.transactionType}
            originalTransactionId={transactionData.originalTransactionId}
            isSharedTransaction={transactionData.isSharedTransaction || mode === 'client'}
            currentTransactionData={transactionData}
            onUpdate={updateTransactionData}
            onNext={nextStep}
            onPrevious={previousStep}
            onSharedLink={onSharedLink}
          />
        );
      case 7:
        return (
          <Step7Summary
            transactionData={transactionData}
            transactionId={transactionId}
            onPrevious={previousStep}
            mode={mode}
            clientToken={clientToken}
            onClientSubmitComplete={onClientSubmitComplete}
            onComplete={onComplete}
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
      default:
        return null;
    }
  };

  // Check if we're on the individual path
  const isIndividualPath = transactionData.entityType === 'individual';
  const hasAgent = transactionData.hasAgent;

  // Get workflow position based on current step
  const getWorkflowPosition = () => {
    // Handle agent entity selection step
    if (currentStep === 12) {
      return 1; // Show as part of step 1 (Agent Info)
    }
    
    // For entity-specific pages (8-11), show as part of step 1
    if (currentStep >= 8 && currentStep <= 11) {
      return 1;
    }
    
    // For individual path
    if (isIndividualPath) {
      // For shared transactions, we skip Transaction Type, so adjust mapping
      if (transactionData.isSharedTransaction) {
        const sharedIndividualStepMapping = {
          1: 1, // Agent Info
          5: 2, // Personal Details
          3: 3, // Upload Deed (skipping Transaction Type)
          4: 4, // Selling Price
          6: 5, // Document Upload
          7: 6  // Summary
        };
        return sharedIndividualStepMapping[currentStep as keyof typeof sharedIndividualStepMapping] || currentStep;
      } else {
        const individualStepMapping = {
          1: 1, // Agent Info
          5: 2, // Personal Details
          2: 3, // Transaction Type
          3: 4, // Upload Deed
          4: 5, // Selling Price
          6: 6, // Document Upload
          7: 7  // Summary
        };
        return individualStepMapping[currentStep as keyof typeof individualStepMapping] || currentStep;
      }
    }
    
    // For regular flow with agent
    if (hasAgent) {
      // For shared transactions, adjust step mapping to account for skipped Transaction Type
      if (transactionData.isSharedTransaction) {
        const sharedStepMapping = {
          1: 1, // Agent Info
          3: 2, // Upload Deed (skipping Transaction Type)
          4: 3, // Selling Price
          5: 4, // Personal Details
          6: 5, // Document Upload
          7: 6  // Summary
        };
        return sharedStepMapping[currentStep as keyof typeof sharedStepMapping] || currentStep;
      }
      // Regular path with agent (same position mapping as base workflow)
      return currentStep;
    }
    
    // For regular flow without agent
    return currentStep;
  };

  // Get appropriate step name
  const getCurrentStepName = () => {
    // For entity-specific pages (8-11), or agent entity selection (12), return "Agent Information"
    if (currentStep === 12 || (currentStep >= 8 && currentStep <= 11)) {
      return 'Agent Information';
    }
    
    if (isIndividualPath) {
      if (transactionData.isSharedTransaction) {
        const sharedIndividualSteps = [
          'Agent Information',
          'Personal Details',
          'Upload Title Deed',
          transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price',
          'Document Upload',
          'Summary'
        ];
        const position = getWorkflowPosition() - 1;
        return position >= 0 && position < sharedIndividualSteps.length ? sharedIndividualSteps[position] : "Unknown Step";
      } else {
        const individualSteps = [
          'Agent Information',
          'Personal Details',
          'Transaction Type',
          'Upload Title Deed',
          transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price',
          'Document Upload',
          'Summary'
        ];
        const position = getWorkflowPosition() - 1;
        return position >= 0 && position < individualSteps.length ? individualSteps[position] : "Unknown Step";
      }
    } else {
      if (transactionData.isSharedTransaction) {
        const sharedBaseSteps = [
          'Agent Information',
          'Upload Title Deed',
          transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price',
          'Personal Details',
          'Document Upload',
          'Summary'
        ];
        const position = getWorkflowPosition() - 1;
        return position >= 0 && position < sharedBaseSteps.length ? sharedBaseSteps[position] : "Unknown Step";
      } else {
        const baseSteps = [
          'Agent Information',
          'Transaction Type',
          'Upload Title Deed',
          transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price',
          'Personal Details',
          'Document Upload',
          'Summary'
        ];
        const index = currentStep - 1;
        return index >= 0 && index < baseSteps.length ? baseSteps[index] : "Unknown Step";
      }
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    let totalSteps;
    if (transactionData.isSharedTransaction) {
      totalSteps = 6; // One less step for shared transactions (no Transaction Type)
    } else {
      totalSteps = 7;
    }
    const workflowPosition = getWorkflowPosition();
    return (workflowPosition / totalSteps) * 100;
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
    if (transactionData.isSharedTransaction) {
      if (isIndividualPath) {
        return [
          { number: 1, name: 'Agent Information' },
          { number: 2, name: 'Personal Details' },
          { number: 3, name: 'Upload Title Deed' },
          { number: 4, name: transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price' },
          { number: 5, name: 'Document Upload' },
          { number: 6, name: 'Summary' }
        ];
      } else {
        return [
          { number: 1, name: 'Agent Information' },
          { number: 2, name: 'Upload Title Deed' },
          { number: 3, name: transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price' },
          { number: 4, name: 'Personal Details' },
          { number: 5, name: 'Document Upload' },
          { number: 6, name: 'Summary' }
        ];
      }
    } else {
      if (isIndividualPath) {
        return [
          { number: 1, name: 'Agent Information' },
          { number: 2, name: 'Personal Details' },
          { number: 3, name: 'Transaction Type' },
          { number: 4, name: 'Upload Title Deed' },
          { number: 5, name: transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price' },
          { number: 6, name: 'Document Upload' },
          { number: 7, name: 'Summary' }
        ];
      } else {
        return [
          { number: 1, name: 'Agent Information' },
          { number: 2, name: 'Transaction Type' },
          { number: 3, name: 'Upload Title Deed' },
          { number: 4, name: transactionData.transactionType === 'buying' ? 'Buying Price' : 'Selling Price' },
          { number: 5, name: 'Personal Details' },
          { number: 6, name: 'Document Upload' },
          { number: 7, name: 'Summary' }
        ];
      }
    }
  };

  const navigationSteps = getNavigationSteps();

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-soft">
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
          <nav className="hidden md:flex justify-between items-center py-6">
            {navigationSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
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
            
            {/* Connecting lines between steps */}
            {[...Array(navigationSteps.length - 1)].map((_, index) => (
              <div key={index} className="hidden md:block absolute h-0.5 bg-secondary/30" style={{
                width: `${100 / navigationSteps.length}%`,
                left: `${(100 / navigationSteps.length) * 0.5 + (index * (100 / navigationSteps.length))}%`,
                top: '1.25rem',
                transform: 'translateX(-50%)',
                zIndex: 0
              }}></div>
            ))}
          </nav>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-4 md:p-6 lg:p-8">
        {renderStep()}
      </div>

      {/* Actions */}
      <div className="bg-background border-t border-border px-4 py-3 md:px-6 md:py-4 flex justify-between">
        <button 
          onClick={() => setCurrentStep(1)}
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Save and exit
        </button>
      </div>
    </div>
  );
};

export default TransactionWizard;