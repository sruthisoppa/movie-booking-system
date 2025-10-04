'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cinemaAPI, movieAPI, type Cinema, type Movie } from '@/lib/api';
import { Play, Star, MapPin, Clock, Search, Filter, Calendar, TrendingUp } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const cinemasRef = useRef<HTMLDivElement>(null);

  const genres = ['All', 'Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Adventure', 'Romance'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortMovies();
  }, [movies, searchTerm, selectedGenre, sortBy]);

  const loadData = async () => {
    try {
      console.log('Loading home page data...');
      
      const [cinemasRes, moviesRes] = await Promise.all([
        cinemaAPI.getAll(),
        movieAPI.getAll()
      ]);

      setCinemas(cinemasRes.data);
      setMovies(moviesRes.data);
      setFilteredMovies(moviesRes.data);
      
      if (cinemasRes.data.length > 0) {
        setSelectedCinema(cinemasRes.data[0]);
      }
      
    } catch (error) {
      console.error('Error loading home page data:', error);
      setError('Failed to load data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMovies = () => {
    let filtered = [...movies];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(movie =>
        movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    // Sort movies
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
      case 'rating':
        filtered.sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }

    setFilteredMovies(filtered);
  };

  const handleBookTickets = (movie: Movie, cinemaId?: number) => {
    if (!cinemaId) {
      alert('Please select a cinema first');
      return;
    }
    router.push(`/cinema/${cinemaId}/movie/${movie.id}`);
  };

  const scrollCinemas = (direction: 'left' | 'right') => {
    if (cinemasRef.current) {
      const scrollAmount = 300;
      cinemasRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getRandomRating = () => {
    return (Math.random() * 1.5 + 3.5).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BMF</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">BookMyFilm</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-50 rounded-lg">
                <MapPin size={16} className="text-red-600" />
                <span className="font-medium">Bangalore</span>
              </div>
              
          
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Find Your Perfect Movie</h2>
          <p className="text-gray-600 text-center mb-8">Book tickets for the latest blockbusters</p>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search movies, genres, actors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Cinema Selection */}
<section className="bg-white border-b border-gray-200 py-8">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">Select Cinema</h2>
      <div className="flex space-x-2">
        <button 
          onClick={() => scrollCinemas('left')}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={() => scrollCinemas('right')}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
    
    <div 
      ref={cinemasRef}
      className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
    >
      {cinemas.map((cinema) => (
        <button
          key={cinema.id}
          onClick={() => setSelectedCinema(cinema)}
          className={`flex-shrink-0 px-6 py-4 rounded-lg border-2 transition-all ${
            selectedCinema?.id === cinema.id
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="text-left min-w-[200px]">
            <h3 className="font-semibold text-gray-900 mb-2">{cinema.name}</h3>
            <p className="text-sm text-gray-600 flex items-start">
              <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span className="text-left">{cinema.location}</span>
            </p>
          </div>
        </button>
      ))}
    </div>
  </div>
</section>

      {/* Filters and Sorting */}
<section className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      <div className="flex items-center space-x-4">
        <Filter size={18} className="text-gray-600" />
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGenre === genre
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-medium">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white text-gray-900"
        >
          <option value="popular" className="text-gray-900">Most Popular</option>
          <option value="name" className="text-gray-900">Name (A-Z)</option>
          <option value="duration" className="text-gray-900">Duration</option>
          <option value="rating" className="text-gray-900">Rating</option>
        </select>
      </div>
    </div>
  </div>
</section>

      {/* Movies Grid */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Now Showing at <span className="text-red-600">{selectedCinema?.name}</span>
            </h2>
            <p className="text-gray-600">
              {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
              {selectedGenre !== 'All' && ` in ${selectedGenre}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Trending</span>
          </div>
        </div>
        
        {filteredMovies.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No movies found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={movie.poster_url || 'https://via.placeholder.com/300x400?text=No+Image'}
                    alt={movie.title}
                    className="w-full h-72 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image';
                    }}
                  />
                  
                  <div className="absolute top-3 right-3 bg-black/90 text-white px-2 py-1 rounded text-sm font-semibold">
                    <Star size={12} className="inline mr-1 fill-yellow-400 text-yellow-400" />
                    {getRandomRating()}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                    {movie.title}
                  </h3>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Clock size={14} className="mr-2" />
                    <span>{movie.duration} min</span>
                    <span className="mx-2">•</span>
                    <span className="text-red-600 font-medium">{movie.genre.split(',')[0]}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                    {movie.description}
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleBookTickets(movie, selectedCinema?.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center font-semibold transition-colors"
                    >
                      <Play size={16} className="mr-2" />
                      Book Tickets
                    </button>
                    
                    <button 
                      className="w-12 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                      title="Add to watchlist"
                    >
                      <Calendar size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BMF</span>
              </div>
              <span className="text-xl font-bold">BookMyFilm</span>
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-400">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact Us</span>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 BookMyFilm. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}