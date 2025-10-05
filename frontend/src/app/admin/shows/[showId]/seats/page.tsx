// app/admin/shows/[showId]/seats/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { adminAPI, SeatWithUser } from '@/lib/api';

interface ShowDetails {
  id: number;
  movie_title: string;
  cinema_name: string;
  screen_name: string;
  start_time: string;
}

export default function ShowSeatsPage() {
  const params = useParams();
  const showId = parseInt(params.showId as string);
  
  const [seats, setSeats] = useState<SeatWithUser[]>([]);
  const [showDetails, setShowDetails] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeatDetails();
  }, [showId]);

  const loadSeatDetails = async () => {
    try {
      const response = await adminAPI.getShowSeatDetails(showId);
      setSeats(response.data.seats);
      setShowDetails(response.data.show);
    } catch (error) {
      console.error('Failed to load seat details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seat_row;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<number, SeatWithUser[]>);

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seat Layout</h1>
        {showDetails && (
          <div className="mt-2 text-gray-600">
            <p><strong>Movie:</strong> {showDetails.movie_title}</p>
            <p><strong>Cinema:</strong> {showDetails.cinema_name} - {showDetails.screen_name}</p>
            <p><strong>Show Time:</strong> {new Date(showDetails.start_time).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Screen */}
      <div className="text-center">
        <div className="bg-gray-800 text-white py-2 mx-auto max-w-md rounded">
          SCREEN
        </div>
      </div>

      {/* Seats Grid */}
      <div className="flex flex-col items-center space-y-4">
        {Object.entries(seatsByRow).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center space-x-2">
            <span className="w-8 text-sm font-medium text-gray-600">Row {row}</span>
            <div className="flex space-x-1">
              {rowSeats.map((seat) => (
                <SeatTooltip key={seat.id} seat={seat}>
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-default ${
                      seat.status === 'booked'
                        ? 'bg-red-500 text-white'
                        : seat.status === 'blocked'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {seat.seat_number.replace(/^.*?(\d+)$/, '$1')}
                  </div>
                </SeatTooltip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Blocked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}

// Tooltip component for showing user info
function SeatTooltip({ seat, children }: { seat: SeatWithUser; children: React.ReactNode }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && seat.status === 'booked' && seat.user_name && (
        <div className="absolute z-10 w-48 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg -top-20 left-1/2 transform -translate-x-1/2">
          <div className="font-semibold">{seat.user_name}</div>
          <div className="text-gray-300 text-xs">{seat.user_email}</div>
          <div className="text-gray-300 text-xs mt-1">
            Booked: {seat.booking_time ? new Date(seat.booking_time).toLocaleString() : 'Unknown'}
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
}