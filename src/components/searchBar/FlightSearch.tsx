"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchFrom from './searchFrom';
import SearchTo from './searchTo';
import TripDatePicker from './tripDatePicker';
import FlightOptionsCheckbox from './flightOption';
import SearchButton from './searchButton';
import FlightResults from './FlightResults';

interface SearchState {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;
}

export default function FlightSearch() {
  const router = useRouter();
  const [searchState, setSearchState] = useState<SearchState>({
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    isRoundTrip: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    success: boolean;
    outbound: {
      results: any[];
      total: number;
    };
    return?: {
      results: any[];
      total: number;
    };
    tripType: 'one-way' | 'roundtrip';
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Extract just the city name if it's a full airport string
    const extractCityName = (input: string) => {
      // If it's an airport format "City - Airport Name (CODE)"
      if (input.includes(' - ')) {
        return input.split(' - ')[0];
      }
      // If it's just "City (CODE)"
      if (input.includes(' (')) {
        return input.split(' (')[0];
      }
      return input;
    };

    try {
      const response = await fetch('/api/flight-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: extractCityName(searchState.from),
          destination: extractCityName(searchState.to),
          date: searchState.departureDate,
          ...(searchState.isRoundTrip && searchState.returnDate && { returnDate: searchState.returnDate }),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Search error:', data);
        setSearchResults(null);
        return;
      }

      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="flight-search">
      <div className="rounded-lg shadow-lg p-6 transition-all duration-300" 
           style={{ backgroundColor: 'var(--form-bg)', borderColor: 'var(--border)' }}>
        <form onSubmit={handleSearch} className="space-y-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Flight Search</h2>
          
          <FlightOptionsCheckbox
            isRoundTrip={searchState.isRoundTrip}
            onChange={(value) => setSearchState(prev => ({ ...prev, isRoundTrip: value }))}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchFrom
              value={searchState.from}
              onChange={(value) => setSearchState(prev => ({ ...prev, from: value }))}
              placeholder="Enter city or airport"
            />
            
            <SearchTo
              value={searchState.to}
              onChange={(value) => setSearchState(prev => ({ ...prev, to: value }))}
              placeholder="Enter city or airport"
            />
          </div>

          <TripDatePicker
            departureDate={searchState.departureDate}
            returnDate={searchState.returnDate}
            isRoundTrip={searchState.isRoundTrip}
            onDepartureDateChange={(value) => setSearchState(prev => ({ ...prev, departureDate: value }))}
            onReturnDateChange={(value) => setSearchState(prev => ({ ...prev, returnDate: value }))}
          />

          <SearchButton isLoading={isLoading} />
        </form>
      </div>

      {searchResults && <FlightResults results={searchResults} />}
    </div>
  );
} 