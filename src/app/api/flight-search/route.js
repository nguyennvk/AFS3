'use server';

import { NextResponse } from 'next/server';
import { AFS_API_KEY, AFS_API_URL } from '../../config/api';
// The code in this file is partially AI generated using Claude

// Helper function to format date for API
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Helper function to format date and time
const formatDateTime = (dateTimeStr) => {
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateTimeStr);
      return null;
    }
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Helper function to calculate duration
const calculateDuration = (departureTime, arrivalTime) => {
  try {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
      return 'Duration not available';
    }
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 'Duration not available';
  }
};

// Handling API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  return NextResponse.json(
    { 
      success: false,
      error: 'Failed to fetch flight data', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    },
    { 
      status: 500,
      headers: corsHeaders 
    }
  );
};

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Date validation functions
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// const isPastDate = (dateString) => {
//   const date = new Date(dateString);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   return date < today;
// };

const isValidDateRange = (departureDate, returnDate) => {
  if (!returnDate) return true; // For one-way flights
  const departure = new Date(departureDate);
  const return_ = new Date(returnDate);
  return return_ >= departure;
};

// City search API with autocomplete
export async function GET(request) {
  console.log('GET request received for city/airport search');
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim();

  if (!query) {
    console.log('Query parameter missing');
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Fetch both cities and airports in parallel
    const [citiesResponse, airportsResponse] = await Promise.all([
      fetch(`${AFS_API_URL}/api/cities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AFS_API_KEY
        }
      }),
      fetch(`${AFS_API_URL}/api/airports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AFS_API_KEY
        }
      })
    ]);

    if (!citiesResponse.ok || !airportsResponse.ok) {
      throw new Error('Failed to fetch cities or airports');
    }

    const [cities, airports] = await Promise.all([
      citiesResponse.json(),
      airportsResponse.json()
    ]);

    console.log(`Received ${cities.length} cities and ${airports.length} airports from API`);

    const queryLower = query.toLowerCase();
    
    // Filter cities that match the query
    const matchingCities = cities.filter(city => 
      city.city.toLowerCase().includes(queryLower)
    ).map(city => ({
      ...city,
      display: city.city,
      type: 'city'
    }));

    // Filter airports that match the query by code or city
    const matchingAirports = airports.filter(airport => 
      airport.code.toLowerCase().includes(queryLower) || 
      airport.city.toLowerCase().includes(queryLower)
    ).map(airport => ({
      ...airport,
      display: `${airport.city} - ${airport.name} (${airport.code})`,
      type: 'airport'
    }));

    // Combine and sort results
    const allResults = [...matchingCities, ...matchingAirports]
      .sort((a, b) => {
        if (!a || !b) return 0;
        
        const aCity = a.city?.toLowerCase() || '';
        const bCity = b.city?.toLowerCase() || '';
        const aCode = a.code?.toLowerCase() || '';
        const bCode = b.code?.toLowerCase() || '';
        const queryLower = query.toLowerCase();

        // Exact matches first
        const aExact = aCity.startsWith(queryLower) || aCode === queryLower;
        const bExact = bCity.startsWith(queryLower) || bCode === queryLower;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then sort by city name
        return aCity.localeCompare(bCity);
      })
      .slice(0, 10);

    console.log(`Returning ${allResults.length} matches for "${query}"`);
    return NextResponse.json(allResults, { headers: corsHeaders });
  } catch (error) {
    return handleApiError(error);
  }
}

// Get all airport codes for a city
async function getAirportCodesForCity(cityName) {
  console.log(`[getAirportCodesForCity] Searching for airports in: ${cityName}`);
  try {
    // If it's already an airport code (3 letters), return as is
    if (cityName.length === 3 && cityName.toUpperCase() === cityName) {
      console.log(`[getAirportCodesForCity] Input is an airport code: ${cityName}`);
      return [cityName];
    }

    // First try to get all airports in the city
    const response = await fetch(`${AFS_API_URL}/api/airports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AFS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch airports');
    }

    const airports = await response.json();
    console.log(`[getAirportCodesForCity] Found ${airports.length} total airports`);

    // Case insensitive search for airports in the city
    const cityAirports = airports.filter(airport => 
      airport.city.toLowerCase() === cityName.toLowerCase()
    );

    if (cityAirports.length > 0) {
      console.log(`[getAirportCodesForCity] Found ${cityAirports.length} airports for ${cityName}:`, 
        cityAirports.map(a => `${a.code} (${a.name})`));
      return cityAirports.map(airport => airport.code);
    }

    // If no airports found, try to find the city in cities list
    console.log(`[getAirportCodesForCity] No airports found directly, checking cities list`);
    const citiesResponse = await fetch(`${AFS_API_URL}/api/cities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AFS_API_KEY
      }
    });

    if (!citiesResponse.ok) {
      throw new Error('Failed to fetch cities');
    }

    const cities = await citiesResponse.json();
    console.log(`[getAirportCodesForCity] Searching through ${cities.length} cities`);

    // Try exact match first
    const exactCity = cities.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    if (exactCity) {
      console.log(`[getAirportCodesForCity] Found exact city match: ${exactCity.city} (${exactCity.code})`);
      // Now search for all airports in this city
      const cityAirports = airports.filter(airport => 
        airport.city.toLowerCase() === exactCity.city.toLowerCase()
      );
      if (cityAirports.length > 0) {
        console.log(`[getAirportCodesForCity] Found ${cityAirports.length} airports for exact city match`);
        return cityAirports.map(airport => airport.code);
      }
      return [exactCity.code];
    }

    // If no exact match, try partial match
    const partialCity = cities.find(c => c.city.toLowerCase().includes(cityName.toLowerCase()));
    if (partialCity) {
      console.log(`[getAirportCodesForCity] Found partial city match: ${partialCity.city} (${partialCity.code})`);
      // Search for all airports in this partially matched city
      const cityAirports = airports.filter(airport => 
        airport.city.toLowerCase() === partialCity.city.toLowerCase()
      );
      if (cityAirports.length > 0) {
        console.log(`[getAirportCodesForCity] Found ${cityAirports.length} airports for partial city match`);
        return cityAirports.map(airport => airport.code);
      }
      return [partialCity.code];
    }

    console.log(`[getAirportCodesForCity] No matches found for ${cityName}`);
    return [];
    } catch (error) {
    console.error('[getAirportCodesForCity] Error:', error);
    throw error;
  }
}

// Flight search API
export async function POST(request) {
  console.log('POST request received for flight search');
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { origin, destination: destinationCity, date, returnDate } = body;
    const tripType = returnDate ? 'roundtrip' : 'one-way';

    if (!origin || !destinationCity || !date) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters (origin, destination, date)', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    // Date validations
    if (!isValidDate(date)) {
      return NextResponse.json({
        error: 'Invalid departure date format (use YYYY-MM-DD)',
        code: 'INVALID_DATE'
      }, { status: 400 });
    }

    if (tripType === 'roundtrip') {
      if (!returnDate) {
        return NextResponse.json({
          error: 'Return date is required for round-trip flights',
          code: 'MISSING_RETURN_DATE'
        }, { status: 400 });
      }

      if (!isValidDate(returnDate)) {
        return NextResponse.json({
          error: 'Invalid return date format (use YYYY-MM-DD)',
          code: 'INVALID_RETURN_DATE'
        }, { status: 400 });
      }

      if (!isValidDateRange(date, returnDate)) {
        return NextResponse.json({
          error: 'Return date must be after departure date',
          code: 'INVALID_DATE_RANGE'
        }, { status: 400 });
      }
    }

    // Get all possible airport codes for origin and destination
    console.log(`Looking up airports for origin: ${origin}`);
    const originAirports = await getAirportCodesForCity(origin);
    console.log(`Found ${originAirports.length} origin airports:`, originAirports);

    console.log(`Looking up airports for destination: ${destinationCity}`);
    const destinationAirports = await getAirportCodesForCity(destinationCity);
    console.log(`Found ${destinationAirports.length} destination airports:`, destinationAirports);

    if (originAirports.length === 0) {
      return NextResponse.json({
        error: `No airports found for origin city: ${origin}. Please check the city name or try using an airport code.`,
        code: 'NO_ORIGIN_AIRPORTS'
      }, { status: 400 });
    }

    if (destinationAirports.length === 0) {
      return NextResponse.json({
        error: `No airports found for destination city: ${destinationCity}. Please check the city name or try using an airport code.`,
        code: 'NO_DESTINATION_AIRPORTS'
      }, { status: 400 });
    }

    // Search flights for all combinations of airports
    let allOutboundFlights = [];
    let allReturnFlights = [];

    for (const sourceAirport of originAirports) {
      for (const destAirport of destinationAirports) {
        if (sourceAirport === destAirport) continue; // Skip if same airport

        // Outbound flight search
    const outboundQueryString = new URLSearchParams({
          origin: sourceAirport,
          destination: destAirport,
      date: formatDate(date)
    }).toString();

    const outboundUrl = `${AFS_API_URL}/api/flights?${outboundQueryString}`;
        console.log(`Searching outbound flights: ${outboundUrl}`);

    const outboundResponse = await fetch(outboundUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AFS_API_KEY
      }
    });

        if (outboundResponse.ok) {
          const outboundData = await outboundResponse.json();
          if (outboundData.results && outboundData.results.length > 0) {
            // Transform flight data
            const transformedFlights = outboundData.results.map(result => {
              const firstFlight = result.flights[0];
              const lastFlight = result.flights[result.flights.length - 1];

              return {
                flightNumber: result.flights.map(f => f.flightNumber).join(' → '),
                airline: result.flights.map(f => f.airline.name).join(' → '),
                departureTime: formatDateTime(firstFlight.departureTime)?.date + ' ' + 
                             formatDateTime(firstFlight.departureTime)?.time || 'Time not available',
                arrivalTime: formatDateTime(lastFlight.arrivalTime)?.date + ' ' + 
                           formatDateTime(lastFlight.arrivalTime)?.time || 'Time not available',
                duration: calculateDuration(firstFlight.departureTime, lastFlight.arrivalTime),
                price: result.flights.reduce((total, f) => total + (f.price || 0), 0).toFixed(2) + ' ' + (firstFlight.currency || 'CAD'),
                origin: firstFlight.origin.code,
                destination: lastFlight.destination.code,
                stops: result.legs - 1,
                route: result.flights.map(f => f.origin.code).concat([lastFlight.destination.code]).join(' → ')
              };
            });
            allOutboundFlights.push(...transformedFlights);
          }
        }

        // Return flight search for round trips
    if (tripType === 'roundtrip') {
      const returnQueryString = new URLSearchParams({
            origin: destAirport,
            destination: sourceAirport,
        date: formatDate(returnDate)
      }).toString();

      const returnUrl = `${AFS_API_URL}/api/flights?${returnQueryString}`;
          console.log(`Searching return flights: ${returnUrl}`);

      const returnResponse = await fetch(returnUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AFS_API_KEY
        }
      });

          if (returnResponse.ok) {
            const returnData = await returnResponse.json();
            if (returnData.results && returnData.results.length > 0) {
              // Transform return flight data
              const transformedFlights = returnData.results.map(result => {
                const firstFlight = result.flights[0];
                const lastFlight = result.flights[result.flights.length - 1];

                return {
                  flightNumber: result.flights.map(f => f.flightNumber).join(' → '),
                  airline: result.flights.map(f => f.airline.name).join(' → '),
                  departureTime: formatDateTime(firstFlight.departureTime)?.date + ' ' + 
                               formatDateTime(firstFlight.departureTime)?.time || 'Time not available',
                  arrivalTime: formatDateTime(lastFlight.arrivalTime)?.date + ' ' + 
                             formatDateTime(lastFlight.arrivalTime)?.time || 'Time not available',
                  duration: calculateDuration(firstFlight.departureTime, lastFlight.arrivalTime),
                  price: result.flights.reduce((total, f) => total + (f.price || 0), 0).toFixed(2) + ' ' + (firstFlight.currency || 'CAD'),
                  origin: firstFlight.origin.code,
                  destination: lastFlight.destination.code,
                  stops: result.legs - 1,
                  route: result.flights.map(f => f.origin.code).concat([lastFlight.destination.code]).join(' → ')
                };
              });
              allReturnFlights.push(...transformedFlights);
            }
          }
        }
      }
    }

    // Sort flights by price
    allOutboundFlights.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (tripType === 'roundtrip') {
      allReturnFlights.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    }

    if (allOutboundFlights.length === 0) {
      return NextResponse.json({
        success: false,
        error: tripType === 'roundtrip' 
          ? `No flights available for round-trip from ${origin} to ${destinationCity} on ${formatDate(date)} - ${formatDate(returnDate)}.`
          : `No flights available from ${origin} to ${destinationCity} on ${formatDate(date)}.`,
        code: 'NO_FLIGHTS_AVAILABLE'
      }, { status: 404 });
    }

    console.log('Formatted outbound flights:', outboundFlights);
    console.log('Formatted return flights:', returnFlights);
    return NextResponse.json({
      success: true,
      outbound: {
        results: allOutboundFlights,
        total: allOutboundFlights.length
      },
      ...(tripType === 'roundtrip' && {
        return: {
          results: allReturnFlights,
          total: allReturnFlights.length
        }
      }),
      tripType
    });

  } catch (error) {
    console.log('Error caught:', error.message);
    return handleApiError(error);
  }
}
