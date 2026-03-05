// lib/agent/stream-manager.ts

export interface StreamState {
  abortController: AbortController;
  port: chrome.runtime.Port | null;
}

export class StreamManager {
  private activeStreams: Map<string, StreamState>;

  constructor() {
    this.activeStreams = new Map();
  }

  createStream(threadId: string, port: chrome.runtime.Port | null = null): AbortController {
    // If there is an existing stream for this thread, abort it first
    this.abortStream(threadId);

    const abortController = new AbortController();
    this.activeStreams.set(threadId, { abortController, port });
    return abortController;
  }

  getStream(threadId: string): StreamState | undefined {
    return this.activeStreams.get(threadId);
  }

  getPort(threadId: string): chrome.runtime.Port | null {
    const stream = this.activeStreams.get(threadId);
    return stream ? stream.port : null;
  }

  updatePort(threadId: string, port: chrome.runtime.Port | null): void {
    const stream = this.activeStreams.get(threadId);
    if (stream) {
      stream.port = port;
    }
  }

  abortStream(threadId: string): boolean {
    const stream = this.activeStreams.get(threadId);
    if (stream) {
      stream.abortController.abort();
      this.activeStreams.delete(threadId);
      return true;
    }
    return false;
  }

  deleteStream(threadId: string): void {
    this.activeStreams.delete(threadId);
  }

  clearDisconnectedPort(port: chrome.runtime.Port): void {
    for (const [threadId, state] of this.activeStreams.entries()) {
      if (state.port === port) {
        state.port = null;
      }
    }
  }
}

export const streamManager = new StreamManager();
