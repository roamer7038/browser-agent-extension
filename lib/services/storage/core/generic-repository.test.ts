import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { BaseGenericRepository } from '@/lib/services/storage/core/generic-repository';
import { z } from 'zod';

const TestEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number()
});

type TestEntity = z.infer<typeof TestEntitySchema>;

const STORAGE_KEY = 'test_entities';

function createRepo(): BaseGenericRepository<TestEntity> {
  return new BaseGenericRepository<TestEntity>(STORAGE_KEY, TestEntitySchema, 'TestEntity', 'id');
}

describe('BaseGenericRepository', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe('getAll', () => {
    it('should return empty array when no data exists', async () => {
      const repo = createRepo();
      const result = await repo.getAll();
      expect(result).toEqual([]);
    });

    it('should return stored entities', async () => {
      const entities: TestEntity[] = [
        { id: '1', name: 'First', value: 10 },
        { id: '2', name: 'Second', value: 20 }
      ];
      await chrome.storage.local.set({ [STORAGE_KEY]: entities });

      const repo = createRepo();
      const result = await repo.getAll();
      expect(result).toEqual(entities);
    });

    it('should return empty array for invalid data (Zod validation failure)', async () => {
      await chrome.storage.local.set({ [STORAGE_KEY]: [{ invalid: true }] });

      const repo = createRepo();
      const result = await repo.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should find entity by id', async () => {
      const entities: TestEntity[] = [
        { id: '1', name: 'First', value: 10 },
        { id: '2', name: 'Second', value: 20 }
      ];
      await chrome.storage.local.set({ [STORAGE_KEY]: entities });

      const repo = createRepo();
      const result = await repo.getById('2');
      expect(result).toEqual({ id: '2', name: 'Second', value: 20 });
    });

    it('should return null for non-existent id', async () => {
      const repo = createRepo();
      const result = await repo.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create new entity', async () => {
      const repo = createRepo();
      const entity: TestEntity = { id: '1', name: 'New', value: 100 };
      await repo.save(entity);

      const result = await repo.getAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(entity);
    });

    it('should update existing entity by id', async () => {
      const repo = createRepo();
      await repo.save({ id: '1', name: 'Original', value: 10 });
      await repo.save({ id: '1', name: 'Updated', value: 99 });

      const result = await repo.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Updated');
      expect(result[0].value).toBe(99);
    });

    it('should add multiple entities with different ids', async () => {
      const repo = createRepo();
      await repo.save({ id: '1', name: 'A', value: 1 });
      await repo.save({ id: '2', name: 'B', value: 2 });

      const result = await repo.getAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('should remove entity by id', async () => {
      const repo = createRepo();
      await repo.save({ id: '1', name: 'A', value: 1 });
      await repo.save({ id: '2', name: 'B', value: 2 });

      await repo.delete('1');

      const result = await repo.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should handle deleting non-existent entity', async () => {
      const repo = createRepo();
      await repo.save({ id: '1', name: 'A', value: 1 });

      await repo.delete('nonexistent');

      const result = await repo.getAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('saveAll', () => {
    it('should replace all entities', async () => {
      const repo = createRepo();
      await repo.save({ id: '1', name: 'Old', value: 1 });

      const newEntities: TestEntity[] = [
        { id: '2', name: 'New A', value: 10 },
        { id: '3', name: 'New B', value: 20 }
      ];
      await repo.saveAll(newEntities);

      const result = await repo.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });
  });
});
