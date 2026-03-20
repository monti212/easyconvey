import React, { createContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Organization, OrganizationUser } from '../types/database';
import * as authService from '../services/auth.service';

interface AuthState {
  session: Session | null;
  user: User | null;
  orgUser: OrganizationUser | null;
  organization: Organization | null;
  orgMemberships: (OrganizationUser & { organization: Organization })[];
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }, organizationType?: string, loginRole?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  selectOrganization: (orgUser: OrganizationUser & { organization: Organization }) => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    orgUser: null,
    organization: null,
    orgMemberships: [],
    loading: true,
    error: null,
  });

  const resolveOrgMembership = useCallback(async (user: User) => {
    try {
      // First try by auth_user_id
      let memberships = await authService.getOrganizationsForUser(user.id);

      // Fallback: try by email (for existing users not yet linked)
      if (memberships.length === 0 && user.email) {
        memberships = await authService.getOrganizationUserByEmail(user.email);

        // Link auth_user_id for future lookups
        for (const m of memberships) {
          await authService.linkAuthUser(m.id, user.id);
        }
      }

      if (memberships.length === 0) {
        setState(prev => ({
          ...prev,
          user,
          orgMemberships: [],
          orgUser: null,
          organization: null,
          loading: false,
        }));
        return;
      }

      // Auto-select if single org, otherwise let user pick
      const selected = memberships[0];
      await authService.updateLastLogin(selected.id);

      setState(prev => ({
        ...prev,
        user,
        orgMemberships: memberships,
        orgUser: selected,
        organization: selected.organization,
        loading: false,
      }));
    } catch (err: any) {
      console.error('Failed to resolve org membership:', err);
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: err.message || 'Failed to load organization data',
      }));
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session }));
        resolveOrgMembership(session.user);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session }));
      if (session?.user) {
        resolveOrgMembership(session.user);
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          orgUser: null,
          organization: null,
          orgMemberships: [],
          loading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveOrgMembership]);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.signInWithEmail(email, password);
      // onAuthStateChange will handle the rest
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      throw err;
    }
  };

  const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string }, organizationType?: string, loginRole?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.signUpWithEmail(email, password, metadata, organizationType, loginRole);
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      throw err;
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setState({
      session: null,
      user: null,
      orgUser: null,
      organization: null,
      orgMemberships: [],
      loading: false,
      error: null,
    });
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const selectOrganization = (orgUser: OrganizationUser & { organization: Organization }) => {
    setState(prev => ({
      ...prev,
      orgUser,
      organization: orgUser.organization,
    }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        selectOrganization,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
