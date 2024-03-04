import {m_client} from "./chainweb_marmalade_ng"
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable'

export function useModuleHashes(enabled)
{
    const {data, error} = useSWR(enabled?"/mod_hashes":null, () => {return m_client.get_modules_hashes()},
                                 {refreshInterval: 60*1000, revalidateIfStale:false})
    if(error)
      console.warn(error);
    return {hashes:data, error}
}

export function useTokenUri(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/uri", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {uri:data, error}
}

export function useTokenSupply(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/supply", token_id]:null, x => {return m_client.batch(x)})
  return {supply:data, error}
}

export function usePrecision(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/precision", token_id]:null, x => {return m_client.batch(x)})
  return {precision:data?Number(data):0, error}
}

export function useTokenBalance(token_id, account)
{
  const {data, error} = useSWR((token_id && account)?["/balance", [token_id, account]]:null, x => {return m_client.batch(x)},
                               {revalidateOnFocus:false})
  if(error)
    console.warn(error);
  return {balance:data, error}
}

export function useSale(sale_id, sale_type)
{
  const {data, error} = useSWR(sale_id?["/sale_"+sale_type, sale_id]:null, x => {return m_client.batch(x)},
                               {refreshInterval: 600*1000, revalidateOnFocus:false})
  return {sale:data, error}
}

export function useTokenPolicies(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/policies", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {policies:data??[], error}
}

export function useTokenBridging(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/bridging", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {bridging:data, error}
}

export function useBridgeDest(token_id)
{
  const {data, error} = useSWR(token_id?["/bridgeDst", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {dest:data, error}
}

export function useBridgeSrc(token_id, policy)
{
  const {data, error} = useSWR(token_id?["/bridgeSrc/"+policy, token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {src:data, error}
}

export function useTokenExtraPolicies(token_id)
{
  const {data, error} = useSWR(token_id?["/extra_policies", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {extra_policies:data??[], error}
}

export function useTokenExtraBlacklist(token_id)
{
  const {data, error} = useSWR(token_id?["/extra_blacklist", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {extra_blacklist:data??[], error}
}

export function useCustodians(token_id)
{
  const {data, error} = useSWR(token_id?["/custodians", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {custodians:data??[], error}
}

export function useTokenCollection(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/tokenCollection", token_id]:null, x => {return m_client.batch(x)})
  return {collection:data, error}
}

export function useOwners(token_id)
{
  const {data, error} = useSWR(token_id?["/listHolders", token_id]:null, x => {return m_client.batch(x)},
                               {fallbackData:[], refreshInterval: 181*1001})
  return {owners:data, error}
}

export function useAllCollections()
{
  const {data, error} = useSWR(["/allCollections", undefined], x => {return m_client.batch(x)},
                               {fallbackData:[],refreshInterval: 600*1002})
  if(error)
    console.warn(error);
  return {collections_list:data, error}
}

export function useTokensFromCollection(collection)
{
  const {data, error} = useSWR(["/listTokensCollection", collection], x => {return m_client.batch(x)},
                               {fallbackData:[],refreshInterval: 182*1003})
  return {tokens:data, error}
}

export function useRoyalty(token_id, adjustable)
{
  const key = token_id?[adjustable?"/adjustable_royalty":"/royalty", token_id]:null
  const {data, error} = useSWRImmutable(key, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {royalty:data, error}
}

export function useAdjustableRoyaltyRate(sale_id)
{
  const key = sale_id?["/adjustable_royalty_rate", sale_id]:null
  const {data, error} = useSWRImmutable(key, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {rate:data, error}
}

export function useMarketPlace(sale_id)
{
  const key = sale_id?["/marketplace", sale_id]:null
  const {data, error} = useSWRImmutable(key, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {market:data, error}
}

export function useFixedIssuance(token_id)
{
  const {data, error} = useSWR(["/issuance", token_id], x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {issuance:data, error}
}

export function useGuards(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/guards", token_id]:null, x => {return m_client.batch(x)})
  return {guards:data, error}
}

export function useCollection(collection)
{
  const {data, error} = useSWRImmutable(["/collection", collection],  x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {collection_data:data, error}
}

export function useDutchPrice(sale_id)
{
  const {data, error} = useSWR(sale_id?["/dutch_price", sale_id]:null, x => {return m_client.batch(x)},
                               {refreshInterval: 15*1000})
  if(error)
    console.warn(error);
  return {price:data, error}
}

export function useSales(account)
{
  const {data, error} = useSWR(["/ListSales", account], ([,a]) => {return m_client.list_sales(a)},
                               {fallbackData:{f:[], a:[], d:[]}, refreshInterval: 180*1000})
  if(error)
    console.warn(error);
  return {sales:data, error}
}

export function useAccountBalances(account)
{
  const {data, error} = useSWR(["/listBalances", account], x => {return m_client.batch(x)},
                               {fallbackData:[],refreshInterval: 180*1000})
  return {balances:data, error}
}
