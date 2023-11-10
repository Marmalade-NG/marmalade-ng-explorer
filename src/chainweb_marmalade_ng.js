import {createClient, Pact,} from '@kadena/client'
import Deferred from 'promise-deferred'
import Decimal from 'decimal.js';

const to_dec = x => typeof x == "object"?Decimal(x.decimal):Decimal(x)
const to_int = x => typeof x == "object"?BigInt(x.int):BigInt(x)
const to_date = ({time, timep}) => time?new Date(time):new Date(timep)

const to_balance = x => ({id:x.id, balance:to_dec(x.balance)})
const to_owned_balance = x => ({account:x.account, balance:to_dec(x.balance)})

const to_collection = ({size, "max-size":max_size, ...rest}) => ({size:to_int(size), "max-size":to_int(max_size), ...rest})


const to_fixed_issuance = ({"max-supply":ms, "min-mint-amount":mma}) => ({"max-supply":to_dec(ms), "min-mint-amount":to_dec(mma)})

const to_module = ({refName}) => refName.namespace?`${refName.namespace}.${refName.name}`:refName.name

const to_fungible = to_module

const to_royalty = ({rate, currencies, ...rest}) => ({rate:to_dec(rate),
                                                     currencies:currencies.map(to_fungible),
                                                     ...rest})

const to_fixed_sale = ({price, amount, timeout, currency, ...rest}) =>
                      ({price:to_dec(price),
                        amount:to_dec(amount),
                        timeout:to_date(timeout),
                        currency:to_fungible(currency),
                        type:"f",
                        ...rest})


const to_auction_sale = ({"start-price":start_price, "current-price":current_price, "increment-ratio":increment_ratio, amount, timeout, currency, ...rest}) =>
                        ({"start-price":to_dec(start_price),
                          "current-price":to_dec(current_price),
                          "increment-ratio":to_dec(increment_ratio),
                          amount:to_dec(amount),
                          timeout:to_date(timeout),
                          currency:to_fungible(currency),
                          type:"a",
                          ...rest})


const to_dutch_auction_sale = ({"start-price":start_price, "end-price":end_price, "start-time":start_time, "end-time":end_time, amount, currency, timeout, ...rest}) =>
                               ({"start-price":to_dec(start_price),
                                 "end-price":to_dec(end_price),
                                 "start-time":to_date(start_time),
                                 "end-time": to_date(end_time),
                                 amount:to_dec(amount),
                                 timeout:to_date(timeout),
                                 currency:to_fungible(currency),
                                 type:"d",
                                 ...rest})

const to_marketplace_fee = ({currency, "min-fee":min_fee, "fee-rate":fee_rate, "max-fee":max_fee, ...rest}) =>
                           ({currency:to_fungible(currency),
                            "min-fee":to_dec(min_fee),
                            "fee-rate":to_dec(fee_rate),
                            "max-fee":to_dec(max_fee),
                            ...rest})

const to_marketplace = ({"marketplace-fee":fee, ...rest}) => ({"marketplace-fee":to_marketplace_fee(fee), ...rest})

//const to_marketplace = x => x

const LOCAL_GAS_LIMIT = 150000

class MarmaladeNGClient
{
  #client;
  #network;
  #chain;
  #namespace;


  #batch;
  #batch_defers;
  #batch_id;

  constructor(node, network, chain, namespace)
  {
    this.#network = network
    this.#chain = chain
    this.#client = createClient(`${node}/chainweb/0.0/${network}/chain/${chain}/pact`);
    this.#namespace = namespace;
    this.init()
  }

  init()
  {
    this.cmds = {"/uri":
                    {cmd: id => `(${this.ledger}.get-uri "${id}")`,
                     post: x => x},
                 "/policies":
                    {cmd: id => `(${this.std_polices}.policies-to-list (${this.ledger}.get-policies "${id}"))`,
                     post: x => x},
                 "/tokenCollection":
                    {cmd: id => `{'c:(${this.policy_collection}.get-token-collection "${id}"),
                                  'r:(${this.policy_collection}.get-token-rank-in-collection "${id}")}`,
                     post: ({c,r}) => ({c:to_collection(c), r:to_int(r)})},
                 "/supply":
                    {cmd: id => `(${this.ledger}.total-supply "${id}")`,
                     post:to_dec},
                 "/precision":
                    {cmd: id => `(${this.ledger}.precision "${id}")`,
                     post:to_int},
                 "/guards":
                    {cmd: id => `(${this.policy_guards}.get-guards "${id}")`,
                     post:x=>x},
                 "/royalty":
                    {cmd: id => `(${this.policy_royalty}.get-royalty-details "${id}")`,
                     post:to_royalty},
                 "/adjustable_royalty":
                    {cmd: id => `(${this.policy_adjustable_royalty}.get-royalty-details "${id}")`,
                     post:to_royalty},
                 "/adjustable_royalty_rate":
                    {cmd: id => `(${this.policy_adjustable_royalty}.get-sale-rate "${id}")`,
                     post:to_dec},
                 "/collection":
                    {cmd: id => `(${this.policy_collection}.get-collection "${id}")`,
                     post:to_collection},
                 "/issuance":
                    {cmd: id => `(${this.policy_fixed_issuance}.get-issuance-spec "${id}")`,
                     post:to_fixed_issuance},
                 "/extra_policies":
                    {cmd: id=> `(map (free.util-strings.to-string) (${this.policy_extra_policies}.policies-list-for-token-id "${id}"))`,
                     post: x => x},
                 "/extra_blacklist":
                    {cmd: id=> `(${this.policy_extra_policies}.get-blacklist "${id}")`,
                     post: x => ({blacklist:x.map(to_module)})},
                 "/marketplace":
                    {cmd: id => `(try {} (${this.policy_marketplace}.get-marketplace-fee "${id}"))`,
                     post:(x) => Object.keys(x).length?to_marketplace(x):null},
                 "/sale_f":
                    {cmd: id => `(${this.policy_fixed_sale}.get-sale "${id}")`,
                     post: to_fixed_sale},
                 "/sale_a":
                    {cmd: id => `(${this.policy_auction_sale}.get-sale "${id}")`,
                     post: to_auction_sale},
                 "/sale_d":
                    {cmd: id => `(${this.policy_dutch_auction_sale}.get-sale "${id}")`,
                     post: to_dutch_auction_sale},
                  "/dutch_price":
                    {cmd: id => `(${this.policy_dutch_auction_sale}.compute-price "${id}")`,
                     post: to_dec},
                  }

    this.#batch = [];
    this.#batch_defers = [];
    this.#batch_id = null;
  }


  run_batch()
  {
    const cmd = `[${this.#batch.join(",")}]`
    const defers = this.#batch_defers;
    this.#batch = [];
    this.#batch_defers = [];
    this.#batch_id = null;
    return this.local_pact(cmd)
               .then(results => {results.forEach((res, i) => {defers[i].resolve(res)})})
               .catch(error => {defers.forEach((defer) => {defer.reject(error)})})
  }


  batch([swr_cmd, argument])
  {
      const {cmd, post} = this.cmds[swr_cmd];
      const d = Deferred();
      this.#batch.push(cmd(argument))
      this.#batch_defers.push(d);

      if(!this.#batch_id)
      {
        this.#batch_id = setTimeout(() => {this.run_batch()}, 20)
      }
      return d.promise.then(post);
  }


   get network_refs()
   {
     return `${this.#network} / ${this.#chain} / ${this.#namespace}`;
   }

   get ledger()
   {
     return `${this.#namespace}.ledger`;
   }

   get policy_collection()
   {
     return `${this.#namespace}.policy-collection`;
   }

   get policy_guards()
   {
     return `${this.#namespace}.policy-guards`;
   }

   get policy_fixed_sale()
   {
     return `${this.#namespace}.policy-fixed-sale`;
   }

   get policy_auction_sale()
   {
     return `${this.#namespace}.policy-auction-sale`;
   }

   get policy_dutch_auction_sale()
   {
     return `${this.#namespace}.policy-dutch-auction-sale`;
   }

   get policy_fixed_issuance()
   {
     return `${this.#namespace}.policy-fixed-issuance`;
   }

   get policy_extra_policies()
   {
     return `${this.#namespace}.policy-extra-policies`;
   }

   get policy_royalty()
   {
     return `${this.#namespace}.policy-royalty`;
   }

   get policy_adjustable_royalty()
   {
     return `${this.#namespace}.policy-adjustable-royalty`;
   }

   get policy_marketplace()
   {
     return `${this.#namespace}.policy-marketplace`;
   }

   get std_polices()
   {
     return `${this.#namespace}.std-policies`;
   }


  local_check(cmd, options)
  {
    return this.#client.local(cmd, options)
          .then((resp) => { if(resp?.result?.status !== 'success')
                             {console.warn(resp); throw Error("Error in local call");}
                            else
                              return resp.result.data;});
  }

  local_pact(pact_code)
  {
    const cmd = Pact.builder
                    .execution(pact_code)
                    .setMeta({chainId:this.#chain, gasLimit:LOCAL_GAS_LIMIT})
                    .setNetworkId(this.#network)
                    .createTransaction();
    return this.local_check(cmd, {signatureVerification:false, preflight:false});
  }

  list_holders(token_id)
  {
    return this.local_pact(`(${this.ledger}.list-holders "${token_id}")`)
               .then((lst) => lst.map(to_owned_balance))
  }

  list_balances(account)
  {
    return this.local_pact(`(${this.ledger}.list-balances "${account}")`)
               .then((lst) => lst.map(to_balance))
  }

  list_sales(account_token)
  {
    let func_arg
    if(!account_token)
      func_arg = "get-all-active-sales";
    else if(account_token.startsWith("t:"))
      func_arg = `get-sales-for-token "${account_token}"`;
    else
      func_arg = `get-sales-from-account "${account_token}"`;

    return this.local_pact(`{'f:(${this.policy_fixed_sale}.${func_arg}),
                             'a:(${this.policy_auction_sale}.${func_arg}),
                             'd:(${this.policy_dutch_auction_sale}.${func_arg})}`)
          .then(({f, a, d}) => ({f:f.map(to_fixed_sale), a:a.map(to_auction_sale), d:d.map(to_dutch_auction_sale)}))
  }

  list_tokens_of_collection(collection_id)
  {
    return this.local_pact(`(${this.policy_collection}.list-tokens-of-collection "${collection_id}")`)
  }

  get_all_collections()
  {
      return this.local_pact(`(${this.policy_collection}.get-all-collections)`)
  }
}

const m_client = new MarmaladeNGClient(import.meta.env.VITE_CHAINWEB_NODE,
                                       import.meta.env.VITE_CHAINWEB_NETWORK,
                                       import.meta.env.VITE_CHAINWEB_CHAIN,
                                       import.meta.env.VITE_CHAINWEB_NAMESPACE);

export {m_client};