import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
}));

describe('SCEN-703: remarksがnullの場合、nullとして保存される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invoiceId=null時に新規請求書を作成し、remarksがnullとして保存される', async () => {
    const mockUUID = '550e8400-e29b-41d4-a716-446655440010';
    const operationTimestamp = '2024-01-15T09:30:00Z';

    (mockDataStore.createRecord as jest.Mock).mockResolvedValue({
      invoiceId: mockUUID,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T09:00:00Z',
      dueDate: '2024-02-15T23:59:59Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証待ち',
      referenceIntegrityVerificationStatus: '検証待ち',
      createdAt: operationTimestamp,
      updatedAt: operationTimestamp,
      createdBy: '880e8400-e29b-41d4-a716-446655440003',
    });

    const result = await saveInvoice({
      invoiceId: null,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T09:00:00Z',
      dueDate: '2024-02-15T23:59:59Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証待ち',
      referenceIntegrityVerificationStatus: '検証待ち',
      currentUserId: '880e8400-e29b-41d4-a716-446655440003',
      operationTimestamp,
    });

    expect(result.invoiceId).toBe(mockUUID);
    expect(result.invoiceId).not.toBeNull();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.salesRepresentativeId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.invoiceNumber).toBe('INV-2024-001');
    expect(result.invoiceDate).toBe('2024-01-15T09:00:00Z');
    expect(result.dueDate).toBe('2024-02-15T23:59:59Z');
    expect(result.invoiceAmount).toBe(110000);
    expect(result.taxAmount).toBe(10000);
    expect(result.untaxedAmount).toBe(100000);
    expect(result.invoiceStatus).toBe('未請求');
    expect(result.paidDate).toBeNull();
    expect(result.paidAmount).toBeNull();
    expect(result.remarks).toBeNull();
    expect(result.modificationReason).toBeNull();
    expect(result.reissueCount).toBe(0);
    expect(result.lastReissuedAt).toBeNull();
    expect(result.amountCalculationVerificationStatus).toBe('検証待ち');
    expect(result.referenceIntegrityVerificationStatus).toBe('検証待ち');
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.createdBy).toBe('880e8400-e29b-41d4-a716-446655440003');
  });
});
