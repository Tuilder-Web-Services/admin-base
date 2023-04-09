import { Component, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { WsClient } from '@tuilder/ws-client'
import { IEntity } from '../edit-entity/edit-entity.component'
import { DataGridComponent, IButtonCellValue, GridCellCoordinates, GridCellValue, GridColumn, GridDataSource, GridImplementationFactory, IGridCellValue, IGridRow, TColumnKey, EMetadataType, ERowStatus, TPrimaryKey } from '@blueshiftone/ngx-grid-core'
import { GridWrapperService } from '../../services/grid-wrapper.service'
import { nanoid } from 'nanoid'
import { firstValueFrom } from 'rxjs'
import { AutoUnsubscribe } from '../auto-unsubscribe'

@Component({
  selector: 'lib-edit-entities',
  templateUrl: './edit-entities.component.html',
  styleUrls: ['./edit-entities.component.scss'],
  providers: [GridWrapperService],
})
export class EditEntitiesComponent extends AutoUnsubscribe implements OnInit {
  
  @Output() openEntity = new EventEmitter<TPrimaryKey>()

  @ViewChild('grid', { read: DataGridComponent, static: true }) public gridComponent!: DataGridComponent  

  columns = {
    id: new GridColumn('id'),
    name: new GridColumn('name'),
    slug: new GridColumn('slug'),
    action: new GridColumn('action'),
  }

  dataSource = new GridDataSource({
    dataGridID: `entities-grid`,
    dataSetName: 'Entities',
    primaryColumnKey: 'id',
    columns: Object.values(this.columns),
  })

  button: IButtonCellValue = {
    text: '➡',
    action: (coords) => {
      this.openEntity.emit(coords.rowKey) 
    }
  }

  entities = this.backend.send<IEntity[]>('Read', {table: 'entity'}).response
  constructor(
    private backend: WsClient,
    private gridWrapperService: GridWrapperService
  ) {
    super()

    this.columns.id.type = {
      name: 'Text'
    }

    this.columns.action.type = {
      name: 'Button',
    }
    this.columns.action.name = 'Fields'
    this.columns.slug.name = 'Slug'
    this.columns.name.name = 'Name'

    this.columns.slug.metadata.set(EMetadataType.CanUpdate, false)

    this.dataSource.setColumns([this.columns.name, this.columns.slug, this.columns.action], true)
    
    firstValueFrom(this.backend.send<IEntity[]>('Read', { table: 'entity' }).response).then(data => {
      if (!data) return
      const rows: IGridRow[] = data.map(d => {
        const values: Map<TColumnKey, IGridCellValue> = new Map(Object.entries(d).map(([k, v]) => {
          return [k, new GridCellValue(new GridCellCoordinates(d.id, k), v)]
        }))
        values.set('action', new GridCellValue(new GridCellCoordinates(d.id, 'action'), this.button))
        const row = GridImplementationFactory.gridRow('id', values)
        return row
      })
      this.dataSource.setRows(rows)
    })
  }

  ngOnInit(): void {
    this.gridWrapperService.setGrid(this.gridComponent)

    const controller = this.gridComponent.gridController

    this.addSubscription(controller.gridEvents.RowInsertedEvent.on().subscribe((row) => {
      controller.cell.SetCellMeta.run(new GridCellCoordinates(row.rowKey, 'slug'), [
        {
          key: EMetadataType.CanUpdate,
          value: true
        }
      ])
    }))
  }

  async write(rows: any[]) {
    const controller = this.gridComponent.gridController
    for (const row of rows) {
      row.id = row.id ?? nanoid()
      const gridRow = controller.dataSource.getRow(row.id)
      if (gridRow) {
        controller.cell.SetCellMeta.run(new GridCellCoordinates(row.id, 'slug'), [
          {
            key: EMetadataType.CanUpdate,
            value: false
          }
        ])
        gridRow.setValue('action', new GridCellValue(new GridCellCoordinates(row.id, 'action'), this.button))
        const rowComponent = controller.row.RowComponents.findWithPrimaryKey(row.id)
        const actionCell = controller.cell.CellComponents.findWithCoords(new GridCellCoordinates(row.id, 'action'))
        const slugCell = controller.cell.CellComponents.findWithCoords(new GridCellCoordinates(row.id, 'slug'))
        if (slugCell) controller.cell.SetCellStylesFromMeta.run(slugCell)
        actionCell?.setValue(this.button)
        controller.row.SetRowStatus.buffer(row.id, ERowStatus.Committed).then(() => {
          if (rowComponent) controller.row.CheckRowIcon.run(rowComponent)
        })
      }
      this.backend.send('EntityWrite', {id: row.id, entity: row})
    }
  }

  delete(rows: any[]) {
    for (const row of rows) {
      this.backend.send('EntityDelete', {id: row.id, entityId: row.id})
    }
  }
}
