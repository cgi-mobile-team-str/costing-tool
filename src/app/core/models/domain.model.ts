export interface Profile {
  id: string;
  name: string;
  username?: string;
  dailyRate: number;
  scr?: number;
  active: boolean;
}

export interface Project {
  id: string;
  name: string;
  marginRate?: number;
  currency?: string;
  startDate?: string;
  createdAt: string;
}

export type Scope = 'MVP' | 'V1' | 'V2';
export type Risk = 'low' | 'medium' | 'high';
export type Moscow = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
export type ChargeType = 'days' | 'ratio';
export type BacklogItemType = 'build' | 'other';

export interface Product {
  id: string;
  name: string;
  order?: number;
}

export interface Cluster {
  id: string;
  name: string;
  productId: string;
  order?: number;
}

export interface BacklogItem {
  id: string;
  title: string; // Used as 'Feature'
  order?: number;

  // Relational links
  productId: string;
  clusterId: string;

  description?: string;
  hypotheses?: string;
  comments?: string;
  moscow: Moscow;
  type: BacklogItemType;
  chargeType: ChargeType;

  scope: Scope;
  effortDays: number;
  profileId: string;
  tags?: string[];
  risk?: Risk;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Settings {
  projectName?: string;
  marginRate: number; // 0.15 = 15%
  currency: string;
  startDate?: string;
  version: string;
}

export interface BacklogVersion {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  projectId: string;
}

export interface Planning {
  id?: string;
  projectId: string;
  scope: string;
  profileId: string;
  distribution: Record<string, number>;
}
