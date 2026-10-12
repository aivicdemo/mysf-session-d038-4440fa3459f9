import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-034: 異常が検知されると、営業担当者に通知が送信され、notificationsSentに結果が記録される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should send notification and record result when anomaly is detected', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('success');
    expect(output.dashboardData).not.toBeNull();
    expect(output.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          anomalyId: 'anom-001',
          anomalyType: 'amount_mismatch',
          severity: 'high',
          targetRecordId: 'deal-101',
        }),
      ])
    );
    expect(output.warnings).toEqual([]);
    expect(output.notificationsSent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          notificationId: 'notif-001',
          recipientId: 'taro@company.com',
          status: 'sent',
          sentAt: new Date('2026-10-15T10:25:00Z'),
        }),
      ])
    );
    expect(output.errorDetails).toBeNull();
  });
});
