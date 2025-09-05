import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreBooks, setGenreBooks] = useState([]);
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

  // Fetch books when component loads
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      console.log('📚 Dashboard: Fetching books...');
      const response = await axios.get('http://localhost:5000/api/books', {
        withCredentials: true
      });
      console.log('📚 Dashboard: Books received:', response.data);
      setBooks(response.data);
    } catch (error) {
      console.error('❌ Dashboard: Error fetching books:', error);
    } finally {
      setBooksLoading(false);
    }
  };

  // Group books by genre
  const booksByGenre = books.reduce((acc, book) => {
    if (!acc[book.genre]) {
      acc[book.genre] = [];
    }
    acc[book.genre].push(book);
    return acc;
  }, {});

  const genres = [
    'comedy', 'horror', 'romance', 'sci-fi', 'fantasy', 
    'mystery', 'thriller', 'biography', 'history', 'self-help'
  ];

  const handleGenreClick = (genre) => {
    const booksInGenre = booksByGenre[genre] || [];
    setSelectedGenre(genre);
    setGenreBooks(booksInGenre);
  };

  const handleCloseGenreDialog = () => {
    setSelectedGenre(null);
    setGenreBooks([]);
  };

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome, {user.googleName || user.username}!
            </Typography>
            <Typography variant="body1" paragraph>
              Email: {user.email}
            </Typography>
            {user.googleName && (
              <Typography variant="body2" color="text.secondary" paragraph>
                Logged in with Google
              </Typography>
            )}
          </Box>
          {user.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </Button>
          )}
        </Box>
      </Paper>

      {/* Books by Genre */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Browse Books by Genre
      </Typography>

      {booksLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {genres.map((genre) => {
            const booksInGenre = booksByGenre[genre] || [];
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={genre}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    }
                  }}
                  onClick={() => handleGenreClick(genre)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 'bold',
                        textTransform: 'capitalize',
                        color: 'primary.main'
                      }}
                    >
                      {genre}
                    </Typography>
                    
                    <Chip 
                      label={`${booksInGenre.length} books`} 
                      color="primary" 
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      {booksInGenre.length === 0 
                        ? 'No books available yet' 
                        : `Click to view ${booksInGenre.length} book${booksInGenre.length === 1 ? '' : 's'}`
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Genre Books Dialog */}
      <Dialog 
        open={selectedGenre !== null} 
        onClose={handleCloseGenreDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowBackIcon sx={{ mr: 1, cursor: 'pointer' }} onClick={handleCloseGenreDialog} />
            <Typography variant="h5" component="h2" sx={{ textTransform: 'capitalize' }}>
              {selectedGenre} Books
            </Typography>
          </Box>
          <IconButton onClick={handleCloseGenreDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {genreBooks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No books in this genre yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Check back later or contact an admin to add books
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {genreBooks.map((book) => (
                <Grid item xs={12} sm={6} md={4} key={book._id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={book.coverImage}
                      alt={book.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 'bold',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {book.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mb: 1,
                          fontStyle: 'italic'
                        }}
                      >
                        by {book.author}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {book.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseGenreDialog} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;