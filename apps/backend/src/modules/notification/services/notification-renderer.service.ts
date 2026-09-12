import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { createHash } from 'crypto';

@Injectable()
export class NotificationRendererService {
  private readonly maxRenderedLength = 2000;

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  sanitizeText(text: string): string {
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }

  getTemplateChecksum(data: unknown): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async renderTemplate(params: {
    templateId: string;
    version: number;
    locale?: string;
    parameters: Record<string, unknown>;
  }): Promise<{
    title: string;
    body: string;
    actionUrl?: string;
    templateChecksumSha256: string;
    checksumSha256: string;
  }> {
    const locale = params.locale || 'en-IN';
    const tpl = await this.repo.findActiveTemplateVersion(params.templateId, params.version, locale);
    if (!tpl) {
      throw new BadRequestException(
        `Template Version Error: Template '${params.templateId}' v${params.version} [${locale}] not found.`,
      );
    }

    let title = tpl.titleTemplate;
    let body = tpl.bodyTemplate;
    let actionUrl = tpl.actionUrlTemplate || '';

    // Interpolate variables {{variableName}}
    for (const [key, value] of Object.entries(params.parameters)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const safeVal = this.sanitizeText(String(value ?? ''));
      title = title.replace(placeholder, safeVal);
      body = body.replace(placeholder, safeVal);
      if (actionUrl) {
        actionUrl = actionUrl.replace(placeholder, safeVal);
      }
    }

    // Check for unrendered placeholders
    if (/{{.*}}/.test(title) || /{{.*}}/.test(body)) {
      throw new BadRequestException(
        `Template Rendering Error: Unresolved placeholders remain in rendered output for template '${params.templateId}'.`,
      );
    }

    if (body.length > this.maxRenderedLength) {
      throw new BadRequestException(
        `Template Length Violation: Rendered body exceeds maximum length of ${this.maxRenderedLength} characters.`,
      );
    }

    const payload = { title, body, actionUrl, templateId: params.templateId, version: params.version, locale };
    const checksumSha256 = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    return {
      title,
      body,
      actionUrl: actionUrl || undefined,
      templateChecksumSha256: tpl.checksumSha256,
      checksumSha256,
    };
  }
}
