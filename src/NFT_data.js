import useSWRImmutable from 'swr/immutable'
import EMPTY_IMG from './assets/empty.png'

const EMPTY_META = {name:"", description:""};
const DEFAULT_DATA = {meta:null, img:EMPTY_IMG}

function process_uri(uri)
{
  if(uri.startsWith("ipfs://"))
    return uri.replace("ipfs://", import.meta.env.VITE_IPFS_GATEWAY);
  else
    return uri;
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
  return await fetch(process_uri(meta.image))
               .then(r => r.blob())
               .then(URL.createObjectURL)
               .then((x)=> ({meta:meta, img:x}));
}

function fetchData(uri)
{
  return fetch(process_uri(uri))
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
