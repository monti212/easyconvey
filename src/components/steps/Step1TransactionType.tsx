import React, { useState } from 'react';
import { Building2, Home, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface Step1Props {
  transactionType: string;
  nationality: string; // Add nationality to check for Botswana
  isFirstTimeBuyer?: boolean; // New property for first time buyer status
  onUpdate: (data: Partial<{ transactionType: string, isFirstTimeBuyer?: boolean }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Step1TransactionType: React.FC<Step1Props> = ({ 
  transactionType, 
  nationality,
  isFirstTimeBuyer,
  onUpdate, 
  onNext,
  onPrevious
}) => {
  const [error, setError] = useState<string | null>(null);
  
  const handleTransactionTypeSelect = (type: string) => {
    // Just update the transaction type without proceeding
    onUpdate({ transactionType: type });
    setError(null); // Clear any existing errors
    
    // If switching from buying to selling, clear the first-time buyer status
    if (type !== 'buying') {
      onUpdate({ transactionType: type, isFirstTimeBuyer: undefined });
    }
  };
  
  const handleFirstTimeBuyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ isFirstTimeBuyer: e.target.checked });
    setError(null); // Clear error when selection is made
  };
  
  const handleProceed = () => {
    // Simply proceed to next step - no validation needed for first time buyer
    setError(null);
    onNext();
  };

  return (
    <div className="py-6 md:py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 md:mb-6 text-center font-serif">
        Welcome to Easy Convey
      </h2>
      <p className="text-base md:text-xl text-gray-600 mb-8 md:mb-12 text-center max-w-2xl mx-auto px-4">
        Our AI-powered platform will guide you through every step of your property transaction.
        Let's start by identifying your transaction type.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 max-w-4xl mx-auto px-4">
        <div className="flex flex-col">
          <button
            onClick={() => handleTransactionTypeSelect('buying')}
            className={`flex flex-col items-center p-6 md:p-10 rounded-xl transition-all duration-300 ${
              transactionType === 'buying'
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-secondary shadow-lg shadow-blue-100'
                : 'bg-white border-2 border-gray-200 hover:border-secondary hover:shadow-md'
            }`}
          >
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 md:mb-6 ${
              transactionType === 'buying' ? 'bg-primary/10' : 'bg-gray-100'
            }`}>
              <Home className={`h-8 w-8 md:h-10 md:w-10 ${
                transactionType === 'buying' ? 'text-primary' : 'text-gray-600'
              }`} />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-primary mb-2 md:mb-3 font-serif">Buying</h3>
            <p className="text-sm md:text-base text-gray-600 text-center">
              I want to purchase land or property and need assistance with the conveyancing process.
            </p>
          </button>
          
          {/* First time buyer checkbox - only appears when nationality is Botswana and transaction type is buying */}
          {nationality === 'Botswana' && transactionType === 'buying' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFirstTimeBuyer || false}
                  onChange={handleFirstTimeBuyerChange}
                  className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  I am a first time property buyer
                </span>
              </label>
              <p className="mt-2 text-xs text-blue-600 pl-8">
                This information helps determine your eligibility for certain benefits or exemptions (optional).
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => handleTransactionTypeSelect('selling')}
          className={`flex flex-col items-center p-6 md:p-10 rounded-xl transition-all duration-300 ${
            transactionType === 'selling'
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-secondary shadow-lg shadow-blue-100'
              : 'bg-white border-2 border-gray-200 hover:border-secondary hover:shadow-md'
          }`}
        >
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 md:mb-6 ${
            transactionType === 'selling' ? 'bg-primary/10' : 'bg-gray-100'
          }`}>
            <Building2 className={`h-8 w-8 md:h-10 md:w-10 ${
              transactionType === 'selling' ? 'text-primary' : 'text-gray-600'
            }`} />
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-primary mb-2 md:mb-3 font-serif">Selling</h3>
          <p className="text-sm md:text-base text-gray-600 text-center">
            I want to sell my land or property and need guidance through the legal transfer process.
          </p>
        </button>
      </div>

      <div className="mt-8 md:mt-12 flex justify-between max-w-4xl mx-auto px-4">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>

        {transactionType && (
          <button
            onClick={handleProceed}
            className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Next
            <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Step1TransactionType;