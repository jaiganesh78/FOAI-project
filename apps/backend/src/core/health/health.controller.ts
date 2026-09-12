import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { BaseController } from '../common/base.controller';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController extends BaseController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {
    super(HealthController.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get overall application health probe' })
  @ApiResponse({ status: 200, description: 'Overall system health check completed.' })
  async getHealth() {
    return this.healthService.getOverallHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get application readiness probe for load balancers' })
  @ApiResponse({ status: 200, description: 'Readiness check completed.' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Get application liveness probe for Kubernetes / Railway' })
  @ApiResponse({ status: 200, description: 'Liveness ping successful.' })
  getLiveness() {
    return this.healthService.getLiveness();
  }
}
