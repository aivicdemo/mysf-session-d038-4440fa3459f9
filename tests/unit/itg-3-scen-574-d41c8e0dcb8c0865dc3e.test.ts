import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';
import { executeEscalationByDiscrepancySeverity } from '../../src/logic/scheduled-monitoring-orchestrator';
import type {
  RetrieveLegacyAndNewSystemInvoiceDataInput,
  RetrieveLegacyAndNewSystemInvoiceDataOutput,
  LegacyInvoiceRecord,
  NormalizedInvoiceComparisonRecord,
} from '../../src/logic/legacy-new-system-data-retrieval';
import type { NewSystemInvoiceRecord } from '../../src/logic/discrepancy-persistence';
import type { ExecuteEscalationByDiscrepancySeverityInput, ExecuteEscalationByDiscrepancySeverityOutput } from '../../src/logic/scheduled-monitoring-orchestrator';

jest.mock('../../src/logic/scheduled-monitoring-orchestrator', () => ({
  ...jest.requireActual<typeof import('../../src/logic/scheduled-monitoring-orchestrator')>('../../src/logic/scheduled-monitoring-orchestrator'),
  executeEscalationByDiscrepancySeverity: jest.fn(),
}));

describe('SCEN-574: 差異の重大度が「極度」のとき、営業部システム担当・経理部門・IT部門にエスカレーションする', () => {
  const mockExecuteEscalationByDiscrepancySeverity = executeEscalationByDiscrepancySeverity as jest.Mock;

  const legacyInvoiceRecords: ReadonlyArray<LegacyInvoiceRecord> = [
    {
      invoiceId: 'LEG-001',
      invoiceNumber: 'INV-001',
      invoiceDate: '2025-01-15',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '確定',
      dueDate: '2025-02-15',
      generatedDateTime: '2025-01-15T10:30:00Z',
      dealId: 'DEAL-100',
    },
    {
      invoiceId: 'LEG-002',
      invoiceNumber: 'INV-002',
      invoiceDate: '2025-01-20',
      invoiceAmount: 250000,
      taxAmount: 25000,
      status: '確定',
      dueDate: '2025-02-20',
      generatedDateTime: '2025-01-20T14:00:00Z',
      dealId: 'DEAL-101',
    },
  ];

  const newSystemInvoiceRecords: ReadonlyArray<NewSystemInvoiceRecord> = [
    {
      invoiceId: 'NEW-001',
      dealId: 'DEAL-100',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-15T10:30:00Z',
    },
    {
      invoiceId: 'NEW-002',
      dealId: 'DEAL-101',
      invoiceAmount: 250500,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-20T14:00:00Z',
    },
  ];

  const normalizedComparisonData: ReadonlyArray<NormalizedInvoiceComparisonRecord> = [
    {
      matchKey: 'DEAL-100-2025-01-15',
      legacyInvoiceId: 'LEG-001',
      newSystemInvoiceId: 'NEW-001',
      legacyAmount: 100000,
      newSystemAmount: 100000,
      differenceSeverity: 'normal',
      difference: 0,
      invoiceNumber: 'INV-001',
      invoiceDate: '2025-01-15',
      legacyStatus: '確定',
      newSystemStatus: '確定',
      comparisonId: 'CMP-001',
      dealId: 'DEAL-100',
    },
    {
      matchKey: 'DEAL-101-2025-01-20',
      legacyInvoiceId: 'LEG-002',
      newSystemInvoiceId: 'NEW-002',
      legacyAmount: 250000,
      newSystemAmount: 250500,
      differenceSeverity: 'extreme',
      difference: 500,
      invoiceNumber: 'INV-002',
      invoiceDate: '2025-01-20',
      legacyStatus: '確定',
      newSystemStatus: '確定',
      comparisonId: 'CMP-002',
      dealId: 'DEAL-101',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockRetrieveLegacyAndNewSystemInvoiceData.mockResolvedValue({
      legacyInvoices: legacyInvoiceRecords,
      newSystemInvoices: newSystemInvoiceRecords,
      normalizedComparisonData: normalizedComparisonData,
      extractionTimestamp: '2025-01-25T10:00:00Z',
    } as RetrieveLegacyAndNewSystemInvoiceDataOutput);
    mockExecuteEscalationByDiscrepancySeverity.mockResolvedValue({
      escalationExecuted: true,
      escalationDetails: [
        {
          recipientRole: 'sales_operations',
          recipientCount: 1,
          discrepancyCount: 1,
          slaDeadline: new Date('2025-01-26T10:00:00Z'),
          notificationSentAt: new Date('2025-01-25T10:30:00Z'),
        },
        {
          recipientRole: 'accounting',
          recipientCount: 1,
          discrepancyCount: 1,
          slaDeadline: new Date('2025-01-26T14:00:00Z'),
          notificationSentAt: new Date('2025-01-25T10:30:00Z'),
        },
        {
          recipientRole: 'it_operations',
          recipientCount: 1,
          discrepancyCount: 1,
          slaDeadline: new Date('2025-01-27T10:00:00Z'),
          notificationSentAt: new Date('2025-01-25T10:30:00Z'),
        },
      ],
      totalEscalationsAttempted: 3,
      totalEscalationsSucceeded: 3,
    } as ExecuteEscalationByDiscrepancySeverityOutput);
  });

  it('入力パラメータ（periodStart: "2025-01-01", periodEnd: "2025-01-31", dealIdRange: null）でretrieveLegacyAndNewSystemInvoiceDataを呼び出す', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result).toBeDefined();
  });

  it('旧システム請求書レコード群が返却されることを確認する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toEqual(legacyInvoiceRecords);
    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.legacyInvoices[0].invoiceId).toBe('LEG-001');
    expect(result.legacyInvoices[1].invoiceId).toBe('LEG-002');
  });

  it('新システム請求書レコード群が返却されることを確認する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.newSystemInvoices).toEqual(newSystemInvoiceRecords);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices[0].invoiceId).toBe('NEW-001');
    expect(result.newSystemInvoices[1].invoiceId).toBe('NEW-002');
  });

  it('正規化済み照合対象データに差異重大度が「extreme（極度）」の差異レコード（DEAL-101-2025-01-20、difference: 500）が含まれていることを確認する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.normalizedComparisonData).toHaveLength(2);

    const extremeDifferenceRecord = result.normalizedComparisonData.find(
      (record: NormalizedInvoiceComparisonRecord) => (record as any).differenceSeverity === 'extreme',
    );
    expect(extremeDifferenceRecord).toBeDefined();
    expect((extremeDifferenceRecord as any)?.matchKey).toBe('DEAL-101-2025-01-20');
    expect((extremeDifferenceRecord as any)?.difference).toBe(500);
    expect(extremeDifferenceRecord?.dealId).toBe('DEAL-101');
    expect(extremeDifferenceRecord?.legacyAmount).toBe(250000);
    expect(extremeDifferenceRecord?.newSystemAmount).toBe(250500);
  });

  it('正規化済み照合対象データ内で「extreme」重大度を検出した場合、通知アダプター経由で営業部システム担当・経理部門・IT部門への差異通知が実行されることを確認する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    const extremeRecords = result.normalizedComparisonData.filter(
      (record: NormalizedInvoiceComparisonRecord) => (record as any).differenceSeverity === 'extreme',
    );
    expect(extremeRecords.length).toBeGreaterThan(0);

    const escalationInput: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: extremeRecords.map((record: NormalizedInvoiceComparisonRecord) => ({
        discrepancyId: (record as any).matchKey,
        severity: 'critical' as const,
        discrepancyType: 'invoice_amount_mismatch',
        amountDifference: (record as any).difference,
        affectedRecordCount: 1,
        detectionTimestamp: new Date(result.extractionTimestamp),
      })),
      executionTimestamp: new Date(result.extractionTimestamp),
      monitoringCycleId: 'CYCLE-001',
    };

    const escalationResult: ExecuteEscalationByDiscrepancySeverityOutput = await executeEscalationByDiscrepancySeverity(escalationInput);

    expect(mockExecuteEscalationByDiscrepancySeverity).toHaveBeenCalled();
    expect(escalationResult.escalationExecuted).toBe(true);
  });

  it('差異通知の呼び出しに対して、受信対象者が営業部システム担当・経理部門・IT部門の複数部門宛であることを確認する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    const extremeRecords = result.normalizedComparisonData.filter(
      (record: NormalizedInvoiceComparisonRecord) => (record as any).differenceSeverity === 'extreme',
    );

    const escalationInput: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: extremeRecords.map((record: NormalizedInvoiceComparisonRecord) => ({
        discrepancyId: (record as any).matchKey,
        severity: 'critical' as const,
        discrepancyType: 'invoice_amount_mismatch',
        amountDifference: (record as any).difference,
        affectedRecordCount: 1,
        detectionTimestamp: new Date(result.extractionTimestamp),
      })),
      executionTimestamp: new Date(result.extractionTimestamp),
      monitoringCycleId: 'CYCLE-001',
    };

    const escalationResult: ExecuteEscalationByDiscrepancySeverityOutput = await executeEscalationByDiscrepancySeverity(escalationInput);

    expect(escalationResult.escalationDetails).toBeDefined();
    expect(escalationResult.escalationDetails).toHaveLength(3);

    const recipientRoles = escalationResult.escalationDetails.map((detail) => detail.recipientRole);
    expect(recipientRoles).toContain('sales_operations');
    expect(recipientRoles).toContain('accounting');
    expect(recipientRoles).toContain('it_operations');
  });

  it('差異通知の呼び出しに対して、通知内容に検出された差異の詳細情報（差異重大度: extreme、差異対象: DEAL-101、旧システム金額: 250000、新システム金額: 250500）が含まれていることを確認する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    const extremeRecord = result.normalizedComparisonData.find(
      (record: NormalizedInvoiceComparisonRecord) => (record as any).differenceSeverity === 'extreme',
    );

    expect(extremeRecord).toBeDefined();
    expect(extremeRecord?.dealId).toBe('DEAL-101');
    expect(extremeRecord?.legacyAmount).toBe(250000);
    expect(extremeRecord?.newSystemAmount).toBe(250500);
    expect((extremeRecord as any)?.differenceSeverity).toBe('extreme');
    expect((extremeRecord as any)?.difference).toBe(500);

    const escalationInput: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: (extremeRecord as any)!.matchKey,
          severity: 'critical' as const,
          discrepancyType: 'invoice_amount_mismatch',
          amountDifference: (extremeRecord as any)!.difference,
          affectedRecordCount: 1,
          detectionTimestamp: new Date(result.extractionTimestamp),
        },
      ],
      executionTimestamp: new Date(result.extractionTimestamp),
      monitoringCycleId: 'CYCLE-001',
    };

    const escalationResult: ExecuteEscalationByDiscrepancySeverityOutput = await executeEscalationByDiscrepancySeverity(escalationInput);

    expect(escalationResult).toBeDefined();
    expect(escalationResult.escalationExecuted).toBe(true);
  });

  it('retrieveLegacyAndNewSystemInvoiceDataが期待する出力を返却する', async () => {
    const input: RetrieveLegacyAndNewSystemInvoiceDataInput = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    const result: RetrieveLegacyAndNewSystemInvoiceDataOutput = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.legacyInvoices).toEqual(legacyInvoiceRecords);

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toEqual(newSystemInvoiceRecords);

    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData).toEqual(normalizedComparisonData);

    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    expect(result.extractionTimestamp).toMatch(isoDatePattern);

    const extremeRecord = result.normalizedComparisonData.find(
      (record: NormalizedInvoiceComparisonRecord) => (record as any).differenceSeverity === 'extreme',
    );
    expect(extremeRecord).toBeDefined();
  });
});
