import { gql } from "@apollo/client";

export const CREATE_CIVILIAN = gql`
  mutation CreateCivilian($input: CivilianCreateInput!) {
    createCivilian(input: $input) {
      success
      message
    }
  }
`;

export const SEND_CIVILIAN_OTP = gql`
  mutation SendCivilianOtp($phoneNumber: String!) {
    sendCivilianOtp(phoneNumber: $phoneNumber) {
      success
      message
    }
  }
`;

export const LOGIN_CIVILIAN = gql`
  mutation LoginCivilian($phoneNumber: String!, $otp: Int!) {
    loginCivilian(phoneNumber: $phoneNumber, otp: $otp) {
      success
      message
      civilian {
        id
        name
        email
        phoneNumber
        nicNumber
        joinedDate
        isRestrict
        civilianStatusId
        civilianStatus {
          role
        }
      }
    }
  }
`;