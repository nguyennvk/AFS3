"use client";
import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Modal from 'react-modal';

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([600, 800]); // Page size: 600x800

const font = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);
const titleFont = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);

interface ReservationProps {
  reservation_id: number;
  hotel_name: string;
  room_number: string;
  room_type: string;
  // status: string;
  start_date: string;
  end_date: string;
  total_price: number;
}

interface FlightProps {
  bookingReference: string;
  ticketNumber: string;
  flight: {
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    destination: string;
    price: number;
  };
}

function createTitel(){
  const checkoutText = 'Checkout';
  const checkoutTextWidth = titleFont.widthOfTextAtSize(checkoutText, 24);
  const checkoutX = page.getWidth() / 2 - checkoutTextWidth / 2;
  page.drawText(checkoutText, {
    x: checkoutX,
    y: 750, // Vertical position
    size: 24,
    font: titleFont,
    color: rgb(0, 0, 1),
  });

}


function createReservations(y_offset: number, reservations: ReservationProps[]){
  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const yPosition = y_offset - (i * 20); // Adjust vertical position for each reservation
    page.drawText(`Reservation ID: `, { x: 50, y: yPosition, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${reservation.reservation_id}`, { x: 250, y: yPosition, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`Hotel Name: `, { x: 50, y: yPosition - 20, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${reservation.hotel_name}`, { x: 250, y: yPosition - 20, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`Room Number: `, { x: 50, y: yPosition - 40, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${reservation.room_number}`, { x: 250, y: yPosition - 40, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`Room Type: `, { x: 50, y: yPosition - 60, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${reservation.room_type}`, { x: 250, y: yPosition - 60, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`Status: `, { x: 50, y: yPosition - 80, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`Start Date: `, { x: 50, y: yPosition - 100, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${reservation.start_date}`, { x: 250, y: yPosition - 100, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`End Date: `, { x: 50, y: yPosition - 120, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${reservation.end_date}`, { x: 250, y: yPosition - 120, size: 12, font, color: rgb(0, 0, 0) });  
    page.drawText(`Total Price: `, { x: 50, y: yPosition - 140, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`$${reservation.total_price.toFixed(2)}`, { x: 250, y: yPosition - 140, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText('-------------------------------------------------------', {
      x: 50,
      y: yPosition - 160,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y_offset -= 180; // Adjust y_offset for the next reservation
  }
  y_offset -= 40; // Add some space after the last reservation
  page.drawText('Total for All Reservations:', {
    x: 50, // Right-aligned at x=400
    y: y_offset+30,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  const total = reservations.reduce((sum, reservation) => sum + reservation.total_price, 0);
  page.drawText(`$${total.toFixed(2)}`, {
    x: 250, // Right-aligned at x=400
    y: y_offset+30,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  return y_offset; // Return the new y_offset after drawing all reservations

}

function TotalPayment(y_offset: number, total: number) {
  const paymentText = 'Total Payment';
  const paymentTextWidth = titleFont.widthOfTextAtSize(paymentText, 20);
  const paymentX = page.getWidth() / 2 - paymentTextWidth / 2;
  page.drawText(paymentText, {
    x: paymentX,
    y: y_offset, // Vertical position
    size: 20,
    font: titleFont,
    color: rgb(0, 0, 1),
  });
  const paymentDetails = [
    { label: 'Subtotal (Flights):', value: '$0.00' },
    { label: 'Subtotal (Hotel):', value: '$164.19' },
    { label: 'Total Amount:', value: '$164.19' },
  ];
  y_offset -= 50; // Starting vertical position
}

function createFlight(y_offset: number, flight: FlightProps[]) {
  var c = 0;
  for (let i = 0; i < flight.length; i++) {
    // Draw flight details
    y_offset -= 20
    page.drawText(`Booking Reference: `, { x: 50, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${flight[i].bookingReference}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
    y_offset -= 20
    page.drawText(`Ticket Number: `, { x: 50, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
    page.drawText(`${flight[i].ticketNumber}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
    y_offset -= 40
    for (let j = 0; j < flight[i].flights.length; j++) {
      const flightDetails = flight[i].flights[j];
      page.drawText(`Flight Number: `, { x: 60, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText(`${flightDetails.flightNumber}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      y_offset -= 20
      page.drawText(`Departure Time: `, { x: 60, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText(`${flightDetails.departureTime}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      y_offset -= 20
      page.drawText(`Arrival Time: `, { x: 60, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText(`${flightDetails.arrivalTime}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      y_offset -= 20
      page.drawText(`Origin: `, { x: 60, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText(`${flightDetails.origin}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      y_offset -= 20
      page.drawText(`Destination: `, { x: 60, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText(`${flightDetails.destination}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      y_offset -= 20
      page.drawText(`Price: `, { x: 60, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText(`$${flightDetails.price.toFixed(2)}`, { x: 250, y: y_offset, size: 12, font, color: rgb(0, 0, 0) });
      y_offset -= 20
      page.drawText('-------------------------------------------------------', {
        x: 50,
        y: y_offset,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y_offset -= 20
      c += flightDetails.price
    }
  }

  page.drawText('Total for All Flights:', {
    x: 50, // Right-aligned at x=400
    y: y_offset+10,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText(`$${c.toFixed(2)}`, {
    x: 250, // Right-aligned at x=400
    y: y_offset+10,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  return y_offset; // Return the new y_offset after drawing all reservations


}

const PDFComponent: React.FC<{ flights: FlightProps[]; reservations: ReservationProps[] }> = ({ flights, reservations }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Function to create PDF
  const createPDF = async () => {

    // Draw header: Checkout (centered)
    createTitel()
    // Draw section: Hotel Reservations (centered)
    const reservationsText = 'Hotel Reservations';
    const reservationsTextWidth = titleFont.widthOfTextAtSize(reservationsText, 20);
    const reservationsX = page.getWidth() / 2 - reservationsTextWidth / 2;
    page.drawText(reservationsText, {
      x: reservationsX,
      y: 700, // Vertical position
      size: 20,
      font: titleFont,
      color: rgb(0, 0, 1),
    });

    var yOffset = createReservations(650, reservations);



    const bookingText = 'Flight Bookings';
    const bookingTextWidth = titleFont.widthOfTextAtSize(bookingText, 20);
    const bookingX = page.getWidth() / 2 - bookingTextWidth / 2;
    page.drawText(bookingText, {
      x: bookingX,
      y: yOffset, // Vertical position
      size: 20,
      font: titleFont,
      color: rgb(0, 0, 1),
    });

    var y_offset = createFlight(yOffset, flights);


    // Save the PDF document
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    setPdfUrl(url); // Store the generated PDF URL for preview and download
  };

  // Function to handle preview (open modal)
  const handlePreview = () => {
    setIsModalOpen(true); // Open modal with PDF preview
  };

  // Function to handle download
  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'generated.pdf';
      a.click();
    }
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button onClick={createPDF} className="border m-3 cursor-pointer rounded-lg">Create Invoice</button>
      {pdfUrl && (
        <div>
          <button onClick={handlePreview} className="border m-3 cursor-pointer rounded-lg">Preview Invoice</button>
          <button onClick={handleDownload} className="border m-3 cursor-pointer rounded-lg">Download Invoice</button>
        </div>
      )}

      {/* Modal for preview */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="PDF Preview"
        ariaHideApp={false}
        style={{
          content: {
            width: '80%',
            height: '80%',
            margin: 'auto',
            padding: '0',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
          },
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={closeModal} style={{ margin: '10px' }}>Close</button>
        </div>
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="PDF Preview"
          />
        )}
      </Modal>
    </div>
  );
};

export default PDFComponent;