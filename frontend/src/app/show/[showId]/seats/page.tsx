'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { seatAPI, showAPI, bookingAPI, type Seat, type Show } from '@/lib/api';
import { ChevronLeft, Users, Ticket } from 'lucide-react';

export default function SeatSelectionPage() {
  const params = useParams<{ showId: string }>();
  const router = useRouter();
  const showId = parseInt(params.showId);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [show, setShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    checkPendingBooking();
  }, [showId]);

  const loadData = async () => {
    try {
      const [seatsRes, showRes] = await Promise.all([
        seatAPI.getSeats(showId),
        showAPI.getShow(showId),
      ]);

      setSeats(seatsRes.data);
      setShow(showRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load show data');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingBooking = () => {
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        if (
          bookingData.showId === showId &&
          Date.now() - bookingData.timestamp < 3600000
        ) {
          setSelectedSeats(bookingData.selectedSeats || []);
        }
        localStorage.removeItem('pendingBooking');
      } catch {
        localStorage.removeItem('pendingBooking');
      }
    }
  };

  const isUserAuthenticated = () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (!token || !user) return false;
      if (token.split('.').length !== 3) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    if (selectedSeats.find((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum 6 seats can be selected');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getSeatStatus = (seat: Seat) => {
    if (selectedSeats.find((s) => s.id === seat.id)) return 'selected';
    return seat.status;
  };

  const totalAmount = selectedSeats.length * (show?.price || 0);

  const handleProceedToPay = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      if (!isUserAuthenticated()) {
        localStorage.setItem(
          'pendingBooking',
          JSON.stringify({
            showId,
            selectedSeats,
            totalAmount,
            timestamp: Date.now(),
          }),
        );
        router.push(`/login?redirect=/show/${showId}/seats`);
        return;
      }

      const bookingResponse = await bookingAPI.create({
        showId,
        seatNumbers: selectedSeats.map((s) => s.seat_number),
        totalAmount,
      });

      const bookingDataFromAPI = bookingResponse.data.booking;

      const finalBookingId =
        bookingDataFromAPI?.bookingId || bookingDataFromAPI?.id || Date.now();

      const bookingData = {
        id: finalBookingId,
        bookingId: finalBookingId,
        selectedSeats: selectedSeats.map((s) => s.seat_number),
        totalAmount,
        movie_title: show?.movie_title || 'Movie',
        cinema_name: show?.cinema_name || 'Cinema',
        start_time: show?.start_time || new Date().toISOString(),
      };

      sessionStorage.setItem('lastBooking', JSON.stringify(bookingData));
      router.push(`/booking/${finalBookingId}`);
    } catch (error: any) {
      console.error('Booking error:', error);
      let errorMessage = 'Failed to create booking. Please try again.';

      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Your session has expired. Please login again.';
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.setItem(
              'pendingBooking',
              JSON.stringify({
                showId,
                selectedSeats,
                totalAmount,
                timestamp: Date.now(),
              }),
            );
            router.push(`/login?redirect=/show/${showId}/seats`);
            return;

          case 400:
            errorMessage =
              error.response.data?.message ||
              'Invalid booking data. Please check your selection.';
            break;

          case 409:
            errorMessage =
              'Some selected seats are no longer available. Please select different seats.';
            loadData();
            setSelectedSeats([]);
            break;

          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-800">
        Loading...
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
                <h1 className="text-xl font-bold text-gray-900">
                  {show?.movie_title}
                </h1>
                <p className="text-gray-700 text-sm font-medium">
                  {show?.cinema_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700 font-medium">
                {new Date(show?.start_time || '').toLocaleDateString()}
              </div>
              <div className="font-semibold text-gray-900">
                {selectedSeats.length} Seats Selected
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="text-center mb-8">
      <div className="w-32 h-1 bg-gray-300 mx-auto mb-2 rounded"></div>
      <div className="text-sm text-gray-700 font-medium">
        SCREEN THIS WAY
      </div>
    </div>

    <div className="flex gap-6 max-w-md mx-auto">
      {/* Row Letters - moved further left with more spacing */}
      <div className="flex flex-col gap-2 justify-center mr-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="w-6 h-8 flex items-center justify-center text-xs font-semibold text-gray-600">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      
      {/* Seat Grid */}
      <div className="grid grid-cols-10 gap-2">
        {seats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => handleSeatClick(seat)}
            disabled={seat.status !== 'available'}
            className={`
              w-8 h-8 rounded text-xs font-medium transition-all
              ${
                getSeatStatus(seat) === 'selected'
                  ? 'bg-green-500 text-white font-bold'
                  : getSeatStatus(seat) === 'booked' ||
                    getSeatStatus(seat) === 'blocked'
                  ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
              }
            `}
          >
            {seat.seat_number.replace(/[A-Z]/g, '')}
          </button>
        ))}
      </div>
    </div>

    {/* Seat Legend */}
    <div className="flex justify-center space-x-6 mt-8 text-sm text-gray-800 font-medium">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
        Available
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
        Selected
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
        Booked/Blocked
      </div>
    </div>
  </div>
</div>

          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6 h-fit sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Ticket size={20} className="mr-2" />
              Booking Summary
            </h2>

            <div className="space-y-3 mb-6 text-gray-800">
              <div className="flex justify-between text-sm font-medium">
                <span>Selected Seats:</span>
                <span className="font-semibold text-gray-900">
                  {selectedSeats.map((s) => s.seat_number).join(', ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Number of Seats:</span>
                <span className="text-gray-900">{selectedSeats.length}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Price per Seat:</span>
                <span className="text-gray-900">₹{show?.price}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-gray-900">
                <span>Total Amount:</span>
                <span className="text-secondary">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPay}
              disabled={selectedSeats.length === 0 || processing}
              className="w-full bg-green-400 hover:bg-green-500 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Proceed to Pay'
              )}
            </button>

            <div className="mt-4 text-xs text-gray-600 text-center font-medium">
              <Users size={14} className="inline mr-1" />
              Maximum 6 seats allowed per booking
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}