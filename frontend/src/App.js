import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/check-auth', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.isAuthenticated) {
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', 'google-auth-token'); // Set a token for Google users
        } else {
          // Fallback to localStorage check for regular login
          const token = localStorage.getItem('token');
          if (token) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback to localStorage check
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
        }
      }
    };
    
    checkAuth();
  }, [location]);

  // Handle Google OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_auth') === 'success') {
      console.log('🔄 Google OAuth success detected, checking auth...');
      // Refresh authentication state after Google OAuth
      const checkAuth = async () => {
        try {
          console.log('🔍 Making auth check request...');
          const response = await fetch('http://localhost:5000/api/auth/check-auth', {
            credentials: 'include'
          });
          const data = await response.json();
          console.log('📋 Auth check response:', data);
          
          if (data.isAuthenticated) {
            console.log('✅ User authenticated, setting state...');
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', 'google-auth-token');
            
            // Clean up URL after successful authentication
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('✅ Authentication state set, should navigate to dashboard');
          } else {
            console.log('❌ User not authenticated');
          }
        } catch (error) {
          console.error('❌ Auth check failed after Google OAuth:', error);
        }
      };
      
      checkAuth();
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout endpoint for Google users
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <LibraryBooksIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Book Library
            </Typography>
            {isAuthenticated ? (
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            ) : (
              <>
                <Button color="inherit" href="/login">Login</Button>
                <Button color="inherit" href="/signup">Sign Up</Button>
              </>
            )}
          </Toolbar>
        </AppBar>
      </Box>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard /> : 
              <Navigate to="/login" state={{ from: '/dashboard' }} replace />
            } 
          />
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
              <Login setAuth={setIsAuthenticated} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/signup" 
            element={
              !isAuthenticated ? 
              <Signup /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
        </Routes>
      </Container>
    </ThemeProvider>
  );
}

export default App;
