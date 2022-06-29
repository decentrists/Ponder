import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#fff',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
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
