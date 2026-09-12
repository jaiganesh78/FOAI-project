import { Injectable } from '@nestjs/common';
import { IKnowledgeConnector } from './knowledge-connector.interface';
import { ApiConnector } from './api.connector';
import { WebScrapingConnector } from './web-scraping.connector';
import { PdfConnector } from './pdf.connector';
import { ManualUploadConnector } from './manual-upload.connector';
import { KnowledgeSource } from '@prisma/client';

@Injectable()
export class ConnectorFactory {
  private readonly connectors: IKnowledgeConnector[];

  constructor(
    apiConnector: ApiConnector,
    webScrapingConnector: WebScrapingConnector,
    pdfConnector: PdfConnector,
    manualUploadConnector: ManualUploadConnector,
  ) {
    this.connectors = [apiConnector, webScrapingConnector, pdfConnector, manualUploadConnector];
  }

  getConnectorForSource(source: KnowledgeSource): IKnowledgeConnector {
    const connector = this.connectors.find((c) => c.supports(source));
    return connector || this.connectors[1]; // Fallback to WebScrapingConnector
  }
}
