# winged

A blazingly fast GeoJSONL processor to group geographical features

## Install

Using yarn:

```sh
yarn add @devgioele/winged
```

Using npm:

```sh
npm install @devgioele/winged
```

## Getting started

### One to many

To group the features of one GeoJSONL file according to the property `nation`:

```ts
import { groupFeatures } from '@devgioele/winged'

const files = [
    {
        name: 'source',
        path: './some-path-to-the-file.geojsonl'
    }
]

const [generatedFiles, malformedFiles] = await groupFeatures(
    files,
    './result',
    ['nation']
  )
```

### Many to many

To group the features of two GeoJSONL files according to the property `nation` and convert them to GeoJSON at the same time:

```ts
import { groupFeatures } from '@devgioele/winged'

const files = [
    {
        name: 'some-prefix',
        path: './some-path-to-source1.geojsonl'
    },
    {
        name: 'some-prefix',
        path: './some-path-to-source2.geojsonl'
    }
]

const [generatedFiles, malformedFiles] = await groupFeatures(
    files,
    './result',
    ['nation']
  )
```

The many-to-many processing is achieved by giving to both input files the same name.

### To GeoJSON

Convert the output files to GeoJSON at the same time by enabling the `toGeoJson` flag:

```ts
import { groupFeatures } from '@devgioele/winged'

const files = [
    {
        name: 'source',
        path: './some-path-to-the-file.geojsonl'
    }
]

const [generatedFiles, malformedFiles] = await groupFeatures(
    files,
    './result',
    ['nation'],
    { toGeoJson: true }
  )

```

## Contributing

### Install Node.js

Install [version 16.10 or higher of Node.js](https://nodejs.org/en/download/). Use `node -v` to check your current version.

### Enable corepack

```sh
corepack enable
```

### Install dependencies

```sh
yarn
```

### Releasing

Whenever it is appropriate to increase the version number, run locally:

```sh
yarn version <version>
```

Replace `<version>` with one of the following:

- major
- minor
- patch

Then commit and push.

For more information, see [the docs](https://yarnpkg.com/cli/version).
