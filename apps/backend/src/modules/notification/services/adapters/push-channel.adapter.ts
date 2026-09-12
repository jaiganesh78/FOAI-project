import { Injectable } from '@nestjs/common';
import { OutboundMessageDto, OutboundMetadataDto, DeliveryResultDto, NotificationChannel } from '@gpios/shared';

@Injectable()
export class PushChannelAdapter {
  readonly channel = NotificationChannel.PUSH;

  async send(message: OutboundMessageDto, _metadata: OutboundMetadataDto): Promise<DeliveryResultDto> {
    const startTime = Date.now();
    return {
      success: true,
      providerMessageId: `push_msg_${message.deliveryIdempotencyKey}`,
      providerStatus: 'DELIVERED',
      acceptedAt: new Date(),
      retryable: false,
      durationMs: Date.now() - startTime,
      providerName: 'PushMockAdapter',
      providerResponseMetadataSanitized: { channel: 'PUSH', priority: message.priority },
    };
  }
}
