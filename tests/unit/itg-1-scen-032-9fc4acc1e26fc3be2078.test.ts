import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-032: ユーザーの権限がダッシュボード表示対象データの閲覧を許可していない場合、ダッシュボードデータがnullになり、executionStatusが失敗を示す', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should return failure status with null dashboardData when access is denied', async () => {
    const input: any = {
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      requestingUserId: 'user-restricted-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('failure');
    expect(output.dashboardData).toBeNull();
    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails).toHaveLength(1);
    expect(output.errorDetails?.[0].errorCode).toEqual('AccessDenied');
    expect(output.errorDetails?.[0].errorMessage).toEqual('このデータを表示する権限がありません。');
    expect(output.anomalies).toEqual([]);
    expect(output.warnings).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
  });
});
