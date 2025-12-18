import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';

function App() {
  return (
    <Router>
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Mini Health Dashboard
          </Typography>
          <Routes>
            <Route path="/" element={<PatientList />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
}

export default App;
