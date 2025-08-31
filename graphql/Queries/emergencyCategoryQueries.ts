import { gql } from '@apollo/client';

export const GET_ALL_EMERGENCY_CATEGORIES = gql`
    query {
        emergencyCategories {
            id
            icon
            name
            description
            emergencySubCategories {
                id
                name
            }
        }
    }
`;

export const GET_EMERGENCY_WITH_SUB = gql`
  query GetEmergencyCategories {
    emergencyCategories {
      id
      icon
      name
      description
      emergencySubCategories {
        id
        name
        description
        emergencyCategoryId
        imageUrl
      }
    }
  }
`;