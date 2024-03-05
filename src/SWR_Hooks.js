import {m_client} from "./chainweb_marmalade_ng"
import useSWR from 'swr';
import { mutate } from "swr"
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
  const {data, error} = useSWRImmutable(["/issuance", token_id], x => {return m_client.batch(x)})
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

export function useAllSales()
{
    const not_empty = x => x.length>0?x:["NULL"]
    const {data:data_f, error:error_f} = useSWR(["/allSalesFixed",        undefined], x => {return m_client.batch(x).then(not_empty)}, {refreshInterval:600*1000, dedupingInterval:120*1000})
    const {data:data_a, error:error_a} = useSWR(["/allSalesAuction",      undefined], x => {return m_client.batch(x).then(not_empty)}, {refreshInterval:600*1000, dedupingInterval:120*1000})
    const {data:data_d, error:error_d} = useSWR(["/allSalesDutchAuction", undefined], x => {return m_client.batch(x).then(not_empty)}, {refreshInterval:600*1000, dedupingInterval:120*1000})

    const error = error_f?error_f:(error_a?error_a:(error_d?error_d:null));

    if(error)
      console.warn(error);

    const sales_map = new Map()

    function __append(x)
    {
      const {"token-id":tid} = x;
      const last = sales_map.get(tid);
      if(last)
        last.push(x);
      else if(tid)
        sales_map.set(tid, [x]);
    }

    if(data_f)
      data_f.forEach(__append);
    if(data_a)
      data_a.forEach(__append);
    if(data_d)
      data_d.forEach(__append);

    return {sales_map, error}
}

export function clear_sales()
{
  console.log("Reload sales");
  mutate(([k,]) => k.startsWith("/allSales") , undefined, {revalidate:true})
}

export function useSalesForAccount(account)
{
  const {sales_map, error} = useAllSales();
  const sales = Array.from(sales_map.values()).flat().filter( ({recipient}) => recipient==account);
  return {sales, error}
}

export function useSalesForToken(token)
{
  const {sales_map, error} = useAllSales();
  const sales = sales_map.get(token)??[]
  return {sales, error}
}

export function useAccountBalances(account)
{
  const {data, error} = useSWR(["/listBalances", account], x => {return m_client.batch(x)},
                               {fallbackData:[],refreshInterval: 180*1000})
  return {balances:data, error}
}
