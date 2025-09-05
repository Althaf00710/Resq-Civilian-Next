import { gql } from '@apollo/client';

export const HANDLE_CIVILIAN_LOCATION = gql`
  mutation HandleCivilianLocation($input: CivilianLocationInput!) {
    handleCivilianLocation(input: $input) {
      success
      message
    }
  }
`;