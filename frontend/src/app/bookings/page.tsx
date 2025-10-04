'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { bookingAPI, type Booking } from '@/lib/api';
import { ChevronLeft, Ticket, Calendar, Clock, MapPin } from 'lucide-react';

interface BookingWithDetails extends Booking {
  movie_title?: string;
  cinema_name?: string;
  start_time?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view your bookings');
        router.push('/login?redirect=/bookings');
        return;
      }

      const response = await bookingAPI.getUserBookings();
      
      // Handle different possible response formats
      let bookingsData: unknown[] = [];
      if (Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (Array.isArray(data.bookings)) {
          bookingsData = data.bookings as unknown[];
        } else if (Array.isArray(data.data)) {
          bookingsData = data.data as unknown[];
        }
      }
      
      console.log('Bookings data:', bookingsData);

      const formattedBookings = bookingsData.map((b) => {
        const booking = b as Record<string, unknown>;
        const rawId = booking['id'] ?? booking['_id'];
        const id = rawId as string | number | undefined;
        const bookingId = (booking['bookingId'] as string | number | undefined) || (id ? `BK${String(id).padStart(3, '0')}` : undefined);
        const showId = (booking['show_id'] as number | undefined) || (booking['showId'] as number | undefined) || 0;
        const seatsField = booking['seats'];
        const seatNumbers = seatsField ? String(seatsField).split(',') : ((booking['seatNumbers'] as string[] | undefined) ?? []);
        const totalAmount = (booking['total_amount'] as number | undefined) ?? (booking['totalAmount'] as number | undefined) ?? 0;
        const status = (booking['status'] as BookingWithDetails['status']) ?? 'pending';
        return {
          id,
          bookingId,
          showId,
          seatNumbers,
          totalAmount,
          status,
          movie_title: booking['movie_title'] as string | undefined,
          cinema_name: booking['cinema_name'] as string | undefined,
          start_time: booking['start_time'] as string | undefined,
          poster_url: booking['poster_url'] as string | undefined,
          end_time: booking['end_time'] as string | undefined,
          booking_time: booking['booking_time'] as string | undefined,
        } as BookingWithDetails;
      });

      setBookings(formattedBookings);
    } catch (err: unknown) {
      console.error('Error loading bookings:', err);
      const axiosErr = err as import('axios').AxiosError;
      if (axiosErr?.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login?redirect=/bookings');
      } else {
        setError('Failed to load your bookings');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

// ...existing code...

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return {
        date: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        shortDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      };
    } catch {
      return { date: 'Invalid date', time: '', shortDate: 'Invalid date' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-800 hover:text-red hover:bg-primary border border-gray-600 hover:border-primary rounded-lg transition-all duration-300 font-semibold group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-700 text-sm font-medium">
                  {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700 font-medium">Total Bookings</div>
              <div className="font-semibold text-gray-900">{bookings.length}</div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {bookings.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Found</h2>
            <p className="text-gray-600 mb-6 font-medium">
              You haven&apos;t made any bookings yet.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              Book Your First Ticket
            </button>
          </div>
        ) : (
          // Bookings List
          <div className="space-y-6">
            {bookings.map((booking) => {
              const displayId = booking.bookingId || booking.id || booking._id || 'N/A';
              const { date, time, shortDate } = formatDateTime(booking.start_time || new Date().toISOString());
              
              return (
                <div key={displayId} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {booking.movie_title || `Movie #${booking.showId}`}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {booking.cinema_name || 'Cinema'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {shortDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {time}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                      {booking.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Booking Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">Booking ID:</span>
                        <span className="font-mono text-blue-600">{displayId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">Show ID:</span>
                        <span className="font-semibold">#{booking.showId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">Seats:</span>
                        <div className="flex gap-1">
                          {booking.seatNumbers.map((seat, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-900">Total Paid:</span>
                          <span className="text-xl font-bold text-blue-600">₹{booking.totalAmount}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 border border-gray-600 text-gray-800 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                        >
                          Print Ticket
                        </button>
                        <button
                          onClick={() => router.push(`/booking/${displayId}`)}
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-medium text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}