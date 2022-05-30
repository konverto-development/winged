import { mkdirSync } from 'fs'
import path from 'path'
import type { StringDictionary } from './types'
import type { BufferedWriteStream } from './stream'
import { createBufferedWriteStream } from './stream'

const crs = 'urn:ogc:def:crs:OGC:1.3:CRS84'

const geojsonStart = `{
  "type": "FeatureCollection",
  "crs": { "type": "name", "properties": { "name": "${crs}" } },
  "features": [`

const geojsonEnd = ']}'

export default class WritePool {
  private encoding: BufferEncoding
  private toGeoJson: boolean
  private writeStreams: StringDictionary<BufferedWriteStream> = {}

  constructor(encoding: BufferEncoding, toGeoJson: boolean) {
    this.encoding = encoding
    this.toGeoJson = toGeoJson
  }

  /** Returns a `WriteStream` for the given file and opens a new one
   * if there is none open yet. */
  private getWriteStream(filePath: string): BufferedWriteStream {
    let stream = this.writeStreams[filePath]
    if (!stream) {
      // Create directory
      mkdirSync(path.dirname(filePath), { recursive: true })
      stream = createBufferedWriteStream(filePath, 2, this.encoding)
      if (this.toGeoJson) {
        // Append start of GeoJSON
        stream.write(geojsonStart)
      }
      this.writeStreams[filePath] = stream
    }
    return stream
  }

  write(filePath: string, content: string): void {
    const stream = this.getWriteStream(filePath)
    stream.write(`${content}${this.toGeoJson ? ',' : ''}\n`)
  }

  /** Closes all created instances of `WriteStream` and returns
   * the corresponding file paths.
   */
  async close(): Promise<string[]> {
    const closings = Object.values(this.writeStreams).map(async stream => {
      if (this.toGeoJson) {
        // Remove comma from previous line
        const withCommaNewLine = stream.getBuffer(0)
        const withoutCommaNewLine = withCommaNewLine.substring(
          0,
          withCommaNewLine.length - 2
        )
        const withoutComma = `${withoutCommaNewLine}\n`
        stream.setBuffer(0, withoutComma)
        // Append end of GeoJSON
        stream.write(geojsonEnd)
      }
      await stream.close()
      return stream.getPath() as string
    })
    return await Promise.all(closings)
  }
}
