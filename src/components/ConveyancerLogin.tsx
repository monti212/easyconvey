import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Shield, Lock, Mail, Users, Building, Briefcase, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ConveyancerLoginProps {
  onBack: () => void;
}

const ORG_TYPES = [
  { value: 'conveyancer',           label: 'Conveyancer',            description: 'Law firm / conveyancing practice', icon: Shield },
  { value: 'estate_agent',          label: 'Estate Agent',           description: 'Property sales & lettings',        icon: Building },
  { value: 'financial_institution', label: 'Financial Institution',  description: 'Bank / mortgage provider',         icon: Briefcase },
] as const;

const ROLES = [
  { value: 'super_admin', label: 'Administrator',  description: 'Full organisation access & settings' },
  { value: 'user',        label: 'Team Member',    description: 'Access limited to assigned tasks' },
] as const;

const EMAIL_DOMAIN_MAP: Record<string, string[]> = {
  estate_agent:          ['properties', 'estate', 'realty', 'property', 'homes', 'pamgolding', 'seeff'],
  conveyancer:           ['legal', 'law', 'attorneys', 'conveyancing', 'lawyer', 'orionxlegal', 'orionx'],
  financial_institution: ['bank', 'finance', 'capital', 'loan', 'mortgage', 'fnb', 'absa', 'standardbank', 'capitalbank'],
};

function detectOrgType(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  for (const [type, keywords] of Object.entries(EMAIL_DOMAIN_MAP)) {
    if (keywords.some(k => domain.includes(k))) return type;
  }
  return null;
}

const ConveyancerLogin: React.FC<ConveyancerLoginProps> = ({ onBack }) => {
  const { signIn, signUp, error: authError, clearError, loading: authLoading } = useAuth();

  // Shared fields
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orgType, setOrgType]           = useState('');
  const [role, setRole]                 = useState('');

  // Sign-up only
  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [orgName, setOrgName]           = useState('');

  const [isSignUp, setIsSignUp]         = useState(false);
  const [localError, setLocalError]     = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Auto-detect org type from email domain
  useEffect(() => {
    const detected = detectOrgType(email);
    if (detected && !orgType) setOrgType(detected);
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (toSignUp: boolean) => {
    setIsSignUp(toSignUp);
    clearError();
    setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!orgType) { setLocalError('Please select an organisation type.'); return; }
    if (!role)    { setLocalError('Please select a role.'); return; }
    if (isSignUp && !firstName.trim()) { setLocalError('First name is required.'); return; }
    if (isSignUp && !orgName.trim())   { setLocalError('Organisation name is required.'); return; }

    try {
      if (isSignUp) {
        await signUp(
          email, password,
          { first_name: firstName.trim(), last_name: lastName.trim() },
          orgType, role, orgName.trim(),
        );
        // Attempt immediate sign-in (works when email confirmation is disabled)
        try {
          await signIn(email, password);
        } catch {
          // Email confirmation required — show the check-email screen
          setSignUpSuccess(true);
        }
      } else {
        await signIn(email, password);
      }
    } catch {
      // Errors surfaced via authError from context
    }
  };

  // ── Check-email screen shown when Supabase requires email confirmation ──
  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-secondary/20">
            <Mail className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-xl font-serif font-bold text-primary mb-2">Check your email</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            We sent a confirmation link to <strong>{email}</strong>.
            Click the link to verify your account, then come back to sign in.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  const displayError = localError || authError;
  const selectedOrgType = ORG_TYPES.find(t => t.value === orgType);
  const IconForHeader = selectedOrgType?.icon ?? Users;
  const canSubmit = !!orgType && !!role && !authLoading;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ── Header ── */}
          <div className="bg-primary px-8 pt-8 pb-6 text-center">
            <p className="font-serif text-lg font-semibold text-white tracking-tight mb-4">
              Minchin &amp; Kelly<span className="text-secondary">.</span>
            </p>
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 ring-2 ring-secondary/30">
              <IconForHeader className="h-7 w-7 text-secondary" />
            </div>
            <h1 className="text-xl font-serif font-bold text-white">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h1>
            <p className="text-sm text-white/60 mt-1">
              {isSignUp ? 'Set up your organisation on EasyConvey' : 'Access your professional dashboard'}
            </p>
          </div>

          <div className="px-8 pb-8">
            {/* ── Sign In / Sign Up toggle ── */}
            <div className="flex mt-6 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => switchTab(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isSignUp ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isSignUp ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </div>

            {displayError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── Organisation Type ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organisation Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ORG_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrgType(value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                        orgType === value
                          ? 'border-secondary bg-secondary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${orgType === value ? 'text-primary' : 'text-gray-400'}`} />
                      <span className={`text-[11px] font-medium leading-tight ${orgType === value ? 'text-primary' : 'text-gray-600'}`}>
                        {label}
                      </span>
                      {orgType === value && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Role ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(({ value, label, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all ${
                        role === value
                          ? 'border-secondary bg-secondary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-medium ${role === value ? 'text-primary' : 'text-gray-800'}`}>
                        {label}
                      </span>
                      <span className="text-[11px] text-gray-500 leading-tight">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sign-up-only fields ── */}
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                        placeholder="Bukhosi"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                        placeholder="Dube"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Organisation Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="orgName"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                        placeholder={selectedOrgType ? `e.g. ${['Conveyancer','Estate Agency','Capital Bank'][['conveyancer','estate_agent','financial_institution'].indexOf(selectedOrgType.value)]}` : 'Your organisation name'}
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">The name of your firm, agency, or institution.</p>
                  </div>
                </>
              )}

              {/* ── Email ── */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                    placeholder="you@yourfirm.com"
                    required
                  />
                </div>
              </div>

              {/* ── Password ── */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                    placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
                  canSubmit
                    ? 'bg-primary hover:bg-primary-dark btn-shine focus:ring-2 focus:ring-secondary focus:ring-offset-2'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {authLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {isSignUp ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : isSignUp ? (
                  <><UserPlus className="h-4 w-4" />Create Account</>
                ) : (
                  <><LogIn className="h-4 w-4" />Sign In</>
                )}
              </button>
            </form>

            {/* ── Access-level summary ── */}
            {orgType && role && (
              <div className="mt-5 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-0.5">
                <p><span className="font-medium text-gray-800">Type:</span> {ORG_TYPES.find(t => t.value === orgType)?.label}</p>
                <p><span className="font-medium text-gray-800">Role:</span> {ROLES.find(r => r.value === role)?.label}</p>
                <p className="text-gray-500">{ROLES.find(r => r.value === role)?.description}</p>
              </div>
            )}

            <p className="mt-5 text-center text-xs text-gray-400">
              All login attempts are logged. This portal uses bank-level encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConveyancerLogin;
