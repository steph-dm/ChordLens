import type { ChordTemplate, TemplateDefinition } from './chord-analyzer.js';
export const TEMPLATES: readonly ChordTemplate[];
export function compileTemplate(definition: TemplateDefinition): ChordTemplate;
export function compileTemplates(definitions: readonly TemplateDefinition[]): readonly ChordTemplate[];
