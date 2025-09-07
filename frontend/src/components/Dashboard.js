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
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Stack,
  CardActionArea,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Close as CloseIcon, 
  ArrowBack as ArrowBackIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreBooks, setGenreBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
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
    'mystery', 'biography', 'history'
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

  // Cart functions
  const addToCart = (book) => {
    setCart(prevCart => {
      const existingBook = prevCart.find(item => item._id === book._id);
      if (existingBook) {
        setSnackbarMessage(`"${book.title}" quantity updated in cart!`);
        return prevCart.map(item =>
          item._id === book._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        setSnackbarMessage(`"${book.title}" added to cart successfully!`);
        return [...prevCart, { ...book, quantity: 1 }];
      }
    });
    setSnackbarOpen(true);
  };

  const removeFromCart = (bookId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== bookId));
  };

  const updateQuantity = (bookId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item._id === bookId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          .pulse {
            animation: pulse 2s ease-in-out infinite;
          }
        `}
      </style>
      {/* Professional Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#1e293b' }}>
        <Toolbar sx={{ py: 1 }}>
          <MenuBookIcon sx={{ mr: 2, fontSize: 32, color: '#3b82f6' }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'white' }}>
            Book Library
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: '#3b82f6' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                {user.googleName || user.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {user.role === 'admin' ? 'Administrator' : 'Reader'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ShoppingCartIcon />}
              onClick={() => setCartOpen(true)}
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { 
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                borderRadius: 2,
                position: 'relative'
              }}
            >
              Cart
              {getTotalItems() > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {getTotalItems()}
                </Box>
              )}
            </Button>
            {user.role === 'admin' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin')}
                sx={{ 
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' },
                  borderRadius: 2
                }}
              >
                Admin Panel
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Hero Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 8, 
            mb: 8, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            borderRadius: 4,
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              animation: 'float 20s ease-in-out infinite'
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}>
              <StarIcon sx={{ mr: 1, color: '#fbbf24', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Premium Book Library
              </Typography>
            </Box>
            
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                mb: 3,
                background: 'linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              Welcome to Your Book Library
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                opacity: 0.95, 
                mb: 4, 
                maxWidth: '700px', 
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 300
              }}
            >
              Discover thousands of books across various genres. Your next great read is just a click away.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              sx={{
                mb: 6,
                px: 4,
                py: 2,
                bgcolor: '#fbbf24',
                color: '#1e293b',
                fontWeight: 'bold',
                borderRadius: 3,
                boxShadow: '0 8px 16px rgba(251, 191, 36, 0.3)',
                '&:hover': {
                  bgcolor: '#f59e0b',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px rgba(251, 191, 36, 0.4)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Start Reading Now
            </Button>
            
            <Stack direction="row" spacing={6} justifyContent="center" sx={{ mt: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fbbf24' }}>
                    {books.length}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Total Books
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Available Now
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fbbf24' }}>
                    {Object.keys(booksByGenre).length}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Genres
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  To Explore
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fbbf24' }}>
                    {books.length > 0 ? Math.max(...Object.values(booksByGenre).map(books => books.length)) : 0}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Most Popular
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Genre
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>


        {/* Browse Section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <CategoryIcon sx={{ mr: 2, color: '#3b82f6', fontSize: 28 }} />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
              Browse by Genre
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: '600px' }}>
            Explore our curated collection of books organized by genre. From thrilling mysteries to heartwarming romances, 
            find your next favorite read in our diverse library.
          </Typography>
        </Box>

      {booksLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {genres.map((genre) => {
            const booksInGenre = booksByGenre[genre] || [];
            const genreColors = {
              'comedy': '#f59e0b',
              'horror': '#dc2626',
              'romance': '#ec4899',
              'sci-fi': '#3b82f6',
              'fantasy': '#8b5cf6',
              'mystery': '#6b7280',
              'biography': '#059669',
              'history': '#d97706'
            };
            
            return (
              <Grid item xs={12} sm={6} md={4} key={genre}>
                <Card 
                  className="fade-in-up"
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      borderColor: genreColors[genre] || '#3b82f6',
                    }
                  }}
                  onClick={() => handleGenreClick(genre)}
                >
                  <CardActionArea sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box
                        className="pulse"
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: genreColors[genre] || '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <MenuBookIcon sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                      
                      <Typography 
                        variant="h5" 
                        component="h3" 
                        sx={{ 
                          mb: 2,
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          color: '#1e293b'
                        }}
                      >
                        {genre}
                      </Typography>
                      
                      <Chip 
                        label={`${booksInGenre.length} books`} 
                        sx={{ 
                          mb: 2,
                          bgcolor: genreColors[genre] || '#3b82f6',
                          color: 'white',
                          fontWeight: 'medium'
                        }}
                      />
                      
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        {booksInGenre.length === 0 
                          ? 'No books available yet' 
                          : `Explore ${booksInGenre.length} carefully curated book${booksInGenre.length === 1 ? '' : 's'} in this genre`
                        }
                      </Typography>
                    </CardContent>
                  </CardActionArea>
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
            <Grid container spacing={3}>
              {genreBooks.map((book) => {
                const genreColors = {
                  'comedy': '#f59e0b',
                  'horror': '#dc2626',
                  'romance': '#ec4899',
                  'sci-fi': '#3b82f6',
                  'fantasy': '#8b5cf6',
                  'mystery': '#6b7280',
                  'biography': '#059669',
                  'history': '#d97706'
                };
                
                return (
                  <Grid item xs={12} sm={6} md={2.4} key={book._id}>  
                    <Card 
                      className="fade-in-up"
                      sx={{ 
                        height: '480px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          borderColor: genreColors[book.genre] || '#3b82f6',
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          image={book.coverImage}
                          alt={book.title}
                          onLoad={() => console.log('✅ Image loaded:', book.title)}
                          onError={(e) => {
                            console.log('❌ Image failed to load:', book.title, book.coverImage);
                            e.target.src = 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover';
                            e.target.onerror = null; // Prevent infinite loop
                          }}
                          sx={{ 
                            height: '240px',
                            width: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            backgroundColor: '#f5f5f5',
                            display: 'block',
                            flexShrink: 0,
                            transition: 'transform 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                        <Chip
                          label={book.genre}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: genreColors[book.genre] || '#3b82f6',
                            color: 'white',
                            fontWeight: 'medium',
                            fontSize: '0.7rem',
                            textTransform: 'capitalize',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            height: '24px'
                          }}
                        />
                      </Box>
                      <CardContent sx={{ 
                        height: '240px',
                        width: '100%',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        bgcolor: '#fafafa'
                      }}>
                        <Box sx={{ 
                          height: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ height: '50px' }}>
                            <Typography 
                              variant="h6" 
                              component="h3" 
                              sx={{ 
                                fontWeight: 'bold',
                                mb: 0.5,
                                fontSize: '1rem',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                height: '2.4rem',
                                color: '#1e293b'
                              }}
                            >
                              {book.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                mb: 1,
                                fontStyle: 'italic',
                                fontSize: '0.8rem',
                                height: '1.2rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#64748b'
                              }}
                            >
                              by {book.author}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              lineHeight: 1.3,
                              fontSize: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              height: '2.9rem',
                              color: '#64748b'
                            }}
                          >
                            {book.description}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => addToCart(book)}
                          fullWidth
                          sx={{
                            bgcolor: genreColors[book.genre] || '#3b82f6',
                            '&:hover': { 
                              bgcolor: genreColors[book.genre] || '#3b82f6',
                              filter: 'brightness(0.9)'
                            },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium',
                            py: 1,
                            height: '40px',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseGenreDialog} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog 
        open={cartOpen} 
        onClose={() => setCartOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCartIcon sx={{ mr: 1, color: '#3b82f6' }} />
            <Typography variant="h5" component="h2">
              Your Cart ({getTotalItems()} items)
            </Typography>
          </Box>
          <IconButton onClick={() => setCartOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {cart.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some books to get started!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {cart.map((item) => (
                <Card key={item._id} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ width: 80, height: 100, flexShrink: 0 }}>
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover';
                        }}
                      />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        by {item.author}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Genre: {item.genre}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            sx={{ minWidth: 32, height: 32 }}
                          >
                            <RemoveIcon fontSize="small" />
                          </Button>
                          <Typography variant="body1" sx={{ minWidth: 24, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            sx={{ minWidth: 32, height: 32 }}
                          >
                            <AddIcon fontSize="small" />
                          </Button>
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item._id)}
                          startIcon={<DeleteIcon />}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        
        {cart.length > 0 && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => setCart([])} 
              variant="outlined" 
              color="error"
              startIcon={<DeleteIcon />}
            >
              Clear Cart
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              variant="contained" 
              size="large"
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                px: 4
              }}
            >
              Checkout ({getTotalItems()} items)
            </Button>
          </DialogActions>
        )}
      </Dialog>

        {/* Professional Footer */}
        <Box sx={{ mt: 8, py: 4, bgcolor: '#1e293b', borderRadius: 3 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MenuBookIcon sx={{ mr: 2, color: '#3b82f6', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Book Library
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: '400px' }}>
                  Your gateway to thousands of books across all genres. Discover, read, and enjoy 
                  the world's greatest literature at your fingertips.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    © 2024 Book Library. All rights reserved.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Built with ❤️ for book lovers everywhere
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Container>

      {/* Success Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 'medium'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;