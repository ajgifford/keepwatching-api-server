// src/services/cacheService.ts
import { cliLogger } from '../logger/logger';
import NodeCache from 'node-cache';

/**
 * Service for handling caching operations across the application
 * Provides consistent interface for cache operations with logging and error handling
 */
export class CacheService {
  private cache: NodeCache;

  /**
   * Creates a new CacheService instance
   * @param stdTTL - Standard TTL in seconds (default: 300 - 5 minutes)
   * @param checkperiod - Period in seconds for automatic delete check (default: 600 - 10 minutes)
   */
  constructor(stdTTL = 300, checkperiod = 600) {
    this.cache = new NodeCache({
      stdTTL,
      checkperiod,
      useClones: false,
    });
  }

  /**
   * Gets a value from cache if it exists, or executes the provided function
   * and stores its result in the cache
   *
   * @param key - Cache key
   * @param fn - Function to execute if cache miss
   * @param ttl - TTL override for this specific item, defaults to 5 minutes
   * @returns The cached or newly computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl: number = 300): Promise<T> {
    const cachedValue = this.cache.get<T>(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    try {
      const value = await fn();
      this.cache.set(key, value, ttl);
      return value;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a value from cache
   *
   * @param key - Cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Sets a value in the cache
   *
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - TTL override for this specific item, defaults to 5 minutes
   * @returns True if successful, false otherwise
   */
  set<T>(key: string, value: T, ttl: number = 300): boolean {
    return this.cache.set(key, value, ttl);
  }

  /**
   * Removes a value from the cache
   *
   * @param key - Cache key to invalidate
   * @returns Number of items deleted (0 or 1)
   */
  invalidate(key: string): number {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      cliLogger.info(`Invalidated cache key: ${key}`);
    }
    return deleted;
  }

  /**
   * Removes all values with keys matching a specific pattern
   *
   * @param pattern - String pattern to match against keys
   * @returns Number of items deleted
   */
  invalidatePattern(pattern: string): number {
    const keys = this.cache.keys().filter((key) => key.includes(pattern));

    if (keys.length > 0) {
      keys.forEach((key) => this.cache.del(key));
    }

    return keys.length;
  }

  /**
   * Flushes the entire cache
   */
  flushAll(): void {
    this.cache.flushAll();
  }

  /**
   * Gets statistics about the cache
   *
   * @returns Object with cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Gets all keys currently in the cache
   *
   * @returns Array of cache keys
   */
  keys(): string[] {
    return this.cache.keys();
  }
}

// Export a singleton instance for global use
export const cacheService = new CacheService();
