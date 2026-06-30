export type Prefecture = '愛知県' | '岐阜県' | '静岡県' | '長野県';
export type Category = '食事' | '観光' | '酒' | 'イベント';

export interface EventItem {
  id: string;
  prefecture: Prefecture;
  category: Category;
  title: string;
  description: string;
  // Dates stored as relative indicator or resolved dynamic date string
  dateType: 'this_weekend' | 'next_weekend' | 'after_weekend' | 'all_season' | 'past' | 'future';
  resolvedStartDate?: string; // Set at runtime: YYYY-MM-DD
  resolvedEndDate?: string;   // Set at runtime: YYYY-MM-DD
  location: string;
  lat: number;
  lng: number;
  imageUrl: string;
  rating: number; // 1-5
  price: string;
  access: string;
  tel?: string;

  
  recommendedTime?: string;
}

export type PeriodFilter = 'all' | 'this_weekend' | 'next_weekend' | 'after_weekend';
