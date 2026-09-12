import { Injectable } from '@nestjs/common';
import { IParser, ParsedDocumentResult } from './parser.interface';

@Injectable()
export class XmlParser implements IParser {
  supports(contentType: string): boolean {
    return contentType.includes('xml');
  }

  async parse(rawContent: string | Buffer): Promise<ParsedDocumentResult> {
    const xmlStr = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
    const cleanText = xmlStr.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return {
      title: 'Parsed XML Document',
      sections: [{ sectionTitle: 'XML Data', paragraphIndex: 1, text: cleanText }],
      rawText: cleanText,
    };
  }
}
