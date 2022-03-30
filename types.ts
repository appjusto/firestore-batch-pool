import { WriteBatch } from 'firebase-admin/firestore';

export interface BatchInfo {
  batch: WriteBatch;
  numberOfWrites: number;
}
