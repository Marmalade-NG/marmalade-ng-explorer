import {m_client} from "./chainweb_marmalade_ng"
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable'

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

export function useSale(sale_id, sale_type)
{
  const {data, error} = useSWR(sale_id?["/sale_"+sale_type, sale_id]:null, x => {return m_client.batch(x)},
                               {refreshInterval: 60*1000})
  return {sale:data, error}
}

export function useTokenPolicies(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/policies", token_id]:null, x => {return m_client.batch(x)})
  if(error)
    console.warn(error);
  return {policies:data??[], error}
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

export function useTokenCollection(token_id)
{
  const {data, error} = useSWRImmutable(token_id?["/tokenCollection", token_id]:null, x => {return m_client.batch(x)})
  return {collection:data, error}
}

export function useOwners(token_id)
{
  const {data, error} = useSWR(token_id?["/owners", token_id]:null, ([, id]) => {return m_client.list_holders(id)},
                               {fallbackData:[], refreshInterval: 181*1001})
  return {owners:data, error}
}

export function useAllCollections()
{
  const {data, error} = useSWR("/AllCollections", () => {return m_client.get_all_collections()},
                               {fallbackData:[],refreshInterval: 600*1002})
  if(error)
    console.warn(error);
  return {collections_list:data, error}
}

export function useTokensFromCollection(collection)
{
  const {data, error} = useSWR(["/CT", collection], ([, id]) => {return m_client.list_tokens_of_collection(id)},
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
                               {fallbackData:{f:[], a:[], d:[]}, refreshInterval: 180000})
  if(error)
    console.warn(error);
  return {sales:data, error}
}

export function useAccountBalances(account)
{
  const {data, error} = useSWR(["/account", account], ([,a]) => {return m_client.list_balances(a)},
                               {fallbackData:[],refreshInterval: 180000})
  return {balances:data, error}
}
