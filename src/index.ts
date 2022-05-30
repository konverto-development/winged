import { once } from 'events'
import { createLineReader, extractProperties, groupHash } from './utils'
import WritePool from './write-pool'

export type GisFile = {
  name: string
  path: string
}

export type GroupingOptions = {
  toGeoJson?: boolean
  encoding?: BufferEncoding
}

export type GroupingResult = Promise<
  [generatedFiles: string[], malformedVectorFiles: string[]]
>

export type GroupingFunction = (
  vectorFiles: GisFile[],
  outputDir: string,
  properties: string[],
  options?: GroupingOptions
) => GroupingResult

type GroupingFunctionRequired = (
  vectorFiles: GisFile[],
  outputDir: string,
  properties: string[],
  options: Required<GroupingOptions>
) => GroupingResult

const defaultOptions: Required<GroupingOptions> = {
  toGeoJson: false,
  encoding: 'utf-8'
}

const _groupFeatures: GroupingFunctionRequired = async (
  vectorFiles,
  outputDir,
  properties,
  options
) => {
  const fileExtension = options.toGeoJson ? '.geojson' : '.geojsonl'
  const malformedVectorFiles = new Set<string>()
  const pool = new WritePool(options.encoding, options.toGeoJson)
  // Read multiple vector files concurrently
  const readings = vectorFiles.map(async file => {
    const lineReader = createLineReader(file.path, options.encoding)
    /* Process each line
    If some previous line processing triggered an abortion,
    don't even start processing remanent lines */
    let abort = false
    lineReader.on('line', line => {
      if (abort) {
        return
      }
      const values = extractProperties(line, properties)
      if (!values) {
        abort = true
        lineReader.close()
        return
      }
      const hash = groupHash(values)
      const filePathOut = `${outputDir}/${file.name}-${hash}${fileExtension}`
      // Write the unmodified line
      pool.write(filePathOut, line)
    })
    await once(lineReader, 'close')
    // If the read stream was closed because of abortion,
    // mark the input vector file as malformed
    if (abort) {
      malformedVectorFiles.add(file.path)
    }
  })
  await Promise.all(readings)
  // Append files that this pool wrote to
  const generatedFiles = await pool.close()
  return [generatedFiles, [...malformedVectorFiles]]
}

/**
 * Reads features from the given GeoJSONL files and groupes them by the
 * specified properties.
 * @param vectorFilePaths The file paths to the GeoJSONL files.
 * @param outputDir The destination for generated GeoJSONL files,
 * without trailing slash.
 * @param properties The properties by which to group the features.
 * @param options Options to tune the grouping process.
 * @returns The file paths to the generated GeoJSONL files.
 */
export const groupFeatures: GroupingFunction = async (
  vectorFiles,
  outputDir,
  properties,
  options?
) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options
  }
  return await _groupFeatures(vectorFiles, outputDir, properties, mergedOptions)
}
