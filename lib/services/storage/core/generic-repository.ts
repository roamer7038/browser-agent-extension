import { BaseStorage, StorageError } from './base-storage';
import { z } from 'zod';

/**
 * A generic repository for array-based storage that requires Zod validation.
 */
export class BaseGenericRepository<T> {
  constructor(
    private storageKey: string,
    private schema: z.ZodType<T>,
    private entityName: string,
    private idField: keyof T
  ) {}

  /**
   * Get all entities from storage.
   */
  async getAll(): Promise<T[]> {
    try {
      const data = await BaseStorage.get<unknown>(this.storageKey);
      if (!data) return [];

      const parsed = z.array(this.schema).safeParse(data);
      if (!parsed.success) {
        console.warn(`Invalid ${this.entityName}s found in storage, reverting to empty array`, parsed.error);
        return [];
      }
      return parsed.data;
    } catch (error) {
      throw new StorageError(`Failed to get ${this.entityName}s`, error);
    }
  }

  /**
   * Get an entity by its identifier.
   */
  async getById(id: string): Promise<T | null> {
    try {
      const entities = await this.getAll();
      return entities.find((e) => String(e[this.idField]) === id) || null;
    } catch (error) {
      throw new StorageError(`Failed to get ${this.entityName} by ID`, error);
    }
  }

  /**
   * Save an entity (create or update).
   */
  async save(entity: T): Promise<void> {
    try {
      const entities = await this.getAll();
      const entityId = String(entity[this.idField]);
      const idx = entities.findIndex((e) => String(e[this.idField]) === entityId);

      if (idx >= 0) {
        entities[idx] = entity;
      } else {
        entities.push(entity);
      }
      await BaseStorage.set(this.storageKey, entities);
    } catch (error) {
      throw new StorageError(`Failed to save ${this.entityName}`, error);
    }
  }

  /**
   * Delete an entity by its identifier.
   */
  async delete(id: string): Promise<void> {
    try {
      const entities = await this.getAll();
      const filtered = entities.filter((e) => String(e[this.idField]) !== id);
      await BaseStorage.set(this.storageKey, filtered);
    } catch (error) {
      throw new StorageError(`Failed to delete ${this.entityName}`, error);
    }
  }

  /**
   * Save multiple entities.
   */
  async saveAll(entities: T[]): Promise<void> {
    try {
      await BaseStorage.set(this.storageKey, entities);
    } catch (error) {
      throw new StorageError(`Failed to save all ${this.entityName}s`, error);
    }
  }
}
