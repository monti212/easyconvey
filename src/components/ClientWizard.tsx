import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as casesService from '../services/cases.service';
import ClientUploadPage from './ClientUploadPage';
import type { Case } from '../types/database';

interface ClientWizardProps {
  token: string;
  role: 'buyer' | 'seller';
  onComplete: () => void;
}

export default function ClientWizard({ token, role, onComplete }: ClientWizardProps) {
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'submitted'>('loading');
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function validateToken() {
      try {
        const result = await casesService.getCaseByToken(token);
        if (!result) {
          setStatus('invalid');
          setErrorMessage('This link is not valid. Please contact your conveyancer for a new link.');
          return;
        }
        if (result.expired) {
          setStatus('expired');
          setErrorMessage('This link has expired. Please contact your conveyancer for a new link.');
          return;
        }
        if (result.used) {
          setStatus('used');
          setErrorMessage('This link has already been used. Your information has been submitted.');
          return;
        }
        setCaseData(result.case_);
        setStatus('valid');
        casesService.trackLinkActivity({
          token,
          case_id: result.case_.id,
          role: result.role as 'buyer' | 'seller',
          event_type: 'link_opened',
          metadata: { userAgent: navigator.userAgent, timestamp: new Date().toISOString() },
        });
      } catch {
        setStatus('invalid');
        setErrorMessage('Unable to validate this link. Please try again later.');
      }
    }
    validateToken();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating your link...</p>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-800 mb-2">Information Submitted</h2>
          <p className="text-sm text-green-700">
            Your {role} details and documents have been submitted to the conveyancer for case {caseData?.case_number}.
            They will contact you with next steps.
          </p>
        </div>
      </div>
    );
  }

  if (status !== 'valid') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">
            {status === 'expired' ? 'Link Expired' : status === 'used' ? 'Already Submitted' : 'Invalid Link'}
          </h2>
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="bg-blue-600 text-white px-4 py-3 mb-6 rounded-lg shadow-md">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium">
            You are submitting details as the <span className="font-bold capitalize">{role}</span> for
            case <span className="font-bold">{caseData?.case_number}</span>
          </p>
          <p className="text-xs text-blue-200 mt-0.5">
            Requested by {caseData?.organization?.name || 'your conveyancer'}
          </p>
        </div>
      </div>

      <ClientUploadPage
        token={token}
        role={role}
        caseId={caseData!.id}
        orgId={caseData!.organization_id || caseData!.id}
        caseNumber={caseData?.case_number}
        caseType={caseData?.case_type}
        onSubmitted={() => {
          setStatus('submitted');
          onComplete();
        }}
      />
    </div>
  );
}
