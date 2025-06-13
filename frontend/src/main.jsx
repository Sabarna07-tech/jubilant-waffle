import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/css/themes.css'; // Import themes first
import './assets/css/style.css'; 
import 'react-toastify/dist/ReactToastify.css';

// Import JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext.jsx';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* FIX: Correctly wrap App with Browser Router and all Providers */}
    <BrowserRouter>
      <ThemeProvider>
        <TaskProvider>
          <App />
        </TaskProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);