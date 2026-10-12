import { prepareMonthlyClosing, InvalidClosingInstructionId } from '../../src/logic/monthly-closing-preparation';

describe('SCEN-1590: 商談ID未指定でエラー発生し照合中断', () => {
  it('closingInstructionId が null の場合、InvalidClosingInstructionId エラーが発生', async () => {
    const targetMonth = '2024-11';
    const operatorUserId = 'user-001';
    const executionTimestamp = new Date('2024-12-01T09:00:00Z');

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: null as any,
        targetMonth,
        operatorUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(InvalidClosingInstructionId);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: null as any,
        targetMonth,
        operatorUserId,
        executionTimestamp,
      });
    } catch (error) {
      expect((error as Error).message).toBe('月次締め確認指示が見つかりません。指示IDを確認してください。');
    }
  });

  it('closingInstructionId が空文字列の場合、InvalidClosingInstructionId エラーが発生', async () => {
    const targetMonth = '2024-11';
    const operatorUserId = 'user-001';
    const executionTimestamp = new Date('2024-12-01T09:00:00Z');

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: '',
        targetMonth,
        operatorUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(InvalidClosingInstructionId);
  });
});
