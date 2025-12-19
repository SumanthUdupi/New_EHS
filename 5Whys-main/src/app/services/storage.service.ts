import { Injectable } from "@angular/core";
import { FiveWhysAnalysis } from "../models/five-whys.models";

@Injectable({
  providedIn: "root",
})
export class StorageService {
  private readonly STORAGE_KEY = "five-whys-analyses";
  private readonly DRAFT_KEY = "five-whys-draft";

  constructor() {}

  // Get all saved analyses
  getAllAnalyses(): FiveWhysAnalysis[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading analyses from storage:", error);
      return [];
    }
  }

  // Save an analysis
  saveAnalysis(analysis: FiveWhysAnalysis): void {
    try {
      const analyses = this.getAllAnalyses();
      const existingIndex = analyses.findIndex((a) => a.id === analysis.id);

      if (existingIndex >= 0) {
        analyses[existingIndex] = analysis;
      } else {
        analyses.push(analysis);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(analyses));
    } catch (error) {
      console.error("Error saving analysis to storage:", error);
    }
  }

  // Get a specific analysis by ID
  getAnalysis(id: string): FiveWhysAnalysis | null {
    const analyses = this.getAllAnalyses();
    return analyses.find((a) => a.id === id) || null;
  }

  // Delete an analysis
  deleteAnalysis(id: string): void {
    try {
      const analyses = this.getAllAnalyses();
      const filtered = analyses.filter((a) => a.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting analysis from storage:", error);
    }
  }

  // Save draft (for autosave)
  saveDraft(analysis: Partial<FiveWhysAnalysis>): void {
    try {
      const draftData = {
        ...analysis,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draftData));
    } catch (error) {
      console.error("Error saving draft to storage:", error);
    }
  }

  // Get saved draft
  getDraft(): Partial<FiveWhysAnalysis> | null {
    try {
      const stored = localStorage.getItem(this.DRAFT_KEY);
      if (!stored) return null;

      const draft = JSON.parse(stored);

      // Check if draft is recent (within 24 hours)
      if (draft.lastSaved) {
        const lastSaved = new Date(draft.lastSaved);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
          this.clearDraft();
          return null;
        }
      }

      return draft;
    } catch (error) {
      console.error("Error loading draft from storage:", error);
      return null;
    }
  }

  // Clear draft
  clearDraft(): void {
    try {
      localStorage.removeItem(this.DRAFT_KEY);
    } catch (error) {
      console.error("Error clearing draft from storage:", error);
    }
  }

  // Check if storage is available
  isStorageAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Export all data for backup
  exportData(): string {
    try {
      const data = {
        analyses: this.getAllAnalyses(),
        draft: this.getDraft(),
        exportDate: new Date().toISOString(),
        version: "1.0",
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Error exporting data:", error);
      return "";
    }
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.analyses && Array.isArray(data.analyses)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.analyses));
      }

      if (data.draft) {
        localStorage.setItem(this.DRAFT_KEY, JSON.stringify(data.draft));
      }

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }
}
