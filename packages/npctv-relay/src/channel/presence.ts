/**
 * NPC.tv Relay — Presence Tracker
 *
 * Tracks live viewer counts per channel. Counts are incremented
 * when an SSE connection opens and decremented when it closes.
 */

export class PresenceTracker {
  private counts = new Map<string, number>();

  /** Increment viewer count for a channel. Returns the new count. */
  increment(channelId: string): number {
    const current = this.counts.get(channelId) ?? 0;
    const next = current + 1;
    this.counts.set(channelId, next);
    return next;
  }

  /** Decrement viewer count for a channel. Returns the new count. */
  decrement(channelId: string): number {
    const current = this.counts.get(channelId) ?? 0;
    const next = Math.max(0, current - 1);

    if (next === 0) {
      this.counts.delete(channelId);
    } else {
      this.counts.set(channelId, next);
    }

    return next;
  }

  /** Get current viewer count for a channel */
  getCount(channelId: string): number {
    return this.counts.get(channelId) ?? 0;
  }

  /** Get total viewers across all channels */
  get totalViewers(): number {
    let total = 0;
    for (const count of this.counts.values()) {
      total += count;
    }
    return total;
  }

  /** Remove all counts for a channel (e.g., on deregister) */
  clear(channelId: string): void {
    this.counts.delete(channelId);
  }
}
