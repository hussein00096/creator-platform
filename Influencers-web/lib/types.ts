export type Locale = 'ar' | 'en';

export type CategoryNode = {
  id: number;
  parentId: number | null;
  nameAr: string;
  slug: string;
  image?: string | null;
  children?: CategoryNode[];
};

export type Place = {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug?: string | null;
  code?: string | null;
};

export type PortfolioImage = {
  id: number;
  filePath: string;
  sortOrder: number;
};

export type SocialAccount = {
  id?: number;
  platform: string;
  handle: string;
};

export type Availability = 'active' | 'busy' | 'paused';

export type InfluencerProfile = {
  bio: string;
  gender: string;
  birthDate: string;
  heightCm: number | null;
  weightKg: number | null;
  skinTone: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  hijab: string | null;
  experienceYears: number;
  languages: string[];
  locationScope: 'inside_iraq' | 'outside_iraq';
  governorate: Place | null;
  country: Place | null;
  categories: CategoryNode[];
  socialAccounts: SocialAccount[];
  avatar: string | null;
  cover: string | null;
  portfolio: PortfolioImage[];
  availability: Availability;
  whatsapp?: string | null;
  contactEmail?: string | null;
};

export type Influencer = {
  id: number;
  name: string;
  status: string;
  profile: InfluencerProfile | null;
};

export type Contact = {
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  website: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  snapchat: string;
  xAccount: string;
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  /** Listing only: how many of the matches currently accept work. */
  available?: number;
};

/** `user` normal account · `client` company · `influencer` creator/model · `admin`. */
export type Role = 'user' | 'client' | 'influencer' | 'admin';

export type Account = {
  id: number;
  name: string;
  /** One of `Role`; typed as string because it comes straight from the API. */
  role: Role | (string & {});
  email?: string | null;
  phone?: string | null;
  status: string;
};

export type OwnOrder = {
  kind: 'ugc' | 'service';
  id: number;
  title: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  productDescription?: string | null;
  executionDetails?: string | null;
  usagePlace?: string | null;
  quantity?: number | null;
  details?: string | null;
  faces: { id: number; name: string }[];
  guests: { name: string; note?: string | null }[];
};

export type OwnAccount = Account & {
  profile: {
    brandName?: string | null;
    whatsapp?: string | null;
    contactEmail?: string | null;
    locationScope?: 'inside_iraq' | 'outside_iraq';
    governorate?: Place | null;
    country?: Place | null;
    bio?: string;
    gender?: string;
    birthDate?: string;
    heightCm?: number | null;
    weightKg?: number | null;
    skinTone?: string | null;
    hairColor?: string | null;
    eyeColor?: string | null;
    hijab?: string | null;
    experienceYears?: number;
    languages?: string[];
    categories?: CategoryNode[];
    socialAccounts?: SocialAccount[];
    availability?: Availability;
  } | null;
};

export function isLocale(value: string): value is Locale {
  return value === 'ar' || value === 'en';
}
