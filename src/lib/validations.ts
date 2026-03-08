import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const caseSchema = z.object({
  case_type: z.enum(['buying', 'selling']),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().optional(),
});

export const propertySchema = z.object({
  title: z.string().min(1, 'Property title is required'),
  description: z.string().optional(),
  property_type: z.string().min(1, 'Property type is required'),
  price: z.number().positive('Price must be positive'),
  address: z.string().min(1, 'Address is required'),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  size_sqm: z.number().positive().optional(),
  status: z.enum(['available', 'under_offer', 'sold']).default('available'),
});

export const loanSchema = z.object({
  applicant_name: z.string().min(1, 'Applicant name is required'),
  applicant_email: z.string().email('Invalid email').optional().or(z.literal('')),
  loan_amount: z.number().positive('Loan amount must be positive'),
  interest_rate: z.number().min(0).max(100).optional(),
  term_months: z.number().int().positive().optional(),
});

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  physicalAddress: z.string().min(1, 'Physical address is required'),
  postalAddress: z.string().optional(),
  maritalStatus: z.enum(['single', 'married_in_community', 'married_out_community', 'divorced', 'widowed']),
});

export const companyDetailsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  taxNumber: z.string().optional(),
  registeredAddress: z.string().min(1, 'Registered address is required'),
  directorName: z.string().min(1, 'Director name is required'),
  directorId: z.string().min(1, 'Director ID is required'),
});

export const trustDetailsSchema = z.object({
  trustName: z.string().min(1, 'Trust name is required'),
  trustNumber: z.string().min(1, 'Trust number is required'),
  trusteeNames: z.array(z.string().min(1)).min(1, 'At least one trustee is required'),
  beneficiaries: z.array(z.string().min(1)).min(1, 'At least one beneficiary is required'),
  registeredAddress: z.string().min(1, 'Registered address is required'),
});

export const estateDetailsSchema = z.object({
  estateName: z.string().min(1, 'Estate name is required'),
  estateNumber: z.string().min(1, 'Estate number is required'),
  executorName: z.string().min(1, 'Executor name is required'),
  executorId: z.string().min(1, 'Executor ID is required'),
  deceasedName: z.string().min(1, 'Deceased name is required'),
  dateOfDeath: z.string().min(1, 'Date of death is required'),
});

export const societyDetailsSchema = z.object({
  societyName: z.string().min(1, 'Society name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  chairpersonName: z.string().min(1, 'Chairperson name is required'),
  chairpersonId: z.string().min(1, 'Chairperson ID is required'),
  secretaryName: z.string().min(1, 'Secretary name is required'),
  registeredAddress: z.string().min(1, 'Registered address is required'),
});

export const documentUploadSchema = z.object({
  file: z.instanceof(File),
  documentType: z.string().min(1, 'Document type is required'),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CaseInput = z.infer<typeof caseSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>;
export type TrustDetailsInput = z.infer<typeof trustDetailsSchema>;
export type EstateDetailsInput = z.infer<typeof estateDetailsSchema>;
export type SocietyDetailsInput = z.infer<typeof societyDetailsSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
