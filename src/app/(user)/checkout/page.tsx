"use client";
import React, { useState, useEffect } from 'react';
import BookingInfo from './bookingInfo';
import { useRouter } from 'next/navigation';
import ReservationInfo from './reservationInfo';
import PaymentForm from './paymentForm';
import { set } from 'date-fns';

interface Flight {
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
  airline: {
    code: string;
    name: string;
  };
}

interface Booking {
  bookingReference: string;
  firstName: string;
  lastName: string;
  email: string;
  passportNumber: string;
  status: string;
  flights: Flight[];
}

interface HotelReservation {
  reservation_id: number;
  hotel_id: number;
  room_number: string;
  customer_id: number;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  room_type: string;
  hotel_name: string;
}

const ConfirmActionModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null; // If modal is not open, render nothing

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h3 className="text-xl font-semibold mb-4">Invoice Print?</h3>
        <p className="mb-4">Do you want to print the invoice?</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">No</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Yes</button>
        </div>
      </div>
    </div>
  );
};


export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCard, setErrorCard] = useState("");
  const [status, setStatus] = useState(200);
  const [invoiceData, setInvoiceData] = useState<{ flights: Booking[]; hotel: HotelReservation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [props, setProps] = useState({
    cardNumber: 0,
    MM: 0,
    YY: 0,
    CVV: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    alert("Payment successful! You will receive a confirmation email shortly.");
    router.push('/bookings');
  };

  const handleConfirmAction = () => {
    setIsModalOpen(false); // Close modal on confirm
    router.push('checkout/invoice');

    // Add any logic for the confirmed action here
  };

  const router = useRouter();
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          setErrorMessage('Failed to fetch invoice data');
          setStatus(response.status);
        }
        const data = await response.json();
        setInvoiceData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invoice data:', error);
      }
    };

    fetchInvoice();
    }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }
  if (errorMessage) {
    return (
      <div className="max-w-4xl mx-auto my-10 bg-red-50 p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center text-red-600 mb-6">Error</h1>
        <p className="text-center text-red-700">{errorMessage}: {status}</p>
      </div>
    );
  }
  // Example booking data with multiple flights
  const bookings: Booking[] = invoiceData?.flights || [];

  const hotelReservations: HotelReservation[] = invoiceData?.hotel || [];



  const handlePayment = async () => {

    try {
      const response = await fetch('/api/checkout/submit-card', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: (props.cardNumber).toString(),
          month: props.MM,
          year: props.YY,
          cvv: props.CVV,
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        setPaymentStatus(responseData.error);
        setStatus(response.status);
        return;
      }
      console.log("Response Data:", responseData);
      setPaymentStatus(responseData.message);
    } catch (error) {
      console.error('Error processing payment:', error);
    }

    try{
      const response = await fetch('/api/checkout/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookings: bookings.map((booking) => (booking.bookingReference)),
          reservations: hotelReservations.map((reservation) => (reservation.reservation_id)),
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        setPaymentStatus(responseData.error);
        setStatus(response.status);
        return;
      }
      console.log("Response Data:", responseData);
      setPaymentStatus(responseData.message);

      setIsModalOpen(true);

      // alert("Payment successful! You will receive a confirmation email shortly.");
      // router.push('/bookings');
    }
    catch (error) {
      setPaymentStatus("Error processing payment");
      setErrorMessage("Error processing payment");
      setStatus(500);
    }



  };
  if (errorMessage) {
    return (
      <div className="max-w-4xl mx-auto my-10 bg-red-50 p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center text-red-600 mb-6">Error</h1>
        <p className="text-center text-red-700">{errorMessage}: {status}</p>
      </div>
    );
  }
  const flightTotalPrice = bookings.reduce(
    (acc, booking) => acc + booking.flights.reduce((flightAcc, flight) => flightAcc + flight.price, 0),
    0
  );

  const hotelTotalPrice = hotelReservations.reduce(
    (acc, reservation) => acc + reservation.total_price,
    0
  );

  const totalAmount = flightTotalPrice + hotelTotalPrice;

  return (
    <div className="max-w-4xl mx-auto my-10 p-6 rounded-lg shadow-lg" id="invoice">
      <h1 className="text-4xl font-bold text-center text-indigo-600 mb-6">Checkout</h1>
      
      {bookings.map((booking, index) => (
        <BookingInfo key={index} booking={booking} />
      ))}
      
        <ReservationInfo hotelReservations={hotelReservations} />

    <h1 className="text-center text-3xl font-semibold text-indigo-600 mt-6">Total Payment</h1>

    <div className="p-6 rounded-lg shadow-lg my-4">
        <p className="text-right mt-2">
        <span className="font-bold">Subtotal (Flights):</span> ${flightTotalPrice.toFixed(2)}
        </p>
        <p className="text-right mt-2">
        <span className="font-bold">Subtotal (Hotel):</span> ${hotelTotalPrice.toFixed(2)}
        </p>
        <p className="text-right mt-2">
        <span className="font-bold">Total Amount:</span> ${totalAmount.toFixed(2)}
        </p>
    </div>
    <h2 className="text-center text-3xl font-semibold text-yellow-600">Payment Information</h2>

      <PaymentForm props={props} setProps={setProps} />
      {paymentStatus && <p className="mt-4 text-center text-red-600">{paymentStatus}</p>}
      <div className="mt-6">
        <button
          onClick={handlePayment}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 cursor-pointer transition duration-200"
        >
          Proceed to Payment
        </button>
        <ConfirmActionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onConfirm={handleConfirmAction}
      />
      </div>
    </div>
  );
}
