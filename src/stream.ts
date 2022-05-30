import { once } from 'events'
import type { PathLike, WriteStream } from 'fs'
import { createWriteStream } from 'fs'

export class BufferedWriteStream {
  private stream
  buffer: string[] = []
  autoCommitAtBufferSize: number

  private invBufferIndex(lookBehindIndex: number): number {
    if (lookBehindIndex < 0) {
      throw new Error('Negative look behind index not allowed!')
    }
    const index = this.buffer.length - 1 - lookBehindIndex
    if (index < 0) {
      throw new Error('Cannot look further back!')
    }
    return index
  }

  constructor(stream: WriteStream, autoCommitAtBufferSize = 0) {
    this.stream = stream
    this.autoCommitAtBufferSize = autoCommitAtBufferSize
  }

  write(content: string): void {
    this.buffer.push(content)
    if (
      this.autoCommitAtBufferSize > 0 &&
      this.buffer.length >= this.autoCommitAtBufferSize
    ) {
      this.commit(1)
    }
  }

  /** Commits the first `n` buffer elements. */
  private commit(n: number, encoding?: BufferEncoding): boolean {
    // Pop first `n` elements
    const elements = this.buffer.splice(0, n)
    // Write elements
    return elements.every(element =>
      encoding
        ? this.stream.write(element, encoding)
        : this.stream.write(element)
    )
  }

  private commitAll(encoding?: BufferEncoding): boolean {
    return this.commit(this.buffer.length, encoding)
  }

  getBuffer(lookBehindIndex: number): string {
    return this.buffer[this.invBufferIndex(lookBehindIndex)]
  }

  setBuffer(lookBehindIndex: number, content: string): void {
    this.buffer[this.invBufferIndex(lookBehindIndex)] = content
  }

  getPath(): string | Buffer {
    return this.stream.path
  }

  async close(): Promise<void> {
    this.commitAll()
    this.stream.close()
    await once(this.stream, 'close')
  }
}

export const createBufferedWriteStream = (
  path: PathLike,
  autoCommitAtBufferSize = 0,
  encoding?: BufferEncoding
): BufferedWriteStream => {
  const stream = createWriteStream(path, encoding)
  return new BufferedWriteStream(stream, autoCommitAtBufferSize)
}
