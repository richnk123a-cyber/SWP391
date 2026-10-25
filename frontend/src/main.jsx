import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import './styles/index.css';
import './styles/workspace-theme.css';
import './styles/workly-reference.css';
import './styles/candidate-workspace.css';
import './components/employer/EmployerPages.css';
import './styles/workspace-scale.css';
import './styles/mint-theme.css';
import './styles/workspace-glass.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
