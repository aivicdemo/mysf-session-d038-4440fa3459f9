import { exportDiscrepanciesAsCSV } from '../../src/logic/csv-export-audit';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
  recordCSVExportAuditLog: jest.fn(),
}));

describe('SCEN-313: exportDiscrepanciesAsCSV with valid input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export discrepancies as CSV and return output with csvFileIdentifier, exportedRecordCount, and auditLogId', async () => {
    const selectedDiscrepancyIds = ['DISC-001', 'DISC-002', 'DISC-003'];
    const executingUserId = 'USER-SALES-001';
    const executionTimestamp = new Date('2026-10-07T10:30:00.000Z');

    const retrievedRecords = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          legacySystemInvoiceId: 'INV-L-001',
          newSystemInvoiceId: 'INV-N-001',
          discrepancyType: '取引先',
          discrepancyContent: '顧客コード不一致: CUST-123 vs CUST-124',
          amountDifference: null,
          countDifference: null,
          statusDifference: null,
          detectionDateTime: '2026-10-06T15:20:00Z',
          severity: 'high',
          causeClassification: null,
          toleranceJudgment: null,
          toleranceJudgmentDateTime: null,
          judgedByUserId: null,
          legacySystemInvoice: null,
          newSystemInvoice: null,
          correctionTrackingHistory: [],
          confirmationHistory: [],
        },
        {
          discrepancyId: 'DISC-002',
          legacySystemInvoiceId: 'INV-L-002',
          newSystemInvoiceId: 'INV-N-002',
          discrepancyType: '商談',
          discrepancyContent: '金額不一致: 1500000 vs 1400000',
          amountDifference: 100000,
          countDifference: null,
          statusDifference: null,
          detectionDateTime: '2026-10-06T16:45:00Z',
          severity: 'critical',
          causeClassification: null,
          toleranceJudgment: null,
          toleranceJudgmentDateTime: null,
          judgedByUserId: null,
          legacySystemInvoice: null,
          newSystemInvoice: null,
          correctionTrackingHistory: [],
          confirmationHistory: [],
        },
        {
          discrepancyId: 'DISC-003',
          legacySystemInvoiceId: 'INV-L-003',
          newSystemInvoiceId: 'INV-N-003',
          discrepancyType: '取引先責任者',
          discrepancyContent: 'メールアドレス不一致',
          amountDifference: null,
          countDifference: null,
          statusDifference: null,
          detectionDateTime: '2026-10-06T17:10:00Z',
          severity: 'medium',
          causeClassification: null,
          toleranceJudgment: null,
          toleranceJudgmentDateTime: null,
          judgedByUserId: null,
          legacySystemInvoice: null,
          newSystemInvoice: null,
          correctionTrackingHistory: [],
          confirmationHistory: [],
        },
      ],
      totalCount: 3,
    };

    const auditLogResult = {
      exportId: 'AUDIT-LOG-20261007-0530',
      executionUserId: 'USER-SALES-001',
      executionDateTime: '2026-10-07T10:30:15Z',
      exportedDiscrepancyCount: 3,
      fileIdentifier: 'FILE-20261007-053001',
      exportStatus: 'success',
    } as const;

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue(
      retrievedRecords
    );
    (discrepancyPersistence.recordCSVExportAuditLog as jest.Mock).mockResolvedValue(
      auditLogResult
    );

    const result = await exportDiscrepanciesAsCSV({
      selectedDiscrepancyIds,
      executingUserId,
      executionTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.csvFileIdentifier).toBeTruthy();
    expect(result.csvFileIdentifier).not.toBe('');
    expect(result.exportedRecordCount).toBe(3);
    expect(result.auditLogId).toBe('AUDIT-LOG-20261007-0530');

    expect(discrepancyPersistence.retrieveDiscrepanciesForCSVExport).toHaveBeenCalledWith({
      discrepancyIds: selectedDiscrepancyIds,
    });

    expect(discrepancyPersistence.recordCSVExportAuditLog).toHaveBeenCalled();
    const recordCall = (discrepancyPersistence.recordCSVExportAuditLog as jest.Mock).mock.calls[0][0];
    expect(recordCall.executionUserId).toBe('USER-SALES-001');
    expect(recordCall.executionDateTime).toBe('2026-10-07T10:30:00.000Z');
    expect(recordCall.exportedDiscrepancyCount).toBe(3);
    expect(recordCall.fileIdentifier).toBeTruthy();
  });
});
