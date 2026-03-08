import { useState, useEffect, useCallback } from 'react';
import * as orgService from '../services/organizations.service';
import type { Organization, OrganizationUser } from '../types/database';

export function useOrganization(organizationId: string | undefined) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [orgData, membersData] = await Promise.all([
        orgService.getOrganization(organizationId),
        orgService.getOrgMembers(organizationId),
      ]);
      setOrg(orgData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { org, members, loading, error, refetch: fetch };
}

export function useOrganizationsByType(type: Organization['type']) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    orgService.getOrgsByType(type)
      .then(setOrgs)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type]);

  return { orgs, loading, error };
}
