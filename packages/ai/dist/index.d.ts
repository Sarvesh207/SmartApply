import { ParsedResume, JobMatchResult } from '@smartapply/shared';
/**
 * Heuristically parses a PDF buffer (represented as a text stream) into structured details.
 * Falls back to a high-quality default profile if no text can be extracted.
 */
export declare function parseResume(pdfBuffer: Buffer): Promise<ParsedResume>;
/**
 * Matches a resume against a job description.
 * Formula: Skills (50%), Experience (30%), Location (10%), Salary (10%).
 */
export declare function matchJobWithResume(resume: ParsedResume, jobDescription: string, jobLocation?: string): Promise<JobMatchResult>;
