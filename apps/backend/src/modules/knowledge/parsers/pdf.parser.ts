import { Injectable } from '@nestjs/common';
import { IParser, ParsedDocumentResult } from './parser.interface';

@Injectable()
export class PdfParser implements IParser {
  supports(contentType: string): boolean {
    return contentType.includes('pdf');
  }

  async parse(rawContent: string | Buffer): Promise<ParsedDocumentResult> {
    const text = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
    return {
      title: 'Parsed Gazette PDF Document',
      sections: [
        {
          sectionTitle: 'Gazette Section 1',
          pageNumber: 1,
          paragraphIndex: 1,
          text: text.replace(/%PDF-[0-9.]+/g, '').trim(),
        },
      ],
      rawText: text,
    };
  }
}
