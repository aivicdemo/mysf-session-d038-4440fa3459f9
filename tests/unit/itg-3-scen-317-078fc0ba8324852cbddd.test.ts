import { exportDiscrepanciesAsCSV, AuditLogRecordingError } from '../../src/logic/csv-export-audit';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
  recordCSVExportAuditLog: jest.fn(),
}));

describe('SCEN-317: AuditLogRecordingError when audit log recording fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuditLogRecordingError when audit log recording fails', async () => {
    const selectedDiscrepancyIds = ['DISC-001', 'DISC-002', 'DISC-003'];
    const executingUserId = 'USER-SALES-01';
    const executionTimestamp = new Date('2026-10-07T10:30:00.000Z');

    const retrievedRecords = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          legacySystemInvoiceId: 'INV-L-001',
          newSystemInvoiceId: 'INV-N-001',
          discrepancyType: 'Account',
          discrepancyContent: 'Account difference',
          amountDifference: null,
          countDifference: null,
          statusDifference: null,
          detectionDateTime: '2026-10-07T09:15:00Z',
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
          discrepancyType: 'Contact',
          discrepancyContent: 'Contact difference',
          amountDifference: null,
          countDifference: null,
          statusDifference: null,
          detectionDateTime: '2026-10-07T09:20:00Z',
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
        {
          discrepancyId: 'DISC-003',
          legacySystemInvoiceId: 'INV-L-003',
          newSystemInvoiceId: 'INV-N-003',
          discrepancyType: 'Opportunity',
          discrepancyContent: 'Opportunity difference',
          amountDifference: null,
          countDifference: null,
          statusDifference: null,
          detectionDateTime: '2026-10-07T09:25:00Z',
          severity: 'low',
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

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue(
      retrievedRecords
    );
    (discrepancyPersistence.recordCSVExportAuditLog as jest.Mock).mockRejectedValue(
      new AuditLogRecordingError('監査ログの記録に失敗しました。')
    );

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(AuditLogRecordingError);

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow('監査ログの記録に失敗しました。');

    expect(discrepancyPersistence.retrieveDiscrepanciesForCSVExport).toHaveBeenCalled();
    expect(discrepancyPersistence.recordCSVExportAuditLog).toHaveBeenCalled();
  });
});
