import { Injectable } from '@nestjs/common';
import { IParser } from './parser.interface';
import { PdfParser } from './pdf.parser';
import { HtmlParser } from './html.parser';
import { JsonParser } from './json.parser';
import { XmlParser } from './xml.parser';
import { PlainTextParser } from './plain-text.parser';

@Injectable()
export class ParserRegistry {
  private readonly parsers: IParser[];

  constructor(
    pdfParser: PdfParser,
    htmlParser: HtmlParser,
    jsonParser: JsonParser,
    xmlParser: XmlParser,
    plainTextParser: PlainTextParser,
  ) {
    this.parsers = [pdfParser, htmlParser, jsonParser, xmlParser, plainTextParser];
  }

  getParserForContentType(contentType: string): IParser {
    const parser = this.parsers.find((p) => p.supports(contentType));
    return parser || this.parsers[4]; // Fallback to PlainTextParser
  }
}
