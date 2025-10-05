// app/admin/movies/page.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { Movie, adminAPI, movieAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Add inside your component

export default function MoviesManagement() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    genre: '',
    poster_url: ''
  });

  useEffect(() => {
    loadMovies();
  }, []);

const loadMovies = async () => {
  try {
    setLoading(true);
    
    // Direct API call to get movies
    const response = await adminAPI.getAllMovies();
    console.log('API Response:', response.data);
    
    // Response.data should be the array directly
    if (Array.isArray(response.data)) {
      setMovies(response.data);
    } else {
      console.error('Unexpected response format:', response.data);
      setMovies([]);
    }
  } catch (error: any) {
    console.error('Failed to load movies:', error.message);
    
    // If API fails, show empty state
    setMovies([]);
    alert('Failed to load movies. Make sure your backend server is running on port 5000.');
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const movieData = {
        ...formData,
        duration: parseInt(formData.duration)
      };

      if (editingMovie) {
        await adminAPI.updateMovie(editingMovie.id, movieData);
      } else {
        await adminAPI.createMovie(movieData);
      }
      
      setShowForm(false);
      setEditingMovie(null);
      setFormData({ title: '', description: '', duration: '', genre: '', poster_url: '' });
      loadMovies();
    } catch (error) {
      console.error('Failed to save movie:', error);
      alert('Failed to save movie');
    }
  };
  const handleViewShows = (movieId: number) => {
  router.push(`/admin/movie/${movieId}/cinemas`);
};
  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      duration: movie.duration.toString(),
      genre: movie.genre,
      poster_url: movie.poster_url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;
    
    try {
      await adminAPI.deleteMovie(id);
      loadMovies();
    } catch (error) {
      console.error('Failed to delete movie:', error);
      alert('Failed to delete movie');
    }
  };

 const filteredMovies = Array.isArray(movies) ? movies.filter(movie =>
  movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
) : [];

  if (loading) return <div className="flex justify-center p-8">Loading movies...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Movies Management</h1>
        <p className="text-gray-600 mt-1">Click the eye icon to view cinemas and shows for each movie</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Movie
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Movie Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingMovie ? 'Edit Movie' : 'Add New Movie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                rows={3}
                required
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                required
              />
              <input
                type="url"
                placeholder="Poster URL"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMovie(null);
                    setFormData({ title: '', description: '', duration: '', genre: '', poster_url: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMovie ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovies.map((movie) => (
          <div key={movie.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <img
              src={movie.poster_url || '/placeholder-movie.jpg'}
              alt={movie.title}
              className="w-full h-48 object-cover "
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
              }}
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 text-gray-600">{movie.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{movie.genre}</p>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{movie.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{movie.duration} min</span>
                <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewShows(movie.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="View Cinemas & Shows"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                  <button
                    onClick={() => handleEdit(movie)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(movie.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No movies found
        </div>
      )}
    </div>
  );
}