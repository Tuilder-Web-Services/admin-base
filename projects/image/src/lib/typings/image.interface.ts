export interface IImage {
  id: string
  path: string
  width: number
  height: number
  color?: number[]
  luminance?: number
  blurhash?: string
  name: string
  folder: string | null
  host: string
}
