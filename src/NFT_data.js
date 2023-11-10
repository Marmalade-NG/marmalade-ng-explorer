import { CID } from 'multiformats/cid'
import useSWRImmutable from 'swr/immutable'
import EMPTY_IMG from './assets/empty.png'

const EMPTY_META = {name:"", description:""};
const DEFAULT_DATA = {meta:null, img:EMPTY_IMG}



const to_path_resolution = (gw, cid) => "https://" + [gw, "ipfs", cid].join("/");
const to_subdom_resolution = (gw, cid) => "https://" + [cid, "ipfs", gw].join(".");

function _fetch(uri)
{
  const [protocol, _cid] = uri.split("//")
  if(protocol == "ipfs:")
  {
    const cid = CID.parse(_cid).toV1().toString()

    return fetch(to_path_resolution("ipfs.io", cid), { signal: AbortSignal.timeout(1000)})
           .catch(() => fetch(to_subdom_resolution("cf-ipfs.com", cid), { signal: AbortSignal.timeout(1000)}))
           .catch(() => fetch(to_subdom_resolution("dweb.link", cid), { signal: AbortSignal.timeout(1000)}))
           .catch(() => fetch(to_path_resolution("gateway.pinata.cloud", cid), { signal: AbortSignal.timeout(1000)}));
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
  if(error)
    console.warn(error);
  return {data:data?data:DEFAULT_DATA, error}
}

export {useNFTdata}
