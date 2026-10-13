import { retrieveLegacyAndNewSystemSalesData, InvalidPeriodRange } from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-273: 指定期間の終了日がISO 8601形式でない場合、期間無効エラーを発生させる", () => {
  it("should throw InvalidPeriodRange error when periodEnd is not in ISO 8601 format", async () => {
    await expect(
      retrieveLegacyAndNewSystemSalesData({
        periodStart: "2025-01-01T00:00:00Z",
        periodEnd: "2025-01-01",
        dealIdRange: null as any,
      })
    ).rejects.toThrow(InvalidPeriodRange);

    try {
      await retrieveLegacyAndNewSystemSalesData({
        periodStart: "2025-01-01T00:00:00Z",
        periodEnd: "2025-01-01",
        dealIdRange: null as any,
      });
      fail("Expected InvalidPeriodRange to be thrown");
    } catch (error) {
      if (error instanceof InvalidPeriodRange) {
        expect(error.message).toBe(
          "指定された期間が無効です。periodStart は periodEnd 以前の日付を ISO 8601 形式で指定してください。"
        );
      } else {
        throw error;
      }
    }
  });
});
