import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth'; // Importado explicitamente como tipo
import { auth, db } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';

import { doc, setDoc } from 'firebase/firestore'; // Importações para salvar no Firestore
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Novo Componente
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // Plugin para formatos customizados
dayjs.extend(customParseFormat);

import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

export const Register = () => {
  const [name, setName] = useState(''); // Novo estado
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null); // Novo estado
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Para evitar cliques duplicados
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!name.trim()) {
      setError('Por favor, preencha seu nome completo.');
      return;
    }
    if (!birthDate) {
      setError('Por favor, selecione sua data de nascimento.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cria o usuário no Firebase AUTH
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Salva os dados adicionais no Firestore (coleção 'users')
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: user.email,
        birthDate: birthDate.toDate(), // Salva como um objeto Date no Firestore
        createdAt: dayjs().toDate(),
      });

      // 3. Redireciona para a Home (o NotificationHandler já vai cuidar do token)
      navigate('/');
      
    } catch (err: any) {
      // 4. Trata os erros
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O formato do e-mail é inválido.');
      } else {
        setError('Ocorreu um erro ao criar a conta.');
        console.error(err.code, err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Criar uma Conta
        </Typography>
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 3 }}>
            
          {/* Campo Nome */}
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nome Completo"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Seletor de Data de Nascimento */}
          <Box sx={{ mt: 2, mb: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                    label="Data de Nascimento"
                    value={birthDate}
                    onChange={(newValue) => setBirthDate(newValue)}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
          </Box>

          {/* Campo Email */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de E-mail"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Campo Senha */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha (mín. 6 caracteres)"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Exibe o alerta de erro, se houver um */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Conta'}
          </Button>
          
          <Link to="/login" style={{ textDecoration: 'none' }}>
            {"Já tem uma conta? Faça login"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
};