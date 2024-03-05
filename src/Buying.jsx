import {useState, useMemo, useEffect, useCallback} from 'react'
import {Decimal} from 'decimal.js';
import {Grid, Label, Message, Form, Container, Header, Segment, Table } from 'semantic-ui-react'
import {Pact} from '@kadena/client'
import {m_client} from "./chainweb_marmalade_ng"
import {auction_next_price} from './marmalade_common'
import {make_nonce} from './transactions_common';
import {CopyHeader, Price} from './Common'
import {TokenCard} from './TokenCards'
import {useSale, usePrecision, useTokenSupply, useDutchPrice} from "./SWR_Hooks.js"
import {TransactionManager,  WalletAccountManager} from './Transactions';


const dec = (x) => ({"decimal":x.toString()})

const make_trx = (sale, buyer, buyer_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:1, rollback:false})
                                                           .setMeta({sender:buyer, chainId:m_client.chain, gasLimit:10000})
                                                           .setNetworkId(m_client.network)
                                                           .addData("buyer",buyer)
                                                           .addData("buyer-guard",buyer_guard)
                                                           .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                           .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.TRANSFER', buyer, sale['escrow-account'], dec(sale.price))])
                                                           .setNonce(make_nonce)
                                                           .createTransaction()


const make_bid_trx = (sale, buyer, buyer_guard, price) => Pact.builder.execution(`(${m_client.policy_auction_sale}.place-bid "${sale['sale-id']}" "${buyer}" (read-msg "bg") ${price.toFixed(12)})`)
                                                                      .setMeta({sender:buyer, chainId:m_client.chain, gasLimit:10000})
                                                                      .setNetworkId(m_client.network)
                                                                      .addData("bg",buyer_guard)
                                                                      .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                      .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.TRANSFER', buyer, sale['escrow-account'], dec(price))])
                                                                      .setNonce(make_nonce)
                                                                      .createTransaction()



const warning_date = () => new Date(Date.now() + 30 * 86400 * 1000)


function BuyingForm({sale})
{
  const [userData,setUserData] = useState(null);

  /* Here we only use sale?.['sale-id'] as a dependency, to be sure the transaction is not re-generated when the sale object is updated by SWR */
  const transaction = useMemo(() => (sale && userData?.account && userData?.guard && userData?.key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
                                    ?make_trx(sale, userData.account, userData.guard):null, [sale?.['sale-id'], userData])
  return  <Form>
            <WalletAccountManager set_data={setUserData} currency={sale.currency} />
            <TransactionManager trx={transaction} wallet={userData?.wallet} />
          </Form>
}

function EndOfSaleMessage({sale})
{
  if(sale.timeout > warning_date())
    return <Message color='red' header="Warning => Auction will end in a long time" list={[sale.timeout.toString(), "Your funds may be locked until that date"]} />
  else
    return <Message color='violet' header="Auction End" list={[sale.timeout.toString()]} />
}

function BidForm({sale})
{
  const [userData,setUserData] = useState(null);
  const [bidAmount,_setBidAmount] = useState("");
  const [amountError,setAmountError] = useState(true);

  const validate = useCallback((x) => {try {setAmountError(Decimal(x).lt(auction_next_price(sale)))}
                                       catch (error) {setAmountError(true)}}, [sale])

  useEffect(()=> validate(bidAmount), [sale, bidAmount, validate])

  const setBidAmount = (x) => {_setBidAmount(x); validate(x)}

  /* Here we only use sale?.['sale-id'] as a dependency, to be sure the transaction is not re-generated when the sale object is updated by SWR */
  const transaction = useMemo(() => (sale && userData?.account && userData?.guard && userData?.key && !amountError)
    // eslint-disable-next-line react-hooks/exhaustive-deps
                                    ?make_bid_trx(sale, userData.account, userData.guard, Decimal(bidAmount)):null, [sale?.['sale-id'], userData, bidAmount, amountError])
  return  <Form>
            <WalletAccountManager set_data={setUserData} />
            <EndOfSaleMessage sale={sale} />
            <Form.Field error={amountError}>
              <label>Bid amount: Min: <Price value={auction_next_price(sale)} curr={sale?.currency} /> </label>
              <input placeholder='BidAmount' value={bidAmount.toString()} onChange={(e) => setBidAmount(e.target.value)}  />
            </Form.Field>
            <TransactionManager trx={transaction} wallet={userData?.wallet} />
          </Form>
}

function SaleDetails({sale})
{
  const {precision} = usePrecision(sale['token-id']);
  const {supply} = useTokenSupply(sale['token-id']);

  return  <Table celled>
            <Table.Body>
              <Table.Row>
                <Table.Cell><Label ribbon>Amount</Label></Table.Cell>
                <Table.Cell>{sale.amount.toFixed(precision)} / {supply?supply.toFixed(precision):""} </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell><Label color="blue" ribbon>Price</Label></Table.Cell>
                <Table.Cell> <Price value={sale?.price} curr={sale?.currency} /> </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
}

function AuctionSaleDetails({sale})
{
  const {precision} = usePrecision(sale['token-id']);
  const {supply} = useTokenSupply(sale['token-id']);

  return  <Table celled>
            <Table.Body>
              <Table.Row>
                <Table.Cell><Label ribbon>Amount</Label></Table.Cell>
                <Table.Cell>{sale.amount.toFixed(precision)} / {supply?supply.toFixed(precision):""} </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell><Label color="blue" ribbon>Current Bid</Label></Table.Cell>
                <Table.Cell> <Price value={sale?.["current-price"]} curr={sale?.currency} /> </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell><Label color="blue" ribbon>Minimum next bid</Label></Table.Cell>
                <Table.Cell> <Price value={auction_next_price(sale)} curr={sale?.currency} /> </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
}

const TITLES = {f:"Buy at Fixed Price", d:"Buy with Dutch auction", a:"Bid for an auction"}

function Buying({sale_id, sale_type})
{
  const {sale} = useSale(sale_id, sale_type)

  /* In case of dutch auction => Copy the price into the sale object */
  const {price} = useDutchPrice(sale_type=="d"?sale_id:null)
  if(sale && sale_type == "d" && price)
    sale.price = price.toDecimalPlaces(2, Decimal.ROUND_UP);

  return <Container>
            <Segment color="purple" stacked compact>
              <Header as="h1"> {TITLES[sale_type]}  </Header>
              <CopyHeader>{sale_id}</CopyHeader>
            </Segment>
            {sale && <Grid celled>
                      <Grid.Column width={4}>
                        <TokenCard token_id={sale['token-id']} hide_sales={true} />
                        {sale_type != "a" && <SaleDetails sale={sale} sale_type={sale_type} />}
                        {sale_type == "a" && <AuctionSaleDetails sale={sale} sale_type={sale_type} />}
                      </Grid.Column>

                      <Grid.Column width={8}>
                        {sale.enabled && sale_type != "a" && <BuyingForm sale={sale} sale_type={sale_type}/>}
                        {sale.enabled && sale_type == "a" && <BidForm sale={sale} />}
                        {!sale.enabled && <Message error header="Item already sold or sale expired" />}
                      </Grid.Column>
                    </Grid>}
        </Container>
}

export {Buying}
