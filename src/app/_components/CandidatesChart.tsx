"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useWebSocket } from "~/hooks/useWebSocket";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CandidatesChartProps {
  isGenerating: boolean;
}

export default function CandidatesChart({ isGenerating }: CandidatesChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);
  const { stats, isConnected, lastUpdated } = useWebSocket();

  // Log when stats change
  useEffect(() => {
    if (stats && stats.length > 0) {
      console.log(`📊 [CandidatesChart] Chart data updated via WebSocket:`);
      console.log(`📊 [CandidatesChart] Stats received:`, stats.map(s => `${s.party}: ${s.count}`));
      console.log(`📊 [CandidatesChart] Total candidates: ${stats.reduce((sum, stat) => sum + stat.count, 0)}`);
      console.log(`📊 [CandidatesChart] Last updated: ${lastUpdated?.toLocaleTimeString()}`);
    }
  }, [stats, lastUpdated]);

  // Animate chart when generating
  useEffect(() => {
    if (isGenerating && chartRef.current) {
      chartRef.current.update('active');
    }
  }, [stats, isGenerating]);

  // Prepare chart data
  const chartData = {
    labels: stats.map((stat: { party: string; count: number }) => {
      // Shorten party names for better display
      const shortNames: Record<string, string> = {
        'USR (Save Romania Union)': 'USR',
        'PNL (National Liberal Party)': 'PNL',
        'PSD (Social Democratic Party)': 'PSD',
        'Independent': 'Independent',
        'AUR (Alliance for the Unity of Romanians)': 'AUR',
      };
      return shortNames[stat.party] || stat.party;
    }),
    datasets: [
      {
        label: 'Number of Candidates',
        data: stats.map((stat: { party: string; count: number }) => stat.count),
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',   // Orange for USR
          'rgba(29, 78, 216, 0.8)',    // Blue for PNL
          'rgba(220, 38, 38, 0.8)',    // Red for PSD
          'rgba(5, 150, 105, 0.8)',    // Green for Independent
          'rgba(124, 58, 237, 0.8)',   // Purple for AUR
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(29, 78, 216, 1)',
          'rgba(220, 38, 38, 1)',
          'rgba(5, 150, 105, 1)',
          'rgba(124, 58, 237, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Candidates by Political Party ${isGenerating ? '(Live Updates)' : ''}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1f2937',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.y} candidate${context.parsed.y === 1 ? '' : 's'}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (value: any) => {
            if (Number.isInteger(value)) {
              return value;
            }
            return '';
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.3)',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: isGenerating ? 750 : 400,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-semibold text-gray-700">
            Total Candidates: {stats.reduce((sum: number, stat: { party: string; count: number }) => sum + stat.count, 0)}
          </span>
        </div>
        {isGenerating && (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Generating...</span>
          </div>
        )}
      </div>
      
      <div className="h-80">
        <Bar 
          ref={chartRef}
          data={chartData} 
          options={options}
        />
      </div>
      
      {stats.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No candidates data available</p>
          </div>
        </div>
      )}
    </div>
  );
} 