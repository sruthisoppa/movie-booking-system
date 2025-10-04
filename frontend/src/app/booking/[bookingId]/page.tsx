'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Ticket, Calendar, Clock, MapPin, User } from 'lucide-react';

interface BookingConfirmation {
  bookingId?: string;
  id?: string | number;
  _id?: string | number;
  movie_title: string;
  cinema_name: string;
  start_time: string;
  selectedSeats?: string[];
  totalAmount: number;
  status?: string;
}

export default function BookingConfirmationPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingData = sessionStorage.getItem('lastBooking');
    if (bookingData) {
      try {
        const parsedBooking = JSON.parse(bookingData);
        if (bookingId && !parsedBooking.bookingId) {
          parsedBooking.bookingId = bookingId;
        }
        setBooking(parsedBooking);
      } catch (error) {
        console.error('Error parsing booking data:', error);
      }
    }
    setLoading(false);
  }, [bookingId]);

  const getBookingId = () => {
    if (!booking) return 'N/A';
    return (
      booking.bookingId ||
      booking.id ||
      booking._id ||
      bookingId ||
      'N/A'
    );
  };

  const getSeatsArray = () => {
    if (!booking) return [];
    return booking.selectedSeats || [];
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
          year: 'numeric',
        }),
      };
    } catch {
      return { date: dateTimeString, time: '', shortDate: dateTimeString };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-6 font-medium">
            We could not find your booking details.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { date, time, shortDate } = formatDateTime(booking.start_time);
  const seatsArray = getSeatsArray();
  const displayBookingId = getBookingId();

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
                <h1 className="text-xl font-bold text-gray-900">Booking Confirmation</h1>
                <p className="text-gray-700 text-sm font-medium">Your ticket details</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700 font-medium">Booking ID</div>
              <div className="font-semibold text-gray-900">{displayBookingId}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 font-medium text-lg">
              Your tickets have been successfully booked
            </p>
          </div>

          {/* Movie & Show Details */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Movie Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {booking.movie_title}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <MapPin size={16} />
                    {booking.cinema_name}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700 font-medium">
                  <Calendar size={18} className="text-gray-500" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 font-medium">
                  <Clock size={18} className="text-gray-500" />
                  <span>{time}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-6">
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3 text-lg">Selected Seats</h3>
                <div className="flex flex-wrap gap-2">
                  {seatsArray.map((seat, index) => (
                    <div
                      key={index}
                      className="bg-green-500 text-white px-3 py-2 rounded-lg font-bold text-sm"
                    >
                      {seat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 text-lg">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">₹{booking.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t pt-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User size={20} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Tickets: {seatsArray.length}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar size={20} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">{shortDate}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Ticket size={20} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">E-Ticket</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-8 py-3 border border-gray-600 text-gray-800 rounded-lg hover:bg-gray-50 hover:border-primary transition-all duration-300 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Ticket
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            <Ticket size={20} />
            Book More Tickets
          </button>
        </div>
      </div>
    </div>
  );
}