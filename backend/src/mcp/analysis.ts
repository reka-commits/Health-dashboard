import { Biomarker } from '../types.js';

export type BiomarkerForAnalysis = Pick<Biomarker, 'name' | 'value' | 'unit' | 'referenceRange' | 'status'>;

export interface MonitoringPriority {
  biomarkerName: string;
  priority: 'critical' | 'high' | 'medium';
  reason: string;
  suggestedAction: string;
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

export function analyzeBiomarkers(biomarkers: BiomarkerForAnalysis[]): AnalysisResult {
  const concerning = biomarkers
    .filter(b => b.status !== 'normal')
    .map(b => {
      let risk = '';
      if (b.name === 'Glucose') {
        risk = b.status === 'high' ? 'Increased risk of diabetes/prediabetes' : 'Risk of hypoglycemia';
      } else if (b.name === 'HbA1c') {
        risk = b.status === 'high' ? 'Long-term blood sugar issues' : 'Low average blood sugar';
      } else if (b.name === 'Systolic BP' || b.name === 'Diastolic BP') {
        risk = b.status === 'high' ? 'Hypertension risk' : 'Hypotension risk';
      } else if (b.name === 'LDL Cholesterol' || b.name === 'Total Cholesterol') {
        risk = b.status === 'high' ? 'Increased cardiovascular risk' : 'Very low cholesterol';
      } else if (b.name === 'Troponin') {
        risk = b.status === 'high' ? 'Potential cardiac muscle damage' : '';
      } else if (b.name === 'TSH') {
        risk = b.status === 'high' ? 'Potential hypothyroidism' : 'Potential hyperthyroidism';
      } else if (b.name === 'BNP') {
        risk = b.status === 'high' ? 'Potential heart failure indicator' : '';
      } else if (b.name === 'Heart Rate') {
        risk = b.status === 'high' ? 'Tachycardia risk' : 'Bradycardia risk';
      } else if (b.name === 'Cortisol') {
        risk = b.status === 'high' ? 'Potential high stress or Cushing syndrome' : 'Potential Addison disease risk';
      } else {
        risk = `Value is ${b.status} compared to reference range`;
      }

      return {
        name: b.name,
        value: b.value,
        unit: b.unit,
        status: b.status as 'high' | 'low',
        referenceRange: b.referenceRange,
        risk
      };
    });

  let overallRiskLevel: 'low' | 'moderate' | 'high' = 'low';
  
  const highRiskMarkers = ['Troponin', 'BNP', 'Glucose', 'Systolic BP'];
  const hasHighRiskMarkers = concerning.some(c => highRiskMarkers.includes(c.name) && c.status === 'high');

  if (hasHighRiskMarkers || concerning.length > 5) {
    overallRiskLevel = 'high';
  } else if (concerning.length > 0) {
    overallRiskLevel = 'moderate';
  }

  const summary = concerning.length > 0 
    ? `Identified ${concerning.length} concerning biomarkers. Overall risk level is ${overallRiskLevel}.`
    : "All analyzed biomarkers are within normal ranges.";

  return {
    concerningBiomarkers: concerning,
    summary,
    overallRiskLevel
  };
}

export function suggestPriorities(biomarkers: BiomarkerForAnalysis[]): MonitoringPriority[] {
  const priorities: MonitoringPriority[] = [];

  const highRiskMarkerNames = ['Troponin', 'BNP', 'Glucose', 'Systolic BP', 'HbA1c'];

  biomarkers.forEach(b => {
    const isOutOfRange = b.status !== 'normal';
    const isHighRiskMarker = highRiskMarkerNames.includes(b.name);
    
    // Calculate how close it is to the edge of the range if it's normal
    let isNearEdge = false;
    if (b.status === 'normal') {
      const range = b.referenceRange.max - b.referenceRange.min;
      const distanceFromMin = b.value - b.referenceRange.min;
      const distanceFromMax = b.referenceRange.max - b.value;
      const threshold = range * 0.1; // 10% threshold

      if (distanceFromMin < threshold || distanceFromMax < threshold) {
        isNearEdge = true;
      }
    }

    if (isOutOfRange && isHighRiskMarker) {
      priorities.push({
        biomarkerName: b.name,
        priority: 'critical',
        reason: `${b.name} is ${b.status} (${b.value} ${b.unit}) and is a high-risk biomarker.`,
        suggestedAction: 'Immediate medical review and follow-up testing recommended.'
      });
    } else if (isOutOfRange) {
      priorities.push({
        biomarkerName: b.name,
        priority: 'high',
        reason: `${b.name} is outside the normal range (${b.value} ${b.unit}).`,
        suggestedAction: 'Schedule a follow-up test within 2-4 weeks to monitor trend.'
      });
    } else if (isHighRiskMarker && isNearEdge) {
      priorities.push({
        biomarkerName: b.name,
        priority: 'medium',
        reason: `${b.name} is within range but near the limit (${b.value} ${b.unit}).`,
        suggestedAction: 'Monitor lifestyle factors and retest in 3 months.'
      });
    }
  });

  return priorities.sort((a, b) => {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

