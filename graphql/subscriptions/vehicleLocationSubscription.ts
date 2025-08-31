import { gql } from '@apollo/client';

export const VEHICLE_LOCATION_SHARE_SUB = gql`
  subscription {
    onVehicleLocationShare {
      rescueVehicleId
      longitude
      latitude
      rescueVehicle {
        plateNumber
        code
        rescueVehicleCategory {
          emergencyToVehicles { emergencyCategory { icon } }
        }
      }
    }
  }
`;