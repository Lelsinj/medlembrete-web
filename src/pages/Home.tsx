import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { 
  collection, addDoc, query, where, onSnapshot, deleteDoc, doc, Timestamp, getDocs 
} from 'firebase/firestore';

import { 
  Button, Container, Typography, Box, IconButton, Snackbar, Alert, 
  Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Card, CardContent, CardActions, Chip
} from '@mui/material';

// Ícones
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicationIcon from '@mui/icons-material/Medication'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 

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
  isTakenToday: boolean; // Propriedade de adesão
}

// Helper para obter a data de hoje no formato YYYY-MM-DD
const getTodayDateString = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const Home = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // Estados
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(dayjs());
  const [medications, setMedications] = useState<Medication[]>([]);
  
  const [openDialog, setOpenDialog] = useState(false);

  // NOVO ESTADO PARA O GATILHO:
  const [updateTrigger, setUpdateTrigger] = useState(0); 

  // Estados do Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setSnackbarMsg(message);
    setSnackbarSeverity(type);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  // --------------------------------------------------------------------
  // EFEITO CENTRAL: BUSCA MEDICAMENTOS E STATUS DE ADESÃO
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;
    
    const medsQuery = query(collection(db, 'medicamentos'), where('userId', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(medsQuery, async (querySnapshot) => {
      try { 
          const today = getTodayDateString();
          const medsPromises: Promise<Medication>[] = [];

          querySnapshot.forEach((docSnap) => {
            const medData = docSnap.data() as Omit<Medication, 'id' | 'isTakenToday'>; 
            const medId = docSnap.id;

            const adherenceCheck = async (): Promise<Medication> => {
              const historyQuery = query(
                collection(db, 'medicamentos', medId, 'historico'),
                where('date', '==', today)
              );
              const historySnapshot = await getDocs(historyQuery);
              
              return {
                ...medData,
                id: medId,
                isTakenToday: !historySnapshot.empty 
              };
            };
            medsPromises.push(adherenceCheck());
          });

          const finalMedsData = await Promise.all(medsPromises);
          
          finalMedsData.sort((a, b) => a.time.localeCompare(b.time));
          setMedications(finalMedsData);
          
      } catch (error) { 
          console.error("ERRO CRÍTICO no carregamento da lista (Adherence Check):", error);
          showFeedback("Falha ao carregar a lista de medicamentos.", 'error');
          setMedications([]); 
      }
    });

    return () => unsubscribe();
  }, [currentUser, updateTrigger]); // CORRIGIDO: Adiciona updateTrigger como dependência

  const handleAddMedication = async () => {
    if (!currentUser) return;
    if (!selectedTime) {
      showFeedback('Selecione um horário.', 'error');
      return;
    }
    if (!medName.trim() || !dosage.trim()) {
      showFeedback('Preencha todos os campos.', 'error');
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
      setSelectedTime(dayjs());
      setOpenDialog(false); // Fecha o modal
      showFeedback('Medicamento adicionado!', 'success');
    } catch (error) {
      showFeedback('Erro ao salvar.', 'error');
    }
  };

  const handleDelete = async (medId: string) => {
    if (!window.confirm("Excluir este medicamento?")) return;
    try {
      await deleteDoc(doc(db, 'medicamentos', medId));
      showFeedback('Medicamento removido.', 'success');
    } catch (error) {
      showFeedback('Erro ao excluir.', 'error');
    }
  };

  // --------------------------------------------------------------------
  // FUNÇÃO DE MARCAR COMO TOMADO
  // --------------------------------------------------------------------
  const handleMedicationTaken = async (medId: string, medName: string, isTakenToday: boolean) => {
    if (isTakenToday) {
      showFeedback(`${medName} já foi marcado como tomado hoje.`, 'error');
      return;
    }

    try {
      const dateString = getTodayDateString();
      
      await addDoc(collection(db, 'medicamentos', medId, 'historico'), {
        takenAt: Timestamp.now(),
        date: dateString, 
        time: dayjs().format('HH:mm'),
        userId: currentUser?.uid
      });
      
      // CHAVE DA CORREÇÃO: Força o re-execução do useEffect para atualizar o visual.
      setUpdateTrigger(prev => prev + 1); 

      showFeedback(`${medName} marcado como tomado!`, 'success');

    } catch (error) {
      showFeedback('Erro ao registrar adesão.', 'error');
    }
  };
  // --------------------------------------------------------------------
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      showFeedback('Erro ao sair.', 'error');
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ pb: 10 }}> 
      
      {/* --- CABEÇALHO --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 4 }}>
        <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Olá, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Usuário'}! 
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vamos verificar seus agendamentos.
            </Typography>
        </Box>
        <IconButton onClick={() => { handleLogout(); }} color="default">
          <LogoutIcon />
        </IconButton>
      </Box>

      {/* --- LISTA DE CARDS (FLEXBOX/BOX) --- */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {medications.length === 0 ? (
          <Box key="empty-state" sx={{ width: '100%', textAlign: 'center', mt: 5, opacity: 0.6 }}>
             <MedicationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
             <Typography>Nenhum medicamento agendado.</Typography>
             <Typography variant="body2">Toque no + para começar.</Typography>
          </Box>
        ) : (
          medications.map((med) => (
            <Card 
              key={med.id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                // Borda muda de cor (verde para tomado, laranja para pendente)
                borderLeft: med.isTakenToday ? '6px solid #4CAF50' : '6px solid #FF9800' 
              }}
            >
              
              {/* ÍCONE CENTRAL: MUDANÇA VISUAL DE STATUS */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  bgcolor: med.isTakenToday ? 'success.main' : 'warning.main', 
                  color: 'primary.contrastText', 
                  mr: 2, 
                  ml: 1 
                }}
              >
                 {/* Ícone muda (Check para tomado, Relógio para pendente) */}
                 {med.isTakenToday ? <CheckCircleIcon /> : <AccessTimeIcon />}
              </Box>
              
              <CardContent sx={{ flex: '1 0 auto', p: '16px 0 !important' }}>
                <Typography component="div" variant="h6">
                  {med.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip label={med.time} size="small" color="primary" variant="outlined" icon={<AccessTimeIcon />} />
                  <Chip label={med.dosage} size="small" />
                </Box>
              </CardContent>
              <CardActions>
                {/* NOVO BOTÃO: Marcar como Tomado */}
                <IconButton 
                  onClick={() => handleMedicationTaken(med.id, med.name, med.isTakenToday)} 
                  color={med.isTakenToday ? 'default' : 'success'}
                  aria-label="Marcar como tomado"
                  disabled={med.isTakenToday} // Desativa se já foi tomado
                >
                  <CheckCircleIcon />
                </IconButton>

                {/* BOTÃO DE DELETAR */}
                <IconButton onClick={() => handleDelete(med.id)} color="error" aria-label="Deletar">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      {/* --- FAB (BOTÃO FLUTUANTE) --- */}
      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* --- MODAL DE ADICIONAR --- */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Novo Medicamento</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Nome do Medicamento"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Dosagem (ex: 1 comprimido)"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <TimePicker
                label="Horário"
                value={selectedTime}
                onChange={(newValue) => setSelectedTime(newValue)}
                ampm={false}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleAddMedication} variant="contained" color="primary">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- SNACKBAR --- */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }} 
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
          {snackbarMsg}
        </Alert>
      </Snackbar>

    </Container>
  );
};