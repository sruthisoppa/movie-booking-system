'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showAPI, cinemaAPI, movieAPI, type Show, type Cinema, type Movie } from '@/lib/api';
import { Calendar, Clock, MapPin, ChevronLeft, Film, Filter, X, ScreenShare } from 'lucide-react';

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
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedScreen, setSelectedScreen] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');

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
    }).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get unique dates
  const uniqueDates = [...new Set(shows.map(show => 
    new Date(show.start_time).toDateString()
  ))];

  // Get unique screens
  const uniqueScreens = [...new Set(shows.map(show => show.screen_name))];

  // Get unique formats (mock data - you can replace with actual format data)
  const formats = ['2D', '3D', 'IMAX', 'Dolby Atmos', '4DX'];

  // Filter shows based on selected filters
  const filteredShows = shows.filter(show => {
    const showDate = new Date(show.start_time).toDateString();
    
    if (selectedDate && showDate !== selectedDate) return false;
    if (selectedScreen && show.screen_name !== selectedScreen) return false;
    
    return true;
  });

  // Group shows by screen
  const showsByScreen = filteredShows.reduce((acc, show) => {
    if (!acc[show.screen_name]) {
      acc[show.screen_name] = [];
    }
    acc[show.screen_name].push(show);
    return acc;
  }, {} as Record<string, Show[]>);

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedScreen('');
    setSelectedFormat('');
  };

  const hasActiveFilters = selectedDate || selectedScreen || selectedFormat;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading showtimes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-800 hover:text-white hover:bg-red-600 border border-gray-300 hover:border-red-600 rounded-lg transition-all duration-300 font-semibold group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{movie?.title}</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <MapPin size={16} className="mr-2 text-red-400" />
                <span className="font-medium">{cinema?.name}</span>
                <span className="mx-2">•</span>
                <span>{cinema?.location}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Movie Info Card */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <img
              src={movie?.poster_url || 'https://via.placeholder.com/300x400?text=No+Image'}
              alt={movie?.title}
              className="w-16 h-20 object-cover rounded-lg shadow-sm"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image';
              }}
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
                  {movie?.genre?.split(',')[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Top Filters Bar */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          {/* Left Side - Date Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-red-600" />
              <span className="font-semibold text-gray-900">Date:</span>
            </div>
            <div className="flex gap-2">
              {uniqueDates.slice(0, 5).map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date === selectedDate ? '' : date)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium min-w-[100px] ${
                    selectedDate === date
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Format Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Format:</span>
            </div>
            <div className="flex gap-2">
              {formats.slice(0, 3).map(format => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format === selectedFormat ? '' : format)}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition-all duration-200 ${
                    selectedFormat === format
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <span className="font-semibold text-gray-900 text-sm">Active Filters:</span>
            <div className="flex gap-2">
              {selectedDate && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {formatDate(selectedDate)}
                  <button onClick={() => setSelectedDate('')} className="hover:text-red-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedScreen && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Screen {selectedScreen}
                  <button onClick={() => setSelectedScreen('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedFormat && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {selectedFormat}
                  <button onClick={() => setSelectedFormat('')} className="hover:text-green-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-red-600 font-medium underline"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Screen-wise Show Times */}
        {filteredShows.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <ScreenShare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No shows found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              {hasActiveFilters 
                ? "No showtimes match your selected filters. Try adjusting your filters."
                : "There are no showtimes available for this movie at the selected cinema."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(showsByScreen).map(([screenName, screenShows]) => (
              <div key={screenName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Screen Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-lg">Screen {screenName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">2K</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Dolby</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Available Shows</div>
                      <div className="font-semibold text-gray-900">{screenShows.length} showtimes</div>
                    </div>
                  </div>
                </div>
                
                {/* Show Times Grid */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-4">
                    {screenShows.map((show) => (
                      <div
                        key={show.id}
                        className="group relative"
                      >
                        <button
                          onClick={() => router.push(`/show/${show.id}/seats`)}
                          className="bg-white border-2 border-gray-300 hover:border-red-400 rounded-xl px-6 py-4 text-center transition-all duration-200 hover:shadow-lg hover:scale-105 min-w-[120px] group"
                        >
                          {/* Time */}
                          <div className="text-lg font-bold text-gray-900 mb-1">
                            {formatTime(show.start_time)}
                          </div>
                          
                          {/* Format Badge */}
                          <div className="text-xs text-gray-500 mb-2">
                            {formats[0]} {/* Using first format for demo */}
                          </div>
                          
                          {/* Price - Hidden by default, shown on hover */}
                          <div className="text-sm font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            ₹{show.price}
                          </div>
                        </button>
                        
                        {/* Hover Tooltip with Price */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                          <div className="font-semibold">₹{show.price} per ticket</div>
                          <div className="text-xs text-gray-300 mt-1">Click to select seats</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Calendar size={18} className="mr-2" />
            Booking Information
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Please arrive 20 minutes before the showtime</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Carry a valid ID proof for verification</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Tickets are non-refundable and non-transferable</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Children under 3 years enter free (without seat)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}