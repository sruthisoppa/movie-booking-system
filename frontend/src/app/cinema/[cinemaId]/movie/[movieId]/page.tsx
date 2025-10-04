'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showAPI, cinemaAPI, movieAPI, type Show, type Cinema, type Movie } from '@/lib/api';
import { Calendar, Clock, MapPin, ChevronLeft } from 'lucide-react';

export default function MovieShowsPage() {
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
      console.log('Loading data for cinema:', cinemaId, 'movie:', movieId);
      
      // Get cinema data
      const cinemaResponse = await cinemaAPI.getAll();
      const foundCinema = cinemaResponse.data.find(c => c.id === cinemaId);
      
      if (!foundCinema) {
        setError('Cinema not found');
        setLoading(false);
        return;
      }
      
      setCinema(foundCinema);

      // Get movie data
      const movieResponse = await movieAPI.getAll();
      const foundMovie = movieResponse.data.find(m => m.id === movieId);
      
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
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-red-600"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-primary"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary">{movie?.title}</h1>
              <p className="text-gray-600 flex items-center">
                <MapPin size={16} className="mr-1" />
                {cinema?.name} • {cinema?.location}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Show Dates */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <Calendar size={20} className="mr-2" />
            Select Date & Time
          </h2>
          
          {shows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No shows available for this movie at the selected cinema.
            </div>
          ) : (
            <div className="space-y-4">
              {shows.map((show) => (
                <div key={show.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(show.start_time)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(show.start_time)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock size={14} className="mr-1" />
                        {formatTime(show.start_time)} - {formatTime(show.end_time)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {show.screen_name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">₹{show.price}</div>
                      <div className="text-xs text-gray-500">per ticket</div>
                    </div>
                    <button
                      onClick={() => router.push(`/show/${show.id}/seats`)}
                      className="bg-secondary hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Select Seats
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}