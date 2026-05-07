import React, { useState, useEffect } from 'react';
import * as storageService from '../../services/storage.service';
import { convertToPdf } from '../../lib/convertToPdf';
import { useDebounce } from '../../hooks/useDebounce';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Upload,
  CheckCircle,
  FileText,
  AlertCircle,
  Info,
  Calculator,
  Percent,
  FileCheck,
  TrendingUp,
  Users,
  Eye,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Step3Props {
  sellingPrice: string; // "buying" price in a purchase flow OR asking price in a selling flow
  valuationAmount: string; // open‑market value / official valuation (optional)
  valuationDocument: string; // filename of uploaded report (optional)
  transactionType: 'buying' | 'selling';
  isFirstTimeBuyer?: boolean; // Added for first time buyer status
  nationality?: string; // Added to check if user is from Botswana
  sharedPricing?: {
    sellingPrice: string;
    valuationAmount: string;
    valuationDocument: string;
  } | null;
  isSharedTransaction?: boolean;
  pricingConfirmed?: boolean;
  onUpdate: (
    data: Partial<{
      sellingPrice: string;
      valuationAmount: string;
      valuationDocument: string;
      pricingConfirmed: boolean;
    }>,
  ) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const DISBURSEMENTS_AMOUNT = 550; // Standard disbursements amount

// -----------------------------------------------------------------------------
// Step‑3 component (incorporates transaction‑cost calculator)
// -----------------------------------------------------------------------------

const Step3SellingPrice: React.FC<Step3Props> = ({
  sellingPrice,
  valuationAmount,
  valuationDocument,
  transactionType,
  isFirstTimeBuyer,
  nationality,
  sharedPricing,
  isSharedTransaction,
  pricingConfirmed,
  onUpdate,
  onNext,
  onPrevious,
}) => {
  // ---------------------------------------------------------------------------
  // Local form state (some is lifted via props, others purely local)
  // ---------------------------------------------------------------------------
  const [buyingPrice, setBuyingPrice] = useState<string>(sellingPrice);
  const [marketValue, setMarketValue] = useState<string>(valuationAmount);
  const [taxType, setTaxType] = useState<'vat' | 'transfer'>('transfer');
  const [isExempt, setIsExempt] = useState<boolean | null>(null);
  const [exemptionDetails, setExemptionDetails] = useState<string>('');
  const [exemptionSection, setExemptionSection] = useState<string>('');

  // Validation flags (simple – extend as needed)
  const [priceError, setPriceError] = useState('');
  const [valuationError, setValuationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ---------------------------------------------------------------------------
  // Calculation state
  // ---------------------------------------------------------------------------
  const [conveyancingFee, setConveyancingFee] = useState<number>(0);
  const [transferDuty, setTransferDuty] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [additionalCostsTotal, setAdditionalCostsTotal] = useState<number>(0);

  // Check if user is a first time buyer from Botswana (automatically exempt)
  const isAutoExempt = isFirstTimeBuyer && nationality === 'Botswana' && transactionType === 'buying';

  // Check if this is a shared transaction with pricing
  const hasSharedPricing = isSharedTransaction && sharedPricing;

  // Calculate the effective property price (higher of buying price and valuation)
  const getEffectivePropertyPrice = () => {
    const price = parseInt(buyingPrice) || 0;
    const valuation = parseInt(marketValue) || 0;
    return Math.max(price, valuation);
  };

  const effectivePropertyPrice = getEffectivePropertyPrice();

  // Determine which value is being used and why
  const getPropertyPriceInfo = () => {
    const price = parseInt(buyingPrice) || 0;
    const valuation = parseInt(marketValue) || 0;
    
    if (valuation > price && valuation > 0) {
      return {
        value: valuation,
        source: 'valuation',
        reason: 'This number is based on the higher figure between valuation amount and buying price'
      };
    } else {
      return {
        value: price,
        source: 'buying',
        reason: 'This number is based on the higher figure between valuation amount and buying price'
      };
    }
  };

  const propertyPriceInfo = getPropertyPriceInfo();

  // Debounce price values to avoid excessive parent updates / Supabase calls
  const debouncedBuyingPrice = useDebounce(buyingPrice, 500);
  const debouncedMarketValue = useDebounce(marketValue, 500);

  // Sync local → parent after debounce
  useEffect(() => {
    onUpdate({ sellingPrice: debouncedBuyingPrice, valuationAmount: debouncedMarketValue });
  }, [debouncedBuyingPrice, debouncedMarketValue]);

  // Auto-set exemption for first time buyers
  useEffect(() => {
    if (isAutoExempt && taxType === 'transfer') {
      setIsExempt(true);
      setExemptionSection('Section 20(1)(f) - First Time Home Buyers');
      setExemptionDetails('Automatic exemption for first-time property buyers in Botswana');
    }
  }, [isAutoExempt, taxType]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const digitsOnly = (v: string) => v.replace(/[^0-9]/g, '');
  const formatCurrency = (n: number | string) =>
    `P ${(+n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Numeric input wrapper – strips formatting but shows thousands separators
  const handleNumericInput = (
    raw: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    validate?: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const v = digitsOnly(raw);
    setter(v);
    if (validate) {
      if (!v.trim()) validate('Required');
      else if (parseInt(v, 10) <= 0) validate('Must be > 0');
      else validate('');
    }
  };

  // ---------------------------------------------------------------------------
  // Fee / duty calculators (updated for nationality-based transfer duties)
  // ---------------------------------------------------------------------------
  const calculateTransferDuty = (value: number) => {
    if (isExempt || isAutoExempt) return 0;
    
    if (nationality === 'Botswana') {
      // Citizens: 0% up to 1.5M, 5% above 1.5M
      if (value <= 1_500_000) return 0;
      return (value - 1_500_000) * 0.05;
    } else {
      // Non-citizens: 10% from 0 to 2M, 15% from 2M upwards
      if (value <= 2_000_000) return value * 0.10;
      return (2_000_000 * 0.10) + ((value - 2_000_000) * 0.15);
    }
  };

  const calculateConveyancingFee = (value: number) => {
    if (value <= 500_000) return 9_000;
    if (value <= 1_000_000) return 12_000;
    if (value <= 5_000_000) return 15_000;
    return 20_000;
  };

  const calculateVAT = (base: number) => base * 0.14; // 14 % VAT

  // ---------------------------------------------------------------------------
  // Recalculate totals whenever relevant inputs change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const price = parseInt(buyingPrice) || 0;
    const propertyPrice = effectivePropertyPrice;

    const fee = calculateConveyancingFee(propertyPrice);
    setConveyancingFee(fee);

    const duty = taxType === 'transfer' ? calculateTransferDuty(propertyPrice) : 0;
    setTransferDuty(duty);
    
    // Updated VAT calculation: include disbursements in both scenarios
    const vatableAmount = taxType === 'vat' ? (fee + propertyPrice + DISBURSEMENTS_AMOUNT) : (fee + DISBURSEMENTS_AMOUNT);
    const vat = calculateVAT(vatableAmount);
    setVatAmount(vat);

    // Calculate additional costs total (excluding the property price)
    setAdditionalCostsTotal(fee + duty + vat + DISBURSEMENTS_AMOUNT);
  }, [buyingPrice, marketValue, taxType, isExempt, isAutoExempt, effectivePropertyPrice, nationality]);

  // ---------------------------------------------------------------------------
  // Upload handler
  // ---------------------------------------------------------------------------
  const handleValuationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // Auto-convert images to PDF
      const pdfFile = await convertToPdf(file);
      try {
        await storageService.uploadFile(pdfFile, 'public', 'valuations', 'valuation', 'valuations');
      } catch {
        // Storage may not be available for unauthenticated users — file name still recorded
      }
      onUpdate({ valuationDocument: pdfFile.name });
    } catch {
      onUpdate({ valuationDocument: file.name });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle tax type change
  const handleTaxTypeChange = (type: 'vat' | 'transfer') => {
    setTaxType(type);
    // Reset exemption state when switching, unless auto-exempt
    if (type === 'vat' || !isAutoExempt) {
      setIsExempt(null);
      setExemptionSection('');
      setExemptionDetails('');
    }
  };

  // Handle exemption change (only for non-auto-exempt users)
  const handleExemptionChange = (exempt: boolean) => {
    if (!isAutoExempt) {
      setIsExempt(exempt);
      if (!exempt) {
        setExemptionSection('');
        setExemptionDetails('');
      }
    }
  };

  // Handle pricing confirmation for shared transactions
  const handlePricingConfirmation = () => {
    onUpdate({ pricingConfirmed: true });
  };

  // Get transfer duty information based on nationality
  const getTransferDutyInfo = () => {
    if (nationality === 'Botswana') {
      return {
        title: 'Transfer Duty (Botswana Citizens)',
        rates: [
          'P0 - P1,500,000: 0% (No transfer duty on first P1,500,000)',
          'Above P1,500,000: 5% (5% calculated on amount above P1,500,000)',
          'First time property buyers: 0% (Completely exempt)'
        ]
      };
    } else {
      return {
        title: 'Transfer Duty (Non-Citizens)',
        rates: [
          'P0 - P2,000,000: 10%',
          'Amount in execss of P2,000,000: 15%'
        ]
      };
    }
  };

  const transferDutyInfo = getTransferDutyInfo();

  // ---------------------------------------------------------------------------
  // Comprehensive exemption sections from Transfer Duty Act
  // ---------------------------------------------------------------------------
  const exemptionSections = [
    // ESTATES
    'Section 20(1)(b) - Heir or legatee taking over property of an estate',
    'Section 20(1)(c) - Inheritance from parents (no valuation certificate required)',
    'Section 20(1)(d) - Surviving spouse from deceased estate (no valuation certificate required)',
    'Section 20(1)(e) - Surviving spouse acquiring heir\'s share (no valuation certificate required)',
    'Section 20(1)(f) - Children of marriage - future inheritance (no valuation certificate required)',
    'Section 20(1)(k) - Limited interests in property under fidei-commissum (no valuation certificate required)',
    'Section 20(1)(l) - Termination of fidei-commissum (no valuation certificate required)',
    'Section 20(1)(m) - Early termination of life interest by surviving spouse',
    'Section 20(1)(dd) - Parent inheritance from deceased child',
    
    // MARRIAGE, DIVORCE OR SPOUSE/SELF TRANSACTIONS
    'Section 20(1)(g) - Transfer from one spouse to another (no valuation certificate required)',
    'Section 20(1)(ga) - Divorce properties (no valuation certificate required)',
    'Section 20(1)(x) - Botswana citizen transfer to own company',
    'Section 20(1)(y) - Botswana citizen company to husband/wife shareholders',
    
    // TRUSTS
    'Section 20(1)(h) - Trust created for marriage (no valuation certificate required)',
    'Section 20(1)(i) - Transfer of trust property to beneficiaries (no valuation certificate required)',
    
    // INSOLVENCY
    'Section 20(1)(n) - Cancelled property sales in insolvent estates',
    'Section 20(1)(o) - Abandoned property purchases in insolvent estates',
    'Section 20(1)(p) - Retention of property by insolvent with creditors\' consent',
    
    // JOINT OWNERSHIP OR PARTITION
    'Section 20(1)(a) - Joint owner purchase of other owner\'s share',
    'Section 20(1)(j) - Voluntary or compulsory partition (no valuation certificate required)',
    
    // MINISTERIAL CONSENTS
    'Section 20(1)(q) - Correcting registration mistakes (no valuation certificate required)',
    'Section 20(1)(r) - Surety taking ownership of property',
    'Section 20(1)(s) - Waiver by Minister of transfer duty payable by Botswana Citizens',
    
    // DONATIONS
    'Section 20(1)(z) - Donation to beneficiaries under Income Tax Act',
    
    // SPECIAL ECONOMIC ZONES
    'Section 20(1)(aa) - Economic zone licence holders',
  ];

  // ---------------------------------------------------------------------------
  // Component UI – progressive disclosure with expandable sections
  // ---------------------------------------------------------------------------

  const canProceed = () => {
    if (hasSharedPricing) {
      return pricingConfirmed; // For shared transactions, need confirmation
    }
    return buyingPrice && parseInt(buyingPrice) > 0 && !priceError;
  };

  // Simplified view for shared transactions with pricing
  if (hasSharedPricing) {
    return (
      <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-3 md:mb-4 text-center">
          Confirm Transaction Price
        </h2>
        <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
          Please confirm that the pricing information below is correct for this transaction.
        </p>

        {/* Pricing Display */}
        <div className="bg-background rounded-2xl p-5 md:p-8 shadow-md mb-6 md:mb-8">
          {/* Shared Pricing Notification */}
          <div className="mb-6 bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start">
              <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Shared Pricing Information</h3>
                <p className="text-sm text-blue-700 mt-1">
                  The other party has provided the following pricing information for this transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Price Display */}
          <div className="mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-primary mb-3 md:mb-4 font-serif">
              {transactionType === 'buying' ? 'Buying' : 'Selling'} Price
            </h3>
            
            <div className="mt-2 relative rounded-xl shadow-md">
              <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                <Banknote className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="bg-blue-50 border-2 border-blue-300 block w-full pl-10 md:pl-12 pr-12 md:pr-16 py-3 md:py-4 text-lg md:text-xl rounded-xl">
                {buyingPrice ? parseInt(buyingPrice).toLocaleString() : '0'}
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm md:text-lg">BWP</span>
              </div>
            </div>
          </div>

          {/* Valuation Display (if provided) */}
          {marketValue && parseInt(marketValue) > 0 && (
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-medium text-primary mb-2">
                Property Valuation
              </h3>
              
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Banknote className="w-5 h-5 text-gray-400" />
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 block w-full pl-10 pr-12 py-3 rounded-md">
                  {parseInt(marketValue).toLocaleString()}
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">BWP</span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Confirmation */}
          <div className="pt-4 border-t border-blue-200">
            <h3 className="text-base md:text-lg font-medium text-primary mb-3">
              Confirm Pricing Information
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              By clicking confirm, you agree that the pricing information above is correct for this transaction.
            </p>
            <button
              onClick={handlePricingConfirmation}
              className="w-full px-6 py-3 rounded-lg text-base font-medium transition-colors bg-green-600 text-white hover:bg-green-700 shadow-md"
            >
              <CheckCircle className="w-5 h-5 inline-block mr-2" />
              Confirm Pricing
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 md:mt-12 flex justify-between">
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" /> Back
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!pricingConfirmed}
            className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white ${
              pricingConfirmed
                ? 'bg-primary hover:bg-primary-dark transition-colors'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Proceed <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Regular form view for non-shared transactions
  return (
    <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
      {/* --------------------------------------------------------------------- */}
      {/* Heading                                                               */}
      {/* --------------------------------------------------------------------- */}
      <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-3 md:mb-4 text-center">
        {transactionType === 'buying' ? 'Buying' : 'Selling'} Price
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please specify the {transactionType === 'buying' ? 'buying' : 'selling'} price for the property and we'll calculate associated costs.
      </p>

      {/* First Time Buyer Notification */}
      {isAutoExempt && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">First Time Buyer Benefit</h3>
              <p className="text-sm text-green-700 mt-1">
                As a first-time property buyer in Botswana, you are automatically exempt from transfer duties 
                under Section 20(1)(f). This exemption has been applied to your cost calculation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nationality-based Transfer Duty Information */}
      {nationality && nationality !== 'Select nationality' && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">{transferDutyInfo.title}</h3>
              <div className="text-sm text-blue-700 mt-1">
                <p className="mb-2">Transfer duty is payable on the higher of the purchase price and market value:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {transferDutyInfo.rates.map((rate, index) => (
                    <li key={index}>{rate}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Main Form with Progressive Disclosure                                 */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-background rounded-2xl p-5 md:p-8 shadow-md mb-6 md:mb-8 space-y-6">
        {/* Step 1: Transaction Price */}
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-primary mb-3 md:mb-4 font-serif">
            Enter the {transactionType === 'buying' ? 'buying' : 'selling'} price
          </h3>
          
          {/* Main price input */}
          <div className="mt-2 relative rounded-xl shadow-md">
            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
              <Banknote className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <input
              id="buying-price"
              type="text"
              value={buyingPrice ? parseInt(buyingPrice).toLocaleString() : ''}
              onChange={(e) => handleNumericInput(e.target.value, setBuyingPrice, setPriceError)}
              className={`bg-white focus:ring-primary focus:border-primary block w-full pl-10 md:pl-12 pr-12 md:pr-16 py-3 md:py-4 text-lg md:text-xl border-0 rounded-xl ${
                priceError ? 'ring-2 ring-error' : ''
              }`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm md:text-lg">BWP</span>
            </div>
          </div>
          {priceError && (
            <p className="mt-2 md:mt-3 text-xs md:text-sm text-error font-medium">{priceError}</p>
          )}
        </div>
        
        {/* Step 2: Property Valuation */}
        <div className="space-y-4 pt-4 border-t border-blue-200">
          <h3 className="text-base md:text-lg font-medium text-primary">
            Property Valuation
          </h3>
          
          {/* Valuation amount input */}
          <div>
            <label htmlFor="valuation-amount" className="block text-sm font-medium text-gray-700 mb-2">
              {transactionType === 'buying' ? 'Open Market' : 'Official'} Valuation Amount
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Banknote className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="valuation-amount"
                type="text"
                value={marketValue ? parseInt(marketValue).toLocaleString() : ''}
                onChange={(e) => handleNumericInput(e.target.value, setMarketValue, setValuationError)}
                placeholder="0.00"
                className={`block w-full pl-10 pr-12 py-3 rounded-md border ${
                  valuationError ? 'border-error ring-error ring-1' : 'border-gray-300'
                } focus:ring-primary focus:border-primary`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">BWP</span>
              </div>
            </div>
            {valuationError && <p className="mt-1 text-xs text-error">{valuationError}</p>}
            <p className="mt-1 text-xs text-gray-600">Transfer duty is calculated on the higher of purchase price and market value</p>
          </div>
          
          {/* Property Price Calculation Info */}
          {(parseInt(buyingPrice) > 0 || parseInt(marketValue) > 0) && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Property Price for Calculations</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">{transactionType === 'buying' ? 'Buying' : 'Selling'} Price:</span>
                      <span className="text-sm font-medium">{formatCurrency(parseInt(buyingPrice) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Valuation Amount:</span>
                      <span className="text-sm font-medium">{formatCurrency(parseInt(marketValue) || 0)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-800">Effective Property Price:</span>
                        <span className="text-base font-bold text-blue-900">{formatCurrency(effectivePropertyPrice)}</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">{propertyPriceInfo.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Valuation document upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Valuation Report <span className="text-xs font-normal text-gray-400">(where applicable)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Required only when the sale price differs from the official market valuation, or when a valuation is requested by BURS for transfer duty purposes.</p>
            
            {!valuationDocument && !isUploading ? (
              <>
                <input
                  id="valuation-report"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleValuationUpload}
                  className="hidden"
                />
                <label
                  htmlFor="valuation-report"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 bg-white rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-6 h-6 text-primary mb-2" />
                  <p className="text-gray-600 text-sm mb-1 text-center">
                    Upload {transactionType === 'buying' ? 'market value' : 'valuation'} report
                  </p>
                  <span className="inline-flex items-center bg-primary text-white px-3 py-1.5 rounded-md text-xs font-medium">
                    <Upload className="w-3 h-3 mr-1" /> Select File
                  </span>
                </label>
              </>
            ) : isUploading ? (
              <div className="border border-blue-200 bg-white rounded-lg p-4 animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-primary/20 rounded w-3/4" />
                  <div className="h-2 bg-primary/10 rounded w-1/2" />
                </div>
              </div>
            ) : (
              <div className="border border-success/30 bg-success/10 rounded-lg p-3 flex items-start">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <div className="ml-2">
                  <p className="font-medium text-primary text-xs">Report Uploaded</p>
                  <p className="text-gray-700 text-xs">{valuationDocument}</p>
                  <button
                    onClick={() => onUpdate({ valuationDocument: '' })}
                    className="text-secondary text-xs underline hover:text-secondary-dark"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Step 3: Advanced Calculator Options */}
        <div className="space-y-5 pt-4 border-t border-blue-200">
          <div className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-primary">Cost Calculator</h3>
          </div>

          {/* Tax Type Selection */}
          <div>
            <h4 className="text-base font-medium text-primary mb-3">Applicable Tax/Duty</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['vat', 'transfer'] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                    taxType === type ? 'border-secondary bg-secondary/10 shadow-sm' : 'border-gray-300 hover:border-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="tax-type"
                    checked={taxType === type}
                    onChange={() => handleTaxTypeChange(type)}
                    className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                    {type === 'vat' ? 'VAT (14%)' : 'Transfer Duty'}
                  </span>
                </label>
              ))}
            </div>
            
            {taxType === 'vat' && (
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg flex">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="ml-2 text-xs text-blue-800">
                  Where parties are registered for VAT, they can opt to pay VAT instead of transfer duty. 
                  VAT is calculated as 14% of the sum of conveyancing fee, effective property price, and disbursements.
                </p>
              </div>
            )}
          </div>
          
          {/* Transfer Duty Exemption (only shown for transfer duty) */}
          {taxType === 'transfer' && (
            <div className="mt-4">
              <h4 className="text-base font-medium text-primary mb-3">Transfer Duty Exemption</h4>
              
              {isAutoExempt ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Automatically Exempt</p>
                      <p className="text-xs text-green-700 mt-1">
                        First-time buyers in Botswana are exempt from transfer duties under Section 20(1)(f).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: 'Exempt', value: true },
                      { label: 'Not Exempt', value: false },
                    ].map(({ label, value }) => (
                      <label
                        key={label}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                          isExempt === value
                            ? 'border-secondary bg-secondary/10 shadow-sm'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="is-exempt"
                          checked={isExempt === value}
                          onChange={() => handleExemptionChange(value)}
                          className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>

                  {isExempt && (
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div>
                        <label htmlFor="exemption-section" className="block text-xs font-medium text-gray-700 mb-1">
                          Exemption Section (Transfer Duty Act)
                        </label>
                        <select
                          id="exemption-section"
                          value={exemptionSection}
                          onChange={(e) => setExemptionSection(e.target.value)}
                          className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-xs"
                        >
                          <option value="">Select applicable section</option>
                          <optgroup label="ESTATES">
                            <option value="Section 20(1)(b) - Heir or legatee taking over property of an estate">Section 20(1)(b) - Heir or legatee taking over property of an estate</option>
                            <option value="Section 20(1)(c) - Inheritance from parents (no valuation certificate required)">Section 20(1)(c) - Inheritance from parents</option>
                            <option value="Section 20(1)(d) - Surviving spouse from deceased estate (no valuation certificate required)">Section 20(1)(d) - Surviving spouse from deceased estate</option>
                            <option value="Section 20(1)(e) - Surviving spouse acquiring heir's share (no valuation certificate required)">Section 20(1)(e) - Surviving spouse acquiring heir's share</option>
                            <option value="Section 20(1)(f) - Children of marriage - future inheritance (no valuation certificate required)">Section 20(1)(f) - Children of marriage - future inheritance</option>
                            <option value="Section 20(1)(k) - Limited interests in property under fidei-commissum (no valuation certificate required)">Section 20(1)(k) - Limited interests under fidei-commissum</option>
                            <option value="Section 20(1)(l) - Termination of fidei-commissum (no valuation certificate required)">Section 20(1)(l) - Termination of fidei-commissum</option>
                            <option value="Section 20(1)(m) - Early termination of life interest by surviving spouse">Section 20(1)(m) - Early termination of life interest</option>
                            <option value="Section 20(1)(dd) - Parent inheritance from deceased child">Section 20(1)(dd) - Parent inheritance from deceased child</option>
                          </optgroup>
                          <optgroup label="MARRIAGE & DIVORCE">
                            <option value="Section 20(1)(g) - Transfer from one spouse to another (no valuation certificate required)">Section 20(1)(g) - Transfer between spouses</option>
                            <option value="Section 20(1)(ga) - Divorce properties (no valuation certificate required)">Section 20(1)(ga) - Divorce properties</option>
                            <option value="Section 20(1)(x) - Botswana citizen transfer to own company">Section 20(1)(x) - Citizen transfer to own company</option>
                            <option value="Section 20(1)(y) - Botswana citizen company to husband/wife shareholders">Section 20(1)(y) - Company to spouse shareholders</option>
                          </optgroup>
                          <optgroup label="TRUSTS">
                            <option value="Section 20(1)(h) - Trust created for marriage (no valuation certificate required)">Section 20(1)(h) - Trust created for marriage</option>
                            <option value="Section 20(1)(i) - Transfer of trust property to beneficiaries (no valuation certificate required)">Section 20(1)(i) - Trust property to beneficiaries</option>
                          </optgroup>
                          <optgroup label="INSOLVENCY">
                            <option value="Section 20(1)(n) - Cancelled property sales in insolvent estates">Section 20(1)(n) - Cancelled sales in insolvent estates</option>
                            <option value="Section 20(1)(o) - Abandoned property purchases in insolvent estates">Section 20(1)(o) - Abandoned purchases in insolvent estates</option>
                            <option value="Section 20(1)(p) - Retention of property by insolvent with creditors' consent">Section 20(1)(p) - Retention by insolvent with consent</option>
                          </optgroup>
                          <optgroup label="JOINT OWNERSHIP">
                            <option value="Section 20(1)(a) - Joint owner purchase of other owner's share">Section 20(1)(a) - Joint owner purchase of other's share</option>
                            <option value="Section 20(1)(j) - Voluntary or compulsory partition (no valuation certificate required)">Section 20(1)(j) - Voluntary or compulsory partition</option>
                          </optgroup>
                          <optgroup label="MINISTERIAL CONSENTS">
                            <option value="Section 20(1)(q) - Correcting registration mistakes (no valuation certificate required)">Section 20(1)(q) - Correcting registration mistakes</option>
                            <option value="Section 20(1)(r) - Surety taking ownership of property">Section 20(1)(r) - Surety taking ownership</option>
                            <option value="Section 20(1)(s) - Waiver by Minister of transfer duty payable by Botswana Citizens">Section 20(1)(s) - Ministerial waiver for citizens</option>
                          </optgroup>
                          <optgroup label="OTHER EXEMPTIONS">
                            <option value="Section 20(1)(z) - Donation to beneficiaries under Income Tax Act">Section 20(1)(z) - Donations under Income Tax Act</option>
                            <option value="Section 20(1)(aa) - Economic zone licence holders">Section 20(1)(aa) - Economic zone licence holders</option>
                          </optgroup>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="exemption-details" className="block text-xs font-medium text-gray-700 mb-1">
                          Exemption Details
                        </label>
                        <textarea
                          id="exemption-details"
                          rows={2}
                          value={exemptionDetails}
                          onChange={(e) => setExemptionDetails(e.target.value)}
                          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-xs"
                          placeholder="Please describe the specific circumstances that qualify for this exemption"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Professional Fees - Simplified without disbursements input */}
          <div>
            <h4 className="text-base font-medium text-primary mb-3">Additional Costs</h4>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Conveyancing Fees</span>
                <span className="text-sm font-medium text-gray-700">{formatCurrency(conveyancingFee)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Based on effective property value ({formatCurrency(effectivePropertyPrice)})</p>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Standard Disbursements</span>
                  <span className="text-sm font-medium text-gray-700">{formatCurrency(DISBURSEMENTS_AMOUNT)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Includes deeds office fees, postage, etc.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cost Summary Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center mb-4">
            <Calculator className="mr-2 h-4 w-4 text-primary" /> 
            <span className="text-sm font-medium text-primary">Additional Costs Summary</span>
          </div>
          
          {/* Property Price Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Effective Property Price</span>
              <span className="text-lg font-bold text-blue-900">{formatCurrency(effectivePropertyPrice)}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {propertyPriceInfo.source === 'valuation' 
                ? 'Using higher valuation amount for calculations' 
                : 'Using your buying price for calculations'
              } (not included in additional costs below)
            </p>
          </div>
          
          <div className="space-y-2 text-sm">
            {taxType === 'transfer' && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 flex items-center">
                  Transfer Duty
                  {isAutoExempt && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      Exempt
                    </span>
                  )}
                  {nationality && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {nationality === 'Botswana' ? 'Citizen' : 'Non-Citizen'}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-gray-900">{formatCurrency(transferDuty)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Conveyancing Fee</span>
              <span className="font-semibold text-gray-900">{formatCurrency(conveyancingFee)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Disbursements</span>
              <span className="font-semibold text-gray-900">{formatCurrency(DISBURSEMENTS_AMOUNT)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">
                VAT (14%)
                {taxType === 'vat' && (
                  <span className="ml-1 text-xs text-blue-600">
                    on conveyancing fee + property price + disbursements
                  </span>
                )}
                {taxType === 'transfer' && (
                  <span className="ml-1 text-xs text-blue-600">
                    on conveyancing fee + disbursements
                  </span>
                )}
              </span>
              <span className="font-semibold text-gray-900">{formatCurrency(vatAmount)}</span>
            </div>

            <div className="flex justify-between py-3 mt-2 text-base font-bold text-primary border-t border-gray-200">
              <span>Total Additional Costs</span>
              <span>{formatCurrency(additionalCostsTotal)}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 flex items-start">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="ml-2">
              This is an estimate of additional costs only. The effective property price ({formatCurrency(effectivePropertyPrice)}) is not included in this total. Final costs may vary based on specific circumstances.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Navigation buttons                                                    */}
      {/* --------------------------------------------------------------------- */}
      <div className="mt-8 md:mt-12 flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" /> Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed()}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white ${
            canProceed()
              ? 'bg-primary hover:bg-primary-dark transition-colors'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Proceed <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Step3SellingPrice;