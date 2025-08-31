export interface EmergencySubCategory {
  id: string;
  name: string;
  description?: string | null;

  emergencyCategoryId: string | number;
  imageUrl?: string | null;
}