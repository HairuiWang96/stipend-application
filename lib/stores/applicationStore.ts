import { Application } from "../types";

class ApplicationStore {
  private applications = new Map<string, Application>();

  save(application: Application): void {
    this.applications.set(application.applicationId, application);
  }

  getById(id: string): Application | undefined {
    return this.applications.get(id);
  }

  getAll(): Application[] {
    return Array.from(this.applications.values());
  }

  clear(): void {
    this.applications.clear();
  }
}

export const applicationStore = new ApplicationStore();
