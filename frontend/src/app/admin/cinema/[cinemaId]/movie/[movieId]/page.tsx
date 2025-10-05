'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showAPI, cinemaAPI, movieAPI, type Show, type Cinema, type Movie } from '@/lib/api';
import { Calendar, Clock, MapPin, ChevronLeft, Film, ScreenShare } from 'lucide-react';

export default function AdminCinemaMovieShowsPage() {
  const params = useParams();
  const router = useRouter();
  const cinemaId = parseInt(params.cinemaId as string);
  const movieId = parseInt(params.movieId as string);
  
  const [shows, setShows] = useState<Show[]>([]);
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(cinemaId) || isNaN(movieId)) {
      setError('Invalid cinema or movie ID');
      setLoading(false);
      return;
    }
    loadData();
  }, [cinemaId, movieId]);

  const loadData = async () => {
    try {
      // Get cinema data
      const cinemasResponse = await cinemaAPI.getAll();
      const foundCinema = cinemasResponse.data.find((c: Cinema) => c.id === cinemaId);
      
      if (!foundCinema) {
        setError('Cinema not found');
        setLoading(false);
        return;
      }
      setCinema(foundCinema);

      // Get movie data
      const moviesResponse = await movieAPI.getAll();
      const foundMovie = moviesResponse.data.find((m: Movie) => m.id === movieId);
      
      if (!foundMovie) {
        setError('Movie not found');
        setLoading(false);
        return;
      }
      setMovie(foundMovie);

      // Get shows data
      const showsResponse = await showAPI.getShows(cinemaId, movieId);
      setShows(showsResponse.data);
      
    } catch (error) {
      console.error('Error loading shows:', error);
      setError('Failed to load shows data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    router.push(`/admin/cinema/${cinemaId}/movies`);
  };

  const handleShowClick = (showId: number) => {
    // Navigate directly to seat view
    router.push(`/admin/show/${showId}/seats`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading shows...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Select Show</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Film size={16} className="mr-2 text-red-500" />
                <span className="font-medium">{movie?.title}</span>
                <span className="mx-2">•</span>
                <MapPin size={14} className="mr-1" />
                {cinema?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Movie Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={movie?.poster_url || 'https://via.placeholder.com/300x400?text=No+Image'}
              alt={movie?.title}
              className="w-16 h-24 object-cover rounded-lg"
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{movie?.title}</h2>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  {movie?.duration} min
                </div>
                <div className="flex items-center">
                  <Film size={14} className="mr-1" />
                  {movie?.genre}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shows List */}
        {shows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <ScreenShare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No shows found</h3>
            <p className="text-gray-600">There are no shows available for this movie at the selected cinema.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shows.map((show) => (
              <div
                key={show.id}
                onClick={() => handleShowClick(show.id)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatTime(show.start_time)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(show.start_time)}
                      </div>
                    </div>
                    <div className="border-l border-gray-200 pl-6">
                      <div className="font-semibold text-gray-900">Screen {show.screen_name}</div>
                      <div className="text-sm text-gray-600 mt-1">₹{show.price} per seat</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Click to view</div>
                    <div className="font-semibold text-blue-600 group-hover:text-blue-700">
                      View Seat Occupancy
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}