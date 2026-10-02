export interface FailedPage {
  url: string;
  reason: string;
}

/** Thrown when not a single page of a site could be analyzed. */
export class AnalysisFailedError extends Error {
  constructor(
    message: string,
    readonly failedPages: FailedPage[],
  ) {
    super(message);
    this.name = "AnalysisFailedError";
  }
}
