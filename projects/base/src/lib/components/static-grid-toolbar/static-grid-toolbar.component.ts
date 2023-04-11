import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core'
import { ERowStatus } from '@blueshiftone/ngx-grid-core'
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs'
import { AutoUnsubscribe } from '../auto-unsubscribe'
import { GridWrapperService } from '../../services/grid-wrapper.service'

@Component({
  selector: 'lib-static-grid-toolbar',
  templateUrl: './static-grid-toolbar.component.html',
  styleUrls: ['./static-grid-toolbar.component.scss']
})
export class StaticGridToolbarComponent extends AutoUnsubscribe implements OnInit {

  public hasDirtyRecords = new BehaviorSubject(false)
  public dirtyRecordsCount = new BehaviorSubject(0)

  @Output() public update = new EventEmitter<any[]>()
  @Output() public delete = new EventEmitter<any[]>()

  constructor(
    private gridWrapper: GridWrapperService
  ) {
    super()
  }

  ngOnInit() {

    this.gridWrapper.getGrid().then(component => {

      const controller = component?.gridController

      if (!controller) return

      this.addSubscription(controller.gridEvents.GridWasModifiedEvent.onWithInitialValue().pipe(
        map(_ => controller.row.dirtyRowsMap.size ?? 0), distinctUntilChanged())
        .subscribe(count => {
          this.dirtyRecordsCount.next(count)
          this.hasDirtyRecords.next(count > 0)
        }))

      this.addSubscription(controller.gridEvents.RowsCommittedEvent.on().subscribe(e => {
        const toUpdate: any[] = []
        const toDelete: any[] = []

        for (const key of e) {
          const row = controller.dataSource.getRow(key)!
          const rowStatus = controller.row.GetRowStatus.run(key)
          const rowJson = row.toJSON<any>()
          if (rowStatus === ERowStatus.Deleted) {
            toDelete.push(rowJson)
          } else {
            toUpdate.push(rowJson)
          }
          controller.row.ResetRowStatus.buffer(key, ERowStatus.Committed)
        }


        if (toUpdate.length) { this.update.emit(toUpdate) }
        if (toDelete.length) { this.delete.emit(toDelete) }
      }))
    })
  }

  private async getController() {
    return (await this.gridWrapper.getGrid())?.gridController
  }

  public commitAll = async () => (await this.getController())?.grid.CommitAll.run()
  public revertAll = async () => (await this.getController())?.grid.RevertAll.run()
  public insertRow = async () => (await this.getController())?.row.InsertRowAtTop.run()

}
