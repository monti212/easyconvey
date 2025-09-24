import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building, Calendar, FileText, Plus, X, CreditCard, Users } from 'lucide-react';

interface Director {
  id: string;
  name: string;
  idNumber: string;
  position: string;
}

interface CompanyDetailsProps {
  companyName: string;
  registrationNumber: string;
  vatNumber: string;
  incorporationDate: string;
  companyDirectors: Director[];
  onUpdate: (data: Partial<{
    companyName: string;
    registrationNumber: string;
    vatNumber: string;
    incorporationDate: string;
    companyDirectors: Director[];
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  companyName,
  registrationNumber,
  vatNumber,
  incorporationDate,
  companyDirectors,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDirector, setNewDirector] = useState<Partial<Director>>({
    id: '',
    name: '',
    idNumber: '',
    position: ''
  });
  const [addingDirector, setAddingDirector] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const handleNewDirectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDirector(prev => ({ ...prev, [name]: value }));
  };

  const addNewDirector = () => {
    // Validate director info
    const directorErrors: Record<string, string> = {};
    if (!newDirector.name) directorErrors.name = "Director name is required";
    if (!newDirector.idNumber) directorErrors.idNumber = "ID/Passport number is required";
    
    if (Object.keys(directorErrors).length > 0) {
      setErrors(directorErrors);
      return;
    }
    
    const newDirectorWithId = {
      ...newDirector,
      id: `director-${Date.now()}` // Generate unique ID
    } as Director;
    
    onUpdate({ companyDirectors: [...companyDirectors, newDirectorWithId] });
    
    // Reset form
    setNewDirector({
      id: '',
      name: '',
      idNumber: '',
      position: ''
    });
    setAddingDirector(false);
    setErrors({});
  };

  const removeDirector = (id: string) => {
    onUpdate({
      companyDirectors: companyDirectors.filter(director => director.id !== id)
    });
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};
    
    if (!companyName) formErrors.companyName = "Company name is required";
    if (!registrationNumber) formErrors.registrationNumber = "Registration number is required";
    
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
        Company Details
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please provide the required information about your company for this transaction.
      </p>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8">
        <div className="space-y-6">
          {/* Company Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={companyName}
                  onChange={handleChange}
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm ${
                    errors.companyName ? 'border-red-300 ring-1 ring-red-300' : ''
                  }`}
                />
                {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
              </div>
              
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={registrationNumber}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.registrationNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                    placeholder="e.g. BW12345678"
                  />
                </div>
                {errors.registrationNumber && <p className="mt-1 text-xs text-red-600">{errors.registrationNumber}</p>}
              </div>
              
              <div>
                <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Number (if applicable)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    value={vatNumber}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300"
                    placeholder="e.g. BW123456789"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="incorporationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Incorporation Date
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="date"
                    id="incorporationDate"
                    name="incorporationDate"
                    value={incorporationDate}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Company Directors */}
          <div className="border-t border-blue-200 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Company Directors
            </h3>
            
            {companyDirectors.length > 0 ? (
              <div className="mb-4 space-y-3">
                {companyDirectors.map(director => (
                  <div key={director.id} className="bg-white p-3 rounded-lg border border-blue-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{director.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          ID: {director.idNumber}
                        </span>
                        {director.position && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                            {director.position}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDirector(director.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-3">No directors added yet. Please add at least one director.</p>
            )}
            
            {addingDirector ? (
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Add New Director</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="directorName" className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="directorName"
                      name="name"
                      value={newDirector.name}
                      onChange={handleNewDirectorChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.name ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="directorId" className="block text-xs font-medium text-gray-700 mb-1">
                      ID/Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="directorId"
                      name="idNumber"
                      value={newDirector.idNumber}
                      onChange={handleNewDirectorChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.idNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                    />
                    {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="directorPosition" className="block text-xs font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      id="directorPosition"
                      name="position"
                      value={newDirector.position}
                      onChange={handleNewDirectorChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm"
                      placeholder="e.g. CEO, Director, etc."
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingDirector(false);
                      setErrors({});
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addNewDirector}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Director
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingDirector(true)}
                className="flex items-center px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Director
              </button>
            )}
          </div>
        </div>
        
        {/* Requirements Reminder */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Required Documents</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li className="text-xs text-gray-700">Certificate of Incorporation</li>
            <li className="text-xs text-gray-700">Memorandum and Articles of Association</li>
            <li className="text-xs text-gray-700">Company Resolution authorizing the transaction</li>
            <li className="text-xs text-gray-700">Director's ID documents</li>
            <li className="text-xs text-gray-700">Tax Registration Certificate</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">These documents will be requested in the upcoming document upload section.</p>
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

export default CompanyDetails;