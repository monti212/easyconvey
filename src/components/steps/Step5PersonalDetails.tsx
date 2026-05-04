import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, UserCircle, Globe, Heart, AlertCircle, CreditCard, Calendar } from 'lucide-react';

interface Step5Props {
  gender: string;
  nationality: string;
  maritalStatus: string;
  requiredDocuments: string[];
  clientName?: string;
  dateOfBirth?: string;
  idPassportNumber?: string;
  // OCR pre-fill values
  extractedClientName?: string;
  extractedIdNumber?: string;
  extractedDateOfBirth?: string;
  onUpdate: (data: Partial<{
    gender: string;
    nationality: string;
    maritalStatus: string;
    requiredDocuments: string[];
    clientName: string;
    dateOfBirth: string;
    idPassportNumber: string;
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Step5PersonalDetails: React.FC<Step5Props> = ({
  gender,
  nationality,
  maritalStatus,
  requiredDocuments,
  clientName = '',
  dateOfBirth = '',
  idPassportNumber = '',
  extractedClientName = '',
  extractedIdNumber = '',
  extractedDateOfBirth = '',
  onUpdate,
  onNext,
  onPrevious
}) => {
  // Pre-fill from OCR extracted values if fields are empty
  useEffect(() => {
    if (extractedClientName && !clientName) onUpdate({ clientName: extractedClientName });
    if (extractedIdNumber && !idPassportNumber) onUpdate({ idPassportNumber: extractedIdNumber });
    if (extractedDateOfBirth && !dateOfBirth) onUpdate({ dateOfBirth: extractedDateOfBirth });
  }, [extractedClientName, extractedIdNumber, extractedDateOfBirth]);
  // Define the documents required based on nationality and marital status
  useEffect(() => {
    const baseDocuments = ['Proof of Address (Utility Bill or Affidavit)'];
    let additionalDocuments: string[] = [];
    
    // Nationality-based documents
    if (nationality === 'Botswana') {
      baseDocuments.push('ID Document');
      
      // Add Form A or Form B based on marital status
      if (maritalStatus === 'married_in') {
        additionalDocuments.push('Form B - The Married Persons Property Act');
      } else if (maritalStatus === 'married_out') {
        additionalDocuments.push('Form A - Married Persons Property Act');
      }
    } else if (nationality !== 'Select nationality' && nationality) {
      additionalDocuments.push('Passport Copy');
      additionalDocuments.push('Residence Permit');
    }
    
    // Marital status-based documents
    if (maritalStatus === 'single') {
      // No additional documents for single
    } else if (maritalStatus === 'married_in') {
      additionalDocuments.push('Marriage Certificate');
      if (nationality === 'Botswana') {
        additionalDocuments.push('Spouse ID Document');
      } else {
        additionalDocuments.push('Spouse Passport Copy or Identity Document Copy');
      }
      additionalDocuments.push('Spouse Consent Form');
    } else if (maritalStatus === 'married_out') {
      additionalDocuments.push('Marriage Certificate');
      additionalDocuments.push('Antenuptial Contract');
    } else if (maritalStatus === 'divorced') {
      additionalDocuments.push('Divorce Decree');
    } else if (maritalStatus === 'widowed') {
      additionalDocuments.push('Death Certificate of Spouse');
    }
    
    // Update required documents
    onUpdate({ requiredDocuments: [...baseDocuments, ...additionalDocuments] });
  }, [nationality, maritalStatus, gender, onUpdate]);

  const nationalities = [
    "Select nationality",
    "Botswana", // Moved to the top as requested
    "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguan", "Argentine", "Armenian", "Australian",
    "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean",
    "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe",
    "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean",
    "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti",
    "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian",
    "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek",
    "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian",
    "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese",
    "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese",
    "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian",
    "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan",
    "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Ni-Vanuatu",
    "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Panamanian",
    "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian",
    "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
    "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan",
    "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan",
    "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan",
    "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
  ];

  const canProceed = clientName.trim() && gender && nationality && nationality !== "Select nationality" && maritalStatus;

  return (
    <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4 text-center font-serif">
        Personal Details
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please provide your personal information for the transaction. This helps us determine the required documentation.
      </p>

      <div className="bg-background rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8 space-y-6 md:space-y-8">

        {/* Full Legal Name */}
        <div>
          <label className="block text-base md:text-lg font-medium text-primary mb-3 font-serif">
            <div className="flex items-center">
              <UserCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              Full Legal Name <span className="text-error ml-1">*</span>
            </div>
          </label>
          {extractedClientName && extractedClientName !== clientName && (
            <div className="mb-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <span className="font-semibold">Auto-extracted from document:</span>
              <button
                type="button"
                onClick={() => onUpdate({ clientName: extractedClientName })}
                className="underline hover:no-underline"
              >
                {extractedClientName}
              </button>
              <span className="text-blue-500">(click to use)</span>
            </div>
          )}
          <input
            type="text"
            value={clientName}
            onChange={e => onUpdate({ clientName: e.target.value })}
            placeholder="e.g. Gaone Molefi"
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary focus:border-primary"
          />
          <p className="mt-1 text-xs text-gray-500">Enter the full name exactly as it appears on the ID document or title deed.</p>
        </div>

        {/* Date of Birth + ID/Passport Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm md:text-base font-medium text-primary mb-2 font-serif">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-primary mr-2" />
                Date of Birth
              </div>
            </label>
            {extractedDateOfBirth && extractedDateOfBirth !== dateOfBirth && (
              <div className="mb-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                Auto-extracted: <button type="button" className="underline" onClick={() => onUpdate({ dateOfBirth: extractedDateOfBirth })}>{extractedDateOfBirth}</button>
              </div>
            )}
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => onUpdate({ dateOfBirth: e.target.value })}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm md:text-base font-medium text-primary mb-2 font-serif">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-primary mr-2" />
                ID / Passport Number
              </div>
            </label>
            {extractedIdNumber && extractedIdNumber !== idPassportNumber && (
              <div className="mb-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                Auto-extracted: <button type="button" className="underline" onClick={() => onUpdate({ idPassportNumber: extractedIdNumber })}>{extractedIdNumber}</button>
              </div>
            )}
            <input
              type="text"
              value={idPassportNumber}
              onChange={e => onUpdate({ idPassportNumber: e.target.value })}
              placeholder="e.g. 123456789"
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Gender selection */}
        <div>
          <label className="block text-base md:text-lg font-medium text-primary mb-3 md:mb-4 font-serif">
            <div className="flex items-center">
              <UserCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              Gender
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                gender === 'male' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ gender: 'male' })}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mr-2 md:mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.5 21.5V18.5C5.5 18.5 1.5 14.5 1.5 9.5C1.5 4.5 5.5 0.5 10.5 0.5C15.5 0.5 19.5 4.5 19.5 9.5C19.5 14.5 15.5 18.5 10.5 18.5" />
                  <path d="M19.5 20.5L15.5 16.5" />
                  <path d="M19.5 16.5L15.5 20.5" />
                </svg>
              </div>
              <span className="text-sm md:text-lg text-primary">Male</span>
            </label>
            
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                gender === 'female' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ gender: 'female' })}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mr-2 md:mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="9" r="7" />
                  <path d="M12 16V22" />
                  <path d="M9 19H15" />
                </svg>
              </div>
              <span className="text-sm md:text-lg text-primary">Female</span>
            </label>
          </div>
        </div>

        {/* Nationality selection */}
        <div>
          <label htmlFor="nationality" className="block text-base md:text-lg font-medium text-primary mb-3 md:mb-4 font-serif">
            <div className="flex items-center">
              <Globe className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              Nationality
            </div>
          </label>
          <div className="relative rounded-xl shadow-sm">
            <select
              id="nationality"
              value={nationality}
              onChange={(e) => onUpdate({ nationality: e.target.value })}
              className="bg-white focus:ring-primary focus:border-primary block w-full py-2.5 md:py-3 px-3 md:px-4 text-sm md:text-base border-gray-300 rounded-xl"
            >
              {nationalities.map((nat, index) => (
                <option key={index} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          </div>
          
          {nationality === 'Botswana' && (
            <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-primary mr-1 flex-shrink-0" />
                <p className="text-xs text-primary/80">
                  Botswana Citizens should provide certified copy of their identity document
                </p>
              </div>
            </div>
          )}
          
          {nationality !== 'Select nationality' && nationality !== 'Botswana' && nationality !== '' && (
            <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-primary mr-1 flex-shrink-0" />
                <p className="text-xs text-primary/80">Non-citizens must provide passport documentation.</p>
              </div>
            </div>
          )}
        </div>

        {/* Marital status selection */}
        <div>
          <label className="block text-base md:text-lg font-medium text-primary mb-3 md:mb-4 font-serif">
            <div className="flex items-center">
              <Heart className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
              Marital Status
            </div>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                maritalStatus === 'single' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ maritalStatus: 'single' })}
            >
              <input
                type="radio"
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                checked={maritalStatus === 'single'}
                readOnly
              />
              <span className="ml-2 md:ml-3 text-sm md:text-base text-primary">Single</span>
            </label>
            
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                maritalStatus === 'married_in' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ maritalStatus: 'married_in' })}
            >
              <input
                type="radio"
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                checked={maritalStatus === 'married_in'}
                readOnly
              />
              <span className="ml-2 md:ml-3 text-sm md:text-base text-primary">Married (In Community)</span>
            </label>
            
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                maritalStatus === 'married_out' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ maritalStatus: 'married_out' })}
            >
              <input
                type="radio"
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                checked={maritalStatus === 'married_out'}
                readOnly
              />
              <span className="ml-2 md:ml-3 text-sm md:text-base text-primary">Married (Out of Community)</span>
            </label>
            
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                maritalStatus === 'divorced' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ maritalStatus: 'divorced' })}
            >
              <input
                type="radio"
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                checked={maritalStatus === 'divorced'}
                readOnly
              />
              <span className="ml-2 md:ml-3 text-sm md:text-base text-primary">Divorced</span>
            </label>
            
            <label
              className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                maritalStatus === 'widowed' 
                  ? 'border-secondary bg-white shadow-md' 
                  : 'border-gray-300 bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => onUpdate({ maritalStatus: 'widowed' })}
            >
              <input
                type="radio"
                className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
                checked={maritalStatus === 'widowed'}
                readOnly
              />
              <span className="ml-2 md:ml-3 text-sm md:text-base text-primary">Widowed</span>
            </label>
          </div>
        </div>

        {/* Required documents based on marital status */}
        {maritalStatus && (
          <div className="bg-white rounded-xl p-4 md:p-6 border border-primary/10">
            <h3 className="text-base md:text-lg font-medium text-primary mb-3 md:mb-4 font-serif">Required Documents</h3>
            <div className="bg-primary/5 p-3 md:p-4 rounded-lg border border-primary/10">
              <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2">
                {requiredDocuments.map((doc, index) => (
                  <li key={index} className="text-sm md:text-base text-primary">
                    <span className="text-gray-700">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3">
              These documents are required based on your nationality and marital status. Our AI will analyze them to verify your eligibility for this transaction.
            </p>
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
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white ${
            canProceed ? 'bg-primary hover:bg-primary-dark transition-colors' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Next
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Step5PersonalDetails;