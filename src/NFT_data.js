import { CID } from 'multiformats/cid'
import delay from 'delay';
import useSWRImmutable from 'swr/immutable'
import EMPTY_IMG from './assets/empty.png'
import MISSING_IMG from './assets/missing.png'


const EMPTY_META = {name:"", description:""};
const DEFAULT_DATA = {meta:null, img:EMPTY_IMG}
const DEFAULT_MISSING = {meta:null, img:MISSING_IMG}


const to_path_resolution = (gw, cid) => "https://" + [gw, "ipfs", cid].join("/");
const to_subdom_resolution = (gw, cid) => "https://" + [cid, "ipfs", gw].join(".");


const del_fetch = (d, sig, uri) => delay(d, {signal:sig})
                                   .then(() => fetch(uri))

function _fetch(uri)
{
  const [protocol, _cid] = uri.split("//")
  if(protocol == "ipfs:")
  {
    const cid = CID.parse(_cid).toV1().toString()
    const ctr = new AbortController();

    return Promise.any([ del_fetch(0, ctr.signal, to_subdom_resolution("dweb.link", cid)),
                         del_fetch(2000, ctr.signal, to_path_resolution("ipfs.io", cid)),
                         del_fetch(4000, ctr.signal, to_path_resolution("cloudflare-ipfs.com", cid)),
                         del_fetch(6000, ctr.signal, to_subdom_resolution("cf-ipfs.com", cid)),
                         del_fetch(8000, ctr.signal, to_path_resolution("gateway.pinata.cloud", cid))
                       ]).then(x => {ctr.abort(); return x})
  }
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
                          else if(resp.headers.get("content-type") === "application/json")
                            return meta_result(resp);
                          else
                            throw Error("Unknown data")})
}

function useNFTdata(uri)
{
  const {data, error} = useSWRImmutable(uri, fetchData);

  return {data:data?data:(error?DEFAULT_MISSING:DEFAULT_DATA), error}
}

export {useNFTdata}
