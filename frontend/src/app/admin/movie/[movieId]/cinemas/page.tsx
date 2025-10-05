'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { movieAPI, cinemaAPI, type Movie, type Cinema } from '@/lib/api';
import { Film, Building2, MapPin, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function AdminMovieCinemasPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = parseInt(params.movieId as string);
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(movieId)) {
      setError('Invalid movie ID');
      setLoading(false);
      return;
    }
    loadData();
  }, [movieId]);

  const loadData = async () => {
    try {
      setError(null);
      
      // Get all movies and find the specific one
      const moviesResponse = await movieAPI.getAll();
      const foundMovie = moviesResponse.data.find((m: Movie) => m.id === movieId);
      
      if (!foundMovie) {
        setError('Movie not found');
        setLoading(false);
        return;
      }
      
      setMovie(foundMovie);

      // Get all cinemas
      const cinemasResponse = await cinemaAPI.getAll();
      setCinemas(cinemasResponse.data);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCinemaClick = (cinemaId: number) => {
    router.push(`/admin/cinema/${cinemaId}/movie/${movieId}`);
  };

  const handleBack = () => {
    router.push('/admin/movies');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading cinemas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={handleBack}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-white hover:bg-red-600 border border-gray-300 hover:border-red-600 rounded-lg transition-all duration-300 font-medium group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back to Movies
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Select Cinema</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Film size={16} className="mr-2 text-red-500" />
                <span className="font-medium">{movie?.title}</span>
                <span className="mx-2">•</span>
                <Clock size={14} className="mr-1" />
                {movie?.duration} min
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Movie Info */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={movie?.poster_url || 'https://via.placeholder.com/300x400?text=No+Image'}
              alt={movie?.title}
              className="w-20 h-28 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image';
              }}
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{movie?.title}</h2>
              <p className="text-gray-600 mt-1 line-clamp-2">{movie?.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">{movie?.genre}</span>
                <span>{movie?.duration} minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cinemas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              onClick={() => handleCinemaClick(cinema.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Building2 className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg group-hover:text-red-600 transition-colors">
                      {cinema.name}
                    </h3>
                    <p className="text-gray-600 text-sm flex items-center mt-1">
                      <MapPin size={14} className="mr-1" />
                      {cinema.location}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 group-hover:text-red-600 transition-colors" />
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                  View Shows
                </span>
              </div>
            </div>
          ))}
        </div>

        {cinemas.length === 0 && (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cinemas Found</h3>
            <p className="text-gray-600">Add cinemas to create shows for this movie.</p>
          </div>
        )}
      </div>
    </div>
  );
}