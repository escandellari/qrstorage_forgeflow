import { getBoxIdFromScanValue } from './boxScanService';

describe('boxScanService', () => {
  it('extracts the box ID from an absolute label URL', () => {
    expect(getBoxIdFromScanValue('https://forgeflow.example/boxes/BOX-0001')).toBe('BOX-0001');
  });

  it('extracts the box ID from a relative box path', () => {
    expect(getBoxIdFromScanValue('/boxes/BOX-0002')).toBe('BOX-0002');
  });

  it('returns null for non-box QR values', () => {
    expect(getBoxIdFromScanValue('https://forgeflow.example/search?q=box')).toBeNull();
  });
});
