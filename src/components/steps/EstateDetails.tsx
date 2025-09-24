import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Calendar, FileText, Phone, Mail, User } from 'lucide-react';

interface EstateDetailsProps {
  deceasedName: string;
  dateOfDeath: string;
  estateNumber: string;
  executorName: string;
  executorContact: string;
  onUpdate: (data: Partial<{
    deceasedName: string;
    dateOfDeath: string;
    estateNumber: string;
    executorName: string;
    executorContact: string;
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EstateDetails: React.FC<EstateDetailsProps> = ({
  deceasedName,
  dateOfDeath,
  estateNumber,
  executorName,
  executorContact,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};
    
    if (!deceasedName) formErrors.deceasedName = "Deceased person's name is required";
    if (!dateOfDeath) formErrors.dateOfDeath = "Date of death is required";
    if (!estateNumber) formErrors.estateNumber = "Estate number/reference is required";
    if (!executorName) formErrors.executorName = "Executor's name is required";
    if (!executorContact) formErrors.executorContact = "Executor's contact information is required";
    
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
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
        Estate Details
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please provide the required information about the deceased's estate for this transaction.
      </p>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8">
        <div className="space-y-6">
          {/* Deceased Person Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
              Estate Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="deceasedName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name of Deceased <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="deceasedName"
                    name="deceasedName"
                    value={deceasedName}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.deceasedName ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                  />
                </div>
                {errors.deceasedName && <p className="mt-1 text-xs text-red-600">{errors.deceasedName}</p>}
              </div>
              
              <div>
                <label htmlFor="dateOfDeath" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Death <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="date"
                    id="dateOfDeath"
                    name="dateOfDeath"
                    value={dateOfDeath}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.dateOfDeath ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                  />
                </div>
                {errors.dateOfDeath && <p className="mt-1 text-xs text-red-600">{errors.dateOfDeath}</p>}
              </div>
              
              <div>
                <label htmlFor="estateNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Estate Number/Reference <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="estateNumber"
                    name="estateNumber"
                    value={estateNumber}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.estateNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                    placeholder="e.g. E00123/2022"
                  />
                </div>
                {errors.estateNumber && <p className="mt-1 text-xs text-red-600">{errors.estateNumber}</p>}
              </div>
            </div>
          </div>
          
          {/* Executor Information */}
          <div className="border-t border-blue-200 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              Executor Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="executorName" className="block text-sm font-medium text-gray-700 mb-1">
                  Executor's Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="executorName"
                    name="executorName"
                    value={executorName}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.executorName ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                  />
                </div>
                {errors.executorName && <p className="mt-1 text-xs text-red-600">{errors.executorName}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="executorContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Executor's Contact Information <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="executorContact"
                    name="executorContact"
                    value={executorContact}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.executorContact ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                    placeholder="Phone number or email address"
                  />
                </div>
                {errors.executorContact && <p className="mt-1 text-xs text-red-600">{errors.executorContact}</p>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Requirements Reminder */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Required Documents</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li className="text-xs text-gray-700">Death Certificate</li>
            <li className="text-xs text-gray-700">Will (if applicable)</li>
            <li className="text-xs text-gray-700">Letters of Executorship from Master of High Court</li>
            <li className="text-xs text-gray-700">Estate inventory</li>
            <li className="text-xs text-gray-700">Identity documents of executor(s)</li>
            <li className="text-xs text-gray-700">Tax Clearance Certificate</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">These documents will be requested in the upcoming document upload section.</p>
        </div>
        
        <div className="mt-6 bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">Important Note</h4>
              <p className="text-xs text-amber-700 mt-1">
                Properties in deceased estates must follow specific transfer processes. The conveyancer will 
                need to coordinate with the Master of the High Court and may require additional documentation
                depending on your specific situation.
              </p>
            </div>
          </div>
        </div>
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
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Next
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default EstateDetails;