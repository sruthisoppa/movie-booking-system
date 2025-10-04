'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { seatAPI, showAPI, userAPI, bookingAPI, type Seat, type Show } from '@/lib/api';
import { ChevronLeft, Users, Ticket } from 'lucide-react';

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showId = parseInt(params.showId as string);
  
  const [seats, setSeats] = useState<Seat[]>([]);
  const [show, setShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [showId]);

  const loadData = async () => {
    try {
      const [seatsRes, showRes] = await Promise.all([
        seatAPI.getSeats(showId),
        showAPI.getShow(showId)
      ]);
      
      setSeats(seatsRes.data);
      setShow(showRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    
    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum 6 seats can be selected');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getSeatStatus = (seat: Seat) => {
    if (selectedSeats.find(s => s.id === seat.id)) return 'selected';
    return seat.status;
  };

  const handleProceedToPay = async () => {
    if (selectedSeats.length === 0) return;

    setProcessing(true);
    
    try {
      // Get or create demo user
      const userResponse = await userAPI.getDemoUser();
      const user = userResponse.data;

      // Create booking
      const bookingData = {
        userId: user.id,
        showId: showId,
        seatNumbers: selectedSeats.map(seat => seat.seat_number),
        totalAmount: totalAmount
      };

      console.log('Creating booking with data:', bookingData);
      
      const bookingResponse = await bookingAPI.create(bookingData);
      const booking = bookingResponse.data;

      console.log('Booking created:', booking);

      // Save booking details for confirmation page
      sessionStorage.setItem('lastBooking', JSON.stringify({
        ...booking,
        movie_title: show?.movie_title,
        cinema_name: show?.cinema_name,
        start_time: show?.start_time
      }));

      // Redirect to confirmation page
      router.push(`/booking/${booking.bookingId}`);

    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = selectedSeats.length * (show?.price || 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-800">Loading...</div>;
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
                <h1 className="text-xl font-bold text-gray-900">{show?.movie_title}</h1>
                <p className="text-gray-700 text-sm font-medium">{show?.cinema_name}</p>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center mb-8">
                <div className="w-32 h-1 bg-gray-300 mx-auto mb-2 rounded"></div>
                <div className="text-sm text-gray-700 font-medium">SCREEN THIS WAY</div>
              </div>

              <div className="grid grid-cols-10 gap-2 max-w-md mx-auto">
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status !== 'available'}
                    className={`
                      w-8 h-8 rounded text-xs font-medium transition-all
                      ${
                        getSeatStatus(seat) === 'selected'
                          ? 'bg-green-500 text-white font-bold' // Selected seats are green with white text
                          : getSeatStatus(seat) === 'booked'
                          ? 'bg-gray-300 cursor-not-allowed text-gray-600' // Booked seats with visible text
                          : getSeatStatus(seat) === 'blocked'
                          ? 'bg-gray-300 cursor-not-allowed text-gray-600' // Blocked seats with visible text
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300' // Available seats with dark text
                      }
                    `}
                  >
                    {seat.seat_number}
                  </button>
                ))}
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
                  {selectedSeats.map(s => s.seat_number).join(', ') || 'None'}
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