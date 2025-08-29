export type UUID = string;

export type Business = {
  id: UUID;
  name: string;
  slug: string;
  description?: string | null;
  category_id?: UUID | null;
  subcategory_id?: UUID | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  opening_hours?: Record<string, any> | null;
  images?: string[] | null; // stored URLs
  status?: "pending" | "approved" | "rejected";
  is_verified?: boolean | null;
  is_sponsored?: boolean | null;
  created_at?: string;
};

export type Category = {
  id: UUID;
  name: string;
  slug: string;
};
