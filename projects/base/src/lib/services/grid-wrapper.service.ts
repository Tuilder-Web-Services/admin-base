import { Injectable } from '@angular/core';
import { DataGridComponent } from '@blueshiftone/ngx-grid-core';

@Injectable()
export class GridWrapperService {
  private _grid: DataGridComponent | null = null;
  public waitingForGrid: Promise<void> | null = null;

  setGrid(grid: DataGridComponent): void {
    this._grid = grid;
  }

  async getGrid(): Promise<DataGridComponent | null> {
    if (this.waitingForGrid) await this.waitingForGrid;
    return this._grid;
  }
}
