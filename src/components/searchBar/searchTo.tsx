'use client';

import React, { useState, useEffect, useRef } from "react";

interface Location {
  city: string;
  code: string;
  name?: string;
  display: string;
  type: 'city' | 'airport';
}

interface GroupedSuggestions {
  city: string;
  airports: Location[];
}

interface SearchToProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showLabel?: boolean;
}

export default function SearchTo({ value, onChange, placeholder = "Enter city or airport", showLabel = true }: SearchToProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<GroupedSuggestions[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update query when value prop changes
    setQuery(value);
  }, [value]);

  useEffect(() => {
    // Handle clicks outside of the component
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/flight-search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch suggestions');
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        // Group airports by city
        const groupedData: { [key: string]: Location[] } = {};
        data.forEach((item: Location) => {
          if (item.type === 'airport') {
            if (!groupedData[item.city]) {
              groupedData[item.city] = [];
            }
            groupedData[item.city].push(item);
          }
        });

        // Convert to array format
        const groupedSuggestions: GroupedSuggestions[] = Object.entries(groupedData).map(([city, airports]) => ({
          city,
          airports: airports.sort((a, b) => a.name?.localeCompare(b.name || '') || 0)
        }));

        setSuggestions(groupedSuggestions);
        setShowSuggestions(true);
      } else {
        console.error('Unexpected API response format:', data);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onChange(value);
    fetchSuggestions(value);
  };

  const handleCityClick = (cityName: string) => {
    setQuery(cityName);
    onChange(cityName);
    setShowSuggestions(false);
  };

  const handleAirportClick = (airport: Location) => {
    setQuery(airport.display);
    onChange(airport.code);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {showLabel && (
        <label htmlFor="to" className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
          To
        </label>
      )}
      <input
        type="text"
        id="to"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim() && fetchSuggestions(query)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all duration-200"
        style={{ 
          backgroundColor: 'var(--form-input-bg)', 
          color: 'var(--input-text)',
          borderColor: 'var(--border)',
          borderWidth: '1px'
        }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {suggestions.map((group, index) => (
            <div key={index} className="border-b last:border-b-0">
              <div
                className="px-4 py-2 font-medium bg-gray-50 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCityClick(group.city)}
              >
                {group.city}
              </div>
              {group.airports.map((airport, airportIndex) => (
                <div
                  key={airportIndex}
                  className="px-4 py-2 pl-8 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => handleAirportClick(airport)}
                >
                  {airport.name} ({airport.code})
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
