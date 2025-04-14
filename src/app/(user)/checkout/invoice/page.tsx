"use client";
import React, { useState, useEffect } from 'react';
import PDFComponent from './PDFComponent';

const App: React.FC = () => {
  const [booking, setBooking] = useState([]);
  const [hotel, setHotel] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch data from the API
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch('/api/invoice', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const data = await response.json();
        console.log( "asdfasd:", data);
        setHotel(data.hotel);
        setBooking(data.booking);
      } catch (error) {
        setErrorMessage('Failed to fetch invoice data');
      }
    }
    fetchInvoice();

  }
  , []);

  return (
    <div>
      <h1>PDF Generator</h1>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <PDFComponent flights={booking} reservations={hotel} />
      </div>

    </div>
  );
};

export default App;
