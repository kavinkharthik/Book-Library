import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper,
  Link as MuiLink,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration and Google OAuth errors
  useEffect(() => {
    const checkExistingAuth = async () => {
      // Check if user is already authenticated via session
      try {
        const response = await axios.get('http://localhost:5000/api/auth/check-auth', {
          withCredentials: true
        });
        
        if (response.data.isAuthenticated) {
          // User is already authenticated, redirect to dashboard
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('token', 'session-auth-token');
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        // Ignore auth check errors, user is not authenticated
      }
    };

    checkExistingAuth();

    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
    
    // Check for Google OAuth error
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'google_auth_failed') {
      setError('Google authentication failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, navigate]);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true // Enable cookies for session management
      };

      const body = JSON.stringify({ email, password });
      
      const res = await axios.post('http://localhost:5000/api/auth/login', body, config);
      
      if (res.data.message === 'Login successful') {
        // Check if user is trying to login through Admin tab but is not an admin
        if (tabValue === 1 && res.data.user.role !== 'admin') {
          setError('User not permitted to login in admin page');
          setLoading(false);
          return;
        }
        
        // Admin users can login through both tabs, regular users only through User tab
        localStorage.setItem('token', 'dummy-token');
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (setAuth) setAuth(true);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccessMessage('');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Book Library Login
        </Typography>
        
        <Box sx={{ width: '100%', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="User Login" />
            <Tab label="Admin Login" />
          </Tabs>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={handleChange}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, height: '45px' }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          
          {tabValue === 0 && (
            <>
              <Divider sx={{ width: '100%', my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                sx={{ 
                  mb: 2, 
                  height: '45px',
                  borderColor: '#db4437',
                  color: '#db4437',
                  '&:hover': {
                    borderColor: '#c23321',
                    backgroundColor: 'rgba(219, 68, 55, 0.04)'
                  }
                }}
              >
                Continue with Google
              </Button>
            </>
          )}
          
          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={Link} to="/signup" variant="body2" sx={{ textDecoration: 'none' }}>
              {"Don't have an account? Sign Up"}
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
