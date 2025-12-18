import { Patient, Biomarker, BiomarkerCategory, BiomarkerStatus } from '../types.js';

export const patients: Patient[] = [
  { id: 'p1', name: 'John Doe', dateOfBirth: '1985-05-15', lastVisit: '2023-11-10' },
  { id: 'p2', name: 'Jane Smith', dateOfBirth: '1990-08-22', lastVisit: '2023-12-05' },
  { id: 'p3', name: 'Robert Brown', dateOfBirth: '1975-03-30', lastVisit: '2023-10-15' },
  { id: 'p4', name: 'Emily Davis', dateOfBirth: '1982-12-12', lastVisit: '2023-11-28' },
  { id: 'p5', name: 'Michael Wilson', dateOfBirth: '1968-01-25', lastVisit: '2023-12-01' },
];

const categories: BiomarkerCategory[] = ['metabolic', 'cardiovascular', 'hormonal'];

const biomarkerConfigs = {
  metabolic: [
    { name: 'Glucose', unit: 'mg/dL', min: 70, max: 100 },
    { name: 'HbA1c', unit: '%', min: 4, max: 5.6 },
    { name: 'Total Cholesterol', unit: 'mg/dL', min: 125, max: 200 },
    { name: 'Triglycerides', unit: 'mg/dL', min: 0, max: 150 },
    { name: 'LDL Cholesterol', unit: 'mg/dL', min: 0, max: 100 },
  ],
  cardiovascular: [
    { name: 'Systolic BP', unit: 'mmHg', min: 90, max: 120 },
    { name: 'Diastolic BP', unit: 'mmHg', min: 60, max: 80 },
    { name: 'Heart Rate', unit: 'bpm', min: 60, max: 100 },
    { name: 'Troponin', unit: 'ng/mL', min: 0, max: 0.04 },
    { name: 'BNP', unit: 'pg/mL', min: 0, max: 100 },
  ],
  hormonal: [
    { name: 'TSH', unit: 'mIU/L', min: 0.4, max: 4.0 },
    { name: 'Free T4', unit: 'ng/dL', min: 0.8, max: 1.8 },
    { name: 'Cortisol', unit: 'mcg/dL', min: 5, max: 23 },
    { name: 'Testosterone', unit: 'ng/dL', min: 300, max: 1000 },
    { name: 'Estradiol', unit: 'pg/mL', min: 15, max: 350 },
  ],
};

const getStatus = (value: number, min: number, max: number): BiomarkerStatus => {
  if (value < min) return 'low';
  if (value > max) return 'high';
  return 'normal';
};

const generateBiomarkers = (): Biomarker[] => {
  const biomarkers: Biomarker[] = [];
  let biomarkerIdCounter = 1;

  patients.forEach((patient) => {
    categories.forEach((category) => {
      const configs = biomarkerConfigs[category];
      configs.forEach((config) => {
  
        const range = config.max - config.min;
        const randomFactor = Math.random() * 1.4 - 0.2; 
        const value = Number((config.min + range * randomFactor).toFixed(2));
        
        biomarkers.push({
          id: `b${biomarkerIdCounter++}`,
          patientId: patient.id,
          name: config.name,
          value,
          unit: config.unit,
          category,
          referenceRange: { min: config.min, max: config.max },
          measuredAt: new Date(2023, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
          status: getStatus(value, config.min, config.max),
        });
      });
    });
  });

  return biomarkers;
};

export const biomarkers: Biomarker[] = generateBiomarkers();

