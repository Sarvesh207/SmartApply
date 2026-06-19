export interface AutofillData {
    fullName: string;
    email: string;
    phone: string;
    githubUrl: string;
    linkedinUrl: string;
    portfolioUrl?: string;
    yearsOfExperience: number;
}
export declare function runAutofill(jobUrl: string, userId: string): Promise<{
    success: boolean;
    message: string;
}>;
