export type AuthFormType = 'signin' | 'signup';

export interface AuthFormData {
  email: string;
  password: string;
  username?: string;
}

export interface BuskerType {
  id?: string;
  user_id: string;
  user_name: string;
  email: string;
  genre: string;
  description: string;
  location: string;
  main_photo: string;
  youtube_url?: string;
  instagram_url?: string;
  website_url?: string;
  tip_url?: string;
  created_at?: string;
  updated_at?: string;
  gallery_contents: GalleryItem[];
}

interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

export type BuskingLocation = {
  id: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  date: string;
  buskerId: string;
  user_name: string;
  main_photo: string;
  genre: string;
  description: string;
};
