import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput, DeleteRecordOutput } from "../../src/logic/data-persistence";
import { deleteRecord } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-967: 存在する請求書修正内容レコードを指定IDで削除", () => {
  const mockInvoiceModification = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    修正内容ID: "550e8400-e29b-41d4-a716-446655440000",
    請求書ID: "550e8400-e29b-41d4-a716-446655440001",
    修正種別: "金額修正",
    修正前値: "100000",
    修正後値: "95000",
    修正理由: "値引き適用",
    修正者ID: "550e8400-e29b-41d4-a716-446655440002",
    修正日時: "2026-10-07T10:30:00Z",
    createdAt: "2026-10-07T10:30:00Z",
    updatedAt: "2026-10-07T10:30:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing invoice modification record and return success", async () => {
    (dataStore.listRecords as any).mockResolvedValue([mockInvoiceModification]);
    (dataStore.deleteRecord as any).mockResolvedValue(undefined);

    const input: DeleteRecordInput = {
      targetTableName: "請求書修正内容",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = await deleteRecord(input);

    expect(result.targetTableName).toBe("請求書修正内容");
    expect(result.targetRecordId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.deletedAt)).toBe(true);

    expect(dataStore.listRecords).toHaveBeenCalledWith("請求書修正内容");
    expect(dataStore.deleteRecord).toHaveBeenCalledWith("請求書修正内容", "550e8400-e29b-41d4-a716-446655440000");
  });
});
