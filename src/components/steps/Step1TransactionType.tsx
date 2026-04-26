import React, { useEffect } from 'react';
import { FileText, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface Step1Props {
  transactionType: string;
  nationality: string;
  isFirstTimeBuyer?: boolean;
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
  // Auto-select transaction_details on mount if not already set
  useEffect(() => {
    if (!transactionType) {
      onUpdate({ transactionType: 'transaction_details' });
    }
  }, []);

  const handleFirstTimeBuyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ isFirstTimeBuyer: e.target.checked });
  };

  const isSelected = transactionType === 'transaction_details' || !!transactionType;

  return (
    <div className="py-6 md:py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 md:mb-6 text-center font-serif">
        Welcome to Minchin & Kelly
      </h2>
      <p className="text-base md:text-xl text-gray-600 mb-8 md:mb-12 text-center max-w-2xl mx-auto px-4">
        Our AI-powered platform will guide you through every step of your property transaction.
      </p>

      <div className="max-w-lg mx-auto px-4">
        <button
          onClick={() => onUpdate({ transactionType: 'transaction_details' })}
          className={`w-full flex flex-col items-center p-8 md:p-12 rounded-xl transition-all duration-300 ${
            isSelected
              ? 'bg-background border-2 border-secondary shadow-lg shadow-blue-100'
              : 'bg-white border-2 border-gray-200 hover:border-secondary hover:shadow-md'
          }`}
        >
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 md:mb-6 ${
            isSelected ? 'bg-primary/10' : 'bg-gray-100'
          }`}>
            {isSelected
              ? <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              : <FileText className="h-8 w-8 md:h-10 md:w-10 text-gray-600" />
            }
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-primary mb-2 md:mb-3 font-serif">Transaction Details</h3>
          <p className="text-sm md:text-base text-gray-600 text-center">
            Enter the full property transaction details for both buyer and seller.
          </p>
        </button>

        {/* First time buyer checkbox — only for Botswana citizens */}
        {nationality === 'Botswana' && isSelected && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isFirstTimeBuyer || false}
                onChange={handleFirstTimeBuyerChange}
                className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Buyer is a first time property buyer
              </span>
            </label>
            <p className="mt-2 text-xs text-blue-600 pl-8">
              Determines eligibility for transfer duty exemption (optional).
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 md:mt-12 flex justify-between max-w-lg mx-auto px-4">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>

        {isSelected && (
          <button
            onClick={onNext}
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