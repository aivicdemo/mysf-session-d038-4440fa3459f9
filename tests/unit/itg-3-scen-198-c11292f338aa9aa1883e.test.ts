import { saveCorrectionTrackingRecord, MissingRequiredFieldError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-198: saveCorrectionTrackingRecord - Missing dataBeforeCorrection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MissingRequiredFieldError when dataBeforeCorrection is not provided', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const input = {
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2026-10-07T10:30:00Z',
      dataBeforeCorrection: null as any,
      dataAfterCorrection: null,
      verificationResult: null,
    };

    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow(MissingRequiredFieldError);
    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow('必須項目が不足しています。');

    // Verify createRecord was not called
    expect(mockDataStore.createRecord).not.toHaveBeenCalled();
  });
});
