export interface Snake {
  id: string;
  name: string;
  scientificName: string;
  venomType: string;
  description: string;
  imageUrl: string;
}

export interface SnakePrediction {
    snake: Snake;
    prob: number;
}