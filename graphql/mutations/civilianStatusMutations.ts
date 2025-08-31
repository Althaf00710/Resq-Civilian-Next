import { gql } from "@apollo/client";

export const REQUEST_CIVILIAN_STATUS = gql`
mutation ($input: CivilianStatusRequestCreateInput!, $proofPicture: Upload!) {
  createCivilianStatusRequest(input: $input, proofPicture: $proofPicture) {
    message
    success
  }
}
`;