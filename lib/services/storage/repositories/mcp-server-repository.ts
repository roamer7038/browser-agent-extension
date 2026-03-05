import { BaseStorage, StorageError } from '../core/base-storage';
import { STORAGE_KEYS } from '../storage-keys';
import { McpServerConfigSchema, type McpServerConfig } from '@/lib/types/agent';
import { CryptoService } from '../../crypto/crypto-service';
import type { IMcpServerRepository } from '../interfaces';
import { BaseGenericRepository } from '../core/generic-repository';

const baseRepo = new BaseGenericRepository<McpServerConfig>(
  STORAGE_KEYS.MCP_SERVERS,
  McpServerConfigSchema,
  'MCP Server',
  'id'
);

async function encryptHeaders(servers: McpServerConfig[]): Promise<McpServerConfig[]> {
  return Promise.all(
    servers.map(async (server) => {
      if (server.headers) {
        const encryptedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(server.headers)) {
          if (value === '') {
            encryptedHeaders[key] = '';
            continue;
          }
          encryptedHeaders[key] = await CryptoService.encrypt(value);
        }
        return { ...server, headers: encryptedHeaders };
      }
      return server;
    })
  );
}

async function decryptHeaders(servers: McpServerConfig[]): Promise<McpServerConfig[]> {
  return Promise.all(
    servers.map(async (server) => {
      if (server.headers) {
        const decryptedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(server.headers)) {
          if (value === '') {
            decryptedHeaders[key] = '';
            continue;
          }
          decryptedHeaders[key] = await CryptoService.decrypt(value);
        }
        return { ...server, headers: decryptedHeaders };
      }
      return server;
    })
  );
}

export const McpServerRepository: IMcpServerRepository = {
  getAll: async (): Promise<McpServerConfig[]> => {
    try {
      const servers = await baseRepo.getAll();
      if (servers.length === 0) return [];
      return await decryptHeaders(servers);
    } catch (error) {
      throw new StorageError('Failed to get MCP servers', error);
    }
  },

  saveAll: async (servers: McpServerConfig[]): Promise<void> => {
    try {
      const serversWithEncryptedHeaders = await encryptHeaders(servers);
      await baseRepo.saveAll(serversWithEncryptedHeaders);
    } catch (error) {
      throw new StorageError('Failed to save MCP servers', error);
    }
  }
};
