export type PoiCategoryGroup = 'all' | 'favorites' | 'sacred' | 'nature' | 'lifestyle';

export type PointOfInterest = {
  id: string;
  name: string;
  category: string;
  categoryGroup: 'sacred' | 'nature' | 'lifestyle';
  tag: string;
  district: string;
  bestTime: string;
  icon: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
};

