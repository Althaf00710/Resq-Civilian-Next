export type EmergencyCategory = {
  icon?: string | null;
  name: string;
};

export type EmergencyToCivilian = {
  emergencyCategoryId: number;
  emergencyCategory?: EmergencyCategory | null;
};

export type CivilianStatusItem = {
  id: number;
  role: string;
  description?: string | null;
  emergencyToCivilians: EmergencyToCivilian[];
};

export type QueryData = {
  civilianStatuses: CivilianStatusItem[];
};