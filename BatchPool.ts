import {
  DocumentReference,
  getFirestore,
  SetOptions,
  UpdateData,
  WriteBatch,
  WriteResult,
} from 'firebase-admin/firestore';
import { BatchInfo } from './types';

const MAX_SIZE = 500;

export class BatchPool {
  pool: BatchInfo[] = [];

  constructor(private size: number = MAX_SIZE) {}

  private createBatchInfo = (): BatchInfo => {
    return {
      numberOfWrites: 0,
      batch: getFirestore().batch(),
    };
  };

  private getBatchInfo = () => {
    let batch = this.pool.find(
      (info) => info.numberOfWrites < Math.min(this.size, MAX_SIZE)
    );
    if (!batch) {
      batch = this.createBatchInfo();
      this.pool = [...this.pool, batch];
    }
    return batch;
  };

  private batch = () => {
    const info = this.getBatchInfo();
    info.numberOfWrites++;
    return info.batch;
  };

  // public interface

  create<T>(documentRef: DocumentReference<T>, data: T): WriteBatch {
    return this.batch().create(documentRef, data);
  }

  set<T>(
    documentRef: DocumentReference<T>,
    data: Partial<T>,
    options?: SetOptions
  ): WriteBatch {
    if (options) return this.batch().set(documentRef, data, options);
    else return this.batch().set(documentRef, data);
  }

  update(documentRef: DocumentReference<any>, data: UpdateData): WriteBatch {
    return this.batch().update(documentRef, data);
  }

  delete(documentRef: DocumentReference<any>): WriteBatch {
    return this.batch().delete(documentRef);
  }

  async commit(): Promise<WriteResult[]> {
    const commits = await Promise.all(
      this.pool.map((info) => info.batch.commit())
    );
    return commits.reduce((results, writes) => [...results, ...writes], []);
  }
}
