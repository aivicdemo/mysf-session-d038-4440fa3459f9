import { saveCorrectionTrackingRecord, InvalidCorrectionMethodError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-194: saveCorrectionTrackingRecord - Invalid correction method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidCorrectionMethodError when correction method is not a valid value', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const input = {
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '無効な是正方法',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2026-10-07T06:33:43.539Z',
      dataBeforeCorrection: '{"field1": "value1", "field2": "value2"}',
      dataAfterCorrection: null,
      verificationResult: null,
    };

    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow(InvalidCorrectionMethodError);
    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow('指定された是正方法は無効です。');

    // Verify createRecord was not called
    expect(mockDataStore.createRecord).not.toHaveBeenCalled();
  });
});
