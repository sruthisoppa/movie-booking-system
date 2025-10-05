'use client';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { seatAPI, showAPI, bookingAPI, type Seat, type Show } from '@/lib/api';
import { ChevronLeft, Users, Ticket, RefreshCw } from 'lucide-react';

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
  const [refreshing, setRefreshing] = useState(false);
  const [blockingSeats, setBlockingSeats] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
    checkPendingBooking();
  }, [showId]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      setRefreshing(false);
    }
  };

  const refreshSeats = async () => {
  if (refreshing) return;
  
  setRefreshing(true);
  try {
    const seatsRes = await seatAPI.getSeats(showId);
    const newSeats = seatsRes.data;
    
    // Only update if seats actually changed
    setSeats(prevSeats => {
      const hasChanges = JSON.stringify(prevSeats) !== JSON.stringify(newSeats);
      return hasChanges ? newSeats : prevSeats;
    });
  } catch (error) {
    console.error('Error refreshing seats:', error);
  } finally {
    setRefreshing(false);
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

const handleSeatClick = async (seat: Seat) => {
  const currentUserId = getCurrentUserId();
  const isSelected = selectedSeats.find((s) => s.id === seat.id);
  
  console.log('Seat clicked:', seat.id, 'Selected:', isSelected, 'Status:', seat.status);
  
  // If seat is already selected by current user - DESELECT IT
  if (isSelected) {
    console.log('Deselecting seat:', seat.id);
    await unblockSeat(seat);
    setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    return;
  }
  
  // If seat is available OR blocked by current user - SELECT IT
  const canSelect = seat.status === 'available' || 
                   (seat.status === 'blocked' && (seat as any).blocked_by_user === currentUserId);
  
  if (!canSelect) {
    console.log('Cannot select seat - not available or blocked by others');
    return;
  }

  // Select seat
  if (selectedSeats.length >= 6) {
    alert('Maximum 6 seats can be selected');
    return;
  }
  
  console.log('Selecting seat:', seat.id);
  const blocked = await blockSeat(seat);
  if (blocked) {
    setSelectedSeats([...selectedSeats, seat]);
  }
};
const getCurrentUserId = (): number | null => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id || userData.userId || null;
    }
    return null;
  } catch {
    return null;
  }
};

const getSeatStatus = (seat: Seat) => {
  const currentUserId = getCurrentUserId();
  
  // If seat is selected by current user
  if (selectedSeats.find((s) => s.id === seat.id)) {
    return 'selected';
  }
  
  // If seat is blocked by current user (but not in selectedSeats yet)
  if (seat.status === 'blocked' && seat.blocked_by_user === currentUserId) {
    return 'selected';
  }
  
  // If seat is blocked by another user
  if (seat.status === 'blocked' && seat.blocked_by_user !== currentUserId) {
    return 'blocked-by-others';
  }
  
  return seat.status;
};
  const blockSeat = async (seat: Seat): Promise<boolean> => {
  try {
    setBlockingSeats(prev => new Set(prev).add(seat.id));
    
    // Block the seat for 5 minutes
    await seatAPI.updateSeatStatus(seat.id, 'blocked');
    
    // Update local state to show seat as blocked
    setSeats(prev => prev.map(s => 
      s.id === seat.id ? { ...s, status: 'blocked' } : s
    ));
    
    return true;
  } catch (error) {
    console.error('Failed to block seat:', error);
    alert('This seat was just taken by another user. Please select another seat.');
    await refreshSeats(); // Refresh to get current seat status
    return false;
  } finally {
    setBlockingSeats(prev => {
      const newSet = new Set(prev);
      newSet.delete(seat.id);
      return newSet;
    });
  }
};

const unblockSeat = async (seat: Seat) => {
  try {
    setBlockingSeats(prev => new Set(prev).add(seat.id));
    
    // Release the seat back to available
    await seatAPI.updateSeatStatus(seat.id, 'available');
    
    // Update local state
    setSeats(prev => prev.map(s => 
      s.id === seat.id ? { ...s, status: 'available' } : s
    ));
  } catch (error) {
    console.error('Failed to unblock seat:', error);
    // Continue anyway - the seat will expire automatically
  } finally {
    setBlockingSeats(prev => {
      const newSet = new Set(prev);
      newSet.delete(seat.id);
      return newSet;
    });
  }
};

// Add auto-refresh to see other users' selections
useEffect(() => {
  const interval = setInterval(() => {
    if (!processing && !loading) {
      refreshSeats();
    }
  }, 1000); // 1 second

  return () => clearInterval(interval);
}, [processing, loading]);


  const totalAmount = selectedSeats.length * (show?.price || 0);

  /*const handleProceedToPay = async () => {
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

      // First, temporarily block the seats to prevent double booking
      try {
        await Promise.all(
          selectedSeats.map(seat => 
            seatAPI.updateSeatStatus(seat.id, 'blocked')
          )
        );
      } catch (blockError) {
        console.error('Failed to block seats:', blockError);
        // Continue with booking anyway
      }

      const bookingResponse = await bookingAPI.create({
        showId,
        seatNumbers: selectedSeats.map((s) => s.seat_number),
        totalAmount,
      });

      const bookingDataFromAPI = bookingResponse.data.booking;

      const finalBookingId =
        bookingDataFromAPI?.bookingId || bookingDataFromAPI?.id || Date.now();

      // Update seats to booked status
      try {
        await Promise.all(
          selectedSeats.map(seat => 
            seatAPI.updateSeatStatus(seat.id, 'booked')
          )
        );
      } catch (updateError) {
        console.error('Failed to update seat status:', updateError);
        // Refresh seats to get current status
        await refreshSeats();
      }

      const bookingData = {
        id: finalBookingId,
        bookingId: finalBookingId,
        selectedSeats: selectedSeats.map((s) => s.seat_number),
        totalAmount,
        movie_title: show?.movie_title || 'Movie',
        cinema_name: show?.cinema_name || 'Cinema',
        start_time: show?.start_time || new Date().toISOString(),
        showId: showId // Important for cancellation
      };

      sessionStorage.setItem('lastBooking', JSON.stringify(bookingData));
      router.push(`/booking/${finalBookingId}`);
    } catch (err: unknown) {
      console.error('Booking error:', err);
      
      // Release any blocked seats on error
      try {
        await Promise.all(
          selectedSeats.map(seat => 
            seatAPI.updateSeatStatus(seat.id, 'available')
          )
        );
      } catch (releaseError) {
        console.error('Failed to release seats:', releaseError);
      }

      let errorMessage = 'Failed to create booking. Please try again.';
      const axiosErr = err as AxiosError | undefined;

      if (axiosErr && axiosErr.response) {
        switch (axiosErr.response.status) {
          case 401: {
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
          }
          case 400: {
            const data = axiosErr.response.data as unknown;
            const message = typeof data === 'object' && data !== null && 'message' in (data as Record<string, unknown>)
              ? String((data as Record<string, unknown>)['message'])
              : undefined;
            errorMessage = message || 'Invalid booking data. Please check your selection.';
            break;
          }
          case 409: {
            errorMessage = 'Some selected seats are no longer available. Please select different seats.';
            await refreshSeats(); // Refresh to get current seat status
            setSelectedSeats([]);
            break;
          }
          case 500: {
            errorMessage = 'Server error. Please try again later.';
            break;
          }
        }
      } else if (axiosErr && axiosErr.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  //};*/
  /*const handleProceedToPay = async () => {
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

    // STEP 1: Create booking (this should handle seat conflicts)
    const bookingResponse = await bookingAPI.create({
      showId,
      seatNumbers: selectedSeats.map((s) => s.seat_number),
      totalAmount,
    });

    const bookingDataFromAPI = bookingResponse.data.booking;
    const finalBookingId = bookingDataFromAPI?.bookingId || bookingDataFromAPI?.id || Date.now();

    // STEP 2: Update seats to booked status
    try {
      await Promise.all(
        selectedSeats.map(seat => 
          seatAPI.updateSeatStatus(seat.id, 'booked')
        )
      );
    } catch (updateError) {
      console.error('Failed to update seat status:', updateError);
      // This might fail if seats are already booked, but booking was created
      await refreshSeats();
    }

    // STEP 3: Only redirect if booking was successful
    const bookingData = {
      id: finalBookingId,
      bookingId: finalBookingId,
      selectedSeats: selectedSeats.map((s) => s.seat_number),
      totalAmount,
      movie_title: show?.movie_title || 'Movie',
      cinema_name: show?.cinema_name || 'Cinema',
      start_time: show?.start_time || new Date().toISOString(),
      showId: showId
    };

    sessionStorage.setItem('lastBooking', JSON.stringify(bookingData));
    router.push(`/booking/${finalBookingId}`);

  } catch (err: unknown) {
    console.error('Booking error:', err);
    
    // Release any blocked seats on error
    try {
      await Promise.all(
        selectedSeats.map(seat => 
          seatAPI.updateSeatStatus(seat.id, 'available')
        )
      );
    } catch (releaseError) {
      console.error('Failed to release seats:', releaseError);
    }

    const axiosErr = err as AxiosError | undefined;

    if (axiosErr?.response?.status === 409) {
      // SEATS ALREADY TAKEN - DON'T REDIRECT
      setError('Some selected seats were just taken by another user. Please select different seats.');
      await refreshSeats();
      setSelectedSeats([]);
      alert('❌ Some seats were taken by other users. Please select different seats.');
      // STAY ON SEAT SELECTION PAGE - NO REDIRECT
    } else if (axiosErr?.response?.status === 401) {
      setError('Your session has expired. Please login again.');
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
    } else {
      let errorMessage = 'Failed to create booking. Please try again.';
      if (axiosErr?.response?.status === 400) {
        errorMessage = 'Invalid booking data. Please check your selection.';
      } else if (axiosErr?.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      setError(errorMessage);
      alert(errorMessage);
    }
  } finally {
    setProcessing(false);
  }
};*/
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

    // STEP 1: Verify seats are still available before booking
    await refreshSeats(); // Get latest seat status
    const currentSeats = await seatAPI.getSeats(showId);
    
    const unavailableSeats = selectedSeats.filter(selectedSeat => {
      const currentSeat = currentSeats.data.find(s => s.id === selectedSeat.id);
      return currentSeat?.status !== 'available' && currentSeat?.status !== 'blocked';
    });

    if (unavailableSeats.length > 0) {
      alert(`Some seats are no longer available: ${unavailableSeats.map(s => s.seat_number).join(', ')}`);
      setSelectedSeats([]);
      await refreshSeats();
      return;
    }

    // STEP 2: Block seats temporarily
    try {
      await Promise.all(
        selectedSeats.map(seat => 
          seatAPI.updateSeatStatus(seat.id, 'blocked')
        )
      );
    } catch (blockError) {
      console.error('Failed to block seats:', blockError);
      // Continue anyway
    }

    // STEP 3: Create booking
    const bookingResponse = await bookingAPI.create({
      showId,
      seatNumbers: selectedSeats.map((s) => s.seat_number),
      totalAmount,
    });

    const bookingDataFromAPI = bookingResponse.data.booking;
    const finalBookingId = bookingDataFromAPI?.bookingId || bookingDataFromAPI?.id || Date.now();

    // STEP 4: Update seats to booked status
    /*try {
      await Promise.all(
        selectedSeats.map(seat => 
          seatAPI.updateSeatStatus(seat.id, 'booked')
        )
      );
    } catch (updateError) {
      console.error('Failed to update seat status:', updateError);
      // This might fail, but booking was created
    }*/

    // STEP 5: Only redirect if everything succeeded
    const bookingData = {
      id: finalBookingId,
      bookingId: finalBookingId,
      selectedSeats: selectedSeats.map((s) => s.seat_number),
      totalAmount,
      movie_title: show?.movie_title || 'Movie',
      cinema_name: show?.cinema_name || 'Cinema',
      start_time: show?.start_time || new Date().toISOString(),
      showId: showId
    };

    sessionStorage.setItem('lastBooking', JSON.stringify(bookingData));
    router.push(`/booking/${finalBookingId}`);

  } catch (err: unknown) {
    console.error('Booking error:', err);
    
    // Release any blocked seats on error
    try {
      await Promise.all(
        selectedSeats.map(seat => 
          seatAPI.updateSeatStatus(seat.id, 'available')
        )
      );
    } catch (releaseError) {
      console.error('Failed to release seats:', releaseError);
    }

    const axiosErr = err as AxiosError | undefined;

    if (axiosErr?.response?.status === 409) {
      setError('Some selected seats were just taken by another user. Please select different seats.');
      await refreshSeats();
      setSelectedSeats([]);
      alert('❌ Some seats were taken by other users. Please select different seats.');
    } else if (axiosErr?.response?.status === 401) {
      setError('Your session has expired. Please login again.');
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
    } else {
      let errorMessage = 'Failed to create booking. Please try again.';
      if (axiosErr?.response?.status === 400) {
        errorMessage = 'Invalid booking data. Please check your selection.';
      } else if (axiosErr?.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      setError(errorMessage);
      alert(errorMessage);
    }
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
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshSeats}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh Seats
              </button>
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
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="w-32 h-1 bg-gray-300 mx-auto mb-2 rounded"></div>
                  <div className="text-sm text-gray-700 font-medium">
                    SCREEN THIS WAY
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>Available: {seats.filter(s => s.status === 'available').length}</div>
                  <div>Booked: {seats.filter(s => s.status === 'booked').length}</div>
                </div>
              </div>

              <div className="flex gap-6 max-w-md mx-auto">
                {/* Row Letters */}
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
  disabled={getSeatStatus(seat) === 'booked' || getSeatStatus(seat) === 'blocked-by-others'}
  className={`
    w-8 h-8 rounded text-xs font-medium transition-all
    ${
      getSeatStatus(seat) === 'selected'
        ? 'bg-green-500 text-white font-bold shadow-md transform scale-105 cursor-pointer'
        : getSeatStatus(seat) === 'blocked-by-others'
        ? 'bg-yellow-400 cursor-not-allowed text-gray-700'
        : seat.status === 'booked'
        ? 'bg-red-400 cursor-not-allowed text-white'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 hover:shadow-md cursor-pointer'
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
                  <div className="w-4 h-4 bg-red-400 rounded mr-2"></div>
                  Booked
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                  Blocked
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
                <span className="text-green-600">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPay}
              disabled={selectedSeats.length === 0 || processing}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
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

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-gray-600">
                <div className="font-semibold text-blue-800">Debug Info:</div>
                <div>Show ID: {showId}</div>
                <div>Total Seats: {seats.length}</div>
                <div>Available: {seats.filter(s => s.status === 'available').length}</div>
                <div>Booked: {seats.filter(s => s.status === 'booked').length}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}