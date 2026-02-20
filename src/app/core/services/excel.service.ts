import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { BacklogItem, Planning, ProductGroup, Profile, Scope } from '../models/domain.model';

import { CalculationService } from './calculation.service';

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
  constructor(private calcService: CalculationService) {}

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
      const scrCell = row.getCell(4);
      const tjmCell = row.getCell(5);

      // Stop if we reach the "Settings" section or a row without a role
      if (!role || role.toString() === 'Settings') {
        stopExtraction = true;
        return;
      }

      profiles.push({
        role: role.toString(),
        username: username ? username.toString() : null,
        scr: this.getNumericalValue(scrCell),
        tjm: this.getNumericalValue(tjmCell),
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
        const cell = isRatio ? row.getCell(14) : row.getCell(13);
        const effort = this.getNumericalValue(cell);

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

  async exportBacklog(
    projectName: string,
    groupedItems: ProductGroup[],
    profiles: Profile[],
    plannings: Planning[] = [],
  ) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CGI Costing Tool';
    workbook.lastModifiedBy = 'CGI Costing Tool';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Estimate');

    // Define columns
    // We try to match the import structure:
    // Col 2: Type (Cluster, Feature, Task)
    // Col 7: Scope
    // Col 8: Title
    // Col 9: Description
    // Col 10: Profile
    // Col 12: Charge Mode (Days, Ratio)
    // Col 13: Effort (Days)
    // Col 14: Effort (Ratio)

    sheet.columns = [
      { header: '', key: 'empty1', width: 2 },
      { header: 'Type', key: 'type', width: 15 },
      { header: '', key: 'empty2', width: 2 },
      { header: '', key: 'empty3', width: 2 },
      { header: '', key: 'empty4', width: 2 },
      { header: '', key: 'empty5', width: 2 },
      { header: 'Scope', key: 'scope', width: 10 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 60 },
      { header: 'Profile', key: 'profile', width: 25 },
      { header: 'Hypothèses', key: 'hypotheses', width: 40 },
      { header: 'Commentaires', key: 'comments', width: 40 },
      { header: 'Charge Mode', key: 'chargeMode', width: 20 },
      { header: 'Effort (Days)', key: 'effortDays', width: 15 },
      { header: 'Effort (Ratio)', key: 'effortRatio', width: 15 },
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF991B1B' }, // Red-900ish
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    let currentRow = 2;

    for (const prodGroup of groupedItems) {
      // Product Row
      const prodRow = sheet.getRow(currentRow++);
      prodRow.getCell(2).value = 'Cluster';
      prodRow.getCell(8).value = prodGroup.product;
      prodRow.font = { bold: true, size: 14, color: { argb: 'FF7F1D1D' } }; // Red-900
      prodRow.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' }, // Red-100
      };

      for (const clusterGroup of prodGroup.clusters) {
        // Cluster Row
        const clusterRow = sheet.getRow(currentRow++);
        clusterRow.getCell(2).value = 'Feature';
        clusterRow.getCell(8).value = clusterGroup.cluster;
        clusterRow.font = { bold: true, size: 12, color: { argb: 'FF991B1B' } }; // Red-800
        clusterRow.getCell(8).alignment = { indent: 2 };

        for (const item of clusterGroup.items) {
          const profile = profiles.find((p) => p.id === item.profileId);
          const taskRow = sheet.getRow(currentRow++);
          taskRow.getCell(2).value = 'Task';
          taskRow.getCell(7).value = item.scope;
          taskRow.getCell(8).value = item.title;
          taskRow.getCell(9).value = item.description;
          taskRow.getCell(10).value = profile ? profile.name : 'Unknown';
          taskRow.getCell(11).value = item.hypotheses || '';
          taskRow.getCell(12).value = item.comments || '';
          taskRow.getCell(13).value = item.chargeType === 'ratio' ? 'Other (Ratio)' : 'Days';

          if (item.chargeType === 'ratio') {
            taskRow.getCell(15).value = Number(item.effortDays || 0) / 100; // Store as decimal fraction for Excel percentage formatting
            taskRow.getCell(15).numFmt = '0%';
          } else {
            taskRow.getCell(14).value = Number(item.effortDays || 0);
            taskRow.getCell(14).numFmt = '0.000';
          }

          taskRow.getCell(8).alignment = { indent: 4 };
        }
      }

      // Add empty row between products
      currentRow++;
    }

    // Add border to all data cells
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // --- SECOND SHEET: PROFILES ---
    const profileSheet = workbook.addWorksheet('Profiles');

    profileSheet.columns = [
      { header: 'Profil', key: 'name', width: 30 },
      { header: 'Identifiant', key: 'username', width: 25 },
      { header: 'Taux Journalier (€)', key: 'dailyRate', width: 20 },
      { header: 'S.C.R. (%)', key: 'scr', width: 15 },
      { header: 'TJM / Rate (€)', key: 'tjm', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Style Header Row for Profile Sheet
    const pHeaderRow = profileSheet.getRow(1);
    pHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    pHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate-800
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    profiles.forEach((p, index) => {
      const row = profileSheet.addRow({
        name: p.name,
        username: p.username || '-',
        dailyRate: Number(p.dailyRate || 0),
        scr: Number(p.scr || 0) / 100,
        tjm: Number(p.dailyRate || 0) * (1 + Number(p.scr || 0) / 100),
        status: p.active ? 'Actif' : 'Inactif',
      });

      // Formatting
      row.getCell('dailyRate').numFmt = '#,##0.00 €';
      row.getCell('scr').numFmt = '0%';
      row.getCell('tjm').numFmt = '#,##0.00 €';

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // --- THIRD SHEET: PLANNING ---
    const planningSheet = workbook.addWorksheet('Planning');

    const monthCols = Array.from({ length: 24 }, (_, i) => ({
      header: `M${i + 1}`,
      key: `m${i + 1}`,
      width: 8,
    }));

    planningSheet.columns = [
      { header: 'Scope', key: 'scope', width: 10 },
      { header: 'Profil', key: 'profile', width: 25 },
      { header: 'Restant', key: 'remaining', width: 12 },
      ...monthCols,
    ];

    // Style Header Row for Planning Sheet
    const planHeaderRow = planningSheet.getRow(1);
    planHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    planHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3730A3' }, // Indigo-800
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const scopes: Scope[] = ['MVP', 'V1', 'V2'];

    // 1. Flatten items
    const allItems: BacklogItem[] = [];
    groupedItems.forEach((pg) => {
      pg.clusters.forEach((cg) => {
        allItems.push(...cg.items);
      });
    });

    if (allItems.length > 0 && profiles.length > 0) {
      // 2. Compute total build effort
      const totalBuildEffort = this.calcService.calculateTotalBuildEffort(allItems);

      // 3. Group effort by Scope + Profile
      const effortMap = new Map<string, number>();
      allItems.forEach((item) => {
        const scope = item.scope || 'No Scope';
        const profileId = item.profileId;
        const key = `${scope}|${profileId}`;
        const effort = this.calcService.getItemEffort(item, totalBuildEffort);
        effortMap.set(key, (effortMap.get(key) || 0) + effort);
      });

      // 4. Group by Scope for export
      const scopeGroupsMap = new Map<string, any[]>();

      effortMap.forEach((totalEffort, key) => {
        const [scope, profileId] = key.split('|');
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) return;

        const planning = plannings.find((p) => p.scope === scope && p.profileId === profileId);
        const distribution = planning ? { ...planning.distribution } : {};

        // Convert distribution keys to numbers if they are strings from backend
        const numericDistribution: Record<number, number> = {};
        Object.entries(distribution).forEach(([k, v]) => {
          numericDistribution[Number(k)] = Number(v);
        });

        const totalDistributed = Object.values(numericDistribution).reduce((sum, v) => sum + v, 0);

        const rowData: any = {
          scope,
          profile: profile.name,
          remaining: Number(totalEffort - totalDistributed || 0),
        };

        // Month indexing is 0 to 23
        for (let i = 0; i < 24; i++) {
          rowData[`m${i + 1}`] = Number(numericDistribution[i] || 0);
        }

        if (!scopeGroupsMap.has(scope)) {
          scopeGroupsMap.set(scope, []);
        }
        scopeGroupsMap.get(scope)!.push(rowData);
      });

      // 5. Build the sheet rows
      for (const scope of scopes) {
        const rows = scopeGroupsMap.get(scope) || [];
        rows.sort((a, b) => a.profile.localeCompare(b.profile));

        for (const rowData of rows) {
          const row = planningSheet.addRow(rowData);

          // Formatting
          row.getCell('remaining').numFmt = '0.000';
          for (let i = 1; i <= 24; i++) {
            row.getCell(`m${i}`).numFmt = '0.000';
          }

          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          });
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-backlog-${date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  private getNumericalValue(cellOrValue: any): number {
    let cell: any = null;
    let value: any = cellOrValue;

    if (
      cellOrValue &&
      typeof cellOrValue === 'object' &&
      'value' in cellOrValue &&
      'numFmt' in cellOrValue
    ) {
      cell = cellOrValue;
      value = cell.value;
    }

    if (value === null || value === undefined) return 0;

    let isPercentFormat = false;
    if (cell && cell.numFmt && typeof cell.numFmt === 'string' && cell.numFmt.includes('%')) {
      isPercentFormat = true;
    }

    let numVal = 0;

    if (typeof value === 'object') {
      if (value.result !== undefined) {
        value = value.result;
      } else {
        value = this.getStringValue(value);
      }
    }

    if (typeof value === 'string') {
      // Handle "15%", "15,5%", "15.5"
      const cleaned = value.replace('%', '').replace(',', '.').trim();
      const num = parseFloat(cleaned);
      numVal = isNaN(num) ? 0 : num;

      if (value.includes('%')) {
        isPercentFormat = false;
      }
    } else if (typeof value === 'number') {
      numVal = isNaN(value) ? 0 : value;
    } else {
      numVal = isNaN(Number(value)) ? 0 : Number(value);
    }

    if (isPercentFormat) {
      return numVal * 100;
    }

    return numVal;
  }
}
