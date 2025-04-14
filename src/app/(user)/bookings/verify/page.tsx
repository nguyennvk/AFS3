"use client";
import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
const ReservationsPage = () => {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<any>({ flights: [] });
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/booking/view', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
            const errorData = await response.json();
            setErrorMessage(errorData.error);
        }
        const data = await response.json();
        setBookingData(data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      }
    };

    fetchData();
  }, []);

  if (errorMessage) {
    router.push("/login");
    return <div className="text-red-500">
        <strong>Error:</strong> {errorMessage}
    </div>;
  }

  return (
    <div className="p-8">
      {/* Flights Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Flights</h2>
        {bookingData.flights.map((flight) => (
          <div key={flight.bookingReference} className="p-4 mb-6 border rounded-md shadow-md">
            <h3 className="text-xl font-semibold">Booking Reference: {flight.bookingReference}</h3>
            <p className="mb-2">Ticket Number: {flight.ticketNumber}</p>
            <p>Passenger: {flight.firstName} {flight.lastName}</p>
            <p>Email: {flight.email}</p>
            <p>Status: <span className={`font-bold ${flight.status === 'CONFIRMED' ? 'text-green-500' : 'text-red-500'}`}>{flight.status}</span></p>
            <div className="mt-4">
              <h4 className="font-semibold">Flight Details</h4>
              {flight.flights.map((f, index) => (
                <div key={index} className="border-b pb-4 mb-4">
                  <p><strong>Flight Number:</strong> {f.flightNumber}</p>
                  <p><strong>Departure:</strong> {new Date(f.departureTime).toLocaleString()}</p>
                  <p><strong>Arrival:</strong> {new Date(f.arrivalTime).toLocaleString()}</p>
                  <p><strong>Origin:</strong> {f.origin.name} ({f.origin.city}, {f.origin.country})</p>
                  <p><strong>Destination:</strong> {f.destination.name} ({f.destination.city}, {f.destination.country})</p>
                  <p><strong>Price:</strong> ${f.price}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <div className="flex justify-end">
        <button
            onClick={() => router.push("/bookings")}
            className="mt-4 cursor-pointer right-0">
            Go Back
        </button>
      </div>

    </div>
  );
};

export default ReservationsPage;
