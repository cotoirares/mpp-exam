"use client";

import { useWebSocket } from "~/hooks/useWebSocket";

export default function LoggingPanel() {
  const { isConnected, candidates, stats, lastUpdated } = useWebSocket();

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-w-md">
      <h3 className="text-white font-bold mb-3">🔍 System Status</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs">
            WebSocket: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        
        <div className="text-xs">
          <span className="text-blue-400">Candidates:</span> {candidates.length} loaded
        </div>
        
        <div className="text-xs">
          <span className="text-purple-400">Parties:</span> {stats.length} tracked
        </div>
        
        <div className="text-xs">
          <span className="text-yellow-400">Last Update:</span> {lastUpdated?.toLocaleTimeString() || 'Never'}
        </div>
        
        <div className="text-xs mt-3 pt-2 border-t border-gray-700">
          <span className="text-gray-400">Data Source:</span> {isConnected ? 'WebSocket' : 'tRPC Fallback'}
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          📝 Check browser console for detailed logs
        </p>
      </div>
    </div>
  );
} 