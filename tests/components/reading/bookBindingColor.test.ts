import { describe, expect, it } from 'vitest';
import {
  extractRepresentativeColor,
  getContrastingTextColor,
  normalizeHexColor,
  resolveBindingColor,
} from '../../../components/reading/shelf/bookBindingColor';

const createImageData = (width: number, height: number, color: [number, number, number, number]) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
  }
  return { data, width, height };
};

describe('book binding color resolution', () => {
  it('normalizes short and long hexadecimal colors while rejecting invalid values', () => {
    expect(normalizeHexColor('#abc')).toBe('#AABBCC');
    expect(normalizeHexColor('#aBc123')).toBe('#ABC123');
    expect(normalizeHexColor(' #123456 ')).toBe('#123456');
    expect(normalizeHexColor('rgb(1, 2, 3)')).toBeNull();
    expect(normalizeHexColor('#12345')).toBeNull();
  });

  it('uses the single documented precedence order and always returns a valid hex', () => {
    expect(resolveBindingColor({
      customColor: '#123456',
      persistedCoverColor: '#654321',
      extractedColor: '#ABCDEF',
      manifestColor: '#111111',
    })).toEqual({ hex: '#123456', source: 'custom' });

    expect(resolveBindingColor({
      extractedColor: '#ABCDEF',
      manifestColor: '#111111',
    })).toEqual({ hex: '#ABCDEF', source: 'extracted-cover' });

    expect(resolveBindingColor({
      customColor: 'invalid',
      extractedColor: null,
      manifestColor: '#111111',
    })).toEqual({ hex: '#111111', source: 'manifest' });

    expect(resolveBindingColor({ customColor: 'invalid', manifestColor: 'also invalid' })).toEqual({
      hex: '#4B5563',
      source: 'fallback',
    });
  });

  it('chooses deterministic high-contrast text for light and dark bindings', () => {
    expect(getContrastingTextColor('#FFFFFF')).toBe('#111827');
    expect(getContrastingTextColor('#123456')).toBe('#F8FAFC');
  });
});

describe('representative cover color extraction', () => {
  it('returns the exact color for a uniform cover and is deterministic', () => {
    const imageData = createImageData(8, 8, [122, 36, 56, 255]);

    expect(extractRepresentativeColor(imageData)).toBe('#7A2438');
    expect(extractRepresentativeColor(imageData)).toBe(extractRepresentativeColor(imageData));
  });

  it('weights the binding-facing border more than an unrelated center color', () => {
    const imageData = createImageData(8, 8, [24, 80, 180, 255]);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (x < 2 || y < 2 || x >= 6 || y >= 6) {
          const index = (y * 8 + x) * 4;
          imageData.data[index] = 170;
          imageData.data[index + 1] = 42;
          imageData.data[index + 2] = 58;
        }
      }
    }

    expect(extractRepresentativeColor(imageData)).toBe('#AA2A3A');
  });

  it('ignores minor white artwork noise but preserves genuinely white or black covers', () => {
    const blueCover = createImageData(8, 8, [28, 92, 150, 255]);
    blueCover.data[0] = 255;
    blueCover.data[1] = 255;
    blueCover.data[2] = 255;
    expect(extractRepresentativeColor(blueCover)).toBe('#1C5C96');

    expect(extractRepresentativeColor(createImageData(4, 4, [255, 255, 255, 255]))).toBe('#FFFFFF');
    expect(extractRepresentativeColor(createImageData(4, 4, [0, 0, 0, 255]))).toBe('#000000');
  });

  it('returns null for transparent or malformed image data', () => {
    expect(extractRepresentativeColor(createImageData(4, 4, [120, 120, 120, 0]))).toBeNull();
    expect(extractRepresentativeColor({ data: new Uint8ClampedArray(3), width: 1, height: 1 })).toBeNull();
  });
});
