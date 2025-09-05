import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  CircularProgress
} from '@mui/material';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 Dashboard: Getting user data from localStorage...');
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Dashboard: Timeout reached, stopping loading');
      setLoading(false);
    }, 3000); // 3 second timeout
    
    // Always check server session first for Google OAuth users
    console.log('🔍 Dashboard: Checking server session...');
    fetch('http://localhost:5000/api/auth/check-auth', {
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      console.log('📋 Dashboard: Server response:', data);
      if (data.isAuthenticated) {
        console.log('✅ Dashboard: Found authenticated user on server');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', 'session-auth-token');
        setUser(data.user);
      } else {
        // Fallback to localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          console.log('✅ Dashboard: Found user data in localStorage');
          setUser(JSON.parse(userData));
        } else {
          console.log('❌ Dashboard: No authenticated user found, redirecting to login');
          navigate('/login');
        }
      }
      setLoading(false);
      clearTimeout(timeout);
    })
    .catch(error => {
      console.error('❌ Dashboard: Error checking server auth:', error);
      // Fallback to localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        console.log('✅ Dashboard: Found user data in localStorage (fallback)');
        setUser(JSON.parse(userData));
      } else {
        console.log('❌ Dashboard: No user data found, redirecting to login');
        navigate('/login');
      }
      setLoading(false);
      clearTimeout(timeout);
    });
    
    return () => clearTimeout(timeout);
  }, [navigate]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (!user && !loading) {
    console.log('❌ Dashboard: No user found after loading, redirecting to login');
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Your Dashboard, {user.googleName || user.username}!
        </Typography>
        <Typography variant="body1" paragraph>
          Email: {user.email}
        </Typography>
        {user.googleName && (
          <Typography variant="body2" color="text.secondary" paragraph>
            Logged in with Google
          </Typography>
        )}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Book Library Features Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is your personal dashboard. More features will be added soon!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;
