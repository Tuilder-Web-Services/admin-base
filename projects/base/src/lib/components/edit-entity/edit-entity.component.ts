import { Component, Input, OnInit, ViewChild } from '@angular/core'
import { DataGridComponent, EGridSelectListType, EMetadataType, ERowStatus, GridCellCoordinates, GridCellValue, GridColumn, GridDataSource, GridImplementationFactory, IGridCellValue, IGridRow, TColumnKey } from '@blueshiftone/ngx-grid-core'
import { WsClient } from '@tuilder/ws-client'
import { nanoid } from 'nanoid'
import { AutoUnsubscribe } from '../../components/auto-unsubscribe'
import { firstValueFrom } from 'rxjs'
import { GridWrapperService } from '../../services/grid-wrapper.service'

@Component({
  selector: 'lib-edit-entity',
  templateUrl: './edit-entity.component.html',
  styleUrls: ['./edit-entity.component.scss'],
  providers: [GridWrapperService],
})
export class EditEntityComponent extends AutoUnsubscribe implements OnInit {

  @Input() id: string | null | undefined = null

  name = ''

  entity: IEntity | null = null

  @ViewChild('grid', { read: DataGridComponent, static: true }) public gridComponent!: DataGridComponent

  columns = {
    id: new GridColumn('id'),
    name: new GridColumn('name'),
    slug: new GridColumn('slug'),
    type: new GridColumn('type'),
    isRequired: new GridColumn('isRequired'),
  }

  dataSource = new GridDataSource({
    dataGridID: `entity-grid-${this.id}`,
    dataSetName: 'Entity Fields',
    primaryColumnKey: 'id',
    columns: Object.values(this.columns),
  })

  constructor(
    private gridWrapperService: GridWrapperService,
    private backend: WsClient,
  ) {
    super()
    this.columns.id.type = {
      name: 'Text'
    }
    this.columns.isRequired.type = {
      name: 'Boolean'
    }
    this.columns.type.type = {
      name: 'DropdownSingleSelect',
      list: {
        type: EGridSelectListType.MultiSelect,
        staticOptions: [
          {
            value: "Entity"
          },
          {
            value: "RichText"
          },
          {
            value: "Boolean"
          },
          {
            value: "Text"
          },
          {
            value: "Number"
          },
          {
            value: "Date"
          },
          {
            value: "Color"
          }
        ]
      }
    }
    this.columns.type.name = 'Type'
    this.columns.slug.name = 'Slug'
    this.columns.name.name = 'Name'
    this.columns.isRequired.name = 'Is Required'
    this.columns.slug.metadata.set(EMetadataType.CanUpdate, false)
    this.columns.slug.metadata.set(EMetadataType.IsRequired, true)
    this.columns.name.metadata.set(EMetadataType.IsRequired, true)
    this.columns.type.metadata.set(EMetadataType.IsRequired, true)
    this.dataSource.setColumns([this.columns.name, this.columns.type, this.columns.slug, this.columns.isRequired], true)
  }

  ngOnInit() {
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

    firstValueFrom(this.backend.send<IEntity>('Read', { table: 'entity', options: { firstOnly: true, id: this.id, } }).response).then(entity => {
      this.entity = entity
      this.name = entity?.name ?? ''
      this.backend.send<IEntityField[]>('Read', { table: 'entityField', options: { where: {entityId: this.id} } }).response.subscribe(rows => {
        if (!rows) return
        const gridRows = rows.map(d => {
          const values: Map<TColumnKey, IGridCellValue> = new Map(Object.entries(d).map(([k, v]) => {
            return [k, new GridCellValue(new GridCellCoordinates(d.id, k), v)]
          }))
          const row = GridImplementationFactory.gridRow('id', values)
          return row
        })
        this.dataSource.setRows(gridRows)
      })
    })
  }

  write(rows: any[]) {
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
        row.entityId = this.id
        const rowComponent = controller.row.RowComponents.findWithPrimaryKey(row.id)
        const slugCell = controller.cell.CellComponents.findWithCoords(new GridCellCoordinates(row.id, 'slug'))
        if (slugCell) controller.cell.SetCellStylesFromMeta.run(slugCell)
        controller.row.SetRowStatus.buffer(row.id, ERowStatus.Committed).then(() => {
          if (rowComponent) controller.row.CheckRowIcon.run(rowComponent)
        })
      }
    }
    this.backend.send('EntityWrite', { id: this.id, fields: rows })
  }

  delete(rows: any[]) {
    this.backend.send('EntityDelete', { id: this.id, fieldsId: rows.map(row => row.id) })
  }
}

export interface IEntity {
  id: string
  name: string
  slug: string
}

export interface IEntityField {
  id: string
  name: string
  slug: string
  type: string
  isRequired: '1' | '0'
}
