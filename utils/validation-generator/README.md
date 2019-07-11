# API validation generator

> Warning! The output which we get from `transform-json-types` library is not perfect. `output.ts` needs to be checked after the automatic transformation.

This util is used to automatically generate [io-ts](https://github.com/gcanti/io-ts) runtime and type validations for an actual Instagram API. 

To generate these validations two steps are required:

*   Get an actual Instagram API response and save as json
*   Get `io-ts` typings from it

## Actual API response

`ts-node utils/validation-generator/get-input.ts` 

The script will save an actual API response for different endpoints in `input.json` file (gitignored)

## Generate typings

`ts-node utils/validation-generator/generate.ts`

The script will save typing to `output.ts` file (gitignored).

After the generation is completed need to move all primitive types (which does not use other types, like `ThumbnailResources`, `Owner` and others) to the top of the file, final types (like `Post`) to the bottom of the file and fix all the block-scoped variables order errors manually.

> Warning! By some weird reasons these typings are a little bit screwed. Need to replace Node3 with Node inside Post type to make them ok.

To test the typings you can do `npm test -- -t "Strict mode"`