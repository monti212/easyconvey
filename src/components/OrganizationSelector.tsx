import React from 'react';
import { Building, Shield, Briefcase, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { OrganizationUser, Organization } from '../types/database';

const orgTypeIcons: Record<string, React.ReactNode> = {
  conveyancer: <Shield className="h-6 w-6" />,
  estate_agent: <Building className="h-6 w-6" />,
  financial_institution: <Briefcase className="h-6 w-6" />,
};

const orgTypeLabels: Record<string, string> = {
  conveyancer: 'Conveyancer',
  estate_agent: 'Estate Agent',
  financial_institution: 'Financial Institution',
};

export default function OrganizationSelector() {
  const { orgMemberships, selectOrganization } = useAuth();

  const handleSelect = (membership: OrganizationUser & { organization: Organization }) => {
    selectOrganization(membership);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <p className="font-serif text-xl font-semibold text-primary tracking-tight mb-4">
            EasyConvey<span className="text-secondary">.</span>
          </p>
          <h1 className="text-2xl font-serif font-bold text-primary mb-2">Choose your organization</h1>
          <p className="text-gray-500 text-sm">You belong to multiple organizations. Choose one to continue.</p>
        </div>

        <div className="space-y-3">
          {orgMemberships.map((membership) => (
            <button
              key={membership.id}
              onClick={() => handleSelect(membership)}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-secondary hover:bg-secondary/5 hover-lift transition-all duration-200 text-left"
            >
              <div className="text-primary mr-4">
                {orgTypeIcons[membership.organization.type] || <Building className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{membership.organization.name}</p>
                <p className="text-sm text-gray-500">
                  {orgTypeLabels[membership.organization.type]} - {membership.role.replace('_', ' ')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
