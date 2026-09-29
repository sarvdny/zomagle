import { runtimeState } from '../state/RuntimeState.js';
import { SessionId, ChatMode, WaitingQueue } from '@shared/models.js';

export class QueueService {
  private static getQueue(mode: ChatMode): WaitingQueue {
    return runtimeState.getWaitingQueues()[mode];
  }

  public static add(mode: ChatMode, sessionId: SessionId): void {
    const queue = this.getQueue(mode);
    if (!queue.indexBySessionId.has(sessionId)) {
      queue.ids.push(sessionId);
      queue.indexBySessionId.set(sessionId, queue.ids.length - 1);
    }
  }

  public static remove(mode: ChatMode, sessionId: SessionId): void {
    const queue = this.getQueue(mode);
    const index = queue.indexBySessionId.get(sessionId);
    if (index !== undefined) {
      // Swap with last element for O(1) removal
      const lastId = queue.ids[queue.ids.length - 1];
      queue.ids[index] = lastId;
      queue.indexBySessionId.set(lastId, index);
      
      queue.ids.pop();
      queue.indexBySessionId.delete(sessionId);
    }
  }

  public static contains(mode: ChatMode, sessionId: SessionId): boolean {
    return this.getQueue(mode).indexBySessionId.has(sessionId);
  }

  public static getLength(mode: ChatMode): number {
    return this.getQueue(mode).ids.length;
  }

  public static getRandomPair(mode: ChatMode): [SessionId, SessionId] | null {
    const queue = this.getQueue(mode);
    if (queue.ids.length < 2) return null;

    const index1 = Math.floor(Math.random() * queue.ids.length);
    let index2 = Math.floor(Math.random() * queue.ids.length);
    while (index1 === index2) {
      index2 = Math.floor(Math.random() * queue.ids.length);
    }

    return [queue.ids[index1], queue.ids[index2]];
  }

  public static cleanupStale(mode: ChatMode): void {
    const queue = this.getQueue(mode);
    for (let i = queue.ids.length - 1; i >= 0; i--) {
      const sessionId = queue.ids[i];
      if (!runtimeState.getSession(sessionId)) {
        this.remove(mode, sessionId);
      }
    }
  }
}
