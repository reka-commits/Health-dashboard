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

export interface AnalysisResult {
  concerningBiomarkers: {
    name: string;
    value: number;
    unit: string;
    status: 'high' | 'low';
    referenceRange: { min: number; max: number };
    risk: string;
  }[];
  summary: string;
  overallRiskLevel: 'low' | 'moderate' | 'high';
}

export interface MonitoringPriority {
  biomarkerName: string;
  priority: 'critical' | 'high' | 'medium';
  reason: string;
  suggestedAction: string;
}

export interface PatientAnalysis {
  patientId: string;
  patientName: string;
  analysis: AnalysisResult;
  priorities: MonitoringPriority[];
}

