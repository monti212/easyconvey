import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Building, Users, Mail, Phone, Percent, Banknote, CreditCard, FileText, HelpCircle, Home, Briefcase, Scale, Calculator, AlertCircle } from 'lucide-react';

interface Step4Props {
  hasAgent: boolean;
  agentName: string;
  agentContact: string;
  agentEmail: string;
  agentIdPassport: string;
  agentCompany: string;
  agentRegNumber: string;
  agentTaxId: string;
  commissionType: string;
  commissionValue: string;
  entityType: string;
  sellingPrice?: string; // Added selling price to calculate commission amount
  onUpdate: (data: Partial<{
    hasAgent: boolean;
    agentName: string;
    agentContact: string;
    agentEmail: string;
    agentIdPassport: string;
    agentCompany: string;
    agentRegNumber: string;
    agentTaxId: string;
    commissionType: string;
    commissionValue: string;
    entityType: string;
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Step4AgentInformation: React.FC<Step4Props> = ({
  hasAgent,
  agentName,
  agentContact,
  agentEmail,
  agentIdPassport,
  agentCompany,
  agentRegNumber,
  agentTaxId,
  commissionType,
  commissionValue,
  entityType,
  sellingPrice = "0",
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTrustInfo, setShowTrustInfo] = useState(false);
  const [showEstateInfo, setShowEstateInfo] = useState(false);
  const [showSocietyInfo, setShowSocietyInfo] = useState(false);
  const [calculatedCommission, setCalculatedCommission] = useState("0");

  // Calculate commission amount when type, value, or selling price changes
  useEffect(() => {
    if (commissionType === 'percentage' && commissionValue && sellingPrice) {
      const price = parseFloat(sellingPrice) || 0;
      const percentage = parseFloat(commissionValue) || 0;
      const commissionAmount = (price * percentage / 100).toFixed(2);
      setCalculatedCommission(commissionAmount);
    } else {
      setCalculatedCommission("0");
    }
  }, [commissionType, commissionValue, sellingPrice]);

  // Reset entity type when switching to agent
  useEffect(() => {
    if (hasAgent && entityType) {
      onUpdate({ entityType: '' });
    }
  }, [hasAgent, entityType, onUpdate]);

  const handleAgentChange = (value: boolean) => {
    onUpdate({ 
      hasAgent: value,
      // Reset these values when switching
      agentName: value ? agentName : '',
      agentContact: value ? agentContact : '',
      agentEmail: value ? agentEmail : '',
      agentIdPassport: value ? agentIdPassport : '',
      agentCompany: value ? agentCompany : '',
      agentRegNumber: value ? agentRegNumber : '',
      agentTaxId: value ? agentTaxId : '',
      commissionType: value ? commissionType : '',
      commissionValue: value ? commissionValue : '',
      entityType: value ? '' : entityType
    });
    setErrors({});
  };

  const handleEntityTypeChange = (type: string) => {
    onUpdate({ entityType: type });
  };

  const validateAgentInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (hasAgent) {
      // Simplified validation for agent information - just require name, contact and company
      if (!agentName.trim()) newErrors.agentName = "Agent name is required";
      if (!agentContact.trim()) newErrors.agentContact = "Contact number is required";
      if (!agentCompany.trim()) newErrors.agentCompany = "Company name is required";
      
      // Commission validation
      if (!commissionType) newErrors.commissionType = "Please select commission type";
      if (!commissionValue.trim()) {
        newErrors.commissionValue = "Commission value is required";
      } else if (parseFloat(commissionValue) <= 0) {
        newErrors.commissionValue = "Commission must be greater than zero";
      } else if (commissionType === 'percentage' && parseFloat(commissionValue) > 100) {
        newErrors.commissionValue = "Percentage cannot exceed 100%";
      }
    } else {
      if (!entityType) newErrors.entityType = "Please select your entity type";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateAgentInfo()) {
      onNext();
    }
  };

  const handleCommissionTypeChange = (type: string) => {
    // Clear previous commission type and value
    onUpdate({ 
      commissionType: type,
      commissionValue: '' // Reset the value when changing types
    });
  };

  const handleCommissionValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (commissionType === 'percentage') {
      // Only allow numbers and decimal point for percentage
      value = value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const parts = value.split('.');
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2);
        }
      }
      
      // Don't allow values over 100%
      const numValue = parseFloat(value);
      if (numValue > 100) value = '100';
    } else {
      // Only allow numbers for fixed amount
      value = value.replace(/[^0-9]/g, '');
    }
    
    onUpdate({ commissionValue: value });
  };

  const formatCurrency = (value: string) => {
    if (!value || isNaN(parseFloat(value))) return 'P 0.00';
    return `P ${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4 text-center font-serif">
        Transaction Participant Information
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please provide information about who is participating in this transaction.
      </p>

      <div className="bg-background rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8">
        <fieldset>
          <legend className="text-lg md:text-xl font-semibold text-primary mb-4 md:mb-6 font-serif">
            Is an estate agent participating in this transaction?
          </legend>
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
            <label className={`flex-1 flex flex-col items-center p-4 md:p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
              hasAgent 
                ? 'border-secondary bg-white shadow-md' 
                : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
            }`}>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <span className="text-base md:text-lg font-medium mb-1 md:mb-2 text-primary">Yes</span>
              <p className="text-xs md:text-sm text-gray-600 text-center mb-3 md:mb-4">I'm working with an estate agent</p>
              <input
                type="radio"
                name="agent"
                checked={hasAgent}
                onChange={() => handleAgentChange(true)}
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
              />
            </label>
            
            <label className={`flex-1 flex flex-col items-center p-4 md:p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
              !hasAgent 
                ? 'border-secondary bg-white shadow-md' 
                : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
            }`}>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <span className="text-base md:text-lg font-medium mb-1 md:mb-2 text-primary">No</span>
              <p className="text-xs md:text-sm text-gray-600 text-center mb-3 md:mb-4">I'm handling this myself</p>
              <input
                type="radio"
                name="agent"
                checked={!hasAgent}
                onChange={() => handleAgentChange(false)}
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
              />
            </label>
          </div>
        </fieldset>

        {hasAgent ? (
          <div className="mt-6 md:mt-8 space-y-4 md:space-y-6 bg-white rounded-xl p-4 md:p-6 border border-blue-200">
            <h3 className="text-lg font-medium text-primary mb-3 font-serif">Agent Details</h3>
            
            {/* Simplified Agent Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Agent's Full Name <span className="text-error">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <input
                    type="text"
                    id="agentName"
                    value={agentName}
                    onChange={(e) => onUpdate({ agentName: e.target.value })}
                    className={`focus:ring-primary focus:border-primary block w-full pl-10 py-2 text-sm border-border rounded-lg ${
                      errors.agentName ? 'border-error ring-1 ring-error' : ''
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.agentName && <p className="mt-1 text-xs text-error">{errors.agentName}</p>}
              </div>
              
              <div>
                <label htmlFor="agentContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-error">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <input
                    type="text"
                    id="agentContact"
                    value={agentContact}
                    onChange={(e) => onUpdate({ agentContact: e.target.value })}
                    className={`focus:ring-primary focus:border-primary block w-full pl-10 py-2 text-sm border-border rounded-lg ${
                      errors.agentContact ? 'border-error ring-1 ring-error' : ''
                    }`}
                    placeholder="+267 7X XXX XXX"
                  />
                </div>
                {errors.agentContact && <p className="mt-1 text-xs text-error">{errors.agentContact}</p>}
              </div>
              
              <div>
                <label htmlFor="agentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <input
                    type="email"
                    id="agentEmail"
                    value={agentEmail}
                    onChange={(e) => onUpdate({ agentEmail: e.target.value })}
                    className="focus:ring-primary focus:border-primary block w-full pl-10 py-2 text-sm border-border rounded-lg"
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-lg font-medium text-primary mb-3 font-serif">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="agentCompany" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-error">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <input
                      type="text"
                      id="agentCompany"
                      value={agentCompany}
                      onChange={(e) => onUpdate({ agentCompany: e.target.value })}
                      className={`focus:ring-primary focus:border-primary block w-full pl-10 py-2 text-sm border-border rounded-lg ${
                        errors.agentCompany ? 'border-error ring-1 ring-error' : ''
                      }`}
                      placeholder="Real Estate Company"
                    />
                  </div>
                  {errors.agentCompany && <p className="mt-1 text-xs text-error">{errors.agentCompany}</p>}
                </div>
                
                <div>
                  <label htmlFor="agentRegNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <input
                      type="text"
                      id="agentRegNumber"
                      value={agentRegNumber}
                      onChange={(e) => onUpdate({ agentRegNumber: e.target.value })}
                      className="focus:ring-primary focus:border-primary block w-full pl-10 py-2 text-sm border-border rounded-lg"
                      placeholder="BW-12345-ABC"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-lg font-medium text-primary mb-3 font-serif">Commission Details</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Commission Type <span className="text-error">*</span></span>
                  <div className="flex space-x-4">
                    <label className={`flex items-center p-3 border-2 rounded-lg ${
                      commissionType === 'percentage' 
                        ? 'border-secondary bg-secondary/10' 
                        : 'border-gray-300 hover:border-secondary'
                    } transition-colors cursor-pointer`}>
                      <input
                        type="radio"
                        name="commissionType"
                        className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                        checked={commissionType === 'percentage'}
                        onChange={() => handleCommissionTypeChange('percentage')}
                      />
                      <div className="ml-2 flex items-center">
                        <Percent className="h-4 w-4 text-secondary mr-1" />
                        <span className="text-sm font-medium">Percentage</span>
                      </div>
                    </label>
                    
                    <label className={`flex items-center p-3 border-2 rounded-lg ${
                      commissionType === 'fixed' 
                        ? 'border-secondary bg-secondary/10' 
                        : 'border-gray-300 hover:border-secondary'
                    } transition-colors cursor-pointer`}>
                      <input
                        type="radio"
                        name="commissionType"
                        className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                        checked={commissionType === 'fixed'}
                        onChange={() => handleCommissionTypeChange('fixed')}
                      />
                      <div className="ml-2 flex items-center">
                        <Banknote className="h-4 w-4 text-secondary mr-1" />
                        <span className="text-sm font-medium">Fixed Amount</span>
                      </div>
                    </label>
                  </div>
                  {errors.commissionType && <p className="mt-1 text-xs text-error">{errors.commissionType}</p>}
                </div>
                
                {commissionType && (
                  <div>
                    <label htmlFor="commissionValue" className="block text-sm font-medium text-gray-700 mb-1">
                      {commissionType === 'percentage' ? 'Commission Percentage (%)' : 'Fixed Commission Amount (BWP)'} <span className="text-error">*</span>
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {commissionType === 'percentage' ? (
                          <Percent className="h-4 w-4 text-primary" />
                        ) : (
                          <Banknote className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <input
                        type="text"
                        id="commissionValue"
                        value={commissionValue}
                        onChange={handleCommissionValueChange}
                        className={`focus:ring-primary focus:border-primary block w-full pl-10 py-2 text-sm border-border rounded-lg ${
                          errors.commissionValue ? 'border-error ring-1 ring-error' : ''
                        }`}
                        placeholder={commissionType === 'percentage' ? "e.g. 5.5" : "e.g. 50000"}
                      />
                      {commissionType === 'fixed' && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">BWP</span>
                        </div>
                      )}
                    </div>
                    {errors.commissionValue && <p className="mt-1 text-xs text-error">{errors.commissionValue}</p>}
                    
                    {/* Show calculated commission for percentage type */}
                    {commissionType === 'percentage' && commissionValue && sellingPrice && parseFloat(sellingPrice) > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <Calculator className="h-4 w-4 text-blue-600 mr-2" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-blue-800">
                              Calculated Commission: {formatCurrency(calculatedCommission)}
                            </span>
                            <span className="text-xs text-blue-600">
                              Based on {parseFloat(commissionValue)}% of {formatCurrency(sellingPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 mt-4">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="ml-2 text-xs text-primary">
                  <span className="font-medium">Note:</span> Only the fields marked with an asterisk (*) are required. The sale agreement will be requested in the document upload section.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 md:mt-8 bg-white rounded-xl p-4 md:p-6 border border-blue-200">
            <legend className="text-base md:text-lg font-medium text-primary mb-4 md:mb-6 font-serif">
              Please identify yourself as:
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <label
                className={`flex flex-col items-center p-3 md:p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  entityType === 'individual' 
                    ? 'border-secondary bg-secondary/10 shadow-md' 
                    : 'border-gray-300 hover:border-secondary hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => handleEntityTypeChange('individual')}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-4">
                  <User className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-primary">Individual</span>
                <input
                  type="radio"
                  className="mt-2 md:mt-3 h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                  checked={entityType === 'individual'}
                  readOnly
                />
              </label>
              
              <label
                className={`flex flex-col items-center p-3 md:p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  entityType === 'company' 
                    ? 'border-secondary bg-secondary/10 shadow-md' 
                    : 'border-gray-300 hover:border-secondary hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => handleEntityTypeChange('company')}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-4">
                  <Building className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-primary">Company</span>
                <input
                  type="radio"
                  className="mt-2 md:mt-3 h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                  checked={entityType === 'company'}
                  readOnly
                />
              </label>
              
              <label
                className={`flex flex-col items-center p-3 md:p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  entityType === 'trust' 
                    ? 'border-secondary bg-secondary/10 shadow-md' 
                    : 'border-gray-300 hover:border-secondary hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => handleEntityTypeChange('trust')}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-4">
                  <Scale className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-primary">Trust</span>
                <input
                  type="radio"
                  className="mt-2 md:mt-3 h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                  checked={entityType === 'trust'}
                  readOnly
                />
              </label>
              
              <label
                className={`flex flex-col items-center p-3 md:p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  entityType === 'estate' 
                    ? 'border-secondary bg-secondary/10 shadow-md' 
                    : 'border-gray-300 hover:border-secondary hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => handleEntityTypeChange('estate')}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-4">
                  <Briefcase className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-primary">Estate</span>
                <input
                  type="radio"
                  className="mt-2 md:mt-3 h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                  checked={entityType === 'estate'}
                  readOnly
                />
              </label>
              
              <label
                className={`flex flex-col items-center p-3 md:p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  entityType === 'society' 
                    ? 'border-secondary bg-secondary/10 shadow-md' 
                    : 'border-gray-300 hover:border-secondary hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => handleEntityTypeChange('society')}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-4">
                  <Users className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-primary">Society</span>
                <input
                  type="radio"
                  className="mt-2 md:mt-3 h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                  checked={entityType === 'society'}
                  readOnly
                />
              </label>
            </div>
            {errors.entityType && (
              <p className="mt-2 text-xs text-center text-error">{errors.entityType}</p>
            )}
            
            {/* Info tooltips for entity types - Keeping these but removing requirement lists */}
            {entityType === 'trust' && (
              <div className="mt-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-primary">About Trusts</h4>
                  <button 
                    type="button"
                    onClick={() => setShowTrustInfo(!showTrustInfo)}
                    className="text-secondary hover:text-secondary-dark"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                
                {showTrustInfo && (
                  <div className="bg-white p-3 rounded-lg border border-primary/10 mb-3 text-xs text-gray-700">
                    <p className="font-medium text-primary mb-1">What is a Trust?</p>
                    <p>A Trust is a legal arrangement where a trustee holds and manages assets on behalf of beneficiaries. It's often established for estate planning, asset protection, or tax purposes.</p>
                  </div>
                )}
              </div>
            )}
            
            {entityType === 'estate' && (
              <div className="mt-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-primary">About Estates</h4>
                  <button 
                    type="button"
                    onClick={() => setShowEstateInfo(!showEstateInfo)}
                    className="text-secondary hover:text-secondary-dark"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                
                {showEstateInfo && (
                  <div className="bg-white p-3 rounded-lg border border-primary/10 mb-3 text-xs text-gray-700">
                    <p className="font-medium text-primary mb-1">What is an Estate?</p>
                    <p>An Estate refers to the total property and assets owned by a deceased person. The estate executor is responsible for distributing these assets according to the will or intestate succession laws.</p>
                  </div>
                )}
              </div>
            )}
            
            {entityType === 'society' && (
              <div className="mt-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-primary">About Societies</h4>
                  <button 
                    type="button"
                    onClick={() => setShowSocietyInfo(!showSocietyInfo)}
                    className="text-secondary hover:text-secondary-dark"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                
                {showSocietyInfo && (
                  <div className="bg-white p-3 rounded-lg border border-primary/10 mb-3 text-xs text-gray-700">
                    <p className="font-medium text-primary mb-1">What is a Society?</p>
                    <p>A Society is a non-profit organization formed by a group of persons who come together for a common purpose like education, culture, religion, charity, etc. It's registered under the Societies Registration Act.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 md:mt-12 flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>
        
        <button
          onClick={handleNext}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          Next
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Step4AgentInformation;