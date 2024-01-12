import { CID } from 'multiformats/cid'
import delay from 'delay';
import useSWRImmutable from 'swr/immutable'
import EMPTY_IMG from './assets/empty.png'
import MISSING_IMG from './assets/missing.png'


const EMPTY_META = {name:"", description:""};
const DEFAULT_DATA = {meta:null, img:EMPTY_IMG}
const DEFAULT_MISSING = {meta:null, img:MISSING_IMG}

const GATEWAYS = [".dweb.link", "ipfs.io", "cloudflare-ipfs.com", ".cf-ipfs.com", "gateway.pinata.cloud"];

const KDAFS_GATEWAY = "gw.marmalade-ng.xyz"

const ipfs_resolution = (gw, cid) =>  "https://" + (gw.startsWith(".")?(cid + ".ipfs" + gw):(gw + "/ipfs/" + cid))

const kdafs_resolution = (gw, cid) =>  "https://" + gw + "/kdafs/" + cid;

const del_fetch = (d, sig, uri) => delay(d, {signal:sig})
                                   .then(() => fetch(uri))

function _fetch(uri)
{
  const [protocol, _cid] = uri.split("//")
  if(protocol == "ipfs:")
  {
    const cid = CID.parse(_cid).toV1().toString()
    const ctr = new AbortController();
    /* Uncomment to round robin */
    /*GATEWAYS.push(GATEWAYS.shift());*/
    return Promise.any(GATEWAYS.map((g, i) => del_fetch(i*2500, ctr.signal, ipfs_resolution(g, cid))))
                  .then(x => {ctr.abort(); return x})
  }
  else if(protocol == "kdafs:")
    return fetch(kdafs_resolution(KDAFS_GATEWAY, _cid))
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
  return {data:data?data:(error?DEFAULT_MISSING:DEFAULT_DATA), error}
}

export {useNFTdata}
