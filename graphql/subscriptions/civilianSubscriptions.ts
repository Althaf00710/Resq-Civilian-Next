import { gql } from '@apollo/client';

export const ON_NEARBY_EMERGENCY = gql`
  subscription OnNearbyEmergency($civilianId: Int!) {
    onNearbyEmergency(civilianId: $civilianId) {
      civilianId
      emergency {
        id
        address
        createdAt
        description
        emergencySubCategoryId
        latitude
        longitude
        proofImageURL
        status
        emergencySubCategory { name }
        civilian { 
          name
          phoneNumber 
        }
      }
    }
  }
`;
