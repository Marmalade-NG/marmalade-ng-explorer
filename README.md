# Marmalade NG Explorer

## Intro
Web explorer for Marmalade-NG.

This is Vite project, build on top of:

- React
- SWR
- Kadena.js
- Semantic

## Building

```sh

yarn install

yarn build

```

## Censorship and tokens exclusion

For many reasons, we want to avoid some tokens, images or collections in the explorer.
- Inappropriate
- Error during token collection/token creation
- ...

The file DO_NOT_DISPLAY.json contains such excluded tokens and collections.

Please propose a PR if you want to add an item in this file.

Note that:
- The token/collection still exists in the ledger and is still viewable by 3rd party frontends like Marketplaces.
- The token/collection is still viewable in the explorer by using the search field.

## Deployment

Currently deployed on https://explorer.marmalade-ng.xyz
