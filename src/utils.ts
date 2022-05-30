import { createReadStream } from 'fs'
import type { Feature } from 'geojson'
import readline from 'node:readline'

export const createLineReader = (
  filePath: string,
  encoding: BufferEncoding
): readline.Interface => {
  const readStream = createReadStream(filePath, encoding)
  return readline.createInterface({
    input: readStream,
    /* Consider \r followed by \n as a single newline
        https://nodejs.org/dist/latest/docs/api/readline.html#readlinepromisescreateinterfaceoptions */
    crlfDelay: Infinity
  })
}

/** Parses the given string as a GeoJSON feature and extract the values from
 * the given properties. Shortcuts to `undefined` if at least one feature does
 * not have all the given properties. */
export const extractProperties = (
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

export const groupHash = (values: unknown[]): string => values.join('-')
