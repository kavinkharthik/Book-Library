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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Book as BookIcon,
  OnlinePrediction as OnlineIcon
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeUsersLoading, setActiveUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
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
        Admin Panel
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
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Book Management
          </Typography>

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
              <Grid container spacing={2}>
                {books.map((book) => (
                  <Grid item xs={12} sm={6} key={book._id}>
                    <Card sx={{ 
                      height: '350px',
                      width: '100%',
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
                        image={book.coverImage}
                        alt={book.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover';
                          e.target.onerror = null; // Prevent infinite loop
                        }}
                        sx={{ 
                          height: '200px',
                          width: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          backgroundColor: '#f5f5f5',
                          display: 'block'
                        }}
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
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
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
    </Container>
  );
};

export default AdminPanel;
