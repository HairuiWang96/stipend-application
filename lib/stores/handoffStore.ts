import { HandoffRecord } from "../types";

class HandoffStore {
  private records = new Map<string, HandoffRecord>();

  save(record: HandoffRecord): void {
    this.records.set(record.applicationId, record);
  }

  getById(id: string): HandoffRecord | undefined {
    return this.records.get(id);
  }

  getAll(): HandoffRecord[] {
    return Array.from(this.records.values());
  }

  clear(): void {
    this.records.clear();
  }
}

export const handoffStore = new HandoffStore();
