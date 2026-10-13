import { saveCorrectionTrackingRecord } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { SaveCorrectionTrackingRecordInput, SaveCorrectionTrackingRecordOutput } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-201: saveCorrectionTrackingRecord - correction status is "完了" when dataAfterCorrection and verificationResult are "承認"', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correction status as "完了" when dataAfterCorrection is provided and verificationResult is "承認"', async () => {
    const generatedCorrectionId = '770e8400-e29b-41d4-a716-446655440003';

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: generatedCorrectionId,
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionStatus: '完了',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2026-10-07T10:30:00Z',
      dataBeforeCorrection: '{"id":"001","amount":100000,"status":"active"}',
      dataAfterCorrection: '{"id":"001","amount":105000,"status":"active"}',
      verificationResult: '承認',
    });

    const input: SaveCorrectionTrackingRecordInput = {
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2026-10-07T10:30:00Z',
      dataBeforeCorrection: '{"id":"001","amount":100000,"status":"active"}',
      dataAfterCorrection: '{"id":"001","amount":105000,"status":"active"}',
      verificationResult: '承認',
    };

    const result: SaveCorrectionTrackingRecordOutput = await saveCorrectionTrackingRecord(input);

    expect(result).toBeDefined();
    expect(result.correctionId).toBeDefined();
    expect(result.differenceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.correctionMethod).toBe('手動修正');
    expect(result.correctionStatus).toBe('完了');
    expect(result.correctionExecutorUserId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.correctionExecutionDateTime).toBe('2026-10-07T10:30:00Z');
    expect(result.dataBeforeCorrection).toBe('{"id":"001","amount":100000,"status":"active"}');
    expect(result.dataAfterCorrection).toBe('{"id":"001","amount":105000,"status":"active"}');
    expect(result.verificationResult).toBe('承認');
  });
});
