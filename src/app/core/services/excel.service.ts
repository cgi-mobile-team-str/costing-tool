import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

export interface ExtractedProfile {
  role: string;
  username: string | null;
  scr: number;
  tjm: number;
}

export interface ExtractedBacklogItem {
  title: string;
  description: string;
  profileName: string;
  effort: number;
  chargeType: 'days' | 'ratio';
  type: 'build' | 'other';
  scope: string; // S1, S2, etc.
  productName: string;
  clusterName: string;
}

export interface ExtractedBacklog {
  products: string[];
  clusters: { name: string; productName: string }[];
  items: ExtractedBacklogItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  async extractProfiles(file: File): Promise<ExtractedProfile[]> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.getWorksheet('Settings');
    if (!sheet) {
      throw new Error('Sheet "Settings" not found in the Excel file.');
    }

    const profiles: ExtractedProfile[] = [];
    const startRow = 6; // Data starts at row 6

    let stopExtraction = false;

    sheet.eachRow((row, rowNumber) => {
      if (stopExtraction || rowNumber < startRow) return;

      const role = row.getCell(2).value;
      const username = row.getCell(3).value;
      const scr = row.getCell(4).value;
      const tjm = row.getCell(5).value;

      // Stop if we reach the "Settings" section or a row without a role
      if (!role || role.toString() === 'Settings') {
        stopExtraction = true;
        return;
      }

      profiles.push({
        role: role.toString(),
        username: username ? username.toString() : null,
        scr: this.getNumericalValue(scr),
        tjm: this.getNumericalValue(tjm),
      });
    });

    return profiles;
  }

  async extractBacklog(file: File): Promise<ExtractedBacklog> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.getWorksheet('Estimate');
    if (!sheet) {
      throw new Error('Sheet "Estimate" not found in the Excel file.');
    }

    const products: Set<string> = new Set();
    const clusters: { name: string; productName: string }[] = [];
    const items: ExtractedBacklogItem[] = [];

    let currentProduct = '';
    let currentCluster = '';

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 4) return; // Skip headers

      const type = row.getCell(2).value?.toString();
      const title = row.getCell(8).value;

      if (type === 'Cluster') {
        const name = this.getStringValue(title);
        currentProduct = name;
        products.add(name);
      } else if (type === 'Feature') {
        const name = this.getStringValue(title);
        currentCluster = name;
        if (
          currentProduct &&
          !clusters.some((c) => c.name === name && c.productName === currentProduct)
        ) {
          clusters.push({ name, productName: currentProduct });
        }
      } else if (type === 'Task') {
        const descriptionValue = row.getCell(9).value;
        const profileName = this.getStringValue(row.getCell(10).value);
        const chargeMode = this.getStringValue(row.getCell(12).value);
        const scope = this.getStringValue(row.getCell(7).value);

        const isOtherRatio = chargeMode === 'Other (Ratio)';
        const isRatio = isOtherRatio || chargeMode.toLowerCase().includes('ratio');

        // Column 14 (N) for ratios, else Column 13 (M)
        const cellValue = isRatio ? row.getCell(14).value : row.getCell(13).value;
        const effort = this.getNumericalValue(cellValue);

        items.push({
          title: this.getStringValue(title),
          description: this.getStringValue(descriptionValue),
          profileName: profileName,
          effort: effort,
          chargeType: isRatio ? 'ratio' : 'days',
          type: isOtherRatio ? 'other' : 'build',
          scope: scope,
          productName: currentProduct,
          clusterName: currentCluster,
        });
      }
    });

    return {
      products: Array.from(products),
      clusters,
      items,
    };
  }

  private getStringValue(value: any): string {
    if (!value) return '';
    if (typeof value === 'object') {
      if (value.richText) {
        return value.richText.map((rt: any) => rt.text).join('');
      }
      if (value.text) return value.text;
      if (value.result !== undefined) return value.result.toString();
      return value.toString();
    }
    return value.toString();
  }

  private getNumericalValue(value: any): number {
    if (!value) return 0;

    if (typeof value === 'object') {
      if (value.result !== undefined) return Number(value.result);
      value = this.getStringValue(value);
    }

    if (typeof value === 'string') {
      // Handle "15%", "15,5%", "15.5"
      const cleaned = value.replace('%', '').replace(',', '.').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    return isNaN(Number(value)) ? 0 : Number(value);
  }
}
