import { gql } from '@apollo/client';

export const VEHICLE_LOCATION_SHARE_SUB = gql`
  subscription OnVehicleLocationShare($rescueVehicleId: Int!) {
    onVehicleLocationShareByVehicle(rescueVehicleId: $rescueVehicleId) {
      rescueVehicleId
      active
      address
      lastActive
      latitude
      longitude
      rescueVehicle {
        code
        rescueVehicleCategory {
          emergencyToVehicles { emergencyCategory { icon } }
        }
      }
    }
  }
`;

