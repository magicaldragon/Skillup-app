// dataSyncService.ts - Comprehensive data synchronization service for Firebase/Firestore
import { usersAPI, classesAPI, levelsAPI, assignmentsAPI } from './apiService';

// Data synchronization configuration - removed unused constants

// Synchronization status tracking
interface SyncStatus {
  entity: string;
  operation: 'create' | 'update' | 'delete' | 'bulk';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  total: number;
  errors: string[];
  startTime: number;
  endTime?: number;
}

// Data validation interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Enhanced error handling for data operations
export class DataSyncError extends Error {
  constructor(
    message: string,
    public operation: string,
    public entity: string,
    public originalError?: Error,
    public rollbackData?: any
  ) {
    super(message);
    this.name = 'DataSyncError';
  }
}

// Data synchronization service
export class DataSyncService {
  private static instance: DataSyncService;
  private syncStatus: Map<string, SyncStatus> = new Map();

  private constructor() {}

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  // Get synchronization status
  getSyncStatus(entity?: string): SyncStatus[] {
    if (entity) {
      return Array.from(this.syncStatus.values()).filter(status => status.entity === entity);
    }
    return Array.from(this.syncStatus.values());
  }

  // Validate data before synchronization
  private validateData<T>(data: T, entity: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push(`${entity}: Data is null or undefined`);
      return { isValid: false, errors, warnings };
    }

    if (typeof data === 'object') {
      // Check for required fields based on entity type
      switch (entity) {
        case 'user':
          if (!('email' in data) || !('name' in data)) {
            errors.push(`${entity}: Missing required fields (email, name)`);
          }
          break;
        case 'class':
          if (!('name' in data) || !('levelId' in data)) {
            errors.push(`${entity}: Missing required fields (name, levelId)`);
          }
          break;
        case 'assignment':
          if (!('title' in data) || !('classId' in data)) {
            errors.push(`${entity}: Missing required fields (title, classId)`);
          }
          break;
      }

      // Check for data integrity
      Object.entries(data).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          warnings.push(`${entity}: Field '${key}' is null or undefined`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Queue operation for processing - removed unused methods

  // Create entity with rollback support
  async createEntity<T>(
    entity: string,
    data: T,
    apiMethod: (data: T) => Promise<any>
  ): Promise<any> {
    const syncId = `${entity}_create_${Date.now()}`;
    const syncStatus: SyncStatus = {
      entity,
      operation: 'create',
      status: 'pending',
      progress: 0,
      total: 1,
      errors: [],
      startTime: Date.now(),
    };

    this.syncStatus.set(syncId, syncStatus);

    try {
      // Validate data
      const validation = this.validateData(data, entity);
      if (!validation.isValid) {
        throw new DataSyncError(
          `Validation failed: ${validation.errors.join(', ')}`,
          'create',
          entity
        );
      }

      // Update status
      syncStatus.status = 'in_progress';
      syncStatus.progress = 50;

      // Perform creation
      const result = await apiMethod(data);

      // Update status
      syncStatus.status = 'completed';
      syncStatus.progress = 100;
      syncStatus.endTime = Date.now();

      console.log(`${entity} created successfully:`, result);
      return result;

    } catch (error) {
      // Update status
      syncStatus.status = 'failed';
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      syncStatus.endTime = Date.now();

      // Attempt rollback if possible
      await this.rollbackCreate(entity, data);

      throw new DataSyncError(
        `Failed to create ${entity}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'create',
        entity,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Update entity with rollback support
  async updateEntity<T>(
    entity: string,
    id: string,
    data: T,
    apiMethod: (id: string, data: T) => Promise<any>
  ): Promise<any> {
    const syncId = `${entity}_update_${id}_${Date.now()}`;
    const syncStatus: SyncStatus = {
      entity,
      operation: 'update',
      status: 'pending',
      progress: 0,
      total: 1,
      errors: [],
      startTime: Date.now(),
    };

    this.syncStatus.set(syncId, syncStatus);

    // Declare currentData outside try block so it's accessible in catch block
    let currentData: any = null;

    try {
      // Validate data
      const validation = this.validateData(data, entity);
      if (!validation.isValid) {
        throw new DataSyncError(
          `Validation failed: ${validation.errors.join(', ')}`,
          'update',
          entity
        );
      }

      // Get current data for rollback
      currentData = await this.getCurrentData(entity, id);

      // Update status
      syncStatus.status = 'in_progress';
      syncStatus.progress = 50;

      // Perform update
      const result = await apiMethod(id, data);

      // Update status
      syncStatus.status = 'completed';
      syncStatus.progress = 100;
      syncStatus.endTime = Date.now();

      console.log(`${entity} updated successfully:`, result);
      return result;

    } catch (error) {
      // Update status
      syncStatus.status = 'failed';
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      syncStatus.endTime = Date.now();

      // Attempt rollback
      if (currentData) {
        await this.rollbackUpdate(entity, id, currentData);
      }

      throw new DataSyncError(
        `Failed to update ${entity}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'update',
        entity,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Delete entity with rollback support
  async deleteEntity(
    entity: string,
    id: string,
    apiMethod: (id: string) => Promise<any>
  ): Promise<any> {
    const syncId = `${entity}_delete_${id}_${Date.now()}`;
    const syncStatus: SyncStatus = {
      entity,
      operation: 'delete',
      status: 'pending',
      progress: 0,
      total: 1,
      errors: [],
      startTime: Date.now(),
    };

    this.syncStatus.set(syncId, syncStatus);

    try {
      // Update status
      syncStatus.status = 'in_progress';
      syncStatus.progress = 50;

      // Perform deletion
      const result = await apiMethod(id);

      // Update status
      syncStatus.status = 'completed';
      syncStatus.progress = 100;
      syncStatus.endTime = Date.now();

      console.log(`${entity} deleted successfully:`, result);
      return result;

    } catch (error) {
      // Update status
      syncStatus.status = 'failed';
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      syncStatus.endTime = Date.now();

      throw new DataSyncError(
        `Failed to delete ${entity}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'delete',
        entity,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Bulk operations with transaction support
  async bulkOperation<T>(
    entity: string,
    operations: Array<{ type: 'create' | 'update' | 'delete'; data: T; id?: string }>,
    apiMethods: {
      create: (data: T) => Promise<any>;
      update: (id: string, data: T) => Promise<any>;
      delete: (id: string) => Promise<any>;
    }
  ): Promise<any[]> {
    const syncId = `${entity}_bulk_${Date.now()}`;
    const syncStatus: SyncStatus = {
      entity,
      operation: 'bulk',
      status: 'pending',
      progress: 0,
      total: operations.length,
      errors: [],
      startTime: Date.now(),
    };

    this.syncStatus.set(syncId, syncStatus);

    const results: any[] = [];
    const rollbackData: Array<{ type: string; data: any; id?: string }> = [];

    try {
      // Update status
      syncStatus.status = 'in_progress';

      // Process operations sequentially to maintain consistency
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        try {
          let result: any;

          switch (operation.type) {
            case 'create':
              result = await apiMethods.create(operation.data);
              rollbackData.push({ type: 'delete', data: result, id: result.id || result._id });
              break;
            case 'update':
              if (!operation.id) throw new Error('ID required for update operation');
              const currentData = await this.getCurrentData(entity, operation.id);
              rollbackData.push({ type: 'update', data: currentData, id: operation.id });
              result = await apiMethods.update(operation.id, operation.data);
              break;
            case 'delete':
              if (!operation.id) throw new Error('ID required for delete operation');
              const deletedData = await this.getCurrentData(entity, operation.id);
              rollbackData.push({ type: 'create', data: deletedData, id: operation.id });
              result = await apiMethods.delete(operation.id);
              break;
          }

          results.push(result);
          
          // Update progress
          syncStatus.progress = ((i + 1) / operations.length) * 100;

        } catch (error) {
          // Log error but continue with other operations
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          syncStatus.errors.push(`Operation ${i + 1} failed: ${errorMsg}`);
          console.error(`Bulk operation ${i + 1} failed:`, error);
        }
      }

      // Update status
      syncStatus.status = 'completed';
      syncStatus.endTime = Date.now();

      console.log(`Bulk ${entity} operations completed:`, results.length, 'successful');
      return results;

    } catch (error) {
      // Update status
      syncStatus.status = 'failed';
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      syncStatus.endTime = Date.now();

      // Attempt rollback
      await this.rollbackBulkOperation(entity, rollbackData, apiMethods);

      throw new DataSyncError(
        `Bulk ${entity} operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'bulk',
        entity,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Get current data for rollback purposes
  private async getCurrentData(entity: string, id: string): Promise<any> {
    try {
      switch (entity) {
        case 'user':
          return await usersAPI.getUserById(id);
        case 'class':
          return await classesAPI.getClassById(id);
        case 'assignment':
          return await assignmentsAPI.getAssignmentById(id);
        case 'level':
          return await levelsAPI.getLevelById(id);
        default:
          console.warn(`Unknown entity type for rollback: ${entity}`);
          return null;
      }
    } catch (error) {
      console.warn(`Failed to get current data for rollback: ${entity}/${id}`, error);
      return null;
    }
  }

  // Rollback create operation
  private async rollbackCreate(entity: string, data: any): Promise<void> {
    try {
      // For create operations, we can't easily rollback without the created ID
      // Log the rollback attempt for manual intervention
      console.warn(`Rollback required for ${entity} create operation:`, data);
    } catch (error) {
      console.error(`Rollback failed for ${entity} create operation:`, error);
    }
  }

  // Rollback update operation
  private async rollbackUpdate(entity: string, id: string, originalData: any): Promise<void> {
    try {
      switch (entity) {
        case 'user':
          await usersAPI.updateUser(id, originalData);
          break;
        case 'class':
          await classesAPI.updateClass(id, originalData);
          break;
        case 'assignment':
          await assignmentsAPI.updateAssignment(id, originalData);
          break;
        case 'level':
          await levelsAPI.updateLevel(id, originalData);
          break;
      }
      console.log(`Rollback successful for ${entity} update: ${id}`);
    } catch (error) {
      console.error(`Rollback failed for ${entity} update: ${id}`, error);
    }
  }

  // Rollback bulk operations
  private async rollbackBulkOperation(
    entity: string,
    rollbackData: Array<{ type: string; data: any; id?: string }>,
    apiMethods: any
  ): Promise<void> {
    try {
      console.log(`Starting rollback for ${entity} bulk operation...`);
      
      for (const rollback of rollbackData) {
        try {
          switch (rollback.type) {
            case 'create':
              if (rollback.id) {
                await apiMethods.create(rollback.data);
              }
              break;
            case 'update':
              if (rollback.id) {
                await apiMethods.update(rollback.id, rollback.data);
              }
              break;
            case 'delete':
              if (rollback.id) {
                await apiMethods.delete(rollback.id);
              }
              break;
          }
        } catch (error) {
          console.error(`Rollback operation failed for ${rollback.type}:`, error);
        }
      }
      
      console.log(`Rollback completed for ${entity} bulk operation`);
    } catch (error) {
      console.error(`Rollback failed for ${entity} bulk operation:`, error);
    }
  }

  // Clean up old sync status entries
  cleanupOldStatus(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    for (const [id, status] of this.syncStatus.entries()) {
      if (status.endTime && status.endTime < cutoffTime) {
        this.syncStatus.delete(id);
      }
    }
  }

  // Get operation statistics
  getOperationStats(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    inProgress: number;
  } {
    const stats = {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      inProgress: 0,
    };

    for (const status of this.syncStatus.values()) {
      stats.total++;
      switch (status.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const dataSyncService = DataSyncService.getInstance();

// Convenience functions for common operations
export const syncUsers = {
  create: (data: any) => dataSyncService.createEntity('user', data, usersAPI.createUser),
  update: (id: string, data: any) => dataSyncService.updateEntity('user', id, data, usersAPI.updateUser),
  delete: (id: string) => dataSyncService.deleteEntity('user', id, usersAPI.deleteUser),
  bulk: (operations: Array<{ type: 'create' | 'update' | 'delete'; data: any; id?: string }>) =>
    dataSyncService.bulkOperation('user', operations, {
      create: usersAPI.createUser,
      update: (id: string, data: any) => usersAPI.updateUser(id, data),
      delete: (id: string) => usersAPI.deleteUser(id),
    }),
};

export const syncClasses = {
  create: (data: any) => dataSyncService.createEntity('class', data, classesAPI.createClass),
  update: (id: string, data: any) => dataSyncService.updateEntity('class', id, data, classesAPI.updateClass),
  delete: (id: string) => dataSyncService.deleteEntity('class', id, classesAPI.deleteClass),
  bulk: (operations: Array<{ type: 'create' | 'update' | 'delete'; data: any; id?: string }>) =>
    dataSyncService.bulkOperation('class', operations, {
      create: classesAPI.createClass,
      update: (id: string, data: any) => classesAPI.updateClass(id, data),
      delete: (id: string) => classesAPI.deleteClass(id),
    }),
};

export const syncAssignments = {
  create: (data: any) => dataSyncService.createEntity('assignment', data, assignmentsAPI.createAssignment),
  update: (id: string, data: any) => dataSyncService.updateEntity('assignment', id, data, assignmentsAPI.updateAssignment),
  delete: (id: string) => dataSyncService.deleteEntity('assignment', id, assignmentsAPI.deleteAssignment),
  bulk: (operations: Array<{ type: 'create' | 'update' | 'delete'; data: any; id?: string }>) =>
    dataSyncService.bulkOperation('assignment', operations, {
      create: assignmentsAPI.createAssignment,
      update: (id: string, data: any) => assignmentsAPI.updateAssignment(id, data),
      delete: (id: string) => assignmentsAPI.deleteAssignment(id),
    }),
}; 