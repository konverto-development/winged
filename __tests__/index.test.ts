import { test, expect } from '@jest/globals'
import { groupFeatures } from '../src'
import { allContainValidJson, findFile, lines, testDir } from './utils'

test('One to many - simple', async () => {
  const [generatedFiles, malformedVectorFiles] = await groupFeatures(
    [
      {
        name: 'simple',
        path: './samples/simple.geojsonl'
      }
    ],
    testDir(),
    ['show_on_map']
  )
  expect(generatedFiles.length).toBe(2)
  expect(malformedVectorFiles.length).toBe(0)
  expect(lines(generatedFiles[0]).length).toBe(2)
  expect(lines(generatedFiles[1]).length).toBe(2)
})

test('One to many - simple malformed', async () => {
  const [generatedFiles, malformedVectorFiles] = await groupFeatures(
    [
      {
        name: 'simple-malformed',
        path: './samples/simple-malformed.geojsonl'
      }
    ],
    testDir(),
    ['show_on_map']
  )
  expect(generatedFiles.length).toBe(1)
  expect(malformedVectorFiles.length).toBe(1)
})

test('One to many - us', async () => {
  const [generatedFiles, malformedVectorFiles] = await groupFeatures(
    [
      {
        name: 'us',
        path: './samples/us.geojsonl'
      }
    ],
    testDir(),
    ['STATE']
  )
  expect(generatedFiles.length).toBe(52)
  expect(malformedVectorFiles.length).toBe(0)
})

test('Many to one - simple', async () => {
  const name = 'simple'
  const [generatedFiles, malformedVectorFiles] = await groupFeatures(
    [
      {
        name,
        path: './samples/simple.geojsonl'
      },
      {
        name,
        path: './samples/simple2.geojsonl'
      }
    ],
    testDir(),
    ['show_on_map']
  )
  expect(generatedFiles.length).toBe(2)
  expect(malformedVectorFiles.length).toBe(0)
  const fileFalse = findFile(generatedFiles, 'false')
  expect(fileFalse && lines(fileFalse).length).toBe(3)
  const fileTrue = findFile(generatedFiles, 'true')
  expect(fileTrue && lines(fileTrue).length).toBe(5)
})

test('Convert to GeoJSON - simple', async () => {
  const [generatedFiles] = await groupFeatures(
    [
      {
        name: 'simple',
        path: './samples/simple.geojsonl'
      }
    ],
    testDir(),
    ['show_on_map'],
    { toGeoJson: true }
  )
  const { error } = allContainValidJson(generatedFiles)
  expect(error).toBeUndefined()
})

test('Convert to GeoJSON - simple2', async () => {
  const [generatedFiles] = await groupFeatures(
    [
      {
        name: 'simple2',
        path: './samples/simple2.geojsonl'
      }
    ],
    testDir(),
    ['show_on_map'],
    { toGeoJson: true }
  )
  const { error } = allContainValidJson(generatedFiles)
  expect(error).toBeUndefined()
})

test('Convert to GeoJSON - us', async () => {
  const [generatedFiles] = await groupFeatures(
    [
      {
        name: 'us',
        path: './samples/us.geojsonl'
      }
    ],
    testDir(),
    ['STATE'],
    { toGeoJson: true }
  )
  const { error } = allContainValidJson(generatedFiles)
  expect(error).toBeUndefined()
})
