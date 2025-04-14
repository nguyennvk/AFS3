'use client';

import { useState } from "react";
import SearchFrom from "./searchFrom";
import SearchTo from "./searchTo";
import TripDatePicker from "./tripDatePicker";
import FlightOptionsCheckbox from "./flightOption";
import SearchButton from "./searchButton";
import FlightResults from "./FlightResults";

interface SearchState {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;
}

interface FlightResults {
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
}

export default function SearchComponent() {
  const [searchState, setSearchState] = useState<SearchState>({
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    isRoundTrip: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FlightResults | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        setError(data.error || 'Failed to search flights');
        return;
      }

      if (data.success) {
        setSearchResults(data);
      } else {
        setError(data.error || 'No flights found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search flights');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="flight-search">
      <div className="rounded-lg shadow-lg p-6 transition-all duration-300" 
           style={{ backgroundColor: 'var(--form-bg)', borderColor: 'var(--border)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(e); }} className="space-y-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Flight Search</h2>
          
          <FlightOptionsCheckbox
            isRoundTrip={searchState.isRoundTrip}
            onChange={(value) => setSearchState(prev => ({ ...prev, isRoundTrip: value }))}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>From</label>
              <SearchFrom
                value={searchState.from}
                onChange={(value) => setSearchState(prev => ({ ...prev, from: value }))}
                placeholder="Enter city or airport"
                showLabel={false}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>To</label>
              <SearchTo
                value={searchState.to}
                onChange={(value) => setSearchState(prev => ({ ...prev, to: value }))}
                placeholder="Enter city or airport"
                showLabel={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Departure Date</label>
              <input
                type="date"
                value={searchState.departureDate}
                onChange={(e) => setSearchState(prev => ({ ...prev, departureDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all duration-200"
                style={{ 
                  backgroundColor: 'var(--form-input-bg)', 
                  color: 'var(--input-text)',
                  borderColor: 'var(--border)',
                  borderWidth: '1px'
                }}
                placeholder="dd/mm/yyyy"
              />
            </div>

            {searchState.isRoundTrip && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Return Date</label>
                <input
                  type="date"
                  value={searchState.returnDate}
                  onChange={(e) => setSearchState(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all duration-200"
                  style={{ 
                    backgroundColor: 'var(--form-input-bg)', 
                    color: 'var(--input-text)',
                    borderColor: 'var(--border)',
                    borderWidth: '1px'
                  }}
                  placeholder="dd/mm/yyyy"
                  min={searchState.departureDate}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: isLoading ? '#94a3b8' : 'var(--button-bg)',
              color: 'var(--button-text)'
            }}
          >
            {isLoading ? 'Searching...' : 'Search Flights'}
          </button>
        </form>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg transition-all duration-200" style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          borderWidth: '1px',
          color: 'rgb(185, 28, 28)'
        }}>
          {error}
        </div>
      )}

      {searchResults && (
        <div className="space-y-4">
          <FlightResults results={searchResults} />
        </div>
      )}
    </div>
  );
}