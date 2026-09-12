export interface ParsedDocumentResult {
  title: string;
  sections: {
    sectionTitle?: string;
    pageNumber?: number;
    paragraphIndex: number;
    text: string;
  }[];
  rawText: string;
}

export interface IParser {
  supports(contentType: string): boolean;
  parse(rawContent: string | Buffer): Promise<ParsedDocumentResult>;
}
