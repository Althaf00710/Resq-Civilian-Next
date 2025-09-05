export type CreateRescueVars = {
  input: {
    civilianId?: number | null;
    description?: string | null;
    emergencySubCategoryId: number; // or ID scalar
    latitude: number;
    longitude: number;
    address?: string | null;
  };
  proofImage?: File | null; // GraphQL Upload
};

export function createVars(args: {
  civilianId?: number | null;
  description?: string | null;
  emergencySubCategoryId: number;
  latitude: number;
  longitude: number;
  address?: string | null;
  proofImage?: File | null;
}): CreateRescueVars {
  return {
    input: {
      civilianId: args.civilianId ?? null,
      description: args.description ?? null,
      emergencySubCategoryId: args.emergencySubCategoryId,
      latitude: args.latitude,
      longitude: args.longitude,
      address: args.address ?? null,
    },
    proofImage: args.proofImage ?? null,
  };
}


export interface OnRescueVehicleRequestStatusChangedPayload {
  id: string | number;
  status: string;
  createdAt: string;

  rescueVehicleAssignments: {
    id: string | number;
    rescueVehicleId: number;
    timestamp: string;
    arrivalTime: string | null;
    departureTime: string | null;
    durationMinutes: number | null;

    rescueVehicle: {
      id: string | number;
      plateNumber: string;
      code: string;
      rescueVehicleCategoryId: number;

      rescueVehicleCategory: {
        name: string;
        emergencyToVehicles: {
          emergencyCategory: {
            icon: string;
          };
        }[];
      };
    };
  }[];
}
