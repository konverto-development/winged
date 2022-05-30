import { once } from 'events'
import { createReadStream } from 'fs'
import type { Feature } from 'geojson'
import readline from 'node:readline'
import type { GisFile, GroupingOptions } from './types'
import WritePool from './write-pool'

const defaultOptions: Required<GroupingOptions> = {
  toGeoJson: false,
  encoding: 'utf-8'
}

/**
 * Reads features from the given GeoJSONL files and groupes them by the
 * specified properties.
 * @param vectorFilePaths The file paths to the GeoJSONL files.
 * @param outputDir The destination for generated GeoJSONL files,
 * without trailing slash.
 * @param properties The properties by which to group the features.
 * @param fileExtension The extension used for the generated files.
 * Defaults to `.geojsonl`.
 * @param encoding The encoding used for reading and writing files.
 * Defaults to `utf-8`.
 * @returns The file paths to the generated GeoJSONL files.
 */
export const groupFeatures = async (
  vectorFiles: GisFile[],
  outputDir: string,
  properties: string[],
  options?: GroupingOptions
): Promise<[generatedFiles: string[], malformedVectorFiles: string[]]> => {
  const mergedOptions = {
    ...defaultOptions,
    ...options
  }
  const fileExtension = mergedOptions.toGeoJson ? '.geojson' : '.geojsonl'
  const malformedVectorFiles = new Set<string>()
  const pool = new WritePool(mergedOptions.encoding, mergedOptions.toGeoJson)
  // Read multiple vector files concurrently
  const readings = vectorFiles.map(async file => {
    const readStream = createReadStream(file.path, mergedOptions.encoding)
    const rl = readline.createInterface({
      input: readStream,
      /* Consider \r followed by \n as a single newline
      https://nodejs.org/dist/latest/docs/api/readline.html#readlinepromisescreateinterfaceoptions */
      crlfDelay: Infinity
    })
    rl.line
    /* Process each line
    If some previous line processing triggered an abortion,
    don't even start processing remanent lines */
    let abort = false
    rl.on('line', line => {
      if (abort) {
        return
      }
      const values = extractProperties(line, properties)
      if (!values) {
        abort = true
        rl.close()
        return
      }
      const hash = groupHash(values)
      const filePathOut = `${outputDir}/${file.name}-${hash}${fileExtension}`
      // Write the unmodified line
      pool.write(filePathOut, line)
    })
    await once(rl, 'close')
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

/** Parses the given string as a GeoJSON feature and extract the values from
 * the given properties. Shortcuts to `undefined` if at least one feature does
 * not have all the given properties. */
const extractProperties = (
  featureString: string,
  properties: string[]
): unknown[] | undefined => {
  const feature: Feature = JSON.parse(featureString)
  const values = Array(properties.length)
  for (let i = 0; i < properties.length; i += 1) {
    const property = properties[i]
    const value = feature.properties?.[property]
    if (value === undefined) {
      return undefined
    }
    values[i] = value
  }
  return values
}

const groupHash = (values: unknown[]): string => values.join('-')
