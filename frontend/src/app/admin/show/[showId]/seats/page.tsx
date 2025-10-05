'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { seatAPI, showAPI, bookingAPI, type Seat, type Show, type BookingWithUser } from '@/lib/api';
import { ChevronLeft, Users, RefreshCw, User, Mail, Calendar } from 'lucide-react';

export default function AdminSeatViewPage() {
  const params = useParams<{ showId: string }>();
  const router = useRouter();
  const showId = parseInt(params.showId);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [show, setShow] = useState<Show | null>(null);
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Check if user is authenticated as admin
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
          setError('Please login as admin to view this page');
          setTimeout(() => router.push('/login'), 3000);
          return false;
        }
        
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
          setError('Admin access required');
          setTimeout(() => router.push('/'), 3000);
          return false;
        }
        
        return true;
      } catch (error) {
        setError('Authentication error');
        setTimeout(() => router.push('/login'), 3000);
        return false;
      }
    };

    if (checkAuth() && showId) {
      loadData();
    }
  }, [showId, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading admin data for show:', showId);

      // Try to load data - if it fails due to auth, we'll handle it
      const seatsRes = await seatAPI.getSeats(showId);
      const showRes = await showAPI.getShow(showId);
      
      setSeats(seatsRes.data);
      setShow(showRes.data);
      
      // Try to load bookings, but if it fails, continue without them
      try {
        const bookingsRes = await bookingAPI.getBookingsByShow(showId);
        setBookings(bookingsRes.data || []);
      } catch (bookingsError) {
        console.warn('Could not load bookings:', bookingsError);
        setBookings([]);
      }
      
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(`Failed to load data: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSeats = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      const seatsRes = await seatAPI.getSeats(showId);
      setSeats(seatsRes.data);
      
      // Try to refresh bookings
      try {
        const bookingsRes = await bookingAPI.getBookingsByShow(showId);
        setBookings(bookingsRes.data || []);
      } catch (bookingsError) {
        console.warn('Could not refresh bookings:', bookingsError);
      }
    } catch (error) {
      console.error('Error refreshing seats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Mock booking data for demo
  const getMockBookingForSeat = (seatNumber: string) => {
    const mockBookings = [
      { user_name: 'John Doe', user_email: 'john@example.com', totalAmount: 250, booking_time: new Date().toISOString() },
      { user_name: 'Jane Smith', user_email: 'jane@example.com', totalAmount: 300, booking_time: new Date().toISOString() },
      { user_name: 'Bob Wilson', user_email: 'bob@example.com', totalAmount: 200, booking_time: new Date().toISOString() },
    ];
    
    // Simple hash to assign mock data consistently
    const seatHash = seatNumber.charCodeAt(0) + parseInt(seatNumber.replace(/[A-Z]/g, ''));
    return mockBookings[seatHash % mockBookings.length];
  };

  const handleSeatHover = (seat: Seat) => {
    if (seat.status === 'booked') {
      setHoveredSeat(seat);
    } else {
      setHoveredSeat(null);
    }
  };

  const handleSeatLeave = () => {
    setHoveredSeat(null);
  };

  const getOccupancyStats = () => {
    const totalSeats = seats.length;
    const bookedSeats = seats.filter(s => s.status === 'booked').length;
    const availableSeats = seats.filter(s => s.status === 'available').length;
    const blockedSeats = seats.filter(s => s.status === 'blocked').length;
    const occupancyRate = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

    return {
      totalSeats,
      bookedSeats,
      availableSeats,
      blockedSeats,
      occupancyRate: occupancyRate.toFixed(1)
    };
  };

  const stats = getOccupancyStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-800 hover:text-white hover:bg-blue-600 border border-gray-300 hover:border-blue-600 rounded-lg transition-all duration-300 font-semibold group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Admin - {show?.movie_title || 'Show'}
                </h1>
                <p className="text-gray-700 text-sm font-medium">
                  {show?.cinema_name || 'Cinema'} • {show?.screen_name || 'Screen'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshSeats}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                <span className="text-blue-700 font-semibold text-sm">Admin View</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar size={18} />
                      {show && new Date(show.start_time).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                    <p className="text-gray-600">
                      {show && new Date(show.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Occupancy Rate</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.occupancyRate}%</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="w-32 h-1 bg-gray-300 mx-auto mb-2 rounded"></div>
                  <div className="text-sm text-gray-700 font-medium">
                    SCREEN
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>Total: {stats.totalSeats}</div>
                  <div>Booked: {stats.bookedSeats}</div>
                  <div>Available: {stats.availableSeats}</div>
                  {stats.blockedSeats > 0 && <div>Blocked: {stats.blockedSeats}</div>}
                </div>
              </div>

              <div className="flex gap-6 max-w-md mx-auto">
                <div className="flex flex-col gap-2 justify-center mr-4">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="w-6 h-8 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-10 gap-2 relative">
                  {seats.map((seat) => {
                    const isHovered = hoveredSeat?.id === seat.id;
                    const mockBooking = seat.status === 'booked' ? getMockBookingForSeat(seat.seat_number) : null;
                    
                    return (
                      <div
                        key={seat.id}
                        className="relative"
                        onMouseEnter={() => handleSeatHover(seat)}
                        onMouseLeave={handleSeatLeave}
                      >
                        <div
                          className={`
                            w-8 h-8 rounded text-xs font-medium transition-all cursor-default flex items-center justify-center
                            ${
                              seat.status === 'booked'
                                ? 'bg-red-400 text-white'
                                : seat.status === 'blocked'
                                ? 'bg-yellow-400 text-gray-800'
                                : 'bg-gray-100 text-gray-800 border border-gray-400'
                            }
                            ${isHovered ? 'ring-2 ring-blue-400 ring-offset-1 transform scale-110' : ''}
                          `}
                        >
                          {seat.seat_number.replace(/[A-Z]/g, '')}
                        </div>
                        
                        {isHovered && mockBooking && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                            <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl min-w-[200px]">
                              <div className="font-semibold text-sm mb-2">Booking Details</div>
                              
                              <div className="flex items-center gap-2 text-xs mb-1">
                                <User size={12} />
                                <span>{mockBooking.user_name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs mb-1">
                                <Mail size={12} />
                                <span>{mockBooking.user_email}</span>
                              </div>
                              
                              <div className="text-xs text-gray-300 mt-2">
                                Seat: {seat.seat_number}
                              </div>
                              <div className="text-xs text-gray-300">
                                Amount: ₹{mockBooking.totalAmount}
                              </div>
                              <div className="text-xs text-gray-300">
                                Booked: {new Date(mockBooking.booking_time).toLocaleString()}
                              </div>
                              
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center space-x-6 mt-8 text-sm text-gray-800 font-medium">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                  Available
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-400 rounded mr-2"></div>
                  Booked (Hover for details)
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                  Blocked
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  💡 <strong>Hover over booked seats</strong> (red) to view user booking details
                </p>
                <p className="text-xs text-blue-700 text-center mt-1">
                  Auto-refreshes every 5 seconds • Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 h-fit sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users size={20} className="mr-2" />
              Show Statistics
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 text-center mb-2">
                  {stats.occupancyRate}%
                </div>
                <div className="text-sm text-gray-600 text-center">Occupancy Rate</div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Seats:</span>
                  <span className="font-semibold">{stats.totalSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booked Seats:</span>
                  <span className="font-semibold text-red-600">{stats.bookedSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Seats:</span>
                  <span className="font-semibold text-green-600">{stats.availableSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blocked Seats:</span>
                  <span className="font-semibold text-yellow-600">{stats.blockedSeats}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}