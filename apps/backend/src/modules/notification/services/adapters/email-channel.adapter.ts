import { Injectable } from '@nestjs/common';
import { OutboundMessageDto, OutboundMetadataDto, DeliveryResultDto, NotificationChannel } from '@gpios/shared';

@Injectable()
export class EmailChannelAdapter {
  readonly channel = NotificationChannel.EMAIL;

  async send(message: OutboundMessageDto, _metadata: OutboundMetadataDto): Promise<DeliveryResultDto> {
    const startTime = Date.now();
    return {
      success: true,
      providerMessageId: `email_msg_${message.deliveryIdempotencyKey}`,
      providerStatus: 'SENT',
      acceptedAt: new Date(),
      retryable: false,
      durationMs: Date.now() - startTime,
      providerName: 'EmailMockAdapter',
      providerResponseMetadataSanitized: { channel: 'EMAIL', recipient: message.recipientUserId },
    };
  }
}
