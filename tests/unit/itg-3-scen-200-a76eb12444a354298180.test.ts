import { saveCorrectionTrackingRecord } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { SaveCorrectionTrackingRecordInput, SaveCorrectionTrackingRecordOutput } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-200: saveCorrectionTrackingRecord - correction status is "実行中" when dataAfterCorrection and verificationResult are null', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correction status as "実行中" when dataAfterCorrection and verificationResult are null', async () => {
    const generatedCorrectionId = '660e8400-e29b-41d4-a716-446655440002';

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: generatedCorrectionId,
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionStatus: '実行中',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2025-01-15T10:30:00Z',
      dataBeforeCorrection: '{"fieldA":"valueA","fieldB":"valueB"}',
      dataAfterCorrection: null,
      verificationResult: null,
    });

    const input: SaveCorrectionTrackingRecordInput = {
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2025-01-15T10:30:00Z',
      dataBeforeCorrection: '{"fieldA":"valueA","fieldB":"valueB"}',
      dataAfterCorrection: null,
      verificationResult: null,
    };

    const result: SaveCorrectionTrackingRecordOutput = await saveCorrectionTrackingRecord(input);

    expect(result).toBeDefined();
    expect(result.correctionId).toBeDefined();
    expect(result.differenceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.correctionMethod).toBe('手動修正');
    expect(result.correctionStatus).toBe('実行中');
    expect(result.correctionExecutorUserId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.correctionExecutionDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.dataBeforeCorrection).toBe('{"fieldA":"valueA","fieldB":"valueB"}');
    expect(result.dataAfterCorrection).toBeNull();
    expect(result.verificationResult).toBeNull();
  });
});
