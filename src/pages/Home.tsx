// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore';

import { 
  Button, Container, Typography, Box, TextField, 
  List, ListItem, ListItemText, IconButton, Paper,
  Snackbar, Alert 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  userId: string;
}

export const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Estados do Formulário
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(dayjs());

  const [medications, setMedications] = useState<Medication[]>([]);

  // --- NOVOS ESTADOS PARA O FEEDBACK VISUAL (SNACKBAR) ---
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Função auxiliar para disparar o feedback
  const showFeedback = (message: string, type: 'success' | 'error') => {
    setSnackbarMsg(message);
    setSnackbarSeverity(type);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };
  // -------------------------------------------------------

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'medicamentos'), 
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const medsData: Medication[] = [];
      querySnapshot.forEach((doc) => {
        medsData.push({ ...doc.data(), id: doc.id } as Medication);
      });
      setMedications(medsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validação do horário
    if (!selectedTime) {
      showFeedback('Por favor, selecione um horário válido.', 'error');
      return;
    }

    try {
      const formattedTime = selectedTime.format('HH:mm');

      await addDoc(collection(db, 'medicamentos'), {
        name: medName.trim(),
        dosage: dosage.trim(),
        time: formattedTime,
        userId: currentUser.uid,
        createdAt: Timestamp.now()
      });
      
      setMedName('');
      setDosage('');
      setSelectedTime(dayjs()); // Reseta para a hora atual
      
      // Feedback de Sucesso
      showFeedback('Medicamento agendado com sucesso! 💊', 'success');
      
    } catch (error) {
      console.error("Erro ao adicionar: ", error);
      showFeedback('Erro ao salvar o medicamento.', 'error');
    }
  };

  const handleDelete = async (medId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este medicamento?")) {
      return;
    }

    try {
      const medDocRef = doc(db, 'medicamentos', medId);
      await deleteDoc(medDocRef);
      
      // Feedback de Sucesso na Exclusão
      showFeedback('Medicamento removido.', 'success');

    } catch (error) {
      console.error("Erro ao excluir: ", error);
      showFeedback('Erro ao excluir o medicamento.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Typography component="h1" variant="h4">
          Meu Painel
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Sair
        </Button>
      </Box>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography component="h2" variant="h5" gutterBottom>
          Adicionar Novo Medicamento
        </Typography>
        <Box component="form" onSubmit={handleAddMedication} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Nome do Medicamento"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Dosagem (ex: 1 cp)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            required
            fullWidth
          />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <TimePicker
              label="Horário"
              value={selectedTime}
              onChange={(newValue) => setSelectedTime(newValue)}
              ampm={false}
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>

          <Button type="submit" variant="contained" sx={{ px: 4 }}>
            Salvar
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography component="h2" variant="h5" gutterBottom>
          Meus Medicamentos
        </Typography>
        <List>
          {medications.length === 0 ? (
            <Typography color="text.secondary">Nenhum medicamento cadastrado ainda.</Typography>
          ) : (
            medications.map((med) => (
              <ListItem key={med.id} divider>
                <ListItemText
                  primary={`${med.name} (${med.dosage})`}
                  secondary={`Tomar às: ${med.time}`}
                />
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleDelete(med.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* --- COMPONENTE DE FEEDBACK VISUAL (SNACKBAR) --- */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>

    </Container>
  );
};