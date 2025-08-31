import { gql } from "@apollo/client";

export const GET_ACTIVE_VEHICLE_REQUEST = gql`
  query GetActiveVehicleRequest($civilianId: Int!) {
    vehicleRequestPaging(
      where: {
        civilianId: { eq: $civilianId }
        status: { in: ["Searching", "Dispatched", "Arrived"] }
      }
    ) {
      id
      isActive
      status
      createdAt
      longitude
      latitude
      rescueVehicleAssignments {
        id
        rescueVehicleId
        rescueVehicle {
          id
          plateNumber
          code
          rescueVehicleCategory { name }
        }
      }
    }
  }
`;
