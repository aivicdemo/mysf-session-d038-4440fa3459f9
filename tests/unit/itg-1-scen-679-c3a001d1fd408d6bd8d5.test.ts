import { saveInvoice } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-679: 新規請求書を正常に保存して、システムが採番したUUIDとともに保存後のレコードが返される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("新規請求書の作成時に、採番されたinvoiceIdとともに全項目が保存されて返される", async () => {
    const invoiceId = "550e8400-e29b-41d4-a716-446655440000";
    const dealId = "deal-uuid-001";
    const customerId = "customer-uuid-001";
    const salesRepresentativeId = "sales-rep-uuid-001";
    const invoiceNumber = "INV-2025-001";
    const invoiceDate = "2025-01-15T09:00:00Z";
    const dueDate = "2025-02-15T09:00:00Z";
    const invoiceAmount = 110000;
    const taxAmount = 10000;
    const untaxedAmount = 100000;
    const invoiceStatus = "未請求";
    const amountCalculationVerificationStatus = "検証済";
    const referenceIntegrityVerificationStatus = "検証済";
    const currentUserId = "user-uuid-001";
    const operationTimestamp = "2025-01-15T10:00:00Z";

    const mockCreateRecord = jest.spyOn(dataStore, "createRecord");

    mockCreateRecord.mockResolvedValueOnce({
      id: invoiceId,
      dealId,
      customerId,
      salesRepresentativeId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceAmount,
      taxAmount,
      untaxedAmount,
      invoiceStatus,
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus,
      referenceIntegrityVerificationStatus,
      createdAt: operationTimestamp,
      updatedAt: operationTimestamp,
      createdBy: currentUserId,
    } as any);

    const result = await saveInvoice({
      invoiceId: null,
      dealId,
      customerId,
      salesRepresentativeId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceAmount,
      taxAmount,
      untaxedAmount,
      invoiceStatus,
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus,
      referenceIntegrityVerificationStatus,
      currentUserId,
      operationTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.invoiceId).toBe(invoiceId);
    expect(result.dealId).toBe(dealId);
    expect(result.customerId).toBe(customerId);
    expect(result.salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.invoiceNumber).toBe(invoiceNumber);
    expect(result.invoiceDate).toBe(invoiceDate);
    expect(result.dueDate).toBe(dueDate);
    expect(result.invoiceAmount).toBe(invoiceAmount);
    expect(result.taxAmount).toBe(taxAmount);
    expect(result.untaxedAmount).toBe(untaxedAmount);
    expect(result.invoiceStatus).toBe(invoiceStatus);
    expect(result.paidDate).toBeNull();
    expect(result.paidAmount).toBeNull();
    expect(result.remarks).toBeNull();
    expect(result.modificationReason).toBeNull();
    expect(result.reissueCount).toBe(0);
    expect(result.lastReissuedAt).toBeNull();
    expect(result.amountCalculationVerificationStatus).toBe(amountCalculationVerificationStatus);
    expect(result.referenceIntegrityVerificationStatus).toBe(referenceIntegrityVerificationStatus);
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(currentUserId);
  });
});
