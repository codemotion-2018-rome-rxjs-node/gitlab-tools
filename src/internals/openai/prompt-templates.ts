import fs from 'fs';

export type ExplainDiffPromptTemplateData = {
    language: string;
    fileName: string;
    fileContent: string;
    diffs: string;
};
export function fillPromptTemplateExplainDiffFromFile(templateFile: string, templateData: ExplainDiffPromptTemplateData) {
    const template = fs.readFileSync(templateFile, 'utf-8');
    return fillPromptTemplateExplainDiff(template, templateData);
}
export function fillPromptTemplateExplainDiff(template: string, templateData: ExplainDiffPromptTemplateData) {
    return fillPromptTemplate(template, templateData);
}

export function fillPromptTemplate(template: string, templateData: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, p1) => templateData[p1] || match);
}

export function fillPromptTemplateFromFile(templateFile: string, templateData: any): string {
    const template = fs.readFileSync(templateFile, 'utf-8');
    return fillPromptTemplate(template, templateData);
}