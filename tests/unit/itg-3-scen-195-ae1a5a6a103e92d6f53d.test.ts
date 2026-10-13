import { saveCorrectionTrackingRecord, MissingRequiredFieldError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-195: saveCorrectionTrackingRecord - Missing differenceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MissingRequiredFieldError when differenceId is not provided', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const input = {
      differenceId: null as any,
      correctionMethod: '手動修正',
      correctionExecutorUserId: 'user-001',
      correctionExecutionDateTime: '2026-10-07T10:30:00Z',
      dataBeforeCorrection: '{"accountId": "acc-123", "amount": 100000}',
      dataAfterCorrection: null,
      verificationResult: null,
    };

    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow(MissingRequiredFieldError);
    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow('必須項目が不足しています。');

    // Verify createRecord was not called
    expect(mockDataStore.createRecord).not.toHaveBeenCalled();
  });
});
