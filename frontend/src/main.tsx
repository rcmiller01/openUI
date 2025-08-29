import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { useAppStore } from './store';
import { themes } from './themes';

// App component with theme provider
const AppWithTheme = () => {
  const { theme: themeVariant } = useAppStore();
  const theme = themes[themeVariant as keyof typeof themes];

  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};

// Initialize the React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);