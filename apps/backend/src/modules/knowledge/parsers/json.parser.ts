import { Injectable } from '@nestjs/common';
import { IParser, ParsedDocumentResult } from './parser.interface';

@Injectable()
export class JsonParser implements IParser {
  supports(contentType: string): boolean {
    return contentType.includes('json');
  }

  async parse(rawContent: string | Buffer): Promise<ParsedDocumentResult> {
    const str = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
    const parsed = JSON.parse(str);
    const text = typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed);

    return {
      title: parsed.scheme || parsed.title || 'Parsed JSON Directive',
      sections: [
        {
          sectionTitle: 'JSON Details',
          paragraphIndex: 1,
          text,
        },
      ],
      rawText: text,
    };
  }
}
