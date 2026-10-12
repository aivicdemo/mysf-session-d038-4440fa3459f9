import {
  estimateTCOForMigrationCandidates,
  InvalidTCOCalculationInput,
} from '../../src/logic/tco-estimation';

describe('SCEN-602: TCO calculation input validation rejects negative values', () => {
  it('should throw InvalidTCOCalculationInput error with correct message when user count or license cost is negative', async () => {
    const error = await estimateTCOForMigrationCandidates({
      candidateSystemIds: ['SYSTEM-001', 'SYSTEM-002'],
      evaluationPeriodYears: 3,
      currentTimestamp: new Date('2026-10-07T10:00:00.000Z'),
    }).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidTCOCalculationInput);
    expect(error.message).toBe('TCO計算入力値が不正です。数値は0以上の整数である必要があります。');
  });
});
