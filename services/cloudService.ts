import { SavedProject, UserProfile } from "../types";

// This simulates a backend database using a separate LocalStorage namespace.
// In a real app, this would use fetch() to talk to a REST or GraphQL API.

export const cloudService = {
  /**
   * Simulates fetching data from the server for a specific user.
   */
  async fetchCloudProjects(user: UserProfile): Promise<SavedProject[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const key = `tempo_cloud_${user.email}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Simulates saving data to the server.
   */
  async saveCloudProjects(user: UserProfile, projects: SavedProject[]): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const key = `tempo_cloud_${user.email}`;
    localStorage.setItem(key, JSON.stringify(projects));
  },

  /**
   * Merges local and cloud projects.
   * Strategy: Union by ID. If conflict, pick the one with later updatedAt.
   */
  mergeProjects(local: SavedProject[], cloud: SavedProject[]): SavedProject[] {
    const mergedMap = new Map<string, SavedProject>();

    // Add all local
    local.forEach(p => mergedMap.set(p.id, p));

    // Merge cloud
    cloud.forEach(p => {
      const existing = mergedMap.get(p.id);
      if (existing) {
        const localTime = new Date(existing.updatedAt || existing.createdAt).getTime();
        const cloudTime = new Date(p.updatedAt || p.createdAt).getTime();
        
        if (cloudTime > localTime) {
          mergedMap.set(p.id, p);
        }
      } else {
        mergedMap.set(p.id, p);
      }
    });

    return Array.from(mergedMap.values());
  }
};