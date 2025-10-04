import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Cinema {
  id: number;
  name: string;
  location: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration: number;
  genre: string;
  poster_url: string;
}

export interface Show {
  id: number;
  start_time: string;
  end_time: string;
  price: number;
  screen_name: string;
  cinema_name: string;
  movie_title: string;
}

export interface Seat {
  id: number;
  seat_number: string;
  seat_row: number;
  seat_column: number;
  status: 'available' | 'booked' | 'blocked';
}

export interface Booking {
  id?: string | number;
  _id?: string | number;
  bookingId?: string | number;
  showId: number;
  seatNumbers: string[]; // This will come from 'seats' field
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  movie_title?: string;
  cinema_name?: string;
  start_time?: string;
  // Add fields from your backend response
  seats?: string; // This is the GROUP_CONCAT result
  poster_url?: string;
  end_time?: string;
  booking_time?: string;
}


// API methods
export const cinemaAPI = {
  getAll: () => api.get<Cinema[]>('/cinemas'),
  getById: (cinemaId: number) => api.get<Cinema>(`/cinemas/${cinemaId}`), // Add this method
  getMovies: (cinemaId: number) => api.get<Movie[]>(`/cinemas/${cinemaId}/movies`),
};

export const movieAPI = {
  getAll: () => api.get<Movie[]>('/movies'),
  getById: (movieId: number) => api.get<Movie>(`/movies/${movieId}`),
};

export const showAPI = {
  getShows: (cinemaId?: number, movieId?: number) => 
    api.get<Show[]>('/shows', { params: { cinemaId, movieId } }),
  getShow: (showId: number) => api.get<Show>(`/shows/${showId}`),
};

export const seatAPI = {
  getSeats: (showId: number) => api.get<Seat[]>(`/seats/show/${showId}`),
};
//export const bookingAPI = {
 // create: (data: any) => api.post('/bookings', data),
  //getUserBookings: (userId: number) => api.get(`/bookings/user/${userId}`),
//};

export const userAPI = {
  create: (data: { name: string; email: string; password: string }) => api.post('/users', data),
  getDemoUser: () => api.get('/users/demo'),
};
// frontend/src/lib/api.ts
// In your api.ts file
// Request interceptor to add token
// Response interceptor to handle auth errors automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only run in client-side
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
// Add JWT token to all requests
// Add JWT token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const bookingAPI = {
  create: (bookingData: {
    showId: number;
    seatNumbers: string[];
    totalAmount: number;
  }): Promise<{ data: { message: string; booking: Booking } }> => 
    api.post('/bookings', bookingData),

  getBooking: (bookingId: string): Promise<{ data: { booking: Booking } }> => 
    api.get(`/bookings/${bookingId}`),

  getUserBookings: (): Promise<{ data: Booking[] }> => 
    api.get('/bookings/my-bookings').then(response => {
      // Transform the backend response { bookings: [...] } to { data: [...] }
      return {
        data: response.data.bookings || response.data || []
      };
    }),
};
export default api;