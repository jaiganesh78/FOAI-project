import { Injectable } from '@nestjs/common';
import { IParser, ParsedDocumentResult } from './parser.interface';

@Injectable()
export class HtmlParser implements IParser {
  supports(contentType: string): boolean {
    return contentType.includes('html');
  }

  async parse(rawContent: string | Buffer): Promise<ParsedDocumentResult> {
    const htmlStr = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
    // Strip HTML tags deterministically for clean text extraction
    const cleanText = htmlStr.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

    return {
      title: 'Parsed HTML Document',
      sections: [
        {
          sectionTitle: 'Main Body',
          pageNumber: 1,
          paragraphIndex: 1,
          text: cleanText,
        },
      ],
      rawText: cleanText,
    };
  }
}
