import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-033: モバイルデバイスからのアクセスで、セキュリティポリシーにより機密情報表示範囲が制限される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
    } as any;
  });

  it('should restrict sensitive fields for mobile access and only show allowed data elements', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-15T10:30:00.000Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00.000Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59.999Z'),
      requestingUserId: 'sales_rep_001',
      deviceContext: {
        deviceType: 'mobile',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('success');
    expect(output.dashboardData).not.toBeNull();
    expect(output.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          anomalyId: 'anom_001',
          type: 'amount_mismatch',
          dealId: 'deal_100',
          severity: 'high',
        }),
      ])
    );
    expect(output.warnings).toEqual([]);
    expect(output.errorDetails).toBeNull();

    if (output.dashboardData) {
      const dashboardJson = JSON.stringify(output.dashboardData);
      expect(dashboardJson).not.toContain('bankAccountDetails');
      expect(dashboardJson).not.toContain('internalCostMargin');
      expect(dashboardJson).not.toContain('customerCreditScore');
      expect(dashboardJson).not.toContain('negotiationLowerBound');
    }
  });
});
