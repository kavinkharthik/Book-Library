import React, { useEffect, useState, useRef } from 'react';
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
  Snackbar,
  Alert,
  TextField
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
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon
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
  const [searchQueries, setSearchQueries] = useState({});
  const [filteredBooks, setFilteredBooks] = useState({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('all'); // 'all', 'year', 'author'
  const navigate = useNavigate();
  const bookSectionRef = useRef(null);

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
    const booksInGenre = getDisplayBooks(genre);
    setSelectedGenre(genre);
    setGenreBooks(booksInGenre);
  };

  const handleCloseGenreDialog = () => {
    setSelectedGenre(null);
    setGenreBooks([]);
  };

  // Search functionality with ranking
  const getSearchScore = (book, query) => {
    if (!query || !book) return 0;
    
    const searchTerm = query.toLowerCase();
    const title = book.title.toLowerCase();
    const author = book.author.toLowerCase();
    const description = book.description.toLowerCase();
    const publishedYear = book.publishedYear ? book.publishedYear.toString() : '';
    
    let score = 0;
    
    // Title matches get highest priority
    if (title.includes(searchTerm)) {
      score += 100;
      // Exact title match gets even higher score
      if (title === searchTerm) score += 50;
      // Title starts with search term gets bonus
      if (title.startsWith(searchTerm)) score += 25;
    }
    
    // Author matches get medium priority
    if (author.includes(searchTerm)) {
      score += 50;
      // Exact author match gets bonus
      if (author === searchTerm) score += 25;
    }
    
    // Published year matches get medium priority
    if (publishedYear.includes(searchTerm)) {
      score += 40;
      // Exact year match gets bonus
      if (publishedYear === searchTerm) score += 20;
    }
    
    // Description matches get lower priority
    if (description.includes(searchTerm)) {
      score += 10;
    }
    
    return score;
  };

  const handleSearchChange = (genre, query) => {
    setSearchQueries(prev => ({
      ...prev,
      [genre]: query
    }));

    // Get all books in this genre
    const booksInGenre = booksByGenre[genre] || [];
    
    if (!query.trim()) {
      // If no search query, show all books in original order
      setFilteredBooks(prev => ({
        ...prev,
        [genre]: []
      }));
    } else {
      // Sort ALL books by search relevance score (matching books first)
      const ranked = booksInGenre.sort((a, b) => {
        const scoreA = getSearchScore(a, query);
        const scoreB = getSearchScore(b, query);
        return scoreB - scoreA; // Descending order - highest scores first
      });

      setFilteredBooks(prev => ({
        ...prev,
        [genre]: ranked
      }));
    }
  };

  const clearSearch = (genre) => {
    setSearchQueries(prev => ({
      ...prev,
      [genre]: ''
    }));
    setFilteredBooks(prev => ({
      ...prev,
      [genre]: []
    }));
  };

  // Global search functionality
  const handleGlobalSearch = (query) => {
    setGlobalSearchQuery(query);
    
    if (!query || query.trim() === '') {
      setGlobalSearchResults([]);
      return;
    }

    let results = [];

    if (searchType === 'year') {
      const searchYear = parseInt(query);
      if (!isNaN(searchYear)) {
        results = books.filter(book => book.publishedYear === searchYear);
      }
    } else if (searchType === 'author') {
      results = books.filter(book => 
        book.author.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      // Search all fields
      results = books.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.description.toLowerCase().includes(query.toLowerCase()) ||
        (book.publishedYear && book.publishedYear.toString().includes(query))
      );
    }

    setGlobalSearchResults(results);
  };

  const clearGlobalSearch = () => {
    setGlobalSearchQuery('');
    setGlobalSearchResults([]);
  };

  const getDisplayBooks = (genre) => {
    const query = searchQueries[genre] || '';
    if (query.trim() === '') {
      return booksByGenre[genre] || [];
    }
    
    const matchingCount = getMatchingBooksCount(genre, query);
    if (matchingCount === 0) {
      // If no matches, show all books in original order
      return booksByGenre[genre] || [];
    }
    
    // When searching and there are matches, show all books sorted by relevance
    return filteredBooks[genre] || [];
  };

  const getMatchingBooksCount = (genre, query) => {
    if (!query.trim()) return 0;
    
    const booksInGenre = booksByGenre[genre] || [];
    return booksInGenre.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.description.toLowerCase().includes(query.toLowerCase()) ||
      (book.publishedYear && book.publishedYear.toString().includes(query))
    ).length;
  };

  const getDisplayBookCount = (genre) => {
    const query = searchQueries[genre] || '';
    if (query.trim() === '') {
      return (booksByGenre[genre] || []).length;
    }
    // When searching, show count of matching books
    return getMatchingBooksCount(genre, query);
  };

  // Highlight search terms in text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span 
            key={index} 
            className="search-highlight"
            style={{ 
              backgroundColor: '#fbbf24', 
              color: '#1e293b', 
              fontWeight: 'bold',
              padding: '1px 3px',
              borderRadius: '3px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Cart functions (Library-style - no quantities)
  const addToCart = (book) => {
    setCart(prevCart => {
      const existingBook = prevCart.find(item => item._id === book._id);
      if (existingBook) {
        setSnackbarMessage(`"${book.title}" is already in your reading list!`);
        return prevCart; // Don't add duplicate
      } else {
        setSnackbarMessage(`"${book.title}" added to reading list!`);
        return [...prevCart, book]; // No quantity field needed
      }
    });
    setSnackbarOpen(true);
  };

  const removeFromCart = (bookId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== bookId));
  };

  const getTotalItems = () => {
    return cart.length; // Just count unique books
  };

  const scrollToBookSection = () => {
    if (bookSectionRef.current) {
      bookSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
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
          @keyframes highlightPulse {
            0%, 100% { 
              background-color: #fbbf24;
              transform: scale(1);
            }
            50% { 
              background-color: #f59e0b;
              transform: scale(1.02);
            }
          }
          .search-highlight {
            animation: highlightPulse 0.6s ease-in-out;
            transition: all 0.2s ease-in-out;
          }
          .search-highlight:hover {
            background-color: #f59e0b !important;
            transform: scale(1.05);
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
      {/* Modern Header */}
      <AppBar position="static" elevation={0} sx={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              mr: 2
            }}>
              <MenuBookIcon sx={{ 
                fontSize: 28, 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
              }} />
            </Box>
            <Typography variant="h5" component="div" sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '-0.02em'
            }}>
              Digital Library
            </Typography>
          </Box>
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
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={() => setCartOpen(true)}
              sx={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
                  transform: 'translateY(-3px) scale(1.02)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover::before': {
                  left: '100%'
                }
              }}
            >
              Reading List
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
              onClick={scrollToBookSection}
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

        {/* Global Search Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mb: 6, 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: 4,
            border: '1px solid rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.1)'
          }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              mr: 2
            }}>
              <SearchIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" component="h2" sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                letterSpacing: '-0.02em',
                mb: 0.5
              }}>
                Search Books
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#64748b', 
                fontSize: '0.95rem'
              }}>
                Find books by title, author, publication year, or description
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              placeholder={
                searchType === 'year' ? 'Enter publication year (e.g., 2020)' :
                searchType === 'author' ? 'Enter author name' :
                'Search by title, author, year, or description...'
              }
              value={globalSearchQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#64748b', mr: 1 }} />,
                endAdornment: globalSearchQuery && (
                  <IconButton
                    size="small"
                    onClick={clearGlobalSearch}
                    sx={{ p: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )
              }}
              sx={{
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  background: 'white',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['all', 'year', 'author'].map((type) => (
                <Button
                  key={type}
                  variant={searchType === type ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setSearchType(type);
                    if (globalSearchQuery) {
                      handleGlobalSearch(globalSearchQuery);
                    }
                  }}
                  sx={{
                    textTransform: 'capitalize',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    ...(searchType === type ? {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                      }
                    } : {
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: 'rgba(59, 130, 246, 0.1)'
                      }
                    })
                  }}
                >
                  {type === 'all' ? 'All Fields' : type === 'year' ? 'Year Only' : 'Author Only'}
                </Button>
              ))}
            </Box>
          </Box>

          {globalSearchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {globalSearchResults.length === 0 
                ? `No books found matching "${globalSearchQuery}"`
                : `Found ${globalSearchResults.length} book${globalSearchResults.length === 1 ? '' : 's'} matching "${globalSearchQuery}"`
              }
            </Typography>
          )}
        </Paper>

        {/* Global Search Results */}
        {globalSearchQuery && globalSearchResults.length > 0 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              mb: 6, 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 4,
              border: '1px solid rgba(59, 130, 246, 0.1)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography variant="h5" component="h3" gutterBottom sx={{ 
              fontWeight: 700,
              color: '#1e293b',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <SearchIcon sx={{ color: '#3b82f6' }} />
              Search Results
            </Typography>
            
            <Grid container spacing={3}>
              {globalSearchResults.map((book) => {
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
                  <Grid item xs={12} sm={6} md={4} key={book._id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.1)',
                          borderColor: genreColors[book.genre] || '#3b82f6',
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          image={book.coverImage}
                          alt={book.title}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover';
                            e.target.onerror = null;
                          }}
                          sx={{ 
                            height: '200px',
                            width: '100%',
                            objectFit: 'cover',
                            backgroundColor: '#f5f5f5'
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
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="h6" 
                          component="h3" 
                          sx={{ 
                            fontWeight: 'bold',
                            mb: 1,
                            fontSize: '1rem',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
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
                            fontSize: '0.9rem',
                            color: '#64748b'
                          }}
                        >
                          by {book.author}
                        </Typography>
                        
                        {book.publishedYear && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 2,
                              fontSize: '0.8rem',
                              color: '#3b82f6',
                              fontWeight: 'medium'
                            }}
                          >
                            Published: {book.publishedYear}
                          </Typography>
                        )}
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            lineHeight: 1.3,
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            color: '#64748b',
                            mb: 2
                          }}
                        >
                          {book.description}
                        </Typography>

                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => addToCart(book)}
                          fullWidth
                          sx={{
                            background: `linear-gradient(135deg, ${genreColors[book.genre]} 0%, ${genreColors[book.genre]}dd 100%)`,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1,
                            fontSize: '0.8rem',
                            boxShadow: `0 4px 12px ${genreColors[book.genre]}30`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${genreColors[book.genre]}dd 0%, ${genreColors[book.genre]}bb 100%)`,
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Add to Reading List
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}

        {globalSearchQuery && globalSearchResults.length === 0 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              mb: 6, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 4,
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Books Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No books were found matching "{globalSearchQuery}". Try a different search term or check the spelling.
            </Typography>
          </Paper>
        )}

        {/* Browse Section */}
        <Box ref={bookSectionRef} sx={{ mb: 8 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4,
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{
              p: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
              mr: 3
            }}>
              <CategoryIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h2" sx={{ 
                fontWeight: 800,
                color: '#1e293b',
                letterSpacing: '-0.02em',
                mb: 1
              }}>
                Browse by Genre
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#64748b', 
                fontSize: '1.1rem',
                lineHeight: 1.6,
                maxWidth: '600px'
              }}>
                Explore our curated collection of books organized by genre. From thrilling mysteries to heartwarming romances, 
                find your next favorite read in our diverse library.
              </Typography>
            </Box>
          </Box>
        </Box>

      {booksLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {genres.map((genre) => {
            const booksInGenre = booksByGenre[genre] || [];
            const displayBookCount = getDisplayBookCount(genre);
            const searchQuery = searchQueries[genre] || '';
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
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(135deg, ${genreColors[genre]} 0%, ${genreColors[genre]}dd 100%)`,
                      transform: 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.3s ease'
                    },
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                      border: `1px solid ${genreColors[genre]}40`,
                      '&::before': {
                        transform: 'scaleX(1)'
                      }
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Search Section */}
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={`Search ${genre} books...`}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(genre, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: '#64748b', mr: 1, fontSize: 20 }} />,
                          endAdornment: searchQuery && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSearch(genre);
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </Box>

                    {/* Genre Info Section */}
                    <Box 
                      sx={{ 
                        flexGrow: 1, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          '& .genre-icon': {
                            transform: 'scale(1.1)'
                          }
                        }
                      }}
                      onClick={() => handleGenreClick(genre)}
                    >
                      <Box
                        className="genre-icon"
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          bgcolor: genreColors[genre] || '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          transition: 'transform 0.2s ease-in-out'
                        }}
                      >
                        <MenuBookIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          mb: 1,
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          color: '#1e293b'
                        }}
                      >
                        {genre}
                      </Typography>
                      
                      <Chip 
                        label={`${displayBookCount} ${searchQuery ? 'found' : 'books'}`} 
                        sx={{ 
                          mb: 2,
                          bgcolor: genreColors[genre] || '#3b82f6',
                          color: 'white',
                          fontWeight: 'medium',
                          fontSize: '0.75rem'
                        }}
                      />
                      
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.4, mb: 2, fontSize: '0.8rem' }}>
                        {searchQuery ? 
                          (displayBookCount === 0 ? 
                            'No books found matching your search' : 
                            `${displayBookCount} book${displayBookCount === 1 ? '' : 's'} found - sorted by relevance`
                          ) :
                          booksInGenre.length === 0 ? 
                            'No books in this genre yet' : 
                            `Explore ${booksInGenre.length} book${booksInGenre.length === 1 ? '' : 's'} in this genre`
                        }
                      </Typography>
                    </Box>

                    {/* Action Button */}
                    <Button
                      variant="outlined"
                      onClick={() => handleGenreClick(genre)}
                      fullWidth
                      sx={{
                        borderColor: genreColors[genre] || '#3b82f6',
                        color: genreColors[genre] || '#3b82f6',
                        '&:hover': { 
                          borderColor: genreColors[genre] || '#3b82f6',
                          bgcolor: `${genreColors[genre] || '#3b82f6'}10`
                        },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'medium',
                        fontSize: '0.875rem',
                        py: 0.5
                      }}
                    >
                      {searchQuery ? 'View Results' : 'Browse Books'}
                    </Button>
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
          {/* Search in Dialog */}
          {selectedGenre && (booksByGenre[selectedGenre] || []).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder={`Search books in ${selectedGenre}...`}
                value={searchQueries[selectedGenre] || ''}
                onChange={(e) => handleSearchChange(selectedGenre, e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#64748b', mr: 1 }} />,
                  endAdornment: searchQueries[selectedGenre] && (
                    <IconButton
                      size="small"
                      onClick={() => clearSearch(selectedGenre)}
                    >
                      <ClearIcon />
                    </IconButton>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          )}

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
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(135deg, ${genreColors[book.genre]} 0%, ${genreColors[book.genre]}dd 100%)`,
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 0.3s ease'
                        },
                        '&:hover': {
                          transform: 'translateY(-12px) scale(1.02)',
                          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                          border: `1px solid ${genreColors[book.genre]}40`,
                          '&::before': {
                            transform: 'scaleX(1)'
                          }
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
                              {highlightText(book.title, searchQueries[selectedGenre])}
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
                              by {highlightText(book.author, searchQueries[selectedGenre])}
                            </Typography>
                            {book.publishedYear && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mb: 1,
                                  fontSize: '0.75rem',
                                  color: '#3b82f6',
                                  fontWeight: 'medium',
                                  height: '1rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Published: {book.publishedYear}
                              </Typography>
                            )}
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
                            {highlightText(book.description, searchQueries[selectedGenre])}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => addToCart(book)}
                          fullWidth
                          sx={{
                            background: `linear-gradient(135deg, ${genreColors[book.genre]} 0%, ${genreColors[book.genre]}dd 100%)`,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5,
                            height: '44px',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            boxShadow: `0 8px 25px ${genreColors[book.genre]}30`,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${genreColors[book.genre]}dd 0%, ${genreColors[book.genre]}bb 100%)`,
                              boxShadow: `0 12px 35px ${genreColors[book.genre]}40`,
                              transform: 'translateY(-2px) scale(1.02)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: 'left 0.5s'
                            },
                            '&:hover::before': {
                              left: '100%'
                            }
                          }}
                        >
                          Add to Reading List
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
          sx: { 
            minHeight: '60vh',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              mr: 2
            }}>
              <ShoppingCartIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" component="h2" sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Your Reading List ({getTotalItems()} books)
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setCartOpen(false)} 
            size="small"
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {cart.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your reading list is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some books to your reading list!
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
                      {item.publishedYear && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Published: {item.publishedYear}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Genre: {item.genre}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item._id)}
                          startIcon={<DeleteIcon />}
                        >
                          Remove from List
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
          <DialogActions sx={{ p: 3, pt: 0, background: 'rgba(59, 130, 246, 0.02)' }}>
            <Button 
              onClick={() => setCart([])} 
              variant="outlined" 
              color="error"
              startIcon={<DeleteIcon />}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': {
                  borderColor: '#dc2626',
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Clear Reading List
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
                    © 2025 Book Library. All rights reserved.
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