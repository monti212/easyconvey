import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Scale, Calendar, FileText, Plus, X, Users, User } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  idNumber: string;
  contact?: string;
}

interface TrustDetailsProps {
  trustName: string;
  trustNumber: string;
  trustDate: string;
  trustees: Person[];
  beneficiaries: Person[];
  onUpdate: (data: Partial<{
    trustName: string;
    trustNumber: string;
    trustDate: string;
    trustees: Person[];
    beneficiaries: Person[];
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TrustDetails: React.FC<TrustDetailsProps> = ({
  trustName,
  trustNumber,
  trustDate,
  trustees,
  beneficiaries,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPerson, setNewPerson] = useState<Partial<Person>>({
    id: '',
    name: '',
    idNumber: '',
    contact: ''
  });
  const [addingPersonType, setAddingPersonType] = useState<'trustee' | 'beneficiary' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const handleNewPersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPerson(prev => ({ ...prev, [name]: value }));
  };

  const addNewPerson = () => {
    if (!addingPersonType) return;
    
    // Validate person info
    const personErrors: Record<string, string> = {};
    if (!newPerson.name) personErrors.name = "Name is required";
    if (!newPerson.idNumber) personErrors.idNumber = "ID/Passport number is required";
    
    if (Object.keys(personErrors).length > 0) {
      setErrors(personErrors);
      return;
    }
    
    const newPersonWithId = {
      ...newPerson,
      id: `${addingPersonType}-${Date.now()}` // Generate unique ID
    } as Person;
    
    if (addingPersonType === 'trustee') {
      onUpdate({ trustees: [...trustees, newPersonWithId] });
    } else {
      onUpdate({ beneficiaries: [...beneficiaries, newPersonWithId] });
    }
    
    // Reset form
    setNewPerson({
      id: '',
      name: '',
      idNumber: '',
      contact: ''
    });
    setAddingPersonType(null);
    setErrors({});
  };

  const removePerson = (id: string, type: 'trustee' | 'beneficiary') => {
    if (type === 'trustee') {
      onUpdate({
        trustees: trustees.filter(person => person.id !== id)
      });
    } else {
      onUpdate({
        beneficiaries: beneficiaries.filter(person => person.id !== id)
      });
    }
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};
    
    if (!trustName) formErrors.trustName = "Trust name is required";
    if (!trustNumber) formErrors.trustNumber = "Trust number/reference is required";
    if (trustees.length === 0) formErrors.trustees = "At least one trustee is required";
    
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const renderPersonList = (people: Person[], type: 'trustee' | 'beneficiary') => {
    return people.length > 0 ? (
      <div className="mb-4 space-y-3">
        {people.map(person => (
          <div key={person.id} className="bg-white p-3 rounded-lg border border-blue-200 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-800">{person.name}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  ID: {person.idNumber}
                </span>
                {person.contact && (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                    {person.contact}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => removePerson(person.id, type)}
              className="p-1 text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-600 mb-3">
        {type === 'trustee' 
          ? "No trustees added yet. Please add at least one trustee." 
          : "No beneficiaries added yet."
        }
      </p>
    );
  };

  return (
    <div className="py-4 md:py-8 max-w-3xl mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
        Trust Details
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please provide the required information about the trust for this transaction.
      </p>

      <div className="bg-background rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8">
        <div className="space-y-6">
          {/* Trust Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Scale className="h-5 w-5 text-blue-600 mr-2" />
              Trust Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="trustName" className="block text-sm font-medium text-gray-700 mb-1">
                  Trust Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="trustName"
                  name="trustName"
                  value={trustName}
                  onChange={handleChange}
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm ${
                    errors.trustName ? 'border-red-300 ring-1 ring-red-300' : ''
                  }`}
                />
                {errors.trustName && <p className="mt-1 text-xs text-red-600">{errors.trustName}</p>}
              </div>
              
              <div>
                <label htmlFor="trustNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Trust Number/Reference <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="trustNumber"
                    name="trustNumber"
                    value={trustNumber}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.trustNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                    placeholder="e.g. IT/12345/22"
                  />
                </div>
                {errors.trustNumber && <p className="mt-1 text-xs text-red-600">{errors.trustNumber}</p>}
              </div>
              
              <div>
                <label htmlFor="trustDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Trust Creation Date
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="date"
                    id="trustDate"
                    name="trustDate"
                    value={trustDate}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Trustees Section */}
          <div className="border-t border-blue-200 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Trustees
              {errors.trustees && (
                <span className="ml-2 text-xs text-red-600">{errors.trustees}</span>
              )}
            </h3>
            
            {renderPersonList(trustees, 'trustee')}
            
            {addingPersonType === 'trustee' ? (
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Add New Trustee</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="personName" className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="personName"
                      name="name"
                      value={newPerson.name}
                      onChange={handleNewPersonChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.name ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="personId" className="block text-xs font-medium text-gray-700 mb-1">
                      ID/Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="personId"
                      name="idNumber"
                      value={newPerson.idNumber}
                      onChange={handleNewPersonChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.idNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                    />
                    {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="personContact" className="block text-xs font-medium text-gray-700 mb-1">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      id="personContact"
                      name="contact"
                      value={newPerson.contact}
                      onChange={handleNewPersonChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm"
                      placeholder="Phone number or email"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingPersonType(null);
                      setErrors({});
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addNewPerson}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Trustee
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingPersonType('trustee')}
                className="flex items-center px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Trustee
              </button>
            )}
          </div>
          
          {/* Beneficiaries Section */}
          <div className="border-t border-blue-200 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              Beneficiaries
            </h3>
            
            {renderPersonList(beneficiaries, 'beneficiary')}
            
            {addingPersonType === 'beneficiary' ? (
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Add New Beneficiary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="beneficiaryName" className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="beneficiaryName"
                      name="name"
                      value={newPerson.name}
                      onChange={handleNewPersonChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.name ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="beneficiaryId" className="block text-xs font-medium text-gray-700 mb-1">
                      ID/Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="beneficiaryId"
                      name="idNumber"
                      value={newPerson.idNumber}
                      onChange={handleNewPersonChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.idNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                    />
                    {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="beneficiaryContact" className="block text-xs font-medium text-gray-700 mb-1">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      id="beneficiaryContact"
                      name="contact"
                      value={newPerson.contact}
                      onChange={handleNewPersonChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm"
                      placeholder="Phone number or email (optional)"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingPersonType(null);
                      setErrors({});
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addNewPerson}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Beneficiary
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingPersonType('beneficiary')}
                className="flex items-center px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Beneficiary
              </button>
            )}
          </div>
        </div>
        
        {/* Requirements Reminder */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Required Documents</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li className="text-xs text-gray-700">Trust Deed or Trust Instrument</li>
            <li className="text-xs text-gray-700">Letters of Authority from Master of High Court</li>
            <li className="text-xs text-gray-700">Trustee Resolution authorizing the transaction</li>
            <li className="text-xs text-gray-700">Identity documents of all trustees</li>
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
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          Next
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TrustDetails;