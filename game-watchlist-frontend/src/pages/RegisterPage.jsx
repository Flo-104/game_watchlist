import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Importiere useNavigate

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate(); // Initialisiere useNavigate

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data submitted:", formData); // Debugging: Formulardaten ausgeben
  
    try {
      const response = await fetch('http://localhost:5000/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      console.log("Response status:", response.status); // Debugging: HTTP-Status ausgeben
      const data = await response.json();
      console.log("Response data:", data); // Debugging: Antwortdaten ausgeben
  
      if (response.ok) {
        alert('Registrierung erfolgreich!');
        navigate('/login'); // Weiterleitung zur Login-Seite
      } else {
        alert(`Fehler: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error("Error during registration:", error); // Debugging: Fehler ausgeben
      alert('Ein Fehler ist aufgetreten.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: 2,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Registrierung
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <TextField
          label="Benutzername"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <TextField
          label="E-Mail"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <TextField
          label="Passwort"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <Button type="submit" variant="contained" color="primary">
          Registrieren
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterPage;