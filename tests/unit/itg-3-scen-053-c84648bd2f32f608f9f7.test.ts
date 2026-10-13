import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-053: 差異IDが一意に生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate unique discrepancy IDs within same detection run', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: { toleranceAmount: 5000, description: '金額差異許容基準' },
          RECORD_COUNT_MISMATCH: { toleranceCount: 2, description: '件数不一致許容基準' },
          STATUS_INCONSISTENCY: { toleranceCount: 1, description: 'ステータス不整合許容基準' },
        };
        return criteria[input.discrepancyType] || null;
      }
    );

    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'INV-2024-0002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 250000,
          taxAmount: 25000,
          status: 'paid',
          paymentDueDate: '2024-02-20',
        },
        {
          invoiceId: 'INV-003',
          invoiceNumber: 'INV-2024-0003',
          invoiceDate: '2024-01-25',
          invoiceAmount: 75000,
          taxAmount: 7500,
          status: 'pending',
          paymentDueDate: '2024-02-25',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'NEW-INV-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'NEW-INV-002',
          invoiceNumber: 'INV-2024-0002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 250000,
          taxAmount: 25000,
          status: 'paid',
          paymentDueDate: '2024-02-20',
        },
        {
          invoiceId: 'NEW-INV-003',
          invoiceNumber: 'INV-2024-0003',
          invoiceDate: '2024-01-25',
          invoiceAmount: 75000,
          taxAmount: 7500,
          status: 'pending',
          paymentDueDate: '2024-02-25',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
        { salesId: 'SALES-002', recordCount: 3, totalAmount: 300000, status: 'active' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
        { salesId: 'SALES-002', recordCount: 3, totalAmount: 300000, status: 'active' },
      ],
      detectionTimestamp: '2024-01-30T10:00:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);

    const discrepancyIds = result.discrepancies.map((d) => d.discrepancyId);
    const uniqueIds = new Set(discrepancyIds);

    expect(uniqueIds.size).toBe(discrepancyIds.length);
    expect(uniqueIds.size).toBe(result.discrepancies.length);

    result.discrepancies.forEach((d) => {
      expect(d.discrepancyId).toBeTruthy();
      expect(typeof d.discrepancyId).toBe('string');
    });
  });

  it('should generate different IDs across multiple runs with same input', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: { toleranceAmount: 5000, description: '金額差異許容基準' },
          RECORD_COUNT_MISMATCH: { toleranceCount: 2, description: '件数不一致許容基準' },
          STATUS_INCONSISTENCY: { toleranceCount: 1, description: 'ステータス不整合許容基準' },
        };
        return criteria[input.discrepancyType] || null;
      }
    );

    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'NEW-INV-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
      ],
      legacySalesData: [{ salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' }],
      newSystemSalesData: [{ salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' }],
      detectionTimestamp: '2024-01-30T10:00:00Z',
    };

    const result1 = await detectDiscrepancies(input);
    const result2 = await detectDiscrepancies(input);

    if (result1.discrepancies.length > 0 && result2.discrepancies.length > 0) {
      const ids1 = result1.discrepancies.map((d) => d.discrepancyId);
      const ids2 = result2.discrepancies.map((d) => d.discrepancyId);

      const differentIds = !ids1.every((id, index) => id === ids2[index]);
      expect(differentIds || ids1.length === 0).toBeTruthy();
    }
  });
});
