import { renderDiscrepancyDetailPanel, InvalidDiscrepancyIdFormatError } from '../../src/logic/dashboard-presentation';

describe('SCEN-294: 差異レコードIDがUUID形式に準拠していない場合、形式不正エラーが発生する', () => {
  it('should throw InvalidDiscrepancyIdFormatError when discrepancyId is not in UUID format', async () => {
    const input = {
      requestUserId: 'user-12345',
      discrepancyId: 'not-a-uuid-format',
    };

    await expect(renderDiscrepancyDetailPanel(input)).rejects.toThrow(InvalidDiscrepancyIdFormatError);
  });

  it('should include error message "差異IDの形式が不正です。" in the thrown error', async () => {
    const input = {
      requestUserId: 'user-12345',
      discrepancyId: 'not-a-uuid-format',
    };

    try {
      await renderDiscrepancyDetailPanel(input);
      fail('Should have thrown InvalidDiscrepancyIdFormatError');
    } catch (error) {
      if (error instanceof InvalidDiscrepancyIdFormatError) {
        expect(error.message).toContain('差異IDの形式が不正です。');
      } else {
        throw error;
      }
    }
  });
});
