import React, { useState, useEffect } from 'react';
import { loadImageFromDB } from '../utils/storage';
import { Icons } from './Icon';

interface AsyncImageProps {
  id: string;
  alt?: string;
}

const AsyncImage: React.FC<AsyncImageProps> = ({ id, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Strip 'image:' prefix if present
        const imageId = id.startsWith('image:') ? id.replace('image:', '') : id;
        
        const blob = await loadImageFromDB(imageId);
        if (blob && active) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setLoading(false);
        } else if (active) {
          setError(true);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error loading image", e);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-50 dark:bg-neutral-900 rounded-lg flex items-center justify-center animate-pulse border border-gray-200 dark:border-neutral-800 my-4">
        <Icons.Loader className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-red-500 text-sm flex items-center justify-center my-4">
        <Icons.Alert size={16} className="mr-2" />
        Could not load image
      </div>
    );
  }

  return (
    <div className="my-4">
      <img 
        src={imageUrl} 
        alt={alt || "User uploaded content"} 
        className="max-w-full rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm" 
        loading="lazy"
      />
    </div>
  );
};

export default AsyncImage;