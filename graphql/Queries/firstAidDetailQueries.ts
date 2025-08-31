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