import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { MatMenuTrigger } from '@angular/material/menu'
import { DataGridComponent, IGridRow, IGridSelectionSlice, TPrimaryKey } from '@blueshiftone/ngx-grid-core'
import { debounceTime } from 'rxjs/operators'
import { AutoUnsubscribe } from '../auto-unsubscribe'

@Component({
  selector: 'lib-floating-grid-toolbar',
  templateUrl: './floating-grid-toolbar.component.html',
  styleUrls: ['./floating-grid-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingGridToolbarComponent extends AutoUnsubscribe implements OnInit {

  @ViewChild('multiEditButton') public multiEditButton?: ElementRef<HTMLElement>
  @ViewChild('multiEditMenuTrigger', {read: MatMenuTrigger}) public multiEditMenuTrigger?: MatMenuTrigger

  @Input() public grid?: DataGridComponent

  public canSetValues = false
  public canRevert    = false
  public canCommit    = false
  public canDelete    = true
  public multiEditorLabels: string[] = []

  public selectionSlice: IGridSelectionSlice | null=  null
  public rows: IGridRow[] = []

  constructor(
    private readonly elRef          : ElementRef<HTMLElement>,
    private readonly changeDetection: ChangeDetectorRef,
  ) {super()}

  ngOnInit(): void {
    if (!this.grid) return
    this.addSubscription(this.grid.selectionChanged.pipe(debounceTime(50)).subscribe(slice => {
      if (!this.grid) return
      this.selectionSlice = slice
      if (slice) {
        this.rows.length = 0
        for (const rowKey of slice.selection.rowKeys) {
          const row = this.grid.gridController.dataSource.getRow(rowKey)
          if (row) {
            this.rows.push(row)
          }
        }
      }
      this._checkChanges()
    }))
    this._init()
  }

  private async _init() {
    const controller = this.grid?.gridController
    if (!controller) return
    await controller.whenInitialised()
    const viewPort = controller.grid.viewPort
    if (!viewPort) return
    const el = viewPort.elementRef.nativeElement.parentElement
    if (!el) return
    el.prepend(this.elRef.nativeElement)
    this.canDelete = controller.dataSource.canDelete
    this.addSubscription(controller.gridEvents.GridWasModifiedEvent.on().subscribe(_ => this._checkChanges()))
  }

  public setValues(): void {
    const selection = this.selectionSlice?.selection
    if (!selection) return
    const distinctType = this.grid?.multiEdit.getDistinctType(selection)
    if (distinctType && distinctType.type.name === 'Boolean') {
      this.multiEditMenuTrigger?.openMenu()
      return
    }
    this.grid?.multiEdit.openValueEditor({
      strategy: 'element',
      element: this.multiEditButton?.nativeElement
    }, selection)
  }

  public runMultiEditor(label: string): void {

    const selection            = this.selectionSlice?.selection
    const multiCellEditService = this.grid?.multiEdit
    if (!selection || !multiCellEditService) return

    multiCellEditService.runMultiEditor(label, selection, {
      strategy: 'element',
      element: this.multiEditButton?.nativeElement
    })

  }

  public copySelection(): void {
    this.grid?.gridController.selection.CopySelection.run()
  }

  public deleteRecords(): void {
    for (const pk of this._selectedRowKeys) this.grid?.gridController.row.DeleteRow.buffer(pk)
  }

  public clearSelection(): void {
    this.grid?.gridController.selection.ClearSelection.run()
  }

  private get _selectedRowKeys(): TPrimaryKey[] {
    return this.selectionSlice?.rowKeys ?? []
  }

  private _checkChanges(): void {
    const selection = this.selectionSlice?.selection
    const multiCellEditService = this.grid?.multiEdit
    if (selection && multiCellEditService) {
      const distinctType = multiCellEditService.getDistinctType(selection) 
      this.canSetValues = distinctType !== false
      if (distinctType) {
        this.multiEditorLabels = distinctType.editors.map(e => new e(null, distinctType.type.name)).map(editor => editor.label).reverse()
      }
      const controller = this.grid?.gridController
      if (controller) {
        this.canDelete = this.rows.find(r => controller.row.GetRowCanDelete.run(r) === true) !== undefined
      }
    }
    this.changeDetection.detectChanges()
  }

}
