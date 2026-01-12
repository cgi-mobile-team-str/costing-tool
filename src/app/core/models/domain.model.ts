export interface Profile {
  id: string;
  name: string;
  dailyRate: number;
  active: boolean;
}

export type Scope = 'MVP' | 'V1' | 'V2';
export type Risk = 'low' | 'medium' | 'high';
export type Moscow = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
export type ChargeType = 'days' | 'ratio';

export interface BacklogItem {
  id: string;
  title: string; // Used as 'Feature'
  product: string; // Level 1 grouping
  cluster: string; // Level 2 grouping (was Category)
  description?: string;
  hypotheses?: string;
  comments?: string;
  moscow: Moscow;
  chargeType: ChargeType;

  scope: Scope;
  effortDays: number;
  profileId: string;
  tags?: string[];
  risk?: Risk;
}

export interface Settings {
  marginRate: number; // 0.15 = 15%
  currency: string;
  version: string;
}
