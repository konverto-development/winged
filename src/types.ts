export type GroupingOptions = {
  toGeoJson?: boolean
  encoding?: BufferEncoding
}

export type GisFile = {
  name: string
  path: string
}

export type StringDictionary<T = unknown> = {
  [index: string]: T
}
