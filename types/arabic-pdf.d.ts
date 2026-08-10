declare module 'arabic-persian-reshaper' {
  export const ArabicShaper: {
    convertArabic: (text: string) => string;
    convertArabicBack: (text: string) => string;
  };
  export const PersianShaper: {
    convertArabic: (text: string) => string;
    convertArabicBack: (text: string) => string;
  };
}

declare module 'bidi-js' {
  type EmbeddingLevels = {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  };

  type Bidi = {
    getEmbeddingLevels: (text: string, direction?: 'ltr' | 'rtl' | null) => EmbeddingLevels;
    getReorderSegments: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number
    ) => Array<[number, number]>;
    getReorderedString: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number
    ) => string;
    getMirroredCharactersMap: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number
    ) => Map<number, string>;
    getMirroredCharacter: (char: string) => string | null;
    getBidiCharTypeName: (char: string) => string;
  };

  export default function bidiFactory(): Bidi;
}
