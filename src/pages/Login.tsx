// src/pages/Login.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';

// Importando componentes do Material-UI
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para guardar mensagens de erro
  const navigate = useNavigate(); // Hook para redirecionar o usuário

  // Função chamada quando o formulário é enviado
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página
    setError(''); // Limpa erros anteriores

    try {
      // Tenta fazer o login com o Firebase
      await signInWithEmailAndPassword(auth, email, password);
      // Se der certo, o <ProtectedRoute> vai nos redirecionar para a Home automaticamente!
      // Mas podemos forçar aqui também:
      navigate('/');
    } catch (err: any) {
      // Trata os erros do Firebase
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
      console.error(err.code, err.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Entrar
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de E-mail"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="current-password"
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
          >
            Entrar
          </Button>
          
          <Link to="/register" style={{ textDecoration: 'none' }}>
            {"Não tem uma conta? Cadastre-se"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
};