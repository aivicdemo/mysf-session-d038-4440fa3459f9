import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-031: ダッシュボード生成が30秒以上応答しない場合、キャッシュまたは簡易版が代替表示され、警告が追加される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should return partial_success with timeout warning when response exceeds 30 seconds', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('partial_success');
    expect(output.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          warningType: 'ResponseTimeoutWithFallback',
          message: 'ダッシュボード生成に時間がかかっています。キャッシュデータまたは簡易版を表示します。',
        }),
      ])
    );
    expect(output.dashboardData).not.toBeNull();
    expect(output.anomalies).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
    expect(output.errorDetails).toBeNull();
  });
});
