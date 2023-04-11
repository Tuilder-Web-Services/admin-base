import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { WsClient } from '@tuilder/ws-client'
import { nanoid } from 'nanoid'
import { BehaviorSubject, filter, firstValueFrom, switchMap } from 'rxjs'
import { IImage } from '../typings/image.interface'
import { IImageRequest } from '../typings/image-request.interface'

@Injectable({
  providedIn: 'root'
})
export class ImageUploaderService {

  _maxSimultaneousUploads = 5

  private _queue: ImageUpload[] = []
  private _inProgress = new Set<ImageUpload>()

  private get _availableSlots() {
    return this._maxSimultaneousUploads - this._inProgress.size
  }

  constructor(
    private backend: WsClient,
    private http: HttpClient
  ) { }

  setMaxSimultaneousUploads(max: number) {
    this._maxSimultaneousUploads = max
  }

  getRequest(file: File) {
    return firstValueFrom(this.backend.send<IImageRequest>('GetPresignedUploadUrl', { fileKey: file.name }).response)
  }

  queue(file: File, req: IImageRequest): ImageUpload {
    const upload = new ImageUpload(this.http, this.backend, file, req)
    this._queue.push(upload)
    this.processQueue()
    return upload
  }

  private async processQueue() {
    if (!this._availableSlots) return
    const upload = this._queue.shift()
    if (!upload) return
    this._inProgress.add(upload)
    upload.start()
    await upload.whenComplete
    this._inProgress.delete(upload)
    this.processQueue()
  }
}

export class ImageUpload {
  progress: BehaviorSubject<number> = new BehaviorSubject(0)
  whenComplete = firstValueFrom(this.progress.pipe(filter(p => p === 100), switchMap(() => this.save())))
  constructor(
    private http: HttpClient,
    private backend: WsClient,
    private file: File,
    private req: IImageRequest
  ) {}
  start() {
    const req = new HttpRequest('PUT', this.req.url, this.file, {
      reportProgress: true,
    })
    this.http.request(req).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress) {
        this.progress.next(Math.round(100 * event.loaded / (event.total ?? 0)))
      } else if (event instanceof HttpResponse) {
        this.progress.next(100)
      }
    })
  }
  async save(): Promise<IImage> {
    const { width, height } = await this.getImageDimensions()
    const payload: IImage = {
      id: nanoid(),
      path: `/${this.req.path}/${this.req.fileKey}`,
      name: this.file.name,
      folder: null,
      width,
      height,
      host: ''
    }
    return (await firstValueFrom(this.backend.send<IImage>('WriteImage', { image: payload}).response)) ?? payload
  }
  private getImageDimensions() {
    return new Promise<{ width: number, height: number }>((resolve, reject) => {
      const img = new Image()
      img.src = window.URL.createObjectURL(this.file)
      img.onload = () => {
        const width = img.naturalWidth
        const height = img.naturalHeight
        window.URL.revokeObjectURL(img.src)
        resolve({ width, height })
      }
      img.onerror = reject
    })
  }
}
