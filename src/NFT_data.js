import { CID } from 'multiformats/cid'
import delay from 'delay';
import { get as idb_get, set as idb_set } from 'idb-keyval';
import {blake2sHex} from 'blakejs';
import useSWRImmutable from 'swr/immutable'
import EMPTY_IMG from './assets/empty.png'
import MISSING_IMG from './assets/missing.png'


const EMPTY_META = {name:"", description:""};
const DEFAULT_DATA = {meta:null, thumbnail:EMPTY_IMG}
const DEFAULT_MISSING = {meta:null, thumbnail:MISSING_IMG}

const THUMBNAIL_MAX_X = 320
const THUMBNAIL_MAX_Y = 320

const GATEWAY_ROUND_ROBIN = true

const GATEWAYS = [".dweb.link", "ipfs.io", "cloudflare-ipfs.com", ".cf-ipfs.com", "gateway.pinata.cloud", ".nftstorage.link"];

const PREFERED_GATEWAY = "ipfs.io";

const KDAFS_GATEWAY = "gw.marmalade-ng.xyz"

const DATA_VERSION = "A"

const ipfs_resolution = (gw, cid, path) =>  "https://" + (gw.startsWith(".")?(cid + ".ipfs" + gw):(gw + "/ipfs/" + cid)) + "/" + (path??" ")

const kdafs_resolution = (gw, cid, path) =>  "https://" + gw + "/kdafs/" + cid + "/" + path;

const delay_fetch = (_delay, sig, uri) => delay(_delay, {signal:sig})
                                         .then(() => fetch(uri))
                                         .then(res => { if(res.ok)
                                                          return res;
                                                        else
                                                          throw Error(`Fetch error: ${res.status}`)
                                                      });


function to_img_link(uri)
{
  const [protocol, c_path] = uri.split("//")
  if(!protocol || !c_path)
    return ""
  const [cid, ..._path] = c_path.split("/");
  const path = _path.join("/");
  return protocol == "ipfs:"? ipfs_resolution(PREFERED_GATEWAY, CID.parse(cid).toV1().toString(), path):uri;
}


function create_thumbnail(data)
{
  function _resize(bitmap)
  {
    const ratio = Math.max(bitmap.width/THUMBNAIL_MAX_X, bitmap.height/THUMBNAIL_MAX_Y, 1.0)
    const [width, height] = [bitmap.width, bitmap.height].map(x=>Math.round(x/ratio))

    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return offscreen.convertToBlob({type:"image/jpeg"})
  }
  return createImageBitmap(data)
         .then(_resize)
}

function _fetch(uri)
{
  const [protocol, c_path] = uri.split("//")
  if(!protocol || !c_path)
    throw new Error(`Invalid URI:${uri}`);

  const [cid, ..._path] = c_path.split("/");
  const path = _path.join("/");

  if(protocol == "ipfs:")
  {
    const norm_cid = CID.parse(cid).toV1().toString()
    const ctr = new AbortController()

    if(GATEWAY_ROUND_ROBIN)
      GATEWAYS.push(GATEWAYS.shift());

    return Promise.any(GATEWAYS.map((g, i) => delay_fetch(i*2500, ctr.signal, ipfs_resolution(g, norm_cid, path))))
                  .then(x => {ctr.abort(); return x})
  }
  else if(protocol == "kdafs:")
    return fetch(kdafs_resolution(KDAFS_GATEWAY, cid, path))
  else
    return fetch(uri);
}

const to_objectURL = ({thumbnail,...others}) => ({thumbnail:URL.createObjectURL(thumbnail), ...others})

function _from_img_data(resp)
{
  return resp.blob()
         .then(create_thumbnail)
         .then(x => ({meta:EMPTY_META, thumbnail:x}));
}

async function _from_meta_data(resp)
{
  const meta = await resp.json();
  return await _fetch(meta.image)
               .then(r => r.blob())
               .then(create_thumbnail)
               .then(x=> ({meta:meta, thumbnail:x, img_link:to_img_link(meta.image)}));
}

function _fetch_meta(uri)
{
  return _fetch(uri)
         .then((resp) => {if(resp.headers.get("content-type").startsWith("image"))
                            return _from_img_data(resp)
                           else if(resp.headers.get("content-type").startsWith("application/json"))
                             return _from_meta_data(resp);
                           else
                             throw Error("Unknown data")})
}

function fetchData(uri)
{
  const db_key = blake2sHex(`NGK*${DATA_VERSION}*${uri}`)

  return idb_get(db_key)
         .then(x => x?x:_fetch_meta(uri)
                        .then(x=> {idb_set(db_key,x); return x}))
         .then(to_objectURL)
}

function useNFTdata(uri)
{
  const {data, error} = useSWRImmutable(uri?["/off-chain", uri]:null, ([,v]) => fetchData(v));
  if(error)
    console.info(`NFT Data Error: ${error}:${uri}`)
  return {data:data?data:(error?DEFAULT_MISSING:DEFAULT_DATA), error}
}

export {useNFTdata}
