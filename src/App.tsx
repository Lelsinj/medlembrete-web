// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Importe nossos novos guardiões
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestRoute } from './components/GuestRoute';

// Importe o nosso novo gestor
import { NotificationHandler } from './components/NotificationHandler';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationHandler /> {/* Ele vai correr em todas as páginas */}

      <Routes>
        {/* Rota Principal (Home):
          Envolvida pelo <ProtectedRoute>
        */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Rota de Login:
          Envolvida pelo <GuestRoute>
        */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        {/* Rota de Cadastro:
          Envolvida pelo <GuestRoute>
        */}
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
      </Routes>
      </ThemeProvider>
  );
}

export default App;