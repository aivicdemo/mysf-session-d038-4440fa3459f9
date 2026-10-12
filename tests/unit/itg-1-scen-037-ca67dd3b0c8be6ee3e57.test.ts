import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-037: 過去の未解決異常がダッシュボードに表示される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should include unresolved anomalies in the anomalies array', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-15T10:00:00.000Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00.000Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59.999Z'),
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
          anomalyId: 'anom-2026-001',
          anomalyType: '金額ズレ',
          severity: 'high',
          targetRecordId: 'deal-099',
        }),
        expect.objectContaining({
          anomalyId: 'anom-2026-002',
          anomalyType: '未請求案件',
          severity: 'medium',
          targetRecordId: 'deal-087',
        }),
      ])
    );
    expect(output.warnings).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
    expect(output.errorDetails).toBeNull();
  });
});
