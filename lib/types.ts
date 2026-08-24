export type WaiverType = 'field' | 'camping';

export interface Waiver {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  yearOfBirth: string;
  phone?: string;
  emergencyContactPhone: string;
  emergencyContactName?: string;
  safetyRulesInitial: string;
  medicalConsentInitial: string;
  photoRelease: boolean;
  minorNames?: string;
  signature: string;
  signatureDate: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  waiverYear: number;
  waiverType?: WaiverType;
  guardianName?: string;
  guardianSignature?: string;
}

export interface WaiverSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  yearOfBirth: string;
  signatureDate: string;
  waiverYear: number;
  hasCurrentYearWaiver: boolean;
  minorNames?: string;
  waiverType?: WaiverType;
}
