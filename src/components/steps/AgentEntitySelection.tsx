import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Building, Scale, Briefcase, Users, HelpCircle } from 'lucide-react';

interface AgentEntitySelectionProps {
  entityType: string;
  onUpdate: (data: Partial<{ entityType: string }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const AgentEntitySelection: React.FC<AgentEntitySelectionProps> = ({
  entityType,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTrustInfo, setShowTrustInfo] = useState(false);
  const [showEstateInfo, setShowEstateInfo] = useState(false);
  const [showSocietyInfo, setShowSocietyInfo] = useState(false);

  const handleEntityTypeChange = (type: string) => {
    onUpdate({ entityType: type });
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};
    
    if (!entityType) {
      formErrors.entityType = "Please select your entity type";
    }
    
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4 text-center font-serif">
        Your Entity Type
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please identify which type of entity you are representing in this transaction.
      </p>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8">
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
        
        {/* Info tooltips for entity types */}
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

export default AgentEntitySelection;