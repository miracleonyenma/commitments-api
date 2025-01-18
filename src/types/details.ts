type DetailsConfig = {
  groupBy?: "priority" | "impact" | "author" | "type";
  format?: "markdown" | "html";
  includeStats?: boolean;
  includeFileChanges?: boolean;
  customTemplate?: string;
};

export type { DetailsConfig };
