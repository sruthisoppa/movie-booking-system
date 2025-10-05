'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cinemaAPI, movieAPI, type Cinema, type Movie } from '@/lib/api';
import { Building2, MapPin, Film, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminCinemaMoviesPage() {
  const params = useParams();
  const router = useRouter();
  const cinemaId = parseInt(params.cinemaId as string);
  
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(cinemaId)) return;
    loadData();
  }, [cinemaId]);

  const loadData = async () => {
    try {
      const [cinemaRes, moviesRes] = await Promise.all([
        cinemaAPI.getById(cinemaId),
        movieAPI.getAll()
      ]);
      setCinema(cinemaRes.data);
      setMovies(moviesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movieId: number) => {
    router.push(`/admin/cinema/${cinemaId}/movie/${movieId}`);
  };

  const handleBack = () => {
    router.push('/admin/cinemas');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-white hover:bg-red-600 border border-gray-300 hover:border-red-600 rounded-lg transition-all duration-300 font-medium group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back to Cinemas
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Select Movie</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Building2 size={16} className="mr-2 text-red-500" />
                <span className="font-medium">{cinema?.name}</span>
                <span className="mx-2">•</span>
                <MapPin size={14} className="mr-1" />
                {cinema?.location}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleMovieClick(movie.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="aspect-[3/4] bg-gray-200 relative">
                <img
                  src={movie.poster_url || 'https://via.placeholder.com/300x400?text=No+Image'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image';
                  }}
                />
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                  {movie.title}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      {movie.duration} min
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      {movie.genre.split(',')[0]}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500">View Shows</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-12">
            <Film size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Movies Found</h3>
            <p className="text-gray-600">Add movies to create shows for this cinema.</p>
          </div>
        )}
      </div>
    </div>
  );
}