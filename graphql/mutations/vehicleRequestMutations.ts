import { gql } from '@apollo/client';

export const CREATE_RESCUE_VEHICLE_REQUEST = gql`
  mutation CreateRescueVehicleRequest(
    $input: RescueVehicleRequestCreateInput!
    $proofImage: Upload
  ) {
    createRescueVehicleRequest(input: $input, proofImage: $proofImage) {
      success
      message
      rescueVehicleRequest {
        id
        status
        createdAt
      }
    }
  }
`;
