import { describe, it, expect, beforeEach } from 'vitest';
import { StreamManager } from '@/lib/agent/stream-manager';

describe('StreamManager', () => {
  let manager: StreamManager;

  beforeEach(() => {
    manager = new StreamManager();
  });

  describe('createStream', () => {
    it('should create a new stream and return an AbortController', () => {
      const controller = manager.createStream('thread-1');
      expect(controller).toBeInstanceOf(AbortController);
    });

    it('should store the stream so it can be retrieved', () => {
      manager.createStream('thread-1');
      const stream = manager.getStream('thread-1');
      expect(stream).toBeDefined();
      expect(stream?.abortController).toBeInstanceOf(AbortController);
    });

    it('should abort existing stream if creating one with the same threadId', () => {
      const firstController = manager.createStream('thread-1');
      const secondController = manager.createStream('thread-1');

      expect(firstController.signal.aborted).toBe(true);
      expect(secondController.signal.aborted).toBe(false);
    });

    it('should associate port with the stream', () => {
      const mockPort = { name: 'test' } as unknown as chrome.runtime.Port;
      manager.createStream('thread-1', mockPort);

      expect(manager.getPort('thread-1')).toBe(mockPort);
    });
  });

  describe('getStream', () => {
    it('should return undefined for non-existent stream', () => {
      expect(manager.getStream('nonexistent')).toBeUndefined();
    });
  });

  describe('getPort', () => {
    it('should return null for non-existent stream', () => {
      expect(manager.getPort('nonexistent')).toBeNull();
    });

    it('should return null when stream has no port', () => {
      manager.createStream('thread-1');
      expect(manager.getPort('thread-1')).toBeNull();
    });
  });

  describe('updatePort', () => {
    it('should update the port on an existing stream', () => {
      manager.createStream('thread-1');
      const mockPort = { name: 'new-port' } as unknown as chrome.runtime.Port;
      manager.updatePort('thread-1', mockPort);

      expect(manager.getPort('thread-1')).toBe(mockPort);
    });

    it('should do nothing for non-existent stream', () => {
      const mockPort = { name: 'port' } as unknown as chrome.runtime.Port;
      // Should not throw
      expect(() => manager.updatePort('nonexistent', mockPort)).not.toThrow();
    });
  });

  describe('abortStream', () => {
    it('should abort and remove the stream, returning true', () => {
      const controller = manager.createStream('thread-1');
      const result = manager.abortStream('thread-1');

      expect(result).toBe(true);
      expect(controller.signal.aborted).toBe(true);
      expect(manager.getStream('thread-1')).toBeUndefined();
    });

    it('should return false for non-existent stream', () => {
      expect(manager.abortStream('nonexistent')).toBe(false);
    });
  });

  describe('deleteStream', () => {
    it('should remove the stream without aborting', () => {
      const controller = manager.createStream('thread-1');
      manager.deleteStream('thread-1');

      expect(manager.getStream('thread-1')).toBeUndefined();
      // deleteStream does NOT abort, the controller remains non-aborted
      expect(controller.signal.aborted).toBe(false);
    });
  });

  describe('clearDisconnectedPort', () => {
    it('should set port to null for all streams using the disconnected port', () => {
      const mockPort = { name: 'shared-port' } as unknown as chrome.runtime.Port;
      manager.createStream('thread-1', mockPort);
      manager.createStream('thread-2', mockPort);
      manager.createStream('thread-3');

      manager.clearDisconnectedPort(mockPort);

      expect(manager.getPort('thread-1')).toBeNull();
      expect(manager.getPort('thread-2')).toBeNull();
      expect(manager.getPort('thread-3')).toBeNull();
    });

    it('should not affect streams with different ports', () => {
      const portA = { name: 'A' } as unknown as chrome.runtime.Port;
      const portB = { name: 'B' } as unknown as chrome.runtime.Port;
      manager.createStream('thread-1', portA);
      manager.createStream('thread-2', portB);

      manager.clearDisconnectedPort(portA);

      expect(manager.getPort('thread-1')).toBeNull();
      expect(manager.getPort('thread-2')).toBe(portB);
    });
  });
});
