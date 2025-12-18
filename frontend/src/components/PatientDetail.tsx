import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { Patient, Biomarker, BiomarkerCategory, PatientAnalysis } from '../types';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<BiomarkerCategory | 'all'>('all');
  const [isLive, setIsLive] = useState<boolean>(false);
  
  // AI Analysis states
  const [analysis, setAnalysis] = useState<PatientAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchPatientData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all patients to find the specific one 
      const patientsRes = await axios.get('http://localhost:3001/api/patients');
      const foundPatient = patientsRes.data.find((p: Patient) => p.id === id);
      
      if (!foundPatient) {
        setError('Patient not found');
        return;
      }
      setPatient(foundPatient);

      // Fetch biomarkers
      const biomarkersUrl = category === 'all' 
        ? `http://localhost:3001/api/patients/${id}/biomarkers`
        : `http://localhost:3001/api/patients/${id}/biomarkers?category=${category}`;
      
      const biomarkersRes = await axios.get(biomarkersUrl);
      setBiomarkers(biomarkersRes.data);
    } catch (err) {
      setError('Failed to fetch patient details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, category]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  // Simulation for live updates
  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setBiomarkers(prevBiomarkers => {
          if (prevBiomarkers.length === 0) return prevBiomarkers;
          
          const newBiomarkers = [...prevBiomarkers];
          const numToUpdate = Math.floor(Math.random() * 2) + 2; // 2 or 3 random biomarkers
          const indicesToUpdate = new Set<number>();
          
          while (indicesToUpdate.size < Math.min(numToUpdate, newBiomarkers.length)) {
            indicesToUpdate.add(Math.floor(Math.random() * newBiomarkers.length));
          }
          
          indicesToUpdate.forEach(idx => {
            const bm = { ...newBiomarkers[idx] };
            // Simulate a small change: +/- 2-5%
            const changePercent = (Math.random() * 0.08 - 0.04); // -4% to +4%
            const newValue = bm.value * (1 + changePercent);
            bm.value = Math.round(newValue * 10) / 10; // Round to 1 decimal place
            
            // Update status based on reference range
            if (bm.value > bm.referenceRange.max) {
              bm.status = 'high';
            } else if (bm.value < bm.referenceRange.min) {
              bm.status = 'low';
            } else {
              bm.status = 'normal';
            }
            
            newBiomarkers[idx] = bm;
          });
          
          return newBiomarkers;
        });
      }, 2500); // Every 2.5 seconds (middle of 2-3s range)
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: BiomarkerCategory | 'all') => {
    setCategory(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'high': return 'error';
      case 'low': return 'warning';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#d32f2f'; // error.main
      case 'moderate': return '#ed6c02'; // warning.main
      case 'low': return '#2e7d32'; // success.main
      default: return 'text.secondary';
    }
  };

  const handleGetAIInsights = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await axios.get(`http://localhost:3001/api/patients/${id}/analysis`);
      setAnalysis(res.data);
    } catch (err) {
      setAnalysisError('Failed to generate AI insights. Please try again later.');
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (!patient) return null;

  return (
    <Container maxWidth="lg">
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')} 
        sx={{ mb: 2 }}
      >
        Back to Patients
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>{patient.name}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Date of Birth</Typography>
                <Typography variant="body1">{patient.dateOfBirth}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Last Visit</Typography>
                <Typography variant="body1">{patient.lastVisit}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Patient ID</Typography>
                <Typography variant="body1">{patient.id}</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right', xs: 'left' } }}>
            <Box sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={isLive} 
                    onChange={(e) => setIsLive(e.target.checked)} 
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: isLive ? 'primary.main' : 'text.secondary' }}>
                    {isLive ? 'LIVE UPDATES ON' : 'Live Updates'}
                  </Typography>
                }
              />
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={analysisLoading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
              onClick={handleGetAIInsights}
              disabled={analysisLoading}
            >
              {analysisLoading ? 'Analyzing...' : 'Get AI Insights'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {analysisError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAnalysisError(null)}>
          {analysisError}
        </Alert>
      )}

      {analysis && (
        <Paper sx={{ p: 3, mb: 3, borderLeft: 6, borderColor: getRiskLevelColor(analysis.analysis.overallRiskLevel) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">AI Biomarker Analysis</Typography>
            <Chip 
              label={`Risk Level: ${analysis.analysis.overallRiskLevel.toUpperCase()}`} 
              sx={{ 
                ml: 2, 
                bgcolor: getRiskLevelColor(analysis.analysis.overallRiskLevel), 
                color: 'white',
                fontWeight: 'bold'
              }} 
            />
          </Box>
          
          <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}>
            "{analysis.analysis.summary}"
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} fontSize="small" />
                Concerning Biomarkers
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {analysis.analysis.concerningBiomarkers.length > 0 ? (
                analysis.analysis.concerningBiomarkers.map((cb, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="error.main">
                      {cb.name}: {cb.value} {cb.unit} ({cb.status.toUpperCase()})
                    </Typography>
                    <Typography variant="body2">{cb.risk}</Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                  <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} fontSize="small" />
                  <Typography variant="body2">No concerning biomarkers identified.</Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'info.main' }} fontSize="small" />
                Monitoring Priorities
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {analysis.priorities.map((p, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Chip 
                      label={p.priority.toUpperCase()} 
                      size="small" 
                      color={p.priority === 'critical' ? 'error' : p.priority === 'high' ? 'warning' : 'info'}
                      sx={{ mr: 1, height: 20, fontSize: '0.65rem' }}
                    />
                    <Typography variant="subtitle2">{p.biomarkerName}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">{p.reason}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                    Action: {p.suggestedAction}
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button size="small" onClick={() => setAnalysis(null)}>Dismiss Analysis</Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={category} onChange={handleCategoryChange} aria-label="biomarker categories">
          <Tab label="All" value="all" />
          <Tab label="Metabolic" value="metabolic" />
          <Tab label="Cardiovascular" value="cardiovascular" />
          <Tab label="Hormonal" value="hormonal" />
        </Tabs>
      </Box>

      {biomarkers.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Biomarker Values {category !== 'all' ? `- ${category.charAt(0).toUpperCase() + category.slice(1)}` : ''}
          </Typography>
          <BarChart
            dataset={biomarkers.slice(0, 10).map(bm => ({
              name: bm.name,
              value: bm.value
            }))} // Show top 10 to keep it clean
            xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
            series={[{ dataKey: 'value', label: 'Measured Value' }]}
            height={300}
            margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
          />
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Biomarker</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Reference Range</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {biomarkers.map((bm) => (
              <TableRow key={bm.id}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                  {bm.name}
                </TableCell>
                <TableCell align="right">{bm.value}</TableCell>
                <TableCell>{bm.unit}</TableCell>
                <TableCell>{bm.referenceRange.min} - {bm.referenceRange.max}</TableCell>
                <TableCell>
                  <Chip 
                    label={bm.status.toUpperCase()} 
                    color={getStatusColor(bm.status) as any} 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            ))}
            {biomarkers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No biomarkers found for this category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PatientDetail;

