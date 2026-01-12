import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  calculateItemCost(effortDays: number, dailyRate: number): number {
    return effortDays * dailyRate;
  }

  applyMargin(baseCost: number, marginRate: number): number {
    return baseCost * (1 + marginRate);
  }

  calculateMarginAmount(baseCost: number, marginRate: number): number {
    return baseCost * marginRate;
  }
}
