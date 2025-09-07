import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Book as BookIcon,
  OnlinePrediction as OnlineIcon,
  Add as AddIcon,
  Close as CloseIcon,
  MenuBook as MenuBookIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

const AdminPanel = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    coverImage: ''
  });
  const [books, setBooks] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeUsersLoading, setActiveUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreBooks, setGenreBooks] = useState([]);
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false);
  const [selectedGenreForAdd, setSelectedGenreForAdd] = useState('');
  const [searchQueries, setSearchQueries] = useState({});
  const [filteredBooks, setFilteredBooks] = useState({});

  const genres = [
    'comedy', 'horror', 'romance', 'sci-fi', 'fantasy', 
    'mystery', 'biography', 'history'
  ];

  useEffect(() => {
    fetchBooks();
    fetchUsers();
    fetchActiveUsers();
    
    // Set up auto-refresh for active users every 30 seconds
    const activeUsersInterval = setInterval(() => {
      fetchActiveUsers();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(activeUsersInterval);
    };
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books', {
        withCredentials: true
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log('📤 Fetching users from API...');
      const response = await axios.get('http://localhost:5000/api/users', {
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });
      console.log('📥 Users response:', response.data);
      setUsers(response.data);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        setError('Backend server is not running. Please start the backend server first.');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in as admin.');
      } else if (error.response?.status === 403) {
        setError('Admin access required to view users.');
      } else if (error.response?.status === 404) {
        setError('Users API endpoint not found. Please check server configuration.');
      } else {
        setError(`Failed to fetch users: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    setActiveUsersLoading(true);
    try {
      console.log('🟢 Fetching active users from API...');
      const response = await axios.get('http://localhost:5000/api/users/active', {
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });
      console.log('🟢 Active users response:', response.data);
      setActiveUsers(response.data);
    } catch (error) {
      console.error('❌ Error fetching active users:', error);
      // Don't set error state for active users as it's not critical
    } finally {
      setActiveUsersLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Group books by genre
  const booksByGenre = books.reduce((acc, book) => {
    if (!acc[book.genre]) {
      acc[book.genre] = [];
    }
    acc[book.genre].push(book);
    return acc;
  }, {});

  const handleGenreClick = (genre) => {
    const booksInGenre = getDisplayBooks(genre);
    setSelectedGenre(genre);
    setGenreBooks(booksInGenre);
  };

  const handleCloseGenreDialog = () => {
    setSelectedGenre(null);
    setGenreBooks([]);
  };

  const handleAddBookToGenre = (genre) => {
    setSelectedGenreForAdd(genre);
    setFormData({
      ...formData,
      genre: genre
    });
    setAddBookDialogOpen(true);
  };

  const handleCloseAddBookDialog = () => {
    setAddBookDialogOpen(false);
    setSelectedGenreForAdd('');
    setFormData({
      title: '',
      author: '',
      genre: '',
      description: '',
      coverImage: ''
    });
  };

  // Search functionality with ranking
  const getSearchScore = (book, query) => {
    if (!query || !book) return 0;
    
    const searchTerm = query.toLowerCase();
    const title = book.title.toLowerCase();
    const author = book.author.toLowerCase();
    const description = book.description.toLowerCase();
    
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
      book.description.toLowerCase().includes(query.toLowerCase())
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsAddingBook(true);

    try {
      console.log('📤 Sending book data:', formData);
      const response = await axios.post('http://localhost:5000/api/books', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('📥 Book creation response:', response.data);

      setMessage('Book added successfully!');
      setShowSuccessAlert(true);
      
      // Reset form for next book
      setFormData({
        title: '',
        author: '',
        genre: selectedGenreForAdd, // Keep the genre selected
        description: '',
        coverImage: ''
      });

      // Close the dialog
      setAddBookDialogOpen(false);
      
      // Refresh books data after 2 seconds
      setTimeout(() => {
        fetchBooks();
        setShowSuccessAlert(false);
        setMessage('');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding book');
      setMessage(''); // Clear success message
    } finally {
      setIsAddingBook(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      setIsDeletingBook(true);
      
      // Optimistic update - remove book from UI immediately
      const bookToDelete = books.find(book => book._id === bookId);
      setBooks(prevBooks => prevBooks.filter(book => book._id !== bookId));
      
      // Update genre books if dialog is open
      if (selectedGenre && genreBooks.length > 0) {
        setGenreBooks(prevGenreBooks => prevGenreBooks.filter(book => book._id !== bookId));
      }
      
      setMessage('Book deleted successfully!');
      setShowSuccessAlert(true);
      setError(''); // Clear any previous errors
      
      try {
        console.log('🗑️ Deleting book with ID:', bookId);
        console.log('🗑️ Current user from localStorage:', localStorage.getItem('user'));
        
        await axios.delete(`http://localhost:5000/api/books/${bookId}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('✅ Book deleted successfully from server');
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setShowSuccessAlert(false);
          setMessage('');
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error deleting book:', error);
        console.error('❌ Error response:', error.response);
        
        // Revert optimistic update on error
        if (bookToDelete) {
          setBooks(prevBooks => [...prevBooks, bookToDelete].sort((a, b) => a.title.localeCompare(b.title)));
          
          // Revert genre books if dialog is open
          if (selectedGenre && genreBooks.length > 0) {
            setGenreBooks(prevGenreBooks => [...prevGenreBooks, bookToDelete].sort((a, b) => a.title.localeCompare(b.title)));
          }
        }
        
        setError(error.response?.data?.message || 'Error deleting book');
        setMessage(''); // Clear any previous success messages
        setShowSuccessAlert(false);
      } finally {
        setIsDeletingBook(false);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <style>
        {`
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
        `}
      </style>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>

      {message && showSuccessAlert && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            fontSize: '1rem',
            fontWeight: 'medium',
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setShowSuccessAlert(false);
                setMessage('');
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BookIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            {message}
          </Box>
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            fontSize: '1rem',
            fontWeight: 'medium'
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError('')}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {isAddingBook && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            fontSize: '1rem',
            fontWeight: 'medium'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            Adding book... Please wait
          </Box>
        </Alert>
      )}

      {isDeletingBook && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            fontSize: '1rem',
            fontWeight: 'medium'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            Deleting book... Please wait
          </Box>
        </Alert>
      )}

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            icon={<BookIcon />} 
            label="Book Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<PersonIcon />} 
            label="User Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<OnlineIcon />} 
            label="Active Users" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>

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
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        borderColor: genreColors[genre] || '#3b82f6',
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
                          InputProps={{
                            startAdornment: <SearchIcon sx={{ color: '#64748b', mr: 1, fontSize: 20 }} />,
                            endAdornment: searchQuery && (
                              <IconButton
                                size="small"
                                onClick={() => clearSearch(genre)}
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
                              `Manage ${booksInGenre.length} book${booksInGenre.length === 1 ? '' : 's'} in this genre`
                          }
                        </Typography>
                      </Box>

                      {/* Action Buttons */}
                      <Stack spacing={1}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddBookToGenre(genre);
                          }}
                          fullWidth
                          sx={{
                            bgcolor: genreColors[genre] || '#3b82f6',
                            '&:hover': { 
                              bgcolor: genreColors[genre] || '#3b82f6',
                              filter: 'brightness(0.9)'
                            },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium',
                            fontSize: '0.875rem',
                            py: 0.5
                          }}
                        >
                          Add Book
                        </Button>

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
                          {searchQuery ? 'View Results' : 'Manage Books'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* User Management Tab */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            User Management
          </Typography>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 1, color: '#3b82f6' }} />
              <Typography variant="h6">
                Registered Users ({users.length})
              </Typography>
            </Box>

            {usersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
                <Typography variant="h6" color="error" gutterBottom>
                  Error Loading Users
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {error}
                </Typography>
                {error.includes('Backend server is not running') && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      To start the backend server:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', bgcolor: '#1f2937', color: '#f9fafb', p: 1, borderRadius: 0.5 }}>
                      1. Open terminal in the backend directory<br/>
                      2. Run: <strong>node server.js</strong><br/>
                      3. Make sure MongoDB is running
                    </Typography>
                  </Box>
                )}
                <Button
                  variant="contained"
                  onClick={fetchUsers}
                  sx={{
                    bgcolor: '#3b82f6',
                    '&:hover': { bgcolor: '#2563eb' }
                  }}
                >
                  Retry
                </Button>
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No users found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Users will appear here once they register
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Registration Date</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: '#3b82f6' }}>
                              {user.googleName ? user.googleName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {user.googleName || user.username}
                              </Typography>
                              {user.googleName && (
                                <Typography variant="caption" color="text.secondary">
                                  Google User
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ mr: 1, fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                            label={user.role}
                            color={user.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ mr: 1, fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(user.createdAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ mr: 1, fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </Typography>
                          </Box>
                          {user.lastLogin && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(user.lastLogin).toLocaleTimeString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.lastLogin ? 'Active' : 'Inactive'}
                            color={user.lastLogin ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* Active Users Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Currently Signed-In Users
          </Typography>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <OnlineIcon sx={{ mr: 1, color: '#10b981' }} />
              <Typography variant="h6">
                Active Users ({activeUsers.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={fetchActiveUsers}
                disabled={activeUsersLoading}
                sx={{ ml: 'auto' }}
              >
                {activeUsersLoading ? <CircularProgress size={16} /> : 'Refresh'}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Users who have logged in within the last 30 minutes
            </Typography>

            {activeUsersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : activeUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <OnlineIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Active Users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No users have logged in recently
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeUsers.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: '#10b981' }}>
                              {user.googleName ? user.googleName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {user.googleName || user.username}
                              </Typography>
                              {user.googleName && (
                                <Typography variant="caption" color="text.secondary">
                                  Google User
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ mr: 1, fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                            label={user.role}
                            color={user.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ mr: 1, fontSize: 16, color: '#64748b' }} />
                            <Typography variant="body2">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(user.lastLogin).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<OnlineIcon />}
                            label="Online"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
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
              {selectedGenre} Books Management
              {searchQueries[selectedGenre] && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: '#64748b' }}>
                  ({getMatchingBooksCount(selectedGenre, searchQueries[selectedGenre])} found - sorted by relevance)
                </Typography>
              )}
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Add the first book to this genre
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAddBookToGenre(selectedGenre)}
                sx={{
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                Add First Book
              </Button>
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
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover';
                            e.target.onerror = null;
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
                          color="error"
                          startIcon={isDeletingBook ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <DeleteIcon />}
                          onClick={() => handleDelete(book._id)}
                          disabled={isDeletingBook}
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium',
                            py: 1,
                            height: '40px',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              bgcolor: '#dc2626',
                              filter: 'brightness(0.9)'
                            },
                            '&:disabled': {
                              bgcolor: '#9ca3af'
                            }
                          }}
                        >
                          {isDeletingBook ? 'Deleting...' : 'Delete Book'}
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
          <Button 
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAddBookToGenre(selectedGenre)}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Add New Book
          </Button>
          <Button onClick={handleCloseGenreDialog} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Book Dialog */}
      <Dialog 
        open={addBookDialogOpen} 
        onClose={handleCloseAddBookDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h5" component="h2">
            Add Book to {selectedGenreForAdd ? selectedGenreForAdd.charAt(0).toUpperCase() + selectedGenreForAdd.slice(1) : ''} Genre
          </Typography>
          <IconButton onClick={handleCloseAddBookDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              multiline
              rows={4}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Cover Image URL (Optional)"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseAddBookDialog} variant="outlined">
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isAddingBook}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              '&:disabled': { bgcolor: '#9ca3af' }
            }}
          >
            {isAddingBook ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                Adding...
              </Box>
            ) : (
              'Add Book'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
