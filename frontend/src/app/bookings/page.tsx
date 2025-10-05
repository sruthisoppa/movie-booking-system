'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { bookingAPI, type Booking } from '@/lib/api';
import { ChevronLeft, Ticket, Calendar, Clock, MapPin, X, AlertCircle, Download, RefreshCw } from 'lucide-react';

interface BookingWithDetails extends Booking {
  movie_title?: string;
  cinema_name?: string;
  start_time?: string;
  end_time?: string;
  poster_url?: string;
  booking_time?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Store cancelled bookings in localStorage to persist across page reloads
  const getCancelledBookings = (): string[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('cancelledBookings') || '[]');
  };

  const setCancelledBookings = (bookingIds: string[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cancelledBookings', JSON.stringify(bookingIds));
  };

  const addCancelledBooking = (bookingId: string) => {
    const cancelled = getCancelledBookings();
    if (!cancelled.includes(bookingId)) {
      setCancelledBookings([...cancelled, bookingId]);
    }
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
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

      const cancelledBookings = getCancelledBookings();
      
      const formattedBookings = bookingsData.map((b) => {
        const booking = b as Record<string, unknown>;
        const rawId = booking['id'] ?? booking['_id'];
        const id = rawId as string | number | undefined;
        const bookingId = (booking['bookingId'] as string | number | undefined) || (id ? `BK${String(id).padStart(3, '0')}` : undefined);
        const showId = (booking['show_id'] as number | undefined) || (booking['showId'] as number | undefined) || 0;
        const seatsField = booking['seats'];
        const seatNumbers = seatsField ? String(seatsField).split(',') : ((booking['seatNumbers'] as string[] | undefined) ?? []);
        const totalAmount = (booking['total_amount'] as number | undefined) ?? (booking['totalAmount'] as number | undefined) ?? 0;
        
        // Check if this booking is cancelled in localStorage
        const isCancelled = cancelledBookings.includes(String(bookingId));
        const status = isCancelled ? 'cancelled' : ((booking['status'] as BookingWithDetails['status']) ?? 'pending');
        
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
          end_time: booking['end_time'] as string | undefined,
          poster_url: booking['poster_url'] as string | undefined,
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
        localStorage.removeItem('cancelledBookings');
        router.push('/login?redirect=/bookings');
      } else {
        setError('Failed to load your bookings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

// Update the handleCancelBooking function to accept 3 parameters
const handleCancelBooking = async (bookingId: string, seatNumbers: string[], showId: number) => {
  if (!confirm(`Are you sure you want to cancel this booking? 
  
This will release your seats: ${seatNumbers.join(', ')}
  
Do you want to proceed?`)) {
    return;
  }

  setCancellingId(bookingId);
  try {
    console.log('Attempting to cancel booking:', bookingId);
    
    // Call API with 3 arguments
    const result = await bookingAPI.cancel(bookingId, seatNumbers, showId);
    
    // Don't check for result.data.success - just assume success if no error
    // Update localStorage to persist cancellation
    addCancelledBooking(bookingId);
    
    // Update local state
    setBookings(prev => prev.map(booking =>
      booking.bookingId === bookingId || booking.id === bookingId
        ? { ...booking, status: 'cancelled' }
        : booking
    ));

    alert(`✅ ${result.data.message}`);
    
    // Refresh to see updated data
    setTimeout(() => {
      loadBookings();
    }, 1000);
    
  } catch (err: unknown) {
    console.error('Cancel booking error:', err);
    const axiosErr = err as import('axios').AxiosError | undefined;
    const message = axiosErr?.response && typeof axiosErr.response.data === 'object'
      ? String((axiosErr.response.data as Record<string, unknown>)['message'] ?? axiosErr.message)
      : (axiosErr?.message ?? String(err));
    alert(`❌ Cancellation failed: ${message}`);
  } finally {
    setCancellingId(null);
  }
};

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const canCancelBooking = (booking: BookingWithDetails) => {
    if (booking.status !== 'confirmed') return false;
    
    const showTime = new Date(booking.start_time || '');
    const now = new Date();
    const timeDiff = showTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Allow cancellation up to 2 hours before show
    return hoursDiff > 2;
  };

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
        relative: getRelativeTime(date),
      };
    } catch {
      return { 
        date: 'Invalid date', 
        time: '', 
        shortDate: 'Invalid date',
        relative: ''
      };
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffHours === 0) {
      return 'now';
    } else {
      return 'passed';
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

  const downloadTicket = (booking: BookingWithDetails) => {
    const ticketContent = `
      MOVIE TICKET
      ============
      Movie: ${booking.movie_title}
      Cinema: ${booking.cinema_name}
      Date: ${formatDateTime(booking.start_time || '').date}
      Time: ${formatDateTime(booking.start_time || '').time}
      Seats: ${booking.seatNumbers.join(', ')}
      Booking ID: ${booking.bookingId}
      Status: ${booking.status.toUpperCase()}
      Total: ₹${booking.totalAmount}
      
      ${booking.status === 'cancelled' ? '⚠️ THIS TICKET HAS BEEN CANCELLED ⚠️' : 'Enjoy your movie!'}
    `;

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${booking.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                className="flex items-center gap-2 px-4 py-2.5 text-gray-800 hover:text-white hover:bg-red-600 border border-gray-300 hover:border-red-600 rounded-lg transition-all duration-300 font-semibold group"
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
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              
              <div className="text-right">
                <div className="text-sm text-gray-700 font-medium">Total Bookings</div>
                <div className="font-semibold text-gray-900">{bookings.length}</div>
              </div>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
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
              const displayId = booking.bookingId || booking.id || 'N/A';
              const { time, shortDate, relative } = formatDateTime(booking.start_time || new Date().toISOString());
              const isUpcoming = booking.status === 'confirmed' && relative !== 'passed';
              
              return (
                <div 
                  key={displayId} 
                  className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                    booking.status === 'cancelled' ? 'opacity-70 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex gap-6">
                    {/* Movie Poster */}
                    {booking.poster_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={booking.poster_url}
                          alt={booking.movie_title}
                          className="w-24 h-32 object-cover rounded-lg shadow-sm"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
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
                            {isUpcoming && (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                {relative}
                              </div>
                            )}
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
                            <span className="font-mono text-blue-600 font-bold">{displayId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 font-medium">Show Time:</span>
                            <span className="font-semibold text-gray-600">{time} • {shortDate}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 font-medium">Seats:</span>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {booking.seatNumbers.map((seat, index) => (
                                <span 
                                  key={index} 
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    booking.status === 'cancelled' 
                                      ? 'bg-gray-200 text-gray-600' 
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </div>
                          {booking.booking_time && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 font-medium">Booked On:</span>
                              <span className="font-semibold text-gray-600">
                                {new Date(booking.booking_time).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Amount & Actions */}
                        <div className="space-y-4">
                          <div className={`rounded-lg p-4 border ${
                            booking.status === 'cancelled' 
                              ? 'bg-gray-100 border-gray-300' 
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={`font-semibold ${
                                booking.status === 'cancelled' ? 'text-gray-700' : 'text-blue-900'
                              }`}>
                                Total {booking.status === 'cancelled' ? 'Refund' : 'Paid'}:
                              </span>
                              <span className={`text-xl font-bold ${
                                booking.status === 'cancelled' ? 'text-gray-600' : 'text-blue-600'
                              }`}>
                                ₹{booking.totalAmount}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadTicket(booking)}
                              className="flex items-center justify-center gap-2 flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                            >
                              <Download size={16} />
                              Download
                            </button>
                            
                            {booking.status === 'confirmed' && canCancelBooking(booking) && (
                              <button
                    onClick={() => {
                      // Prefer the numeric DB id if available (booking.id)
                      let idForApi: string | number = booking.id ?? booking.bookingId ?? '';
                      // If bookingId is formatted like 'BK001', attempt to parse numeric part
                      if ((!idForApi || String(idForApi).startsWith('BK')) && booking.bookingId) {
                        const parsed = String(booking.bookingId).replace(/^BK0*/, '');
                        if (/^\d+$/.test(parsed)) idForApi = Number(parsed);
                      }
                      handleCancelBooking(String(idForApi), booking.seatNumbers, booking.showId);
                    }}
                    disabled={cancellingId === booking.bookingId}
                    className="flex items-center justify-center gap-2 flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    {cancellingId === booking.bookingId ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Cancel
                      </>
                    )}
                  </button>
                            )}

                            {booking.status === 'confirmed' && !canCancelBooking(booking) && (
                              <button
                                disabled
                                className="flex items-center justify-center gap-2 flex-1 bg-gray-400 text-white py-2 rounded-lg font-medium text-sm cursor-not-allowed"
                                title="Cannot cancel within 2 hours of showtime"
                              >
                                <AlertCircle size={16} />
                                Can&apos;t Cancel
                              </button>
                            )}

                            <button
                              onClick={() => router.push(`/booking/${displayId}`)}
                              className="flex items-center justify-center gap-2 flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-medium text-sm transition-colors"
                            >
                              <Ticket size={16} />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Message */}
                  {booking.status === 'cancelled' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle size={16} />
                        <span className="font-medium">This booking has been cancelled. Refund will be processed within 5-7 business days.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}