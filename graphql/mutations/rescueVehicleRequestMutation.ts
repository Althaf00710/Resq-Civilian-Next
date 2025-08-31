import { gql } from '@apollo/client';

export const CANCEL_RESCUE_VEHICLE_REQUEST = gql`
  mutation UpdateRescueVehicleRequest($id: Int!, $status: String!) {
    updateRescueVehicleRequest(id: $id, input: { status: $status }) {
      success
      message
      rescueVehicleRequest {
        id
        status
      }
    }
  }
`;
