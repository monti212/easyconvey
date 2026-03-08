import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Users, Calendar, FileText, Plus, X, Building, Phone, User } from 'lucide-react';

interface CommitteeMember {
  id: string;
  name: string;
  idNumber: string;
  position: string;
}

interface SocietyDetailsProps {
  societyName: string;
  societyRegNumber: string;
  societyFormationDate: string;
  committeeMembers: CommitteeMember[];
  societyAddress: string;
  societyContact: string;
  onUpdate: (data: Partial<{
    societyName: string;
    societyRegNumber: string;
    societyFormationDate: string;
    committeeMembers: CommitteeMember[];
    societyAddress: string;
    societyContact: string;
  }>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SocietyDetails: React.FC<SocietyDetailsProps> = ({
  societyName,
  societyRegNumber,
  societyFormationDate,
  committeeMembers,
  societyAddress,
  societyContact,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newMember, setNewMember] = useState<Partial<CommitteeMember>>({
    id: '',
    name: '',
    idNumber: '',
    position: ''
  });
  const [addingMember, setAddingMember] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const handleNewMemberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };

  const addNewMember = () => {
    // Validate member info
    const memberErrors: Record<string, string> = {};
    if (!newMember.name) memberErrors.name = "Member name is required";
    if (!newMember.idNumber) memberErrors.idNumber = "ID/Passport number is required";
    
    if (Object.keys(memberErrors).length > 0) {
      setErrors(memberErrors);
      return;
    }
    
    const newMemberWithId = {
      ...newMember,
      id: `member-${Date.now()}` // Generate unique ID
    } as CommitteeMember;
    
    onUpdate({ committeeMembers: [...committeeMembers, newMemberWithId] });
    
    // Reset form
    setNewMember({
      id: '',
      name: '',
      idNumber: '',
      position: ''
    });
    setAddingMember(false);
    setErrors({});
  };

  const removeMember = (id: string) => {
    onUpdate({
      committeeMembers: committeeMembers.filter(member => member.id !== id)
    });
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};
    
    if (!societyName) formErrors.societyName = "Society name is required";
    if (!societyRegNumber) formErrors.societyRegNumber = "Registration number is required";
    if (committeeMembers.length === 0) formErrors.members = "At least one committee member is required";
    
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
        Society Details
      </h2>
      <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 text-center max-w-2xl mx-auto">
        Please provide the required information about your society for this transaction.
      </p>

      <div className="bg-background rounded-2xl p-5 md:p-8 shadow-lg mb-6 md:mb-8">
        <div className="space-y-6">
          {/* Society Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Society Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="societyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Society Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="societyName"
                  name="societyName"
                  value={societyName}
                  onChange={handleChange}
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm ${
                    errors.societyName ? 'border-red-300 ring-1 ring-red-300' : ''
                  }`}
                />
                {errors.societyName && <p className="mt-1 text-xs text-red-600">{errors.societyName}</p>}
              </div>
              
              <div>
                <label htmlFor="societyRegNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="societyRegNumber"
                    name="societyRegNumber"
                    value={societyRegNumber}
                    onChange={handleChange}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 ${
                      errors.societyRegNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                    }`}
                    placeholder="e.g. SOC-12345"
                  />
                </div>
                {errors.societyRegNumber && <p className="mt-1 text-xs text-red-600">{errors.societyRegNumber}</p>}
              </div>
              
              <div>
                <label htmlFor="societyFormationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Formation Date
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="date"
                    id="societyFormationDate"
                    name="societyFormationDate"
                    value={societyFormationDate}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="societyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Society Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <textarea
                    id="societyAddress"
                    name="societyAddress"
                    value={societyAddress}
                    onChange={handleChange}
                    rows={2}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300"
                    placeholder="Official address of the society"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="societyContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Information
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    id="societyContact"
                    name="societyContact"
                    value={societyContact}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300"
                    placeholder="Phone and/or email for the society"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Committee Members Section */}
          <div className="border-t border-blue-200 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Committee Members
              {errors.members && (
                <span className="ml-2 text-xs text-red-600">{errors.members}</span>
              )}
            </h3>
            
            {committeeMembers.length > 0 ? (
              <div className="mb-4 space-y-3">
                {committeeMembers.map(member => (
                  <div key={member.id} className="bg-white p-3 rounded-lg border border-blue-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          ID: {member.idNumber}
                        </span>
                        {member.position && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                            {member.position}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeMember(member.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-3">No committee members added yet. Please add at least one member.</p>
            )}
            
            {addingMember ? (
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Add New Committee Member</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="memberName" className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="memberName"
                        name="name"
                        value={newMember.name}
                        onChange={handleNewMemberChange}
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 rounded-lg border-gray-300 shadow-sm text-sm ${
                          errors.name ? 'border-red-300 ring-1 ring-red-300' : ''
                        }`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="memberId" className="block text-xs font-medium text-gray-700 mb-1">
                      ID/Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="memberId"
                      name="idNumber"
                      value={newMember.idNumber}
                      onChange={handleNewMemberChange}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm ${
                        errors.idNumber ? 'border-red-300 ring-1 ring-red-300' : ''
                      }`}
                      placeholder="ID or passport number"
                    />
                    {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="memberPosition" className="block text-xs font-medium text-gray-700 mb-1">
                      Position in Society
                    </label>
                    <input
                      type="text"
                      id="memberPosition"
                      name="position"
                      value={newMember.position}
                      onChange={handleNewMemberChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-lg border-gray-300 shadow-sm text-sm"
                      placeholder="e.g. Chairperson, Secretary, Treasurer, etc."
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingMember(false);
                      setErrors({});
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addNewMember}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingMember(true)}
                className="flex items-center px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Committee Member
              </button>
            )}
          </div>
        </div>
        
        {/* Requirements Reminder */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Required Documents</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li className="text-xs text-gray-700">Society Registration Certificate</li>
            <li className="text-xs text-gray-700">Constitution/Bylaws of the Society</li>
            <li className="text-xs text-gray-700">Resolution by the Society Board authorizing the transaction</li>
            <li className="text-xs text-gray-700">List of current Society Board members</li>
            <li className="text-xs text-gray-700">Identity documents of authorized signatories</li>
            <li className="text-xs text-gray-700">Tax Registration/Exemption Certificate</li>
            <li className="text-xs text-gray-700">Financial statements (if applicable)</li>
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
                Any property owned by a society must be transferred according to the society's constitution 
                and governing laws. The conveyancer will need to verify that the transaction has been properly 
                authorized by the society's governing body.
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
          className="inline-flex items-center px-4 py-2 md:px-5 md:py-2.5 border-2 border-transparent rounded-lg text-sm md:text-base font-medium shadow-md text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          Next
          <ArrowRight className="ml-1 md:ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SocietyDetails;