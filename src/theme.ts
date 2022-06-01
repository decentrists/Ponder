import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#fff',
    },
  },
  components: {
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#4b9b73',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: '#4b9b73',
            transition: 'all 0.3s ease',
          },
          '&.Mui-selected': {
            color: '#4b9b73',
          },
        },
      },
    },
  },
});