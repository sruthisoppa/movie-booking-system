'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Home, Ticket } from 'lucide-react';

interface BookingDetails {
  bookingId: number;
  seats: string[];
  totalAmount: number;
  movie_title: string;
  cinema_name: string;
  start_time: string;
}

export default function BookingConfirmation() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch booking details from API
    // For now, we'll use mock data from sessionStorage or create demo data
    const savedBooking = sessionStorage.getItem('lastBooking');
    
    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    } else {
      // Demo data
      setBooking({
        bookingId: parseInt(bookingId),
        seats: ['A1', 'A2', 'A3'],
        totalAmount: 750,
        movie_title: 'Avengers: Endgame',
        cinema_name: 'PVR Cinemas',
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      });
    }
    
    setLoading(false);
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
          {/* Header */}
          <div className="bg-green-500 text-white p-6 text-center">
            <CheckCircle size={64} className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-green-100">Your tickets have been successfully booked</p>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                <Ticket size={16} className="mr-2" />
                Booking ID: #{booking?.bookingId}
              </div>
            </div>

            {/* Movie Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{booking?.movie_title}</h2>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{booking?.cinema_name}</span>
                <span>{formatDate(booking?.start_time || '')} • {formatTime(booking?.start_time || '')}</span>
              </div>
            </div>

            {/* Seats & Amount */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Seats</h3>
                <p className="text-2xl font-bold text-blue-700">
                  {booking?.seats.join(', ')}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Total Amount</h3>
                <p className="text-2xl font-bold text-purple-700">
                  ₹{booking?.totalAmount}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Instructions</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Please arrive at the cinema 30 minutes before the show</li>
                <li>• Carry a valid ID proof for verification</li>
                <li>• Show this booking confirmation at the ticket counter</li>
                <li>• Seats will be released 10 minutes before showtime</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="flex-1 bg-secondary hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center">
                <Download size={20} className="mr-2" />
                Download Ticket
              </button>
              <button 
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <Home size={20} className="mr-2" />
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Confirmation email has been sent to your registered email address</p>
          <p className="mt-1">Need help? Contact support: support@bookmyshow.com</p>
        </div>
      </div>
    </div>
  );
}