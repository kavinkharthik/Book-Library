import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const genres = [
    'comedy', 'horror', 'romance', 'sci-fi', 'fantasy', 
    'mystery', 'thriller', 'biography', 'history', 'self-help'
  ];

  useEffect(() => {
    fetchBooks();
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
    setMessage('');

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
      setFormData({
        title: '',
        author: '',
        genre: '',
        description: '',
        coverImage: ''
      });
      fetchBooks(); // Refresh the books list
      
      // Also refresh the dashboard if it's open
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding book');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
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
        console.log('✅ Book deleted successfully');
        setMessage('Book deleted successfully!');
        setError(''); // Clear any previous errors
        fetchBooks(); // Refresh the books list
        
        // Also refresh the dashboard if it's open
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('❌ Error deleting book:', error);
        console.error('❌ Error response:', error.response);
        setError(error.response?.data?.message || 'Error deleting book');
        setMessage(''); // Clear any previous success messages
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel - Book Management
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Add Book Form - Vertical */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Book
            </Typography>
            
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
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Genre</InputLabel>
                <Select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  required
                >
                  {genres.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
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
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Book'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Books List - Horizontal */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              All Books ({books.length})
            </Typography>
            
            {books.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No books added yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#a8a8a8',
                },
              }}>
                {books.map((book) => (
                  <Card key={book._id} sx={{ 
                    minWidth: 200,
                    maxWidth: 200,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}>
                    {book.coverImage && (
                      <CardMedia
                        component="img"
                        height="120"
                        image={book.coverImage}
                        alt={book.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                      <Typography 
                        variant="subtitle2" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 'bold',
                          mb: 0.5,
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
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          mb: 0.5,
                          fontStyle: 'italic'
                        }}
                      >
                        by {book.author}
                      </Typography>
                      <Chip 
                        label={book.genre} 
                        color="primary" 
                        size="small" 
                        sx={{ mb: 0.5 }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          color: 'text.secondary',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {book.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 1, pt: 0 }}>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(book._id)}
                        size="small"
                        sx={{ 
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'white'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminPanel;
