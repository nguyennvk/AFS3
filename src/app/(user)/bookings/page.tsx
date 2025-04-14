"use client";
import { set } from "date-fns";
import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FlightInfo from "../checkout/flightInfo";

interface Flight {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  origin: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  price: number;
  currency: string;
  airline: {
    name: string;
  };
}

interface HotelReservation {
  reservation_id: number;
  hotel_name: string;
  room_number: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  room_type: string;
}

const FlightHotelPage = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<HotelReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [count, setCount] = useState(0);
  const router = useRouter();
  const [flightStatus, setFlightStatus] = useState({});
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
        const { reservations, flights } = data;
        
        setFlights(flights);
        setHotels(reservations);


        const bookingStatus = await fetch('/api/flight-booking/retrieve?bookingReference='+flights.map(flight => flight.bookingReference).join("&bookingReference="), {
          method: 'GET',
          credentials: 'include',
        });
        if (!bookingStatus.ok) {
          const errorData = await bookingStatus.json();
          setErrorMessage(errorData.error);
        }
        const statusData = await bookingStatus.json();
        setFlightStatus(statusData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [count]);
    if (errorMessage) {
        return (
            <div className="text-red-700 p-10 rounded-lg shadow-md flex items-center justify-center">
              <strong>Error: </strong> {errorMessage}
            </div>
          );
              }

  const cancelFlight = async (id: string) => {
    try {
        await fetch(`/api/flight-booking/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookings: [id] }),
          credentials: "include",
        }
        );
        setCount(count + 1);
    } catch (error) {
      console.error("Error canceling flight:", error);
    }
  };

  const cancelHotel = async (id: number) => {
    try {
      await fetch(`/api/booking/cancel-booking`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookings: [id] }),
        credentials: "include",
      });
      setCount(count + 1);
      setHotels(hotels.filter(hotel => hotel.reservation_id !== id));

    } catch (error) {
      console.error("Error canceling hotel reservation:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  return (
    <div className="p-4">
    <div className="gap-4 p-4">
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Flight Bookings</h2>
        {flights.map((flight, index) => (
          <div key={index} className="border-b py-2 flex justify-between items-center">
            <div>
          <p>Booking Reference: {flight.bookingReference}</p>
          <p>Status: {flightStatus[flight.bookingReference]}</p>
          </div>
          <FlightInfo flights={flight.flights}></FlightInfo>
          <button onClick={() => cancelFlight(flight.bookingReference)} className="bg-red-500 px-4 py-2 rounded hover:bg-red-700 cursor-pointer">Cancel</button>
        </div>        ))}

      </div>
      <div>
      <button
        onClick={() => router.push("/bookings/verify")}
        className="mt-9 relative w-75 relative h-13 rounded-lg border-1 font-semibold px-4 py-2 transition-colors bg-green-500 hover:bg-green-400 cursor-pointer relative bottom-5 left-5/6"      >
        Verify
      </button>
      </div>
              
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Hotel Reservations</h2>
        {hotels.map((hotel) => (
          <div key={hotel.reservation_id} className="border-b py-2 flex justify-between items-center">
          <div>
            <p><strong>Hotel:</strong> {hotel.hotel_name}</p>
            <p><strong>Room Number:</strong> {hotel.room_number} ({hotel.room_type})</p>
            <p><strong>Check-in:</strong> {new Date(hotel.start_date).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(hotel.end_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {hotel.status}</p>
            <p><strong>Price:</strong> ${hotel.total_price}</p>
          </div>
          <button onClick={() => cancelHotel(hotel.reservation_id)} className="bg-red-500 px-4 py-2 rounded hover:bg-red-700 cursor-pointer">Cancel</button>
        </div>
        ))}
      </div>
    </div>
    <button
        onClick={() => router.push("/checkout")}
        className="mt-4 w-75 relative h-13 rounded-lg border-1 font-semibold px-4 py-2 transition-colors bg-green-500 hover:bg-green-400 cursor-pointer relative bottom-5 left-5/6"      >
        Checkout
      </button>
    </div>
    
  );
};

export default FlightHotelPage;
