'use client';

import React from 'react';

interface FlightResult {
  flightNumber: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
}

interface FlightResultsProps {
  results: {
    success: boolean;
    outbound: {
      results: FlightResult[];
      total: number;
    };
    return?: {
      results: FlightResult[];
      total: number;
    };
    tripType: 'one-way' | 'roundtrip';
  } | null;
}

export default function FlightResults({ results }: FlightResultsProps) {
  if (!results) {
    return null;
  }

  if (!results.success || (!results.outbound.total && (!results.return || !results.return.total))) {
    return (
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center transition-colors">
        <p className="text-lg text-gray-700 dark:text-gray-300">No flights found matching your search criteria.</p>
      </div>
    );
  }

  const renderFlights = (flights: FlightResult[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {flights.map((flight, index) => (
        <div key={index} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg shadow-lg p-4 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{flight.airline}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Flight {flight.flightNumber}</p>
              <div className="mt-2">
                <p className="text-gray-700 dark:text-gray-300">
                  Departure: {flight.departureTime}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Arrival: {flight.arrivalTime}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {flight.duration}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${flight.price}
              </p>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Book now
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {renderFlights(results.outbound.results, results.tripType === 'roundtrip' ? 'Outbound Flights' : 'Available Flights')}
      {results.tripType === 'roundtrip' && results.return && (
        renderFlights(results.return.results, 'Return Flights')
      )}
    </div>
  );
} 