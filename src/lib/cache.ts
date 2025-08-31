// Simple in-memory cache with TTL (Time To Live)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton cache instance
export const apiCache = new SimpleCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  apiCache.cleanup();
}, 10 * 60 * 1000);

// Generate cache keys for different API operations
export const getCacheKey = {
  allUsers: (page: number, limit: number) => `users:all:${page}:${limit}`,
  searchUsers: (query: string, page: number, limit: number) => `users:search:${query}:${page}:${limit}`,
  userById: (id: string) => `users:id:${id}`
};

// Cache invalidation helpers
export const invalidateCache = {
  allUsers: () => {
    const keys = apiCache.getStats().keys;
    keys.forEach(key => {
      if (key.startsWith('users:all:') || key.startsWith('users:search:')) {
        apiCache.delete(key);
      }
    });
  },
  userById: (id: string) => {
    apiCache.delete(getCacheKey.userById(id));
  }
};