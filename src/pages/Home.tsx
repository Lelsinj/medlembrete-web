// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase-config'; // Importe o 'db' (Firestore)
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Nosso hook de autenticação
import DeleteIcon from '@mui/icons-material/Delete'; // (Opcional: Ícone de lixeira)

// Funções do Firestore que vamos usar
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';

// Componentes do Material-UI
import { 
  Button, Container, Typography, Box, TextField, 
  List, ListItem, ListItemText, IconButton, Paper 
} from '@mui/material';

// Definindo o TIPO de um Medicamento
interface Medication {
  id: string; // ID do documento no Firestore
  name: string;
  dosage: string;
  time: string; // Por simplicidade, usaremos string (ex: "08:00")
  userId: string; // ID do usuário dono do medicamento
}

export const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Pega o usuário logado

  // Estados para o formulário
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');

  // Estado para guardar a lista de medicamentos
  const [medications, setMedications] = useState<Medication[]>([]);

  // --- EFEITO PARA BUSCAR OS MEDICAMENTOS ---
  useEffect(() => {
    // Se não há usuário logado, não faça nada
    if (!currentUser) return;

    // 1. Cria a "query" (consulta)
    // "Busque na coleção 'medicamentos' ONDE o 'userId' for IGUAL ao ID do usuário logado"
    const q = query(
      collection(db, 'medicamentos'), 
      where('userId', '==', currentUser.uid)
    );

    // 2. Cria o "listener" em tempo real (onSnapshot)
    // Isso "ouve" qualquer mudança na consulta
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const medsData: Medication[] = [];
      querySnapshot.forEach((doc) => {
        // Adiciona o ID do documento aos dados
        medsData.push({ ...doc.data(), id: doc.id } as Medication);
      });
      setMedications(medsData); // Atualiza o estado com os dados
    });

    // 3. Retorna a função de limpeza
    return () => unsubscribe();

  }, [currentUser]); // Rode este efeito sempre que o 'currentUser' mudar

  // --- FUNÇÃO PARA ADICIONAR UM NOVO MEDICAMENTO ---
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return; // Checagem de segurança

    try {
      // Adiciona um novo "documento" na coleção "medicamentos"
      await addDoc(collection(db, 'medicamentos'), {
        name: medName,
        dosage: dosage,
        time: time,
        userId: currentUser.uid, // Salva o ID do dono
        createdAt: Timestamp.now() // Salva a data de criação
      });
      // Limpa o formulário
      setMedName('');
      setDosage('');
      setTime('');
    } catch (error) {
      console.error("Erro ao adicionar medicamento: ", error);
    }
  };

  // --- FUNÇÃO PARA EXCLUIR UM MEDICAMENTO ---
  const handleDelete = async (medId: string) => {
    // Confirmação simples (opcional, mas recomendado)
    if (!window.confirm("Tem certeza que deseja excluir este medicamento?")) {
      return;
    }

    try {
      // Cria a referência para o documento específico
      const medDocRef = doc(db, 'medicamentos', medId);
      // Exclui o documento
      await deleteDoc(medDocRef);
      // O onSnapshot vai atualizar a lista automaticamente!
    } catch (error) {
      console.error("Erro ao excluir medicamento: ", error);
    }
  };

  // --- FUNÇÃO DE LOGOUT ---
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

      {/* --- SEÇÃO DO FORMULÁRIO --- */}
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
            label="Dosagem (ex: 1 comprimido)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Horário (ex: 08:00)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" sx={{ px: 4 }}>
            Salvar
          </Button>
        </Box>
      </Paper>

      {/* --- SEÇÃO DA LISTA DE MEDICAMENTOS --- */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography component="h2" variant="h5" gutterBottom>
          Meus Medicamentos
        </Typography>
        <List>
          {medications.length === 0 ? (
            <Typography>Nenhum medicamento cadastrado ainda.</Typography>
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
                  onClick={() => handleDelete(med.id)} // <--- Adiciona o onClick
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Container>
  );
};