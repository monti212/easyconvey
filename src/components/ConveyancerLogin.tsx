import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Shield, Lock, Mail, Users, Building, Briefcase, Play } from 'lucide-react';

interface ConveyancerLoginProps {
  onLogin: (email: string, password: string, organizationType: string, loginRole: string) => boolean;
  onBack: () => void;
}

const ConveyancerLogin: React.FC<ConveyancerLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [detectedType, setDetectedType] = useState<string | null>(null);

  const organizationTypes = [
    { value: '', label: 'Select Organization Type', disabled: true },
    { value: 'estate_agent', label: 'Estate Agent', icon: Building },
    { value: 'conveyancer', label: 'Conveyancer', icon: Shield },
    { value: 'financial_institution', label: 'Financial Institution', icon: Briefcase }
  ];

  const loginRoles = [
    { value: '', label: 'Select Login Role', disabled: true },
    { value: 'super_admin', label: 'Super User (Admin)', description: 'Full organization access' },
    { value: 'user', label: 'Team Member (Staff)', description: 'Limited to assigned tasks' }
  ];

  // Demo credentials for different combinations
  const demoCredentials = [
    { orgType: 'conveyancer', role: 'super_admin', email: 'admin@orionxlegal.co.bw', name: 'Conveyancer Admin' },
    { orgType: 'conveyancer', role: 'user', email: 'lawyer@orionxlegal.co.bw', name: 'Conveyancer Staff' },
    { orgType: 'estate_agent', role: 'super_admin', email: 'admin@premiumproperties.co.bw', name: 'Estate Agent Admin' },
    { orgType: 'estate_agent', role: 'user', email: 'agent@premiumproperties.co.bw', name: 'Estate Agent Staff' },
    { orgType: 'financial_institution', role: 'super_admin', email: 'admin@capitalbank.co.bw', name: 'Bank Admin' },
    { orgType: 'financial_institution', role: 'user', email: 'officer@capitalbank.co.bw', name: 'Loan Officer' }
  ];

  // Intelligent email recognition
  const detectUserTypeFromEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    // Common patterns for different organization types
    const patterns = {
      estate_agent: ['properties', 'estate', 'realty', 'property', 'homes', 'pamgolding', 'seeff'],
      conveyancer: ['legal', 'law', 'attorneys', 'conveyancing', 'lawyer'],
      financial_institution: ['bank', 'finance', 'capital', 'loan', 'mortgage', 'fnb', 'absa', 'standardbank']
    };

    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => domain.includes(keyword))) {
        return type;
      }
    }

    // Check specific demo domains
    if (domain.includes('orionxlegal')) return 'conveyancer';
    if (domain.includes('premiumproperties')) return 'estate_agent';
    if (domain.includes('capitalbank')) return 'financial_institution';

    return null;
  };

  // Auto-detect organization type when email changes
  useEffect(() => {
    if (email && !isDemoMode) {
      const detected = detectUserTypeFromEmail(email);
      setDetectedType(detected);
      if (detected && !organizationType) {
        setOrganizationType(detected);
      }
    } else {
      setDetectedType(null);
    }
  }, [email, organizationType, isDemoMode]);

  // Audit trail logging
  const logLoginAttempt = (success: boolean, details: any = {}) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'LOGIN_ATTEMPT',
      user_email: email,
      success,
      ip_address: '105.208.45.1', // Would be actual IP in production
      organization_type: organizationType,
      login_role: loginRole,
      is_demo_mode: isDemoMode,
      detected_type: detectedType,
      ...details
    };
    
    // In production, this would be sent to your audit logging service
    console.log('Audit Log:', auditEntry);
    
    // Store in localStorage for demo purposes
    const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    existingLogs.push(auditEntry);
    localStorage.setItem('auditLogs', JSON.stringify(existingLogs.slice(-100))); // Keep last 100 entries
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!organizationType) {
      setError('Please select an organization type.');
      return;
    }

    if (!loginRole) {
      setError('Please select a login role.');
      return;
    }

    setIsLoading(true);

    // Simulate a brief loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = onLogin(email, password, organizationType, loginRole);
    
    if (!success) {
      setError('Invalid credentials. Please check your email and password.');
      logLoginAttempt(false, { error: 'Invalid credentials' });
    } else {
      logLoginAttempt(true, { 
        organization_type: organizationType,
        login_role: loginRole,
        auto_detected: detectedType === organizationType
      });
    }
    
    setIsLoading(false);
  };

  const handleDemoMode = () => {
    setIsDemoMode(true);
    // Pre-select first demo credential
    const firstDemo = demoCredentials[0];
    setOrganizationType(firstDemo.orgType);
    setLoginRole(firstDemo.role);
    setEmail(firstDemo.email);
    setPassword('demo123');
  };

  const handleDemoCredentialSelect = (credential: typeof demoCredentials[0]) => {
    setOrganizationType(credential.orgType);
    setLoginRole(credential.role);
    setEmail(credential.email);
    setPassword('demo123');
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setEmail('');
    setPassword('');
    setOrganizationType('');
    setLoginRole('');
  };

  const getSelectedOrgTypeInfo = () => {
    const selected = organizationTypes.find(type => type.value === organizationType);
    if (!selected || !selected.value) return null;
    return { label: selected.label, icon: selected.icon };
  };

  const selectedOrgInfo = getSelectedOrgTypeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to main site
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {selectedOrgInfo ? (
                <selectedOrgInfo.icon className="h-8 w-8 text-white" />
              ) : (
                <Users className="h-8 w-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Professional Portal</h1>
            <p className="text-gray-600">
              {selectedOrgInfo 
                ? `Access your ${selectedOrgInfo.label.toLowerCase()} dashboard`
                : 'Access your professional dashboard'
              }
            </p>
          </div>

          {/* Demo Mode Toggle */}
          {!isDemoMode ? (
            <div className="mb-6 text-center">
              <button
                onClick={handleDemoMode}
                className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                <Play className="h-4 w-4 mr-2" />
                👀 Try Demo Mode
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-green-800">Demo Mode Active</h3>
                <button
                  onClick={exitDemoMode}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Exit Demo
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    onClick={() => handleDemoCredentialSelect(cred)}
                    className={`text-left p-2 text-xs rounded border ${
                      email === cred.email 
                        ? 'bg-green-100 border-green-300 text-green-800' 
                        : 'bg-white border-green-200 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    <div className="font-medium">{cred.name}</div>
                    <div className="text-green-600">{cred.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email Detection Notification */}
          {detectedType && detectedType === organizationType && !isDemoMode && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ✨ Auto-detected: {organizationTypes.find(t => t.value === detectedType)?.label}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Type Selection */}
            <div>
              <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="organizationType"
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="block w-full py-3 px-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white"
                  required
                >
                  {organizationTypes.map((type) => (
                    <option key={type.value} value={type.value} disabled={type.disabled}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Login Role Selection */}
            <div>
              <label htmlFor="loginRole" className="block text-sm font-medium text-gray-700 mb-2">
                Login Role <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {loginRoles.filter(role => role.value).map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      loginRole === role.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="loginRole"
                      value={role.value}
                      checked={loginRole === role.value}
                      onChange={(e) => setLoginRole(e.target.value)}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{role.label}</div>
                      <div className="text-xs text-gray-500">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !organizationType || !loginRole}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-white font-medium ${
                isLoading || !organizationType || !loginRole
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2'
              } transition-colors`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Manual Demo Credentials (for non-demo mode) */}
          {!isDemoMode && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Email:</strong> Any of the demo emails above</p>
                <p><strong>Password:</strong> demo123</p>
                <p className="text-blue-600 mt-2">Or use "Try Demo Mode" for quick access</p>
              </div>
            </div>
          )}

          {/* Access Level Information */}
          {organizationType && loginRole && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Access Level</h3>
              <div className="text-xs text-gray-600">
                <p><strong>Organization:</strong> {organizationTypes.find(t => t.value === organizationType)?.label}</p>
                <p><strong>Role:</strong> {loginRoles.find(r => r.value === loginRole)?.label}</p>
                <div className="mt-2">
                  {loginRole === 'super_admin' && (
                    <p className="text-green-700">Full administrative access to all organization features.</p>
                  )}
                  {loginRole === 'user' && (
                    <p className="text-blue-700">Access limited to assigned tasks and basic features.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              All login attempts are logged for security purposes. This portal uses bank-level encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConveyancerLogin;