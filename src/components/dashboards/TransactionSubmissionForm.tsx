import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  User, 
  Home, 
  Scale, 
  Phone, 
  Mail, 
  DollarSign, 
  Percent,
  Building,
  MapPin,
  Users,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TransactionSubmissionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TransactionSubmissionForm: React.FC<TransactionSubmissionFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Property Information
    property_title: '',
    property_address: '',
    property_type: '',
    selling_price: '',
    
    // Parties Information
    buyer_name: '',
    buyer_email: '',
    buyer_contact: '',
    seller_name: '',
    seller_email: '',
    seller_contact: '',
    
    // Agent & Commission
    agent_commission_type: 'percentage',
    agent_commission_rate: '',
    conveyancer_firm: '',
    
    // Documents
    uploaded_documents: [] as string[],
    special_instructions: '',
    
    // Preferences
    submission_type: 'full_package' // full_package or basic
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const conveyancerFirms = [
    'OrionX Legal Services',
    'Botswana Law Chambers',
    'Gaborone Conveyancing Attorneys',
    'Legal Hub Botswana',
    'Property Law Associates'
  ];

  const propertyTypes = [
    'House',
    'Apartment',
    'Townhouse',
    'Villa',
    'Plot',
    'Commercial Property',
    'Industrial Property'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      setFormData(prev => ({
        ...prev,
        uploaded_documents: [...prev.uploaded_documents, ...fileNames]
      }));
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName));
    setFormData(prev => ({
      ...prev,
      uploaded_documents: prev.uploaded_documents.filter(f => f !== fileName)
    }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.property_title.trim()) newErrors.property_title = 'Property title is required';
      if (!formData.property_address.trim()) newErrors.property_address = 'Property address is required';
      if (!formData.property_type) newErrors.property_type = 'Property type is required';
      if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
        newErrors.selling_price = 'Valid selling price is required';
      }
    }
    
    if (step === 2) {
      if (!formData.buyer_name.trim()) newErrors.buyer_name = 'Buyer name is required';
      if (!formData.buyer_contact.trim()) newErrors.buyer_contact = 'Buyer contact is required';
      if (!formData.seller_name.trim()) newErrors.seller_name = 'Seller name is required';
      if (!formData.seller_contact.trim()) newErrors.seller_contact = 'Seller contact is required';
    }
    
    if (step === 3) {
      if (!formData.agent_commission_rate || parseFloat(formData.agent_commission_rate) <= 0) {
        newErrors.agent_commission_rate = 'Valid commission rate is required';
      }
      if (!formData.conveyancer_firm) newErrors.conveyancer_firm = 'Please select a conveyancer';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(3)) {
      onSubmit(formData);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Home className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Property Information</h3>
        <p className="text-sm text-gray-600">Provide details about the property being sold</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="property_title" className="block text-sm font-medium text-gray-700 mb-1">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="property_title"
            name="property_title"
            value={formData.property_title}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.property_title ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. Modern 3BR House in Gaborone"
          />
          {errors.property_title && <p className="mt-1 text-xs text-red-600">{errors.property_title}</p>}
        </div>

        <div>
          <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
            Property Type <span className="text-red-500">*</span>
          </label>
          <select
            id="property_type"
            name="property_type"
            value={formData.property_type}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.property_type ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select property type</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.property_type && <p className="mt-1 text-xs text-red-600">{errors.property_type}</p>}
        </div>

        <div>
          <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700 mb-1">
            Selling Price (BWP) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="selling_price"
            name="selling_price"
            value={formData.selling_price}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.selling_price ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. 2500000"
          />
          {errors.selling_price && <p className="mt-1 text-xs text-red-600">{errors.selling_price}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="property_address" className="block text-sm font-medium text-gray-700 mb-1">
            Property Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="property_address"
            name="property_address"
            value={formData.property_address}
            onChange={handleChange}
            rows={2}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.property_address ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. Block 8, Plot 123, Gaborone"
          />
          {errors.property_address && <p className="mt-1 text-xs text-red-600">{errors.property_address}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Buyer & Seller Information</h3>
        <p className="text-sm text-gray-600">Contact details for both parties</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buyer Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-green-800 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Buyer Information
          </h4>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="buyer_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="buyer_name"
                name="buyer_name"
                value={formData.buyer_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.buyer_name ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.buyer_name && <p className="mt-1 text-xs text-red-600">{errors.buyer_name}</p>}
            </div>

            <div>
              <label htmlFor="buyer_contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="buyer_contact"
                name="buyer_contact"
                value={formData.buyer_contact}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.buyer_contact ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                }`}
                placeholder="+267 7X XXX XXX"
              />
              {errors.buyer_contact && <p className="mt-1 text-xs text-red-600">{errors.buyer_contact}</p>}
            </div>

            <div>
              <label htmlFor="buyer_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="buyer_email"
                name="buyer_email"
                value={formData.buyer_email}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Seller Information
          </h4>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="seller_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="seller_name"
                name="seller_name"
                value={formData.seller_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.seller_name ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                }`}
                placeholder="Jane Smith"
              />
              {errors.seller_name && <p className="mt-1 text-xs text-red-600">{errors.seller_name}</p>}
            </div>

            <div>
              <label htmlFor="seller_contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="seller_contact"
                name="seller_contact"
                value={formData.seller_contact}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.seller_contact ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                }`}
                placeholder="+267 7Y YYY YYY"
              />
              {errors.seller_contact && <p className="mt-1 text-xs text-red-600">{errors.seller_contact}</p>}
            </div>

            <div>
              <label htmlFor="seller_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="seller_email"
                name="seller_email"
                value={formData.seller_email}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="jane@example.com"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Commission & Conveyancer</h3>
        <p className="text-sm text-gray-600">Set your commission and select a conveyancer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-green-800 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Commission Details
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="agent_commission_type"
                    value="percentage"
                    checked={formData.agent_commission_type === 'percentage'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Percentage</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="agent_commission_type"
                    value="fixed"
                    checked={formData.agent_commission_type === 'fixed'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Fixed Amount</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="agent_commission_rate" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.agent_commission_type === 'percentage' ? 'Commission Percentage' : 'Commission Amount (BWP)'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="agent_commission_rate"
                  name="agent_commission_rate"
                  value={formData.agent_commission_rate}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.agent_commission_rate ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                  }`}
                  placeholder={formData.agent_commission_type === 'percentage' ? 'e.g. 5' : 'e.g. 125000'}
                  step={formData.agent_commission_type === 'percentage' ? '0.1' : '1000'}
                />
                {formData.agent_commission_type === 'percentage' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
              {errors.agent_commission_rate && <p className="mt-1 text-xs text-red-600">{errors.agent_commission_rate}</p>}
              
              {formData.selling_price && formData.agent_commission_rate && formData.agent_commission_type === 'percentage' && (
                <p className="mt-1 text-sm text-green-600">
                  Commission Amount: P {((parseFloat(formData.selling_price) * parseFloat(formData.agent_commission_rate)) / 100).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Conveyancer Selection */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-purple-800 mb-4 flex items-center">
            <Scale className="h-5 w-5 mr-2" />
            Select Conveyancer
          </h4>
          
          <div>
            <label htmlFor="conveyancer_firm" className="block text-sm font-medium text-gray-700 mb-1">
              Conveyancer Firm <span className="text-red-500">*</span>
            </label>
            <select
              id="conveyancer_firm"
              name="conveyancer_firm"
              value={formData.conveyancer_firm}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.conveyancer_firm ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Choose a conveyancer...</option>
              {conveyancerFirms.map(firm => (
                <option key={firm} value={firm}>{firm}</option>
              ))}
            </select>
            {errors.conveyancer_firm && <p className="mt-1 text-xs text-red-600">{errors.conveyancer_firm}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Documents & Instructions</h3>
        <p className="text-sm text-gray-600">Upload supporting documents and provide special instructions</p>
      </div>

      {/* Submission Type Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-medium text-blue-800 mb-4">Choose Your Submission Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            formData.submission_type === 'full_package' 
              ? 'border-blue-500 bg-blue-100' 
              : 'border-gray-300 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="submission_type"
              value="full_package"
              checked={formData.submission_type === 'full_package'}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">🔥 Full Package (Recommended)</div>
              <div className="text-sm text-gray-500 mt-1">
                Upload complete documentation for faster processing
              </div>
            </div>
          </label>

          <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            formData.submission_type === 'basic' 
              ? 'border-blue-500 bg-blue-100' 
              : 'border-gray-300 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="submission_type"
              value="basic"
              checked={formData.submission_type === 'basic'}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">💤 Basic Submission</div>
              <div className="text-sm text-gray-500 mt-1">
                Minimal documents - conveyancer will follow up
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Document Upload */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Documents {formData.submission_type === 'full_package' && <span className="text-red-500">*</span>}
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload sale agreement, IDs, FICA docs, etc.</p>
            <input
              type="file"
              id="document-upload"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label
              htmlFor="document-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Select Files
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h5>
              <div className="space-y-2">
                {uploadedFiles.map((fileName, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{fileName}</span>
                    <button
                      onClick={() => removeFile(fileName)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700 mb-1">
            Special Instructions
          </label>
          <textarea
            id="special_instructions"
            name="special_instructions"
            value={formData.special_instructions}
            onChange={handleChange}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special requirements or notes for the conveyancer..."
          />
        </div>
      </div>

      {/* Recommended Documents List */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-amber-800 mb-2">Recommended Documents:</h5>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Signed Sale Agreement</li>
          <li>• Buyer & Seller ID Documents</li>
          <li>• Proof of Address (both parties)</li>
          <li>• FICA Documentation</li>
          <li>• Bank Statements (if applicable)</li>
          <li>• Title Deed (if available)</li>
        </ul>
      </div>
    </div>
  );

  const steps = [
    { number: 1, name: 'Property', icon: Home },
    { number: 2, name: 'Parties', icon: Users },
    { number: 3, name: 'Commission', icon: DollarSign },
    { number: 4, name: 'Documents', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Submit New Transaction</h2>
              <p className="text-blue-100 text-sm">Complete the form to submit to conveyancer</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-blue-100 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex justify-between">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step.number 
                      ? 'bg-white text-blue-600' 
                      : currentStep > step.number 
                        ? 'bg-blue-400 text-white' 
                        : 'bg-blue-500 text-blue-200'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <IconComponent className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep === step.number ? 'text-white font-medium' : 'text-blue-200'
                  }`}>
                    {step.name}
                  </span>
                  {step.number < steps.length && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      currentStep > step.number ? 'bg-blue-400' : 'bg-blue-500'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionSubmissionForm;