import { gql } from "@apollo/client";

export const GET_CIVILIAN_STATUS = gql`
  query {
    civilianStatuses {
        id
        role
        description
        emergencyToCivilians {
        emergencyCategoryId
            emergencyCategory {
                icon
                name
            }
        }
    }
  }
`;