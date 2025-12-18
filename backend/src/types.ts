export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  lastVisit: string;
}

export type BiomarkerCategory = 'metabolic' | 'cardiovascular' | 'hormonal';
export type BiomarkerStatus = 'normal' | 'high' | 'low';

export interface Biomarker {
  id: string;
  patientId: string;
  name: string;
  value: number;
  unit: string;
  category: BiomarkerCategory;
  referenceRange: {
    min: number;
    max: number;
  };
  measuredAt: string;
  status: BiomarkerStatus;
}

