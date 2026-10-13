import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-054: 検出日時がISO 8601形式で記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record detectionTimestamp in ISO 8601 format', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => ({})
    );
    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV20240101-001',
          invoiceDate: '2024-01-01',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-01',
          remarks: 'Test invoice',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV20240101-001',
          invoiceDate: '2024-01-01',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-01',
          remarks: 'Test invoice',
        },
      ],
      legacySalesData: [{ salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' }],
      newSystemSalesData: [{ salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' }],
      detectionTimestamp: '2024-01-15T14:30:45.123Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();

    result.discrepancies.forEach((d) => {
      expect(d.detectionTimestamp).toBe('2024-01-15T14:30:45.123Z');
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(iso8601Regex.test(d.detectionTimestamp)).toBe(true);
    });
  });

  it('should match ISO 8601 format YYYY-MM-DDTHH:mm:ss.sssZ', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => ({})
    );
    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV20240101-001',
          invoiceDate: '2024-01-01',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-01',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV20240101-001',
          invoiceDate: '2024-01-01',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-01',
        },
      ],
      legacySalesData: [{ salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' }],
      newSystemSalesData: [{ salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' }],
      detectionTimestamp: '2024-01-15T14:30:45.123Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.detectionTimestamp === undefined).toBe(true);

    result.discrepancies.forEach((d) => {
      expect(d.detectionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      expect(d.detectionTimestamp).toContain('Z');
    });
  });
});
