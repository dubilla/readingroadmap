import { type InsertLane, type InsertSwimlane } from "./schema";

// Default swimlane
export const DEFAULT_SWIMLANE: InsertSwimlane = {
  name: "General Reading",
  description: "General books to read",
  order: 0,
};

// Default lanes configuration for each swimlane
export const DEFAULT_SWIMLANE_LANES: InsertLane[] = [
  {
    name: "Backlog",
    description: "Books to read eventually",
    order: 0,
    type: "backlog",
    swimlaneId: null, // Will be set when creating
  },
  {
    name: "Currently Reading",
    description: "Books in progress",
    order: 1,
    type: "in-progress",
    swimlaneId: null, // Will be set when creating
  }
];

// Completed lane configuration (single lane for all completed books)
export const COMPLETED_LANE: InsertLane = {
  name: "Read",
  description: "Finished books",
  order: 999, // Always at the end
  type: "completed",
  swimlaneId: null // No swimlane for completed books
}; 