import { Injectable } from '@nestjs/common';
import { IParser, ParsedDocumentResult } from './parser.interface';

@Injectable()
export class PlainTextParser implements IParser {
  supports(contentType: string): boolean {
    return contentType.includes('text/plain') || true; // Fallback
  }

  async parse(rawContent: string | Buffer): Promise<ParsedDocumentResult> {
    const text = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
    return {
      title: 'Parsed Plain Text Document',
      sections: [{ sectionTitle: 'Content', paragraphIndex: 1, text: text.trim() }],
      rawText: text.trim(),
    };
  }
}
