import {useSale} from "./SWR_Hooks.js"
import {useState, useMemo, useEffect} from 'react'
import {TransactionManager,  WalletAccountManager} from './Transactions';
import {Grid, Message, Form, Container, Header, Segment } from 'semantic-ui-react'
import {is_no_timeout} from './marmalade_common.js';
import {Pact} from '@kadena/client'
import {m_client} from "./chainweb_marmalade_ng"
import {TokenCard} from './TokenCards'
import {make_nonce} from './transactions_common';
import {CopyHeader} from './Common'


const make_trx_withdraw_timed_out = (sale, gas_payer, user_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:0, rollback:true})
                                                                                 .setMeta({sender:gas_payer, chainId:m_client.chain, gasLimit:3500})
                                                                                 .setNetworkId(m_client.network)
                                                                                 .addSigner(user_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                 .setNonce(make_nonce)
                                                                                 .createTransaction()

const make_trx_withdraw_forced_fixed = (sale, gas_payer, user_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:0, rollback:true})
                                                                                    .setMeta({sender:gas_payer, chainId:m_client.chain, gasLimit:3500})
                                                                                    .setNetworkId(m_client.network)
                                                                                    .addSigner(user_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                    .addSigner(user_guard.keys[0], (withCapability) => [withCapability(`${m_client.policy_fixed_sale}.FORCE-WITHDRAW`, sale['sale-id']) ])
                                                                                    .setNonce(make_nonce)
                                                                                    .createTransaction()

const make_trx_withdraw_forced_dutch = (sale, gas_payer, user_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:0, rollback:true})
                                                                                    .setMeta({sender:gas_payer, chainId:m_client.chain, gasLimit:3500})
                                                                                    .setNetworkId(m_client.network)
                                                                                    .addSigner(user_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                    .addSigner(user_guard.keys[0], (withCapability) => [withCapability(`${m_client.policy_dutch_auction_sale}.FORCE-WITHDRAW`, sale['sale-id']) ])
                                                                                    .setNonce(make_nonce)
                                                                                    .createTransaction()

const make_trx_end_auction = (sale, gas_payer, user_guard,buyer, buyer_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:1, rollback:false})
                                                                                             .setMeta({sender:gas_payer, chainId:m_client.chain, gasLimit:4000})
                                                                                             .setNetworkId(m_client.network)
                                                                                             .addData("buyer-guard",buyer_guard)
                                                                                             .addData("buyer",buyer)
                                                                                             .addSigner(user_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                             .setNonce(make_nonce)
                                                                                             .createTransaction()

function get_transaction_builder(sale_type, sale)
{
  switch(sale_type)
  {
    case "f":
      return is_no_timeout(sale.timeout)?make_trx_withdraw_forced_fixed:make_trx_withdraw_timed_out;
    case "d":
      return is_no_timeout(sale.timeout)?make_trx_withdraw_forced_dutch:make_trx_withdraw_timed_out;
    case "a":
      return sale?.['current-buyer']?make_trx_end_auction:make_trx_withdraw_timed_out;
    default:
      return null;
  }
}


function EndingForm({sale, sale_type})
{
  const [userData,setUserData] = useState(null);
  const [buyerGuard, setBuyerGuard] = useState(null);

  console.log(buyerGuard)
  useEffect( () => { if(sale?.['current-buyer'])
                        m_client.local_pact(`(${m_client.ledger}.account-guard "${sale['token-id']}" "${sale['current-buyer']}")`).then(setBuyerGuard);
                   }, [sale])

  /* Choose the right transaction */
  const make_trx = get_transaction_builder(sale_type, sale);

/* Here we only use sale?.['sale-id'] as a dependency, to be sure the transaction is not re-generated when the sale object is updated by SWR */
  const transaction = useMemo(() => (sale && userData?.account && userData?.guard && userData?.key && make_trx)
// eslint-disable-next-line react-hooks/exhaustive-deps
                                    ?make_trx(sale, userData.account, userData.guard, sale?.['current-buyer'], buyerGuard):null, [sale?.['sale-id'], userData, buyerGuard])

  console.log(transaction)
  return  <Form>
            <WalletAccountManager set_data={setUserData} currency={sale.currency} />
            <TransactionManager trx={transaction} wallet={userData?.wallet} />
          </Form>
}


function Ending({sale_id, sale_type})
{
  const {sale} = useSale(sale_id, sale_type)
  const can_end = sale && (is_no_timeout(sale.timeout) || sale.timeout <= new Date());

  return <Container>
            <Segment color="purple" stacked compact>
              <Header as="h1"> Close sale </Header>
              <CopyHeader>{sale_id}</CopyHeader>
            </Segment>
            {sale && <Grid celled>
                      <Grid.Column width={4}>
                        <TokenCard token_id={sale['token-id']} />
                      </Grid.Column>

                      <Grid.Column width={8}>
                        {!can_end && <Message error header="Can't end the sale (Timeout not reached)" />}
                        {can_end && <EndingForm sale={sale} sale_type={sale_type}/>}
                      </Grid.Column>
                    </Grid>}
        </Container>
}

/*
  {sale.enabled && sale_type != "a" && <BuyingForm sale={sale} sale_type={sale_type}/>}
  {sale.enabled && sale_type == "a" && <BidForm sale={sale} />}

*/

export {Ending}
