import { gql } from '@apollo/client';

export const GET_ALL_FIRST_AID_DETAILS = gql`
  query GetAllFirstAidDetails {
    firstAidDetails {
      id
      displayOrder
      emergencySubCategoryId
      emergencySubCategory {
        name
        description
      }
      imageUrl
      point
    }
  }
`;

export const GET_FIRST_AID_DETAILS_BY_SUBCATEGORY = gql`
  query GetFirstAidDetailsBySubCategory($emergencySubCategoryId: Int!) {
    firstAidDetailsBySubCategoryId(emergencySubCategoryId: $emergencySubCategoryId) {
      id
      displayOrder
      emergencySubCategoryId
      emergencySubCategory {
        name
        description
      }
      imageUrl
      point
    }
  }
`;