import { Injectable } from '@angular/core';
import { DataGridComponent } from '@blueshiftone/ngx-grid-core';

@Injectable()
export class GridWrapperService {
  private _grid: DataGridComponent | null = null;

  setGrid(grid: DataGridComponent): void {
    this._grid = grid;
  }

  getGrid(): DataGridComponent | null {
    return this._grid;
  }
}
