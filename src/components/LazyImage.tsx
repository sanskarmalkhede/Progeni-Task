import { useState, useRef, useEffect, ReactNode } from 'react';
import { User as UserIcon } from 'lucide-react';

const LazyImage = ({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  placeholder
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  placeholder?: ReactNode;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (!currentImg || !src) return;

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Don't render image if not in view yet
  if (!isInView) {
    return (
      <div ref={imgRef} className={className}>
        {placeholder || (
          <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
            <UserIcon className="w-1/2 h-1/2 text-gray-400" />
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (hasError || !src) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${fallbackClassName || className}`}>
        <UserIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
          <UserIcon className="w-1/2 h-1/2 text-gray-400" />
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

export default LazyImage;