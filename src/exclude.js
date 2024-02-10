import data from '../DO_NOT_DISPLAY.json';

const to_element = x => [x,true]

const _images_map = new Map(data.IMAGES.map(to_element))
const _tokens_map = new Map(data.TOKENS.map(to_element))
const _collection_map = new Map(data.COLLECTIONS.map(to_element))


export const disabled_image = x => _images_map.has(x);
export const enabled_image = x => !_images_map.has(x);

export const disabled_token = x => _tokens_map.has(x);
export const enabled_token = x => !_tokens_map.has(x);

export const disabled_collection = x => _collection_map.has(x);
export const enabled_collection = x => !_collection_map.has(x);
