import { Injectable } from '@nestjs/common';
import { OutboundMessageDto, OutboundMetadataDto, DeliveryResultDto, NotificationChannel } from '@gpios/shared';

@Injectable()
export class SmsChannelAdapter {
  readonly channel = NotificationChannel.SMS;

  async send(message: OutboundMessageDto, _metadata: OutboundMetadataDto): Promise<DeliveryResultDto> {
    const startTime = Date.now();
    return {
      success: true,
      providerMessageId: `sms_msg_${message.deliveryIdempotencyKey}`,
      providerStatus: 'DELIVERED',
      acceptedAt: new Date(),
      retryable: false,
      durationMs: Date.now() - startTime,
      providerName: 'SmsMockAdapter',
      providerResponseMetadataSanitized: { channel: 'SMS', length: message.body.length },
    };
  }
}
