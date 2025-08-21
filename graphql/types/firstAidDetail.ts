export interface FirstAidDetail {
  id: string;
  emergencySubCategoryId: string;
  emergencySubCategory : {
    name : string;
    description: string;
  }
  displayOrder: number;
  point: string;
  imageUrl: string;
}