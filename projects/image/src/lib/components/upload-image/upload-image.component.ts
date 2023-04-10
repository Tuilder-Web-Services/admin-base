import { coerceBooleanProperty } from '@angular/cdk/coercion'
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core'
import { ControlValueAccessor, FormControl, FormGroupDirective, NgControl, NgForm } from '@angular/forms'
import { MatFormFieldControl } from '@angular/material/form-field'
import { Subject, filter, takeUntil } from 'rxjs'

@Component({
  selector: 'lib-upload-image',
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: UploadImageComponent,
    },
  ],
})
export class UploadImageComponent implements ControlValueAccessor, OnInit, OnDestroy, MatFormFieldControl<any> {

  @Input() formControl?: FormControl
  @Input() formControlName?: string

  private destroy$ = new Subject<void>();

  @Input()
  get value(): any {
    return this.control.value
  }
  set value(value: any) {
    if (this.control.value !== value) {
      this.control.setValue(value, {emitEvent: false});
      this.stateChanges.next();
    }
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.control.disable() : this.control.enable();
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input()
  get placeholder(): string {
    return ''
  }
  set placeholder(value: string) {
    // Do nothing, since there is no need for a placeholder
  }

  public control!: FormControl

  imagePreview: string | ArrayBuffer | null = null;

  static nextId = 0;
  stateChanges = new Subject<void>();
  focused = false;
  controlType = 'lib-image-upload';
  @HostBinding() id = `image-upload-${UploadImageComponent.nextId++}`;
  describedBy = '';

  get empty(): boolean {
    return !this.control.value
  }

  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty
  }

  onFocusIn() {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  get errorState(): boolean {
    return this.control.invalid && this.control.touched;
  }

  constructor(
    private formGroupDirective: FormGroupDirective,
    @Optional() private ngForm: NgForm,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    // Replace the provider from above with this.
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit() {
    if (!this.formControl && !this.formControlName) {
      throw new Error('ImageUploadComponent must have either formControl or formControlName input')
    }
    this.control = this.formControl ?? this.formGroupDirective.form.get(this.formControlName!) as FormControl
    if (this._onChangePreregistered) {
      this.registerOnChange(this._onChangePreregistered)
      this._onChangePreregistered = null
    }
    if (this._valuePreregistered) {
      this.value = this._valuePreregistered
      this._valuePreregistered = null
    }
    const form = this.ngForm ? this.ngForm : this.formGroupDirective;
    form.ngSubmit.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.control.markAsTouched()
      this.stateChanges.next()
    })
  }

  ngOnDestroy() {
    this.stateChanges.complete()
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      this.imagePreview = reader.result
      this.value = reader.result
      this.control.markAsTouched()
      this.control.markAsDirty()
      this.stateChanges.next()
    }
    reader.readAsDataURL(file)
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ')
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as HTMLElement)?.tagName.toLowerCase() !== 'input') {
      this._elementRef.nativeElement.querySelector('input')?.click()
    }
  }

  writeValue(value: any) {
    if (this.control) {
      this.value = value
    } else {
      this._valuePreregistered = value
    }
  }

  private _valuePreregistered: any

  registerOnChange(fn: any) {
    if (!this.control) {
      this._onChangePreregistered = fn
    } else {
      this.control.valueChanges.subscribe(fn)
    }
  }
  private _onChangePreregistered: any

  registerOnTouched(fn: any) {
    this.onTouched = fn
  }

  onTouched() {
    this.control.markAsTouched()
  }

}
