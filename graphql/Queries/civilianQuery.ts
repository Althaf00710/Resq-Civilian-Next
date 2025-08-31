import { gql } from "@apollo/client";

export const GET_CIVILIAN_BY_ID = gql`
query GetCivilianById($id: Int!){
  civilianById(id: $id) {
    civilianStatus {
      role
    }
    email
    joinedDate
    name
    nicNumber
    phoneNumber
  }
}
`;

export const UPDATE_CIVILIAN = gql`
  mutation UpdateCivilian($id: Int!, $input: CivilianUpdateInput!) {
    updateCivilian(id: $id, input: $input) {
      success
      message
      civilian {
        id
        email
        name
        nicNumber
        phoneNumber
        joinedDate
      }
    }
  }
`;
