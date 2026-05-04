import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Info, CheckCircle, FileText, Building2, MapPin, Banknote } from 'lucide-react';

interface Step1Props {
  transactionType: string;
  transactionCategory?: string;
  includeBondRegistration?: boolean;
  nationality: string;
  isFirstTimeBuyer?: boolean;
  onUpdate: (data: Partial<{
    transactionType: string;
    transactionCategory: string;
    includeBondRegistration: boolean;
    isFirstTimeBuyer: boolean;
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TRANSFER_TYPES = [
  {
    id: 'normal_transfer',
    label: 'Normal Transfer',
    icon: FileText,
    short: 'Standard freehold property sale between private parties.',
    info: 'The most common type of conveyancing in Botswana. Covers the sale and transfer of freehold (urban) residential or commercial property from one private party to another. Governed by the Deeds Registry Act (Cap 33:02) and Transfer Duty Act (Cap 53:01).',
  },
  {
    id: 'sectional_title',
    label: 'Sectional Title',
    icon: Building2,
    short: 'Transfer of a unit within a scheme (e.g. flat, apartment, townhouse).',
    info: 'Used when the property being transferred is a unit within a sectional title scheme — such as a flat, apartment, or townhouse in a complex. Each unit has its own title and the owner also holds a share in the common property. Governed by the Sectional Titles Act.',
  },
  {
    id: 'tribal_grant',
    label: 'Tribal Grant',
    icon: MapPin,
    short: 'Property held under a tribal/customary land grant — requires Land Board consent.',
    info: 'Covers the transfer of property held under a tribal land grant or Fixed Period State Grant. Land Board consent is required under the Tribal Land Act before transfer can proceed. The deed references the original State Grant and the 99-year ownership period. Common in urban extensions and peri-urban areas of Botswana.',
  },
] as const;

const Step1TransactionType: React.FC<Step1Props> = ({
  transactionType,
  transactionCategory,
  includeBondRegistration,
  nationality,
  isFirstTimeBuyer,
  onUpdate,
  onNext,
  onPrevious,
}) => {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const handleCategorySelect = (id: string) => {
    onUpdate({
      transactionType: 'transaction_details',
      transactionCategory: id,
    });
    setOpenTooltip(null);
  };

  const toggleBond = () => {
    onUpdate({ includeBondRegistration: !includeBondRegistration });
  };

  const canProceed = !!transactionCategory;

  return (
    <div className="py-6 md:py-10 max-w-2xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 text-center font-serif">
        Transaction Type
      </h2>
      <p className="text-sm md:text-base text-gray-600 mb-8 text-center">
        Select the type of transfer and whether bond registration is included.
      </p>

      {/* Transfer type selection */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
          Transfer Type <span className="text-error">*</span>
        </p>
        <div className="grid grid-cols-1 gap-3">
          {TRANSFER_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = transactionCategory === type.id;
            const tooltipOpen = openTooltip === type.id;

            return (
              <div key={type.id} className="relative">
                <button
                  onClick={() => handleCategorySelect(type.id)}
                  className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-secondary bg-secondary/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-secondary/50 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4 ${
                    isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{type.label}</span>
                      {isSelected && <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{type.short}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltip(tooltipOpen ? null : type.id);
                    }}
                    className="ml-3 flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                    title={`About ${type.label}`}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </button>

                {/* Info tooltip */}
                {tooltipOpen && (
                  <div className="mt-1 mx-1 p-4 bg-[#0B1F3A] text-white rounded-xl shadow-xl text-sm leading-relaxed z-10 relative">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-[#C8A14F] flex-shrink-0 mt-0.5" />
                      <p>{type.info}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bond Registration toggle */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
          Bond Registration
        </p>
        <div className="relative">
          <button
            onClick={toggleBond}
            className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              includeBondRegistration
                ? 'border-secondary bg-secondary/5 shadow-md'
                : 'border-gray-200 bg-white hover:border-secondary/50 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4 ${
              includeBondRegistration ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            }`}>
              <Banknote className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Include Bond Registration</span>
                {includeBondRegistration && <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Add bond registration alongside this transfer (e.g. buyer is taking out a mortgage)
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenTooltip(openTooltip === 'bond' ? null : 'bond');
              }}
              className="ml-3 flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
              title="About Bond Registration"
            >
              <Info className="h-4 w-4" />
            </button>
          </button>

          {openTooltip === 'bond' && (
            <div className="mt-1 mx-1 p-4 bg-[#0B1F3A] text-white rounded-xl shadow-xl text-sm leading-relaxed z-10 relative">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-[#C8A14F] flex-shrink-0 mt-0.5" />
                <p>
                  Bond registration covers the registration of a mortgage bond over the property, typically when the buyer is financing the purchase through a bank or financial institution. It runs simultaneously with the transfer and generates its own set of bond registration documents. Select this alongside your transfer type — not as a standalone transaction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* First-time buyer — only for Botswana citizens */}
      {nationality === 'Botswana' && transactionCategory && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isFirstTimeBuyer || false}
              onChange={(e) => onUpdate({ isFirstTimeBuyer: e.target.checked })}
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Buyer is a first-time property buyer
            </span>
          </label>
          <p className="mt-1.5 text-xs text-blue-600 pl-8">
            Botswana citizens purchasing their first property may be exempt from Transfer Duty under Section 20(1)(f) of the Transfer Duty Act.
          </p>
        </div>
      )}

      {/* Selected summary pill */}
      {(transactionCategory || includeBondRegistration) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {transactionCategory && (
            <span className="inline-flex items-center px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
              {TRANSFER_TYPES.find(t => t.id === transactionCategory)?.label}
            </span>
          )}
          {includeBondRegistration && (
            <span className="inline-flex items-center px-3 py-1 bg-secondary text-primary text-xs font-medium rounded-full">
              + Bond Registration
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-gray-300 rounded-lg text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4" />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white transition-colors ${
            canProceed ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Step1TransactionType;
