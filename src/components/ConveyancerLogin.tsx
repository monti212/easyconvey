import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Shield, Lock, Mail, Users, Building, Briefcase, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ConveyancerLoginProps {
  onBack: () => void;
}

const ConveyancerLogin: React.FC<ConveyancerLoginProps> = ({ onBack }) => {
  const { signIn, signUp, error: authError, clearError, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

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

  const detectUserTypeFromEmail = (emailVal: string) => {
    const domain = emailVal.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    const patterns: Record<string, string[]> = {
      estate_agent: ['properties', 'estate', 'realty', 'property', 'homes', 'pamgolding', 'seeff'],
      conveyancer: ['legal', 'law', 'attorneys', 'conveyancing', 'lawyer', 'orionxlegal', 'orionx'],
      financial_institution: ['bank', 'finance', 'capital', 'loan', 'mortgage', 'fnb', 'absa', 'standardbank', 'capitalbank']
    };
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => domain.includes(keyword))) return type;
    }
    return null;
  };

  useEffect(() => {
    if (email) {
      const detected = detectUserTypeFromEmail(email);
      setDetectedType(detected);
      if (detected && !organizationType) setOrganizationType(detected);
    } else {
      setDetectedType(null);
    }
  }, [email, organizationType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!organizationType) {
      setLocalError('Please select an organization type.');
      return;
    }
    if (!loginRole) {
      setLocalError('Please select a login role.');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, { first_name: firstName, last_name: lastName });
        setSignUpSuccess(true);
      } else {
        await signIn(email, password);
      }
    } catch {
      // Error is set via authError from context
    }
  };

  const selectedOrgType = organizationTypes.find(t => t.value === organizationType && t.value !== '');
  const SelectedIcon = selectedOrgType?.icon;
  const displayError = localError || authError;

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-secondary/20">
            <Mail className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-xl font-serif font-bold text-primary mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account, then come back to sign in.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <p className="font-serif text-xl font-semibold text-primary tracking-tight mb-5">
              Minchin & Kelly<span className="text-secondary">.</span>
            </p>
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-secondary/20">
              {SelectedIcon ? (
                <SelectedIcon className="h-8 w-8 text-white" />
              ) : (
                <Users className="h-8 w-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary mb-2">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isSignUp ? 'Get started with Minchin & Kelly' : (
                selectedOrgType
                  ? `Access your ${selectedOrgType.label.toLowerCase()} dashboard`
                  : 'Access your professional dashboard'
              )}
            </p>
          </div>

          {/* Sign In / Sign Up Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setIsSignUp(false); clearError(); setLocalError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isSignUp ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); clearError(); setLocalError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isSignUp ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            >
              Sign Up
            </button>
          </div>

          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{displayError}</p>
            </div>
          )}

          {detectedType && detectedType === organizationType && !isSignUp && (
            <div className="mb-6 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
              <p className="text-sm text-primary">
                Auto-detected: {organizationTypes.find(t => t.value === detectedType)?.label}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Type */}
            <div>
              <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type <span className="text-red-500">*</span>
              </label>
              <select
                id="organizationType"
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                className="block w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white"
                required
              >
                {organizationTypes.map((type) => (
                  <option key={type.value} value={type.value} disabled={type.disabled}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Login Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Role <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {loginRoles.filter(role => role.value).map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      loginRole === role.value ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300'
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

            {/* Name fields for sign up */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  required
                  minLength={6}
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
              disabled={authLoading || !organizationType || !loginRole}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-white font-medium ${
                authLoading || !organizationType || !loginRole
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-secondary focus:ring-offset-2 btn-shine'
              } transition-colors`}
            >
              {authLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                <div className="flex items-center">
                  {isSignUp ? <UserPlus className="h-5 w-5 mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </div>
              )}
            </button>
          </form>

          {/* Access Level Info */}
          {organizationType && loginRole && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Access Level</h3>
              <div className="text-xs text-gray-600">
                <p><strong>Organization:</strong> {organizationTypes.find(t => t.value === organizationType)?.label}</p>
                <p><strong>Role:</strong> {loginRoles.find(r => r.value === loginRole)?.label}</p>
                <div className="mt-2">
                  {loginRole === 'super_admin' && (
                    <p className="text-secondary-dark">Full administrative access to all organization features.</p>
                  )}
                  {loginRole === 'user' && (
                    <p className="text-primary-light">Access limited to assigned tasks and basic features.</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
