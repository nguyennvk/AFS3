'use client';

import React from 'react';

interface SearchButtonProps {
  isLoading: boolean;
  type?: 'button' | 'submit';
}

export default function SearchButton({ isLoading, type = 'submit' }: SearchButtonProps) {
  return (
    <button
      type={type}
      disabled={isLoading}
      className="w-full py-3 px-6 rounded-md transition-all duration-200 disabled:cursor-not-allowed"
      style={{ 
        backgroundColor: isLoading ? '#94a3b8' : 'var(--button-bg)',
        color: 'var(--button-text)'
      }}
    >
      {isLoading ? 'Searching...' : 'Search Flights'}
    </button>
  );
}

