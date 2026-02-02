import { Injectable } from '@angular/core';
import { BacklogItem } from '../models/domain.model';

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  calculateTotalBuildEffort(items: BacklogItem[]): number {
    return items
      .filter((i) => i.type === 'build' || !i.type)
      .reduce((sum, i) => sum + Number(i.effortDays || 0), 0);
  }

  getItemEffort(item: BacklogItem, totalBuildEffort: number): number {
    if (item.chargeType === 'ratio') {
      const rawEffort = (totalBuildEffort * Number(item.effortDays || 0)) / 100;
      return this.roundToNearestHour(rawEffort);
    }
    return Number(item.effortDays || 0);
  }

  private roundToNearestHour(days: number): number {
    // Round to nearest 1/8th of a day (1 hour in 8h day)
    return Math.round(days * 8) / 8;
  }

  getItemCost(item: BacklogItem, totalBuildEffort: number, dailyRate: number): number {
    const effort = this.getItemEffort(item, totalBuildEffort);
    return effort * dailyRate;
  }

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
