"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { useWebSocket } from "~/hooks/useWebSocket";
import CandidateForm from "~/app/_components/CandidateForm";
import ConfirmDialog from "~/app/_components/ConfirmDialog";
import CandidateAvatar from "~/app/_components/CandidateAvatar";
import CandidatesChart from "~/app/_components/CandidatesChart";
import LoggingPanel from "~/app/_components/LoggingPanel";

export default function CandidatesPage() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<{
    id: number;
    name: string;
    politicalParty: string;
    description: string;
  } | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const utils = api.useUtils();
  const { candidates, isConnected } = useWebSocket();
  
  // Always fetch via tRPC as backup, but with lower priority when WebSocket is connected
  const { data: tRPCCandidates } = api.candidates.getAll.useQuery(
    undefined,
    { 
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: isConnected ? 60000 : 5000, // Longer stale time when WebSocket is connected
      refetchInterval: isConnected ? false : 10000, // Poll every 10s when WebSocket is not connected
    }
  );
  
  // Use WebSocket data if available and connected, otherwise use tRPC data
  const activeCandidates = (isConnected && candidates.length > 0) ? candidates : (tRPCCandidates || []);

  // Log data source changes
  useEffect(() => {
    if (isConnected && candidates.length > 0) {
      console.log(`🔄 [CandidatesPage] Using WebSocket data: ${candidates.length} candidates`);
      console.log(`🔄 [CandidatesPage] WebSocket candidates:`, candidates.map(c => `${c.name} (${c.politicalParty})`));
    } else if (!isConnected && tRPCCandidates && tRPCCandidates.length > 0) {
      console.log(`🔄 [CandidatesPage] Using tRPC fallback data: ${tRPCCandidates.length} candidates`);
      console.log(`🔄 [CandidatesPage] tRPC candidates:`, tRPCCandidates.map(c => `${c.name} (${c.politicalParty})`));
    }
  }, [isConnected, candidates, tRPCCandidates]);
  
  const { data: selectedCandidate } = api.candidates.getById.useQuery(
    { id: selectedCandidateId! },
    { 
      enabled: selectedCandidateId !== null,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    }
  );

  const deleteMutation = api.candidates.delete.useMutation({
    onSuccess: (data) => {
      console.log(`✅ [CandidatesPage] Delete mutation succeeded: ${data.name}`);
      // Invalidate queries to ensure UI updates even if WebSocket fails
      utils.candidates.getAll.invalidate().catch(console.error);
      setDeleteCandidate(null);
      // If the deleted candidate was selected, clear selection
      if (selectedCandidateId === deleteCandidate?.id) {
        setSelectedCandidateId(null);
      }
    },
    onError: (error) => {
      console.error("❌ [CandidatesPage] Delete error:", error);
    },
  });

  const generateMutation = api.candidates.generate.useMutation({
    onSuccess: (data) => {
      console.log(`✅ [CandidatesPage] Generate mutation succeeded: ${data.name} (${data.politicalParty})`);
      // Invalidate queries to ensure UI updates even if WebSocket fails
      utils.candidates.getAll.invalidate().catch(console.error);
    },
    onError: (error) => {
      console.error("❌ [CandidatesPage] Generate error:", error);
      stopGeneration();
    },
  });

  const handleEdit = (candidate: typeof selectedCandidate) => {
    if (candidate) {
      setEditingCandidate({
        id: candidate.id,
        name: candidate.name,
        politicalParty: candidate.politicalParty,
        description: candidate.description,
      });
      setShowForm(true);
    }
  };

  const handleDelete = (candidate: { id: number; name: string }) => {
    setDeleteCandidate(candidate);
  };

  const confirmDelete = () => {
    if (deleteCandidate) {
      console.log(`🗑️ [CandidatesPage] Confirming delete for candidate ID: ${deleteCandidate.id} (${deleteCandidate.name})`);
      deleteMutation.mutate({ id: deleteCandidate.id });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const startGeneration = () => {
    if (isGenerating) return;
    
    console.log(`🎯 [CandidatesPage] Starting candidate generation (every 5 seconds)`);
    setIsGenerating(true);
    
    // Emit custom event for chart component
    window.dispatchEvent(new CustomEvent('candidateGenerationStart'));
    
    intervalRef.current = setInterval(() => {
      console.log(`🎯 [CandidatesPage] Triggering candidate generation...`);
      generateMutation.mutate();
    }, 5000); // Generate every 5 seconds
  };

  const stopGeneration = () => {
    console.log(`🎯 [CandidatesPage] Stopping candidate generation`);
    setIsGenerating(false);
    
    // Emit custom event for chart component
    window.dispatchEvent(new CustomEvent('candidateGenerationStop'));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Don't block the UI if WebSocket is not connected - show the app anyway
  // if (!isConnected) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Connecting to server...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!activeCandidates || activeCandidates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500 text-center">
          <h2 className="text-2xl font-bold mb-2">No Candidates Available</h2>
          <p>Loading candidates data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Election Candidates 2024</h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-600">Choose your candidate for the upcoming election</p>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'WebSocket Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Generation Controls */}
              {!isGenerating ? (
                <button
                  onClick={startGeneration}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  disabled={generateMutation.isPending}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1M4 7a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7z" />
                  </svg>
                  <span>Start Generation</span>
                </button>
              ) : (
                <button
                  onClick={stopGeneration}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>Stop Generation</span>
                </button>
              )}
              
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Candidate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <CandidatesChart isGenerating={isGenerating} />
          </div>
          <div className="lg:col-span-1">
            <LoggingPanel />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidates List (Master) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Candidates</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {activeCandidates?.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedCandidateId === candidate.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CandidateAvatar
                        src={candidate.image}
                        alt={candidate.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {candidate.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {candidate.politicalParty}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Candidate Details (Detail) */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                                      <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-end space-x-4">
                        <CandidateAvatar
                          src={selectedCandidate.image}
                          alt={selectedCandidate.name}
                          size="lg"
                          className="border-4 border-white"
                        />
                      <div className="flex-1 pb-2">
                        <h1 className="text-2xl font-bold text-white">
                          {selectedCandidate.name}
                        </h1>
                        <p className="text-blue-100 font-medium">
                          {selectedCandidate.politicalParty}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCandidate.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Political Party</h3>
                      <p className="text-gray-700">{selectedCandidate.politicalParty}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Candidate ID</h3>
                      <p className="text-gray-700">#{selectedCandidate.id}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Support This Candidate
                      </button>
                      <button
                        onClick={() => handleEdit(selectedCandidate)}
                        className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete({ id: selectedCandidate.id, name: selectedCandidate.name })}
                        className="bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Candidate</h3>
                <p className="text-gray-500">
                  Choose a candidate from the list to view their detailed information and platform.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Form Modal */}
      {showForm && (
        <CandidateForm
          candidate={editingCandidate}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCandidate}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidate(null)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
} 