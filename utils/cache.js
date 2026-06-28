class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key, options = {}) {
    const item = this.store.get(key);
    if (!item) return null;
    if (!options.allowExpired && Date.now() > item.expiresAt) return null;
    return item.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  async remember(key, ttlMs, fetcher) {
    const cached = this.get(key);
    if (cached) return cached;
    try {
      return this.set(key, await fetcher(), ttlMs);
    } catch (error) {
      const stale = this.get(key, { allowExpired: true });
      if (stale) return stale;
      throw error;
    }
  }
}
module.exports = new Cache();
