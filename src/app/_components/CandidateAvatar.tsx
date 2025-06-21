"use client";

import Image from "next/image";
import { useState } from "react";

interface CandidateAvatarProps {
  src: string;
  alt: string;
  size: "sm" | "lg";
  className?: string;
}

export default function CandidateAvatar({ src, alt, size, className = "" }: CandidateAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Extract initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Get background color based on name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length] || 'bg-blue-500';
  };

  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    lg: "w-24 h-24 text-xl"
  };

  const initials = getInitials(alt);
  const bgColor = getBackgroundColor(alt);

  if (imageError) {
    // Fallback to CSS-based avatar
    return (
      <div className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-bold ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        priority={false}
        loading="lazy"
        onLoadStart={() => setImageError(false)}
      />
    </div>
  );
} 