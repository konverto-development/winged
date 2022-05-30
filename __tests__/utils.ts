import { readFileSync } from 'fs'
import path from 'path'

export const testDir = (): string =>
  `./__tests__/out/${expect.getState().currentTestName}`

type StdResult =
  | { success: true; error: undefined }
  | { success: false; error: string }

export const containsValidJson = (filePath: string): StdResult => {
  const content = readFileSync(filePath).toString()
  try {
    JSON.parse(content)
  } catch (e) {
    if (e instanceof Error) {
      return { success: false, error: e.message }
    }
  }
  return { success: true, error: undefined }
}

export const allContainValidJson = (filePaths: string[]): StdResult => {
  for (const filePath of filePaths) {
    const { error } = containsValidJson(filePath)
    if (error) {
      return {
        success: false,
        error: `File '${filePath}' is invalid! ${error}`
      }
    }
  }
  return { success: true, error: undefined }
}

export const lines = (filePath: string): string[] => {
  const content = readFileSync(filePath).toString()
  return content.split('\n')
}

export const findFile = (
  files: string[],
  propertyValue: string
): string | undefined =>
  files.find(filePath => path.parse(filePath).name.includes(propertyValue))
