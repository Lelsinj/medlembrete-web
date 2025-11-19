import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2A9D8F', // Um verde-azulado moderno ("Teal")
      contrastText: '#fff',
    },
    secondary: {
      main: '#E76F51', // Um terracota para destaques/alertas
    },
    background: {
      default: '#F4F7F6', // Cinza muito suave para o fundo (não cansa a vista)
      paper: '#ffffff',
    },
    text: {
      primary: '#264653', // Um azul escuro quase preto (melhor que preto puro)
    },
  },
  shape: {
    borderRadius: 16, // Bordas bem arredondadas (estilo moderno)
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#264653',
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Tira o CAIXA ALTA padrão dos botões
          fontWeight: 600,
          padding: '10px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Sombra suave e elegante
        },
      },
    },
  },
}, ptBR);