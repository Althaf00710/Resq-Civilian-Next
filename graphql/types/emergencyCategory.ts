import { EmergencySubCategory } from "./emergencySubCategory";

export interface EmergencyCategory {
  id: string;
  icon?: string | null;        
  name: string;
  description?: string | null;
  emergencySubCategories: EmergencySubCategory[];
}

export interface GetEmergencyCategoriesData {
  emergencyCategories: EmergencyCategory[];
}