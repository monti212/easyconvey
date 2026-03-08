import React, { useState } from 'react';
import { Scale, Building, MapPin, User, FileText, X } from 'lucide-react';
import { Loan } from '../../types/database';
import { useOrganizationsByType } from '../../hooks/useOrganization';

interface ConveyancingApplicationFormProps {
  loan: Loan;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ConveyancingApplicationForm: React.FC<ConveyancingApplicationFormProps> = ({
  loan,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    conveyancerFirm: '',
    propertyAddress: '',
    transactionType: 'buying',
    propertyValue: loan.loan_amount.toString(),
    urgencyLevel: 'medium',
    specialInstructions: '',
    clientContactMethod: 'email'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch real conveyancer firms from database
  const { orgs: conveyancerOrgs } = useOrganizationsByType('conveyancer');
  const conveyancerFirms = conveyancerOrgs.map(o => o.name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.conveyancerFirm) {
      newErrors.conveyancerFirm = 'Please select a conveyancer firm';
    }
    
    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    }
    
    if (!formData.propertyValue || parseInt(formData.propertyValue) <= 0) {
      newErrors.propertyValue = 'Valid property value is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-white mr-3" />
              <div>
                <h2 className="text-xl font-bold text-white">Submit to Conveyancer</h2>
                <p className="text-purple-100 text-sm">Loan Application: {loan.application_number}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-purple-100 hover:text-white hover:bg-purple-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Loan Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Applicant:</span>
                <span className="text-blue-800 ml-2">{loan.applicant_name}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Amount:</span>
                <span className="text-blue-800 ml-2">P {loan.loan_amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Interest Rate:</span>
                <span className="text-blue-800 ml-2">{loan.interest_rate}%</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Term:</span>
                <span className="text-blue-800 ml-2">{loan.term_months} months</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Conveyancer Selection */}
            <div>
              <label htmlFor="conveyancerFirm" className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Select Conveyancer Firm <span className="text-red-500">*</span>
              </label>
              <select
                id="conveyancerFirm"
                name="conveyancerFirm"
                value={formData.conveyancerFirm}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.conveyancerFirm ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a conveyancer...</option>
                {conveyancerFirms.map((firm) => (
                  <option key={firm} value={firm}>{firm}</option>
                ))}
              </select>
              {errors.conveyancerFirm && (
                <p className="mt-1 text-xs text-red-600">{errors.conveyancerFirm}</p>
              )}
            </div>

            {/* Property Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Property Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="propertyAddress"
                  name="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.propertyAddress ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Block 8, Plot 123, Gaborone"
                />
                {errors.propertyAddress && (
                  <p className="mt-1 text-xs text-red-600">{errors.propertyAddress}</p>
                )}
              </div>

              <div>
                <label htmlFor="propertyValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Value (BWP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="propertyValue"
                  name="propertyValue"
                  value={formData.propertyValue}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.propertyValue ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.propertyValue && (
                  <p className="mt-1 text-xs text-red-600">{errors.propertyValue}</p>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  id="transactionType"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="buying">Buying</option>
                  <option value="selling">Selling</option>
                  <option value="refinancing">Refinancing</option>
                </select>
              </div>

              <div>
                <label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  id="urgencyLevel"
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="low">Low - Standard Processing</option>
                  <option value="medium">Medium - Moderate Priority</option>
                  <option value="high">High - Urgent Processing</option>
                </select>
              </div>
            </div>

            {/* Client Contact */}
            <div>
              <label htmlFor="clientContactMethod" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Preferred Client Contact Method
              </label>
              <select
                id="clientContactMethod"
                name="clientContactMethod"
                value={formData.clientContactMethod}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="both">Both Email and Phone</option>
              </select>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Special Instructions (Optional)
              </label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Any special requirements or notes for the conveyancer..."
              />
            </div>

            {/* Information Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">Required Documentation</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    The conveyancer will receive the loan approval details and will contact the client directly 
                    to begin the legal transfer process. All necessary loan documentation will be shared securely.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Submit to Conveyancer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConveyancingApplicationForm;