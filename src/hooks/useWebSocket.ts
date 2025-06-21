"use client";

import { useEffect, useRef, useState } from 'react';
import { api } from '~/trpc/react';
import type { Candidate, CandidateStats } from '~/server/services/candidateService';

interface UseWebSocketReturn {
  candidates: Candidate[];
  stats: CandidateStats[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdated: Date | null;
  socket: null;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<CandidateStats[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const mountedRef = useRef(true);

  // Use tRPC queries with automatic refetching
  const candidatesQuery = api.candidates.getAll.useQuery(undefined, {
    refetchInterval: 3000, // Refresh every 3 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const statsQuery = api.candidates.getStats.useQuery(undefined, {
    refetchInterval: 3000, // Refresh every 3 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    mountedRef.current = true;
    
    console.log('🔌 [useWebSocket] Initializing tRPC polling fallback...');
    setIsConnecting(true);
    setError(null);

    // Simulate connection after a short delay
    const connectTimeout = setTimeout(() => {
      if (!mountedRef.current) return;
      
      console.log('✅ [useWebSocket] tRPC polling connected');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    }, 1000);

    // Cleanup function
    return () => {
      mountedRef.current = false;
      clearTimeout(connectTimeout);
    };
  }, []);

  // Update state when tRPC queries return data
  useEffect(() => {
    if (candidatesQuery.data && mountedRef.current) {
      console.log('📋 [useWebSocket] Received candidates from tRPC:', candidatesQuery.data.length, 'candidates');
      setCandidates(candidatesQuery.data);
      setLastUpdated(new Date());
    }
  }, [candidatesQuery.data]);

  useEffect(() => {
    if (statsQuery.data && mountedRef.current) {
      console.log('📊 [useWebSocket] Received stats from tRPC:', statsQuery.data.length, 'parties');
      setStats(statsQuery.data);
      setLastUpdated(new Date());
    }
  }, [statsQuery.data]);

  // Handle loading states
  useEffect(() => {
    if (candidatesQuery.isLoading || statsQuery.isLoading) {
      setIsConnecting(true);
    } else {
      setIsConnecting(false);
    }
  }, [candidatesQuery.isLoading, statsQuery.isLoading]);

  // Handle errors
  useEffect(() => {
    if (candidatesQuery.error || statsQuery.error) {
      const errorMessage = candidatesQuery.error?.message || statsQuery.error?.message || 'Unknown error';
      console.error('🚫 [useWebSocket] tRPC error:', errorMessage);
      setError(`Data fetch failed: ${errorMessage}`);
      setIsConnected(false);
    } else {
      setError(null);
    }
  }, [candidatesQuery.error, statsQuery.error]);

  return {
    candidates,
    stats,
    isConnected,
    isConnecting,
    error,
    lastUpdated,
    socket: null,
  };
};

// Hook for individual candidate data (using tRPC)
export function useWebSocketCandidate(id: number | null) {
  const candidateQuery = api.candidates.getById.useQuery(
    { id: id! }, 
    { enabled: id !== null }
  );
  
  return candidateQuery.data || null;
}

// Hook for search functionality (using tRPC)
export function useWebSocketSearch() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const searchResults = api.candidates.search.useQuery(
    { query: searchQuery }, 
    { 
      enabled: searchQuery.length > 0,
    }
  );

  // Handle loading state changes
  useEffect(() => {
    if (!searchResults.isLoading && isSearching) {
      setIsSearching(false);
    }
  }, [searchResults.isLoading, isSearching]);

  const search = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
  };

  return {
    search,
    searchResults: searchResults.data || [],
    isSearching: isSearching || searchResults.isLoading,
  };
} 