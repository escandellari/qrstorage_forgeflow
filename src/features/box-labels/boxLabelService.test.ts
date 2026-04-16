import { buildBoxLabelUrl } from './boxLabelService';

describe('boxLabelService', () => {
  it('builds the box label URL from the current browser origin and box ID', () => {
    expect(buildBoxLabelUrl('http://localhost:3000', 'BOX-0001')).toBe(
      'http://localhost:3000/boxes/BOX-0001',
    );
  });
});
