import { describe, it, expect, beforeEach } from 'vitest';
import { QueueService } from '../services/QueueService.js';
import { runtimeState } from '../state/RuntimeState.js';

describe('QueueService', () => {
  beforeEach(() => {
    // Reset state before each test
    runtimeState.getWaitingQueues().text.ids = [];
    runtimeState.getWaitingQueues().text.indexBySessionId.clear();
    runtimeState.getWaitingQueues().video.ids = [];
    runtimeState.getWaitingQueues().video.indexBySessionId.clear();
  });


  it('should add to queue', () => {
    QueueService.add('text', 'session1');
    expect(QueueService.getLength('text')).toBe(1);
  });

  it('should not add duplicates', () => {
    QueueService.add('text', 'session1');
    QueueService.add('text', 'session1');
    expect(QueueService.getLength('text')).toBe(1);
  });

  it('should remove from queue', () => {
    QueueService.add('video', 'session2');
    QueueService.remove('video', 'session2');
    expect(QueueService.getLength('video')).toBe(0);
  });

  it('should get random pair when 2 or more exist', () => {
    QueueService.add('text', 's1');
    QueueService.add('text', 's2');
    QueueService.add('text', 's3');
    
    const pair = QueueService.getRandomPair('text');
    expect(pair).toBeTruthy();
    expect(pair!.length).toBe(2);
    expect(pair![0]).not.toBe(pair![1]);
  });
});
