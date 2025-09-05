import { gql } from "@apollo/client";

export const VEHICLE_REQUEST_STATUS = gql`
  subscription {
    onRescueVehicleRequestStatusChanged {
        id
        status
        createdAt
        rescueVehicleAssignments {
            arrivalTime
            departureTime
            durationMinutes
            id
            rescueVehicleId
            timestamp
            rescueVehicle {
                id
                plateNumber
                code
                rescueVehicleCategoryId
                rescueVehicleCategory {
                    name
                }
            }
        }
    }
}
`;

export const VEHICLE_REQUEST_STATUS_SUB = gql`
  subscription OnRescueVehicleRequestStatusChanged($requestId: Int!) {
    onRescueVehicleRequestStatusChanged(requestId: $requestId) {
      id
      status
      createdAt
      rescueVehicleAssignments {
        id
        rescueVehicleId
        timestamp
        arrivalTime
        departureTime
        durationMinutes
        rescueVehicle {
          id
          plateNumber
          code
          rescueVehicleCategoryId
          rescueVehicleCategory {
            name
            emergencyToVehicles { emergencyCategory { icon } }
          }
        }
      }
    }
  }
`;
