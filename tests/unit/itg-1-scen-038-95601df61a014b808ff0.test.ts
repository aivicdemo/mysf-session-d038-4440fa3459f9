import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-038: 異常がない場合、anomaliesが空配列になり、notificationsSentも空配列になる', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should return success with empty anomalies and notifications when no anomalies are detected', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-07T10:00:00.000Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00.000Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59.999Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('success');
    expect(output.dashboardData).not.toBeNull();
    expect(output.anomalies).toEqual([]);
    expect(output.warnings).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
    expect(output.errorDetails).toBeNull();
  });
});
