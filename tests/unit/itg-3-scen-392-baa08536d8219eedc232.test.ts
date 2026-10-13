import { judgeDiscrepancyWithinTolerance, DiscrepancyTypeNotFound } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-392: 指定された差異種類に対応する許容基準が存在しないとき、DiscrepancyTypeNotFoundエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DiscrepancyTypeNotFound error when tolerance criteria for discrepancy type is not found', async () => {
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(null);

    await expect(
      judgeDiscrepancyWithinTolerance({
        discrepancyType: 'UNKNOWN_TYPE',
        discrepancyAmount: 1500,
        discrepancyCount: null,
        discrepancyStatus: null,
      })
    ).rejects.toThrow(DiscrepancyTypeNotFound);

    const error = new DiscrepancyTypeNotFound('差異種類 UNKNOWN_TYPE に対応する許容基準が見つかりません。');
    expect(error.message).toBe('差異種類 UNKNOWN_TYPE に対応する許容基準が見つかりません。');
  });
});
