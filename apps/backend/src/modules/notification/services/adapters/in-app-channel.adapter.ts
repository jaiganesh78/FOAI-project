import { Injectable } from '@nestjs/common';
import { OutboundMessageDto, OutboundMetadataDto, DeliveryResultDto, NotificationChannel } from '@gpios/shared';

@Injectable()
export class InAppChannelAdapter {
  readonly channel = NotificationChannel.IN_APP;

  async send(message: OutboundMessageDto, _metadata: OutboundMetadataDto): Promise<DeliveryResultDto> {
    const startTime = Date.now();
    return {
      success: true,
      providerMessageId: `inapp_${message.notificationId}`,
      providerStatus: 'DELIVERED',
      acceptedAt: new Date(),
      retryable: false,
      durationMs: Date.now() - startTime,
      providerName: 'InAppChannelAdapter',
      providerResponseMetadataSanitized: { channel: 'IN_APP', delivered: true },
    };
  }
}
