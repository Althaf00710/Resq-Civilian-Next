import { gql } from '@apollo/client';

export const GET_ALL_SNAKES = gql`
  query GetAllSnakes {
    snakes {
      id
      name
      description
      scientificName
      venomType
      imageUrl
    }
  }
`;

export const PREDICT_SNAKE = gql`
    query($file:Upload!) {
        snakeClassifier(file: $file) {
            snake {
                description
                id
                imageUrl
                name
                scientificName
                venomType
            }
            prob
        }
    }
`;