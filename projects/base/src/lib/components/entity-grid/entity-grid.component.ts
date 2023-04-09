import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core'
import { DataGridComponent, GridColumn, GridDataSource, IGridRow, GridImplementationFactory, TColumnKey, IGridCellValue, GridCellValue, GridCellCoordinates, GridMetadataCollection, EMetadataType, TCellTypeName } from '@blueshiftone/ngx-grid-core'
import { WsClient } from '@tuilder/ws-client'
import { firstValueFrom } from 'rxjs'
import { GridWrapperService } from '../../services/grid-wrapper.service'
import { IEntityModel } from '../../typings/entity-model.interface'
import { IEntity } from '../edit-entity/edit-entity.component'

@Component({
  selector: 'lib-entity-grid',
  templateUrl: './entity-grid.component.html',
  styleUrls: ['./entity-grid.component.scss'],
  providers: [GridWrapperService],
})
export class EntityGridComponent implements OnInit {

  @ViewChild('grid', { read: DataGridComponent, static: true }) public gridComponent!: DataGridComponent

  @Input() name = ''

  private entity?: IEntity | null = null

  dataSource = new GridDataSource({
    dataGridID: `entity-grid-${this.name}`,
    dataSetName: this.name,
    primaryColumnKey: 'id',
  })

  constructor(
    private backend: WsClient,
    private gridWrapperService: GridWrapperService
  ) {
  }

  ngOnInit(): void {
    this.gridWrapperService.setGrid(this.gridComponent)
    firstValueFrom(this.backend.send<IEntityModel<any>>('EntityRead', { slug: this.name }).response).then(data => {
      if (!data) return
      this.entity = data.entity
      const columns = data.fields.map(f => {
        const col = new GridColumn(f.slug)
        col.type = { name: (f.type as TCellTypeName) ?? 'Text' }
        if (f.isRequired === '1') {
          col.metadata.set(EMetadataType.IsRequired, true)
        }
        col.name = f.name
        return col
      })
      const idColumn = new GridColumn('id')
      idColumn.type = { name: 'Text' }
      columns.unshift(idColumn)
      this.dataSource.setColumns(columns)
      this.dataSource.setColumns(columns.filter(c => c.columnKey !== 'id'), true)
      const rows: IGridRow[] = data.records.map(d => {
        const values: Map<TColumnKey, IGridCellValue> = new Map(Object.entries(d).map(([k, v]) => {
          return [k, new GridCellValue(new GridCellCoordinates(d.id, k), v)]
        }))
        const row = GridImplementationFactory.gridRow('id', values)
        return row
      })
      console.log(rows)      
      this.dataSource.setRows(rows)
    })
  }

  write(rows: any[]) {
    if (!this.entity) {
      throw new Error('Entity not found')
    }
    for (const row of rows) {
      this.backend.send('EntityWrite', { id: this.entity.id, record: row })
    }
  }

  delete(rows: any[]) {
    if (!this.entity) {
      throw new Error('Entity not found')
    }
    this.backend.send('EntityDelete', { id: this.entity.id, recordId: rows.map(r => r.id) })
  }
}
