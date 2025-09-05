import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper
} from '@mui/material';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if no user data is found
      navigate('/login');
    }
  }, [navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Your Dashboard, {user.username}!
        </Typography>
        <Typography variant="body1" paragraph>
          Email: {user.email}
        </Typography>
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
