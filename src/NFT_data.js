import { CID } from 'multiformats/cid'
import delay from 'delay';
import useSWRImmutable from 'swr/immutable'
import EMPTY_IMG from './assets/empty.png'
import MISSING_IMG from './assets/missing.png'


const EMPTY_META = {name:"", description:""};
const DEFAULT_DATA = {meta:null, img:EMPTY_IMG}
const DEFAULT_MISSING = {meta:null, img:MISSING_IMG}

const GATEWAYS = [".dweb.link", "ipfs.io", ".nftstorage.link", "cloudflare-ipfs.com", ".cf-ipfs.com", "gateway.pinata.cloud"];

const KDAFS_GATEWAY = "gw.marmalade-ng.xyz"


const ipfs_resolution = (gw, cid, path) =>  "https://" + (gw.startsWith(".")?(cid + ".ipfs" + gw):(gw + "/ipfs/" + cid)) + "/" + (path??" ")

const kdafs_resolution = (gw, cid, path) =>  "https://" + gw + "/kdafs/" + cid + "/" + path;

const del_fetch = (d, sig, uri) => delay(d, {signal:sig})
                                   .then(() => fetch(uri))

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
    /* Uncomment to round robin */
    /*GATEWAYS.push(GATEWAYS.shift());*/
    return Promise.any(GATEWAYS.map((g, i) => del_fetch(i*2500, ctr.signal, ipfs_resolution(g, norm_cid, path))))
                  .then(x => {ctr.abort(); return x})
  }
  else if(protocol == "kdafs:")
    return fetch(kdafs_resolution(KDAFS_GATEWAY, cid, path))
  else
    return fetch(uri);
}

function image_result(resp)
{
  return resp.blob()
         .then(URL.createObjectURL)
         .then((x) => ({meta:EMPTY_META, img:x}));
}

async function meta_result(resp)
{
  const meta = await resp.json();
  return await _fetch(meta.image)
               .then(r => r.blob())
               .then(URL.createObjectURL)
               .then((x)=> ({meta:meta, img:x}));
}

function fetchData(uri)
{
  return _fetch(uri)
         .then((resp) => {if(resp.headers.get("content-type").startsWith("image"))
                            return image_result(resp)
                          else if(resp.headers.get("content-type").startsWith("application/json"))
                            return meta_result(resp);
                          else
                            throw Error("Unknown data")})
}

function useNFTdata(uri)
{
  const {data, error} = useSWRImmutable(uri?["/off-chain", uri]:null, ([,v]) => fetchData(v));
  if(error)
    console.info(`${error.message}:${uri}`)
  return {data:data?data:(error?DEFAULT_MISSING:DEFAULT_DATA), error}
}

export {useNFTdata}
