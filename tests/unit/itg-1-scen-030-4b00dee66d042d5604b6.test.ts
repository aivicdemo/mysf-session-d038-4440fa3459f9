import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-030: ダッシュボード表示データに不整合が検出されると、警告が追加される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should include integrity warning when data inconsistencies are detected', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toMatch(/^(success|partial_success)$/);
    expect(output.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          warningType: 'DataIntegrityWarning',
          message: '表示データに不整合が検出されました。詳細はシステム管理者に確認してください。',
        }),
      ])
    );
    expect(output.dashboardData).not.toBeNull();
    expect(output.anomalies).toEqual([]);
    expect(output.errorDetails).toBeNull();
  });
});
