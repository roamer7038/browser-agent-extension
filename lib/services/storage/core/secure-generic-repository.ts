import { BaseGenericRepository } from './generic-repository';
import { z } from 'zod';
import { CryptoService } from '../../crypto/crypto-service';
import { StorageError } from './base-storage';

/**
 * A generic repository for array-based storage that requires Zod validation and field encryption.
 */
export class SecureGenericRepository<T> extends BaseGenericRepository<T> {
  constructor(
    storageKey: string,
    schema: z.ZodType<T>,
    entityName: string,
    idField: keyof T,
    private fieldsToEncrypt: (keyof T)[]
  ) {
    super(storageKey, schema, entityName, idField);
  }

  /**
   * Encrypts the specified string fields of an entity.
   */
  private async encryptEntity(entity: T): Promise<T> {
    const encryptedEntity = { ...entity };
    for (const field of this.fieldsToEncrypt) {
      const value = entity[field];
      if (typeof value === 'string' && value) {
        encryptedEntity[field] = (await CryptoService.encrypt(value)) as any;
      }
    }
    return encryptedEntity;
  }

  /**
   * Decrypts the specified string fields of an entity.
   */
  private async decryptEntity(entity: T): Promise<T> {
    const decryptedEntity = { ...entity };
    for (const field of this.fieldsToEncrypt) {
      const value = entity[field];
      if (typeof value === 'string' && value) {
        decryptedEntity[field] = (await CryptoService.decrypt(value)) as any;
      }
    }
    return decryptedEntity;
  }

  override async getAll(): Promise<T[]> {
    try {
      const entities = await super.getAll();
      return await Promise.all(entities.map((e) => this.decryptEntity(e)));
    } catch (error) {
      throw new StorageError(`Failed to get and decrypt ${super['entityName']}s`, error);
    }
  }

  override async getById(id: string): Promise<T | null> {
    try {
      const entity = await super.getById(id);
      if (!entity) return null;
      return await this.decryptEntity(entity);
    } catch (error) {
      throw new StorageError(`Failed to get and decrypt ${super['entityName']} by ID`, error);
    }
  }

  override async save(entity: T): Promise<void> {
    try {
      const encryptedEntity = await this.encryptEntity(entity);
      await super.save(encryptedEntity);
    } catch (error) {
      throw new StorageError(`Failed to encrypt and save ${super['entityName']}`, error);
    }
  }

  override async saveAll(entities: T[]): Promise<void> {
    try {
      const encryptedEntities = await Promise.all(entities.map((e) => this.encryptEntity(e)));
      await super.saveAll(encryptedEntities);
    } catch (error) {
      throw new StorageError(`Failed to encrypt and save all ${super['entityName']}s`, error);
    }
  }
}
