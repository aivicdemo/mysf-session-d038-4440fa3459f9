import { saveCorrectionTrackingRecord } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-193: saveCorrectionTrackingRecord - Normal case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a correction tracking record and return output with generated correctionId', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    const generatedCorrectionId = 'cid-550e8400-e29b-41d4-a716-446655440000';
    const correctionExecutionDateTime = '2026-01-15T09:30:00Z';
    const differenceId = '550e8400-e29b-41d4-a716-446655440000';
    const correctionMethod = '手動修正';
    const correctionExecutorUserId = 'user-12345678-1234-1234-1234-123456789012';
    const dataBeforeCorrection = '{"field":"value","amount":10000,"status":"active"}';

    // Mock createRecord to return the saved record with generated ID
    mockDataStore.createRecord.mockResolvedValueOnce({
      id: generatedCorrectionId,
      correctionId: generatedCorrectionId,
      differenceId,
      correctionMethod,
      correctionStatus: '実行中',
      correctionExecutorUserId,
      correctionExecutionDateTime,
      dataBeforeCorrection,
      dataAfterCorrection: null,
      verificationResult: null,
    });

    const input = {
      differenceId,
      correctionMethod,
      correctionExecutorUserId,
      correctionExecutionDateTime,
      dataBeforeCorrection,
      dataAfterCorrection: null,
      verificationResult: null,
    };

    const output = await saveCorrectionTrackingRecord(input);

    // Verify output contains expected values
    expect(output.correctionId).toBeDefined();
    expect(output.correctionId).not.toBeNull();
    expect(output.correctionId).not.toBe('');
    expect(output.differenceId).toBe(differenceId);
    expect(output.correctionMethod).toBe(correctionMethod);
    expect(output.correctionStatus).toBe('実行中');
    expect(output.correctionExecutorUserId).toBe(correctionExecutorUserId);
    expect(output.correctionExecutionDateTime).toBe(correctionExecutionDateTime);
    expect(output.dataBeforeCorrection).toBe(dataBeforeCorrection);
    expect(output.dataAfterCorrection).toBeNull();
    expect(output.verificationResult).toBeNull();

    // Verify createRecord was called
    expect(mockDataStore.createRecord).toHaveBeenCalled();
  });
});
