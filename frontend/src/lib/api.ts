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
export const bookingAPI = {
  create: (data: any) => api.post('/bookings', data),
  getUserBookings: (userId: number) => api.get(`/bookings/user/${userId}`),
};

export const userAPI = {
  create: (data: any) => api.post('/users', data),
  getDemoUser: () => api.get('/users/demo'),
};