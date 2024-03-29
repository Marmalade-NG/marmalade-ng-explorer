import {useTokenPolicies, useTokenBalance, useTokenSupply, usePrecision, useRoyalty, clear_sales} from "./SWR_Hooks.js"
import {useState, useMemo, useEffect} from 'react'
import {TransactionManager,  WalletAccountManager} from './Transactions';
import {Card, Grid, Image, Label, Message, Form, Container, Header, Segment, Radio, Modal, Button, Table , Popup} from 'semantic-ui-react'
import {Pact} from '@kadena/client'
import {m_client} from "./chainweb_marmalade_ng"
import Decimal from 'decimal.js';
import {Link} from 'react-router-dom';
import {TokenCard} from './TokenCards'
import {make_nonce} from './transactions_common';
import {CopyHeader} from './Common'
import {pretty_price, compute_marketplace_fees} from './marmalade_common.js';
import fees from '../config/fees.json';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import SALES_A_IMG from './assets/sales_a.png'
import SALES_F_IMG from './assets/sales_f.png'
import SALES_D_IMG from './assets/sales_d.png'
import DUTCH_SCHEME from './assets/dutch_scheme.png'

const coin_fungible = {refSpec: [{namespace:null, name:"fungible-v2"}],
                       refName: {namespace:null, name: "coin"}}

const timep = x => x?{timep:x.toISOString()}:null

const ZERO = Decimal("0")
const ONE = Decimal("1")
const HUNDRED = Decimal("100")
const to_percent = x => x.mul(HUNDRED).toFixed(1) + "%"

const dec = (x) => ({"decimal":x.toString()})

const make_trx_fixed = (token_id, amount, seller, seller_guard, fee, {tout, price}) => Pact.builder.execution(`(${m_client.ledger}.sale "${token_id}" "${seller}" ${amount.toFixed(6)} ${tout?"(read-msg 'tout)":`${m_client.ledger}.NO-TIMEOUT`})`)
                                                                                      .setMeta({sender:seller, chainId:m_client.chain, gasLimit:4000})
                                                                                      .setNetworkId(m_client.network)
                                                                                      .addData("tout", timep(tout))
                                                                                      .addData(`marmalade_marketplace_${token_id}`, fee?fee:undefined)
                                                                                      .addData(`marmalade_sale_${token_id}`,{sale_type:"fixed", currency:coin_fungible})
                                                                                      .addData(`marmalade_fixed_quote_${token_id}`,{price:dec(price), recipient:seller})
                                                                                      .addSigner(seller_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                      .addSigner(seller_guard.keys[0], (withCapability) => [withCapability(`${m_client.ledger}.OFFER`, token_id, seller, dec(amount))])
                                                                                      .setNonce(make_nonce)
                                                                                      .createTransaction()

const make_trx_dutch = (token_id, amount, seller, seller_guard, fee, {start_price, end_price, end_date, tout}) => Pact.builder.execution(`(${m_client.ledger}.sale "${token_id}" "${seller}" ${amount.toFixed(6)} ${tout?"(read-msg 'tout)":`${m_client.ledger}.NO-TIMEOUT`})`)
                                                                                                                 .setMeta({sender:seller, chainId:m_client.chain, gasLimit:4000})
                                                                                                                 .setNetworkId(m_client.network)
                                                                                                                 .addData("tout", timep(tout))
                                                                                                                 .addData(`marmalade_marketplace_${token_id}`, fee?fee:undefined)
                                                                                                                 .addData(`marmalade_sale_${token_id}`,{sale_type:"dutch_auction", currency:coin_fungible})
                                                                                                                 .addData(`marmalade_dutch_quote_${token_id}`,{start_price:dec(start_price), end_price:dec(end_price), end_time:timep(end_date), recipient:seller})
                                                                                                                 .addSigner(seller_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                                                 .addSigner(seller_guard.keys[0], (withCapability) => [withCapability(`${m_client.ledger}.OFFER`, token_id, seller, dec(amount))])
                                                                                                                 .setNonce(make_nonce)
                                                                                                                 .createTransaction()

const make_trx_auction = (token_id, amount, seller, seller_guard, fee, {start_price, increment, tout}) => Pact.builder.execution(`(${m_client.ledger}.sale "${token_id}" "${seller}" ${amount.toFixed(6)} (read-msg 'tout))`)
                                                                                                          .setMeta({sender:seller, chainId:m_client.chain, gasLimit:4000})
                                                                                                          .setNetworkId(m_client.network)
                                                                                                          .addData("tout", timep(tout))
                                                                                                          .addData(`marmalade_marketplace_${token_id}`, fee?fee:undefined)
                                                                                                          .addData(`marmalade_sale_${token_id}`,{sale_type:"auction", currency:coin_fungible})
                                                                                                          .addData(`marmalade_auction_${token_id}`,{start_price:dec(start_price), increment_ratio:dec(increment), recipient:seller})
                                                                                                          .addSigner(seller_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                                                          .addSigner(seller_guard.keys[0], (withCapability) => [withCapability(`${m_client.ledger}.OFFER`, token_id, seller, dec(amount))])
                                                                                                          .setNonce(make_nonce)
                                                                                                          .createTransaction()

const MAKE_TRX = {"FIXED-SALE":make_trx_fixed, "DUTCH-AUCTION-SALE":make_trx_dutch, "AUCTION-SALE":make_trx_auction}


const SelectedLabel = () => <Label color="green" icon="selected radio" corner="right" />

function FixedPriceCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":undefined}>
            {selected && <SelectedLabel />}
            <Card.Content header='Fixed Price' style={{minHeight:"70px"}}/>
            <Card.Content >
                <Image src={SALES_F_IMG} />
            </Card.Content>
          </Card>
}

function AuctionCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":undefined}>
            {selected && <SelectedLabel />}
            <Card.Content header='Auction' style={{minHeight:"70px"}}/>
            <Card.Content >
                <Image src={SALES_A_IMG} />
            </Card.Content>
          </Card>
}

function DutchAuctionCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":undefined}>
            {selected && <SelectedLabel />}
            <Card.Content header='Dutch Auction' style={{minHeight:"70px"}}/>
            <Card.Content >
                <Image src={SALES_D_IMG} />
            </Card.Content>
          </Card>
}


const has_fixed = p => p.includes("FIXED-SALE");
const has_auction = p => p.includes("AUCTION-SALE");
const has_dutch_auction = p => p.includes("DUTCH-AUCTION-SALE");


const base_date = () => new Date(Date.now() + 3600 * 1000)
const min_date = () => new Date(Date.now() + 60 * 1000)
const base_date_2 = () => new Date(Date.now() + 4200 * 1000)
const warning_date = () => new Date(Date.now() + 30 * 86400 * 1000)

function default_sale(policies)
{
  if(has_fixed(policies))
    return "FIXED-SALE";
  if(has_auction(policies))
    return "AUCTION-SALE";
  if(has_dutch_auction(policies))
    return "DUTCH-AUCTION-SALE";
  return "UNDEF"
}

function SaleChoice({token_id, onSelect})
{
  const [selected, _setSelected] = useState(null);
  const {policies} = useTokenPolicies(token_id)


  const setSelected = x => {_setSelected(x); onSelect(x)}

  useEffect( () => { if(policies)
                      setSelected(default_sale(policies));
                   }, [policies])

  return <Card.Group itemsPerRow={3}>
            {has_fixed(policies) && <FixedPriceCard onClick={() => setSelected("FIXED-SALE")} selected={selected=="FIXED-SALE"} /> }
            {has_auction(policies) && <AuctionCard onClick={() => setSelected("AUCTION-SALE")} selected={selected=="AUCTION-SALE"} /> }
            {has_dutch_auction(policies) && <DutchAuctionCard onClick={() => setSelected("DUTCH-AUCTION-SALE")} selected={selected=="DUTCH-AUCTION-SALE"} /> }
            </Card.Group>
}

function NoTimeoutDatePicker({value, onChange, disabled})
{
  const is_no_timeout = value == null;
  const [lastDate, setLastDate] = useState(base_date());

  const setNoTimeout = x=> { if(x)
                              {onChange(null);setLastDate(value)}
                             else
                              {onChange(lastDate)}
                            }
  return  <>
            <Form.Field disabled={disabled}>
              <Radio toggle label='Unlimited sale' checked={is_no_timeout} onChange={(e,t) => setNoTimeout(t.checked)} />
              &nbsp;&nbsp;<Popup content="When choosing an Unlimited sale, tiemout will be disabled. Seller can close the sale at any time."  on='click' trigger={<Button color="teal" basic size="mini" circular icon='help'/>} />
            </Form.Field>
            <Form.Field disabled={is_no_timeout || disabled}>
              <label>End date</label>
              <DatePicker  showTimeSelect selected={value} onChange={date => onChange(date)} dateFormat="Pp"/>
            </Form.Field>
          </>
}

function DecimalPriceField({name, onChange, disabled, error})
{
  const [isError, setIsError] = useState(true);
  const setValue = (x) => { try { const v = Decimal(x);
                                  if(v.gt(ZERO))
                                  {
                                    setIsError(false);
                                    onChange(v);
                                  }
                                  else
                                  {
                                    setIsError(true);
                                    onChange(null);
                                  }
                                }
                            catch(error) {setIsError(true); onChange(null)}
                          }
  return  <Form.Input label={name + " (KDA)"} disabled={disabled} error={isError || error} placeholder={name} onChange={e=> setValue(e.target.value)} />
}


const DateWarningMessage = ({date}) => (date  && date>warning_date())?(<Message visible warning header="Are you sure? The choosen time is long time in the future" content="Your token will be locked until that date"/>):"";


function useRoyaltyRate(token_id)
{
    const {policies} = useTokenPolicies(token_id);
    const has_cst_royalty = policies.includes("ROYALTY");
    const has_adj_royalty = policies.includes("ADJUSTABLE-ROYALTY");
    const has_royalty = has_cst_royalty || has_adj_royalty;

    const {royalty} = useRoyalty(has_royalty?token_id:null, has_adj_royalty);

    return royalty?royalty.rate:ZERO;
}

function FeeDetailsModal({headers, gross, fees, total})
{
  const [open, setOpen] = useState(false)

/* eslint-disable react/jsx-key */
  return  <Modal size="tiny" onClose={() => setOpen(false)} onOpen={() => setOpen(true)} open={open} trigger={<Link>Details</Link>} >
            <Modal.Header>Fees details</Modal.Header>
            <Modal.Content>
            <Table celled>

              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell collapsing/>
                  {headers.map( x=> (<Table.HeaderCell> {x} </Table.HeaderCell> ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row positive>
                  <Table.Cell> Gross&nbsp;price </Table.Cell>
                  {gross.map( x=> (<Table.Cell> {x} </Table.Cell> ))}
                </Table.Row>

                {fees.map(fee_line => <Table.Row negative>{fee_line.map(x => <Table.Cell>{x}</Table.Cell>)}</Table.Row>) }
              </Table.Body>

              <Table.Footer>
                <Table.Row>
                  <Table.HeaderCell> Total </Table.HeaderCell>
                    {total.map( x=> (<Table.HeaderCell> {x} </Table.HeaderCell> ))}
                </Table.Row>
              </Table.Footer>

            </Table>
            </Modal.Content>
            <Modal.Actions>
              <Button color='black' onClick={() => setOpen(false)}> Close</Button>
            </Modal.Actions>
          </Modal>
/* eslint-enable react/jsx-key */
}

function FixedPriceNet({sale_data, token_id, fee})
{
  const royalty_rate = useRoyaltyRate(token_id);
  const gross = sale_data?.price??ZERO;
  const mplace_fee = compute_marketplace_fees(gross, fee);
  const gross_after_mplace = gross.sub(mplace_fee);

  const royalty = royalty_rate.mul(gross_after_mplace)
  const total = gross_after_mplace.sub(royalty)

  const details = <FeeDetailsModal headers={["Fixed"]} gross={[pretty_price(gross, "coin")]}
                                                       fees={[["Marketplace", "- " + pretty_price(mplace_fee, "coin")],
                                                              ["Royalty", "- " + pretty_price(royalty, "coin")]]}
                                                       total={[pretty_price(total, "coin")]}/>

  return sale_data? <Message icon="info" header={`You will receive ${pretty_price(total, "coin")}`}
                             content={details} />:""
}

function AuctionPriceNet({sale_data, token_id, fee})
{
  const royalty_rate = useRoyaltyRate(token_id);
  const gross = sale_data?.start_price??ZERO;
  const mplace_fee = compute_marketplace_fees(gross, fee);
  const gross_after_mplace = gross.sub(mplace_fee);
  const royalty = royalty_rate.mul(gross_after_mplace);
  const total = gross_after_mplace.sub(royalty);

  const mplace_fee_rate = fee?Decimal(fee["fee-rate"]):ZERO;
  const mplace_fee_max = fee?Decimal(fee["max-fee"]):ZERO;

  const mplace_string = fee?`- X * ${to_percent(mplace_fee_rate)} (Max : ${pretty_price(mplace_fee_max, "coin")})`:pretty_price(ZERO,"coin");

  const details = <FeeDetailsModal headers={["Start price", "End price"]}
                                   gross={[pretty_price(gross, "coin"), "X" ]}
                                   fees={[["MarketPlace", "- " + pretty_price(mplace_fee, "coin"), mplace_string],
                                          ["Royalty", "- " + pretty_price(royalty, "coin"), "- X * " + to_percent(royalty_rate.mul(ONE.sub(mplace_fee_rate)))]]}
                                   total={[pretty_price(total, "coin"), "X * " + to_percent(ONE.sub(royalty_rate).mul(ONE.sub(mplace_fee_rate)))]}/>

  return sale_data? <Message icon="info" header={`You will receive at least ${pretty_price(total, "coin")}`}
                             content={details} />:""
}


function DutchAuctionPriceNet({sale_data, token_id, fee})
{
  const royalty_rate = useRoyaltyRate(token_id);
  const gross = sale_data?[sale_data.start_price, sale_data.end_price]:[ZERO, ZERO];

  const mplace_fee = gross.map(x => compute_marketplace_fees(x, fee));
  const gross_after_mplace = mplace_fee.map((f, i)=> gross[i].sub(f))

  const royalty = gross_after_mplace.map(g => royalty_rate.mul(g))
  const total = royalty.map((f, i)=> gross_after_mplace[i].sub(f))

  const details = <FeeDetailsModal headers={["Max", "Min"]}
                                   gross={gross.map(x=> pretty_price(x, "coin"))}
                                   fees={[["Marketplace"].concat(mplace_fee.map(x => "- " + pretty_price(x, "coin"))),
                                          ["Royalty"].concat(royalty.map(x => "- " + pretty_price(x, "coin")))]}
                                   total={total.map(x=> pretty_price(x, "coin"))}/>


  return sale_data? <Message icon="info" header={`You will receive betwenn ${pretty_price(total[1], "coin")} and ${pretty_price(total[0], "coin")}`}  content={details}  />:""
}

function FixedPriceHelpModal()
{
  const [open, setOpen] = useState(false)

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Segment textAlign="center"> <Link>How does it work ?</Link> </Segment>}
    >
      <Modal.Header>Fixed price Sale</Modal.Header>
      <Modal.Content image>
        <Image size='medium' src={SALES_F_IMG} wrapped />
        <Modal.Description>
          The token is put for sale at a fixed price defined by the seller.
          <br /> <br />
          This is an instant buy. The sale is settled immediately when a User wants to take the offer at the proposed price.
          <br /> <br />
          The sale offer is available until timeout is reached. After the timeout, the sale has to be withdrawn.
          <br /> <br />
          In case of an unlimited sale, the seller can withdraw his offer at any time.
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setOpen(false)} positive> Ok </Button>
      </Modal.Actions>
    </Modal>
  )
}

function AuctioneHelpModal()
{
  const [open, setOpen] = useState(false)

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Segment textAlign="center"> <Link>How does it work ?</Link> </Segment>}
    >
      <Modal.Header>Auction Sale</Modal.Header>
      <Modal.Content image>
        <Image size='medimum' src={SALES_A_IMG} wrapped />
        <Modal.Description>
          The token is put for sale at a starting price defined by the seller.
          <br /> <br />
          User can bid for the token.
          <br />
          - The first bid has to be made at least at the starting price.
          <br />
          - Subsequent bids have to be made at minimum with an increment ratio. eg: at least 120% of the previous bid
          <br /> <br />
          This is not an immediate sale. The sale is settled only when the timeout has been reached. Unlimited sale are not supported.
          <br /> <br />
          If no bid has been placed when the timeout is reached, the sale is cancelled, and the token is given back to the seller.
          <br /> <br />
          The timeout may be slightly extended in case of of a last-minute bid, to discourage people for waiting the last block to bid.

        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setOpen(false)} positive> Ok </Button>
      </Modal.Actions>
    </Modal>
  )
}



function DutchAuctioneHelpModal()
{
  const [open, setOpen] = useState(false)

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Segment textAlign="center"> <Link>How does it work ?</Link> </Segment>}
    >
      <Modal.Header>Dutch Auction Sale</Modal.Header>
      <Modal.Content image>
        <Image size='huge' src={DUTCH_SCHEME} wrapped />
        <Modal.Description>
          The token is put for sale at a starting price defined by the seller.
          <br /> <br />
          The price decreases exponentially toward the "End of slope price". This price will be reached at "End of slope time".
          <br /> <br />
          After "End of slope time", the price stops to decrease, and the token can be bought at a fixed price.
          <br /> <br />
          This is an instant buy. The sale is settled immediately when a User wants to take the offer at the current price.
          <br /> <br />
          The sale offer is available until timeout is reached. After the timeout, the sale has to be withdrawn.
          <br /> <br />
          In case of an unlimited sale, the seller can withdraw his offer at any time.
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setOpen(false)} positive> Ok </Button>
      </Modal.Actions>
    </Modal>
  )
}


function FixedPriceSellForm({disabled, onChange})
{
  const [price, _setPrice] = useState(null)
  const [toDate, _setToDate] = useState(base_date())
  const setPrice = x => {_setPrice(x); if(x) {onChange({price:x, tout:toDate})}}
  const setToDate = x => {_setToDate(x); if(price) {onChange({price:price, tout:x})}}

  return  <>
          <FixedPriceHelpModal />
          <Grid celled>
            <Grid.Row>
              <Grid.Column width={7}>
                <DecimalPriceField name="Sell price" disabled={disabled} onChange={setPrice} />
              </Grid.Column>
              <Grid.Column width={9}>
                <NoTimeoutDatePicker value={toDate} onChange={setToDate} />
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <DateWarningMessage date={toDate} />
          </>
}

const INCREMENT_OPTIONS = [ {text:"10%", value:"1.1"},
                            {text:"20%", value:"1.2"},
                            {text:"50%", value:"1.5"},
                            {text:"100%", value:"2.0"}]

const DEFAULT_OPTION = INCREMENT_OPTIONS[0].value;

function AuctionSellForm({disabled, onChange})
{
  const [startingPrice, setStartingPrice] = useState(null)
  const [increment, setIncrement] = useState(DEFAULT_OPTION)
  const [toDate, setToDate] = useState(base_date())

  useEffect( () => { if(startingPrice)
                        onChange({start_price:startingPrice, increment:Decimal(increment), tout: toDate});
                   },[startingPrice, increment, toDate, onChange])

  return  <>
          <AuctioneHelpModal />
          <Grid celled>
            <Grid.Row>
              <Grid.Column width={7}>
                <DecimalPriceField name="Starting price" disabled={disabled} onChange={setStartingPrice} />
              </Grid.Column>
              <Grid.Column width={7}>
                <Form.Select label="Minimum increment between bids" disabled={disabled} options={INCREMENT_OPTIONS} value={increment} onChange={(e,o) => setIncrement(o.value)} />
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column width={7} />

              <Grid.Column width={9}>
                  <Form.Field disabled={disabled} >
                    <label>End date</label>
                    <DatePicker  showTimeSelect selected={toDate} onChange={date => setToDate(date)} dateFormat="Pp"/>
                  </Form.Field>
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <DateWarningMessage date={toDate} />
          </>
}

function DutchAuctionSellForm({disabled, onChange})
{
  const [startingPrice, setStartingPrice] = useState(null)
  const [endPrice, setEndPrice] = useState(null)
  const [endSlopeDate, setEndOfSlopeDate] = useState(base_date())
  const [toDate, setToDate] = useState(base_date_2())

  const price_error = endPrice && startingPrice && startingPrice.lt(endPrice)
  const date_error = toDate!=null && (toDate < endSlopeDate);

  useEffect( () => { if(startingPrice && endPrice && endPrice.lt(startingPrice) && (toDate== null || (toDate >= endSlopeDate)))
                        onChange({start_price:startingPrice, end_price:endPrice, end_date: endSlopeDate, tout: toDate});
                   },[endPrice, startingPrice, endSlopeDate, toDate, onChange])

  return  <>
          <DutchAuctioneHelpModal />
          <Grid celled>
            <Grid.Row>
              <Grid.Column width={7}>
                <DecimalPriceField name="Starting price" disabled={disabled} onChange={setStartingPrice} error={price_error}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={7}>
                <DecimalPriceField name="End of slope price" disabled={disabled} onChange={setEndPrice} error={price_error}/>
              </Grid.Column>

              <Grid.Column width={9}>
                  <Form.Field disabled={disabled} error={date_error}>
                    <label>End of Slope Date</label>
                    <DatePicker  showTimeSelect selected={endSlopeDate} onChange={date => setEndOfSlopeDate(date)} dateFormat="Pp"/>
                  </Form.Field>
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column width={7} />

              <Grid.Column width={9}>
                <NoTimeoutDatePicker value={toDate} onChange={setToDate} />
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <DateWarningMessage date={toDate} />
          </>
}


function useFee(token_id)
{
  const {policies} = useTokenPolicies(token_id);
  return (policies && policies.includes("MARKETPLACE"))?fees[m_client.network]:undefined;
}

function SellForm({token_id})
{
  const [userData, setUserData] = useState(null);
  const [selectedSale, _setSelectedSale] = useState(null);
  const [data, setData] = useState(null);
  const {precision} = usePrecision(token_id);
  const {supply} = useTokenSupply(token_id);
  const {balance} = useTokenBalance(token_id, userData?.account)
  const fee = useFee(token_id);
  const setSelectedSale = x => {_setSelectedSale(x); setData(null)};

  const trx = useMemo( ()=> (userData && data && selectedSale)?MAKE_TRX[selectedSale](token_id, balance, userData.account, userData.guard, fee, data):null,
                      [userData,data, selectedSale, token_id, balance, fee])

  const has_balance = balance && !balance.eq(ZERO)

  return  <Form>
            <WalletAccountManager set_data={setUserData} />
            <Form.Field error={!balance || balance.eq(ZERO)}>
              <label>Account balance</label>
              <input placeholder='BidAmount' value={`${(balance??Decimal("0.0")).toFixed(precision)} / ${supply?supply.toFixed(precision):""}`} readOnly disabled  />
            </Form.Field>

            {has_balance && <SaleChoice token_id={token_id} onSelect={setSelectedSale} />}
            {selectedSale == "FIXED-SALE" && has_balance && <><FixedPriceSellForm onChange={setData} />
                                                              <FixedPriceNet sale_data={data} token_id={token_id} fee={fee}/></>}

            {selectedSale == "DUTCH-AUCTION-SALE" && has_balance && <><DutchAuctionSellForm onChange={setData} />
                                                                      <DutchAuctionPriceNet sale_data={data} token_id={token_id} fee={fee} /></>}


            {selectedSale == "AUCTION-SALE" && has_balance && <> <AuctionSellForm onChange={setData} />
                                                                 <AuctionPriceNet sale_data={data} token_id={token_id} fee={fee} /></>}
          <TransactionManager trx={trx} wallet={userData?.wallet} onConfirm={clear_sales}/>
          </Form>
}

function Selling({token_id})
{
  const {policies} = useTokenPolicies(token_id)
  const sellable = policies && !policies.includes("DISABLE-SALE") && (policies.includes("FIXED-SALE") || policies.includes("AUCTION-SALE") || policies.includes("DUTCH-AUCTION-SALE"))

  return <Container>
            <Segment color="purple" stacked compact>
              <Header as="h1"> Sell token {token_id}  </Header>
              <CopyHeader>{token_id}</CopyHeader>
            </Segment>
            <Grid celled>
                      <Grid.Column width={4}>
                        <TokenCard token_id={token_id} hide_sales={true}  />

                      </Grid.Column>

                      <Grid.Column width={8}>
                          {sellable &&   <SellForm token_id={token_id} />}
                          {!sellable && <Message error header="This token cannot be sold" />}
                      </Grid.Column>
            </Grid>
        </Container>
}

export {Selling}
