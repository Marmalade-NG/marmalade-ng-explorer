import {useState, useMemo, useEffect, useCallback} from 'react'
import YAML from 'yaml'
import {Decimal} from 'decimal.js';
import {Grid, Card, Label, Message, Form,  TextArea, Loader, Dimmer, Image, Container, Header, Segment, Button, Modal, Table } from 'semantic-ui-react'
import {CopyHeader, CopyButton, Price} from './Common.jsx'
import {TokenCard} from './TokenCards.jsx'
import {useSale, usePrecision, useTokenSupply, useDutchPrice} from "./SWR_Hooks.js"
import {m_client} from "./chainweb_marmalade_ng"
import {auction_next_price} from './marmalade_common.js'
import {createEckoWalletQuicksign, signWithChainweaver} from '@kadena/client'
import ECKO_LOGO from './assets/ecko-wallet-rounded.png';
import CHAINWEAVER_LOGO from './assets/chainweaver-rounded.png';
import {Pact} from '@kadena/client'

const ecko = createEckoWalletQuicksign()
const cweaver = signWithChainweaver

const SIGNERS = {"Ecko":ecko, "ChainWeaver_Desktop":cweaver, "ChainWeaver":null, "":null, null:null}


const ecko_account = (networkId) => window.kadena.request({ method: 'kda_checkStatus', networkId})
                                                 .then((x) => x.account.account)

const get_guard = (x) => m_client.local_pact(`(coin.details "${x}")`)
                                 .then((x)=> x.guard)

const dec = (x) => ({"decimal":x.toString()})

function nonce()
{
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return "ng_expl:" + Array.from(a, (x)=>x.toString(16)).join('');
}


const make_trx = (sale, buyer, buyer_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:1, rollback:false})
                                                           .setMeta({sender:buyer, chainId:m_client.chain, gasLimit:10000})
                                                           .setNetworkId(m_client.network)
                                                           .addData("buyer",buyer)
                                                           .addData("buyer-guard",buyer_guard)
                                                           .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                           .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.TRANSFER', buyer, sale['escrow-account'], dec(sale.price))])
                                                           .setNonce(nonce)
                                                           .createTransaction()


const make_bid_trx = (sale, buyer, buyer_guard, price) => Pact.builder.execution(`(${m_client.policy_auction_sale}.place-bid "${sale['sale-id']}" "${buyer}" (read-msg "bg") ${price.toFixed(12)})`)
                                                                      .setMeta({sender:buyer, chainId:m_client.chain, gasLimit:10000})
                                                                      .setNetworkId(m_client.network)
                                                                      .addData("bg",buyer_guard)
                                                                      .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                                      .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.TRANSFER', buyer, sale['escrow-account'], dec(price))])
                                                                      .setNonce(nonce)
                                                                      .createTransaction()


const SelectedLabel = () => <Label color="green" icon="selected radio" corner="right" />

function SignatureModal({trx, open, onClose})
{
  const sigdata = (trx && open)?{cmd:trx.cmd,
                                 sigs: JSON.parse(trx.cmd).signers.map((x)=>({pubKey:x.pubKey, sig:null}))
                                }:null;

  const yaml_data = YAML.stringify(sigdata)

  return  <Modal closeIcon open={open} onClose={onClose} >
            <Modal.Header>Copy Transaction to SigBuilder</Modal.Header>
            <Modal.Content>
              <Form>
                <TextArea value={yaml_data} style={{ minHeight: 300 }}  />
              </Form>
              <Container textAlign="center">
                <CopyButton value={yaml_data} fontsize={24} />
              </Container>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={onClose} positive> Ok </Button>
            </Modal.Actions>
          </Modal>
}

function EckoWalletCard({selected, onClick, onAccount})
{
  const [isConnecting, setIsConnecting] = useState(false);

  const connect_ok = () => {ecko_account(m_client.network).then(onAccount); onClick()}

  const _onClick = () => {setIsConnecting(true);
                          ecko.connect(m_client.network)
                               .then(connect_ok)
                               .finally(() => setIsConnecting(false))
                          }

  return  <Dimmer.Dimmable as={Card} dimmed={!ecko.isInstalled() || isConnecting} raised={selected} onClick={ecko.isInstalled()?_onClick:null} color={selected?"green":undefined} >
            {selected && <SelectedLabel />}
            <Dimmer inverted active={!ecko.isInstalled() || isConnecting} />
            <Loader active={isConnecting} />
            <Card.Content header='EckoWallet' style={{minHeight:"70px"}}/>
            <Card.Content >
              <Image src={ECKO_LOGO} />
            </Card.Content>
          </Dimmer.Dimmable>
}

function ChainWeaverCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":undefined}>
            {selected && <SelectedLabel />}
            <Card.Content header='Chainweaver' style={{minHeight:"70px"}}/>
            <Card.Content >
              <Image src={CHAINWEAVER_LOGO} />
            </Card.Content>
          </Card>
}

function ChainWeaverDesktopCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":undefined}>
            {selected && <SelectedLabel />}
            <Card.Content header='Chainweaver Desktop' style={{minHeight:"70px"}}/>
            <Card.Content >
              <Image src={CHAINWEAVER_LOGO} />
            </Card.Content>
          </Card>
}

function WalletAccountManager({set_data})
{
  const [wallet, setWallet] = useState("")
  const [account, _setAccount] = useState("")
  const [guard, setGuard] = useState("")
  const [keyError, setKeyError] = useState(false)

  const _to_key = (g) => g?.keys?.[0] ?? ""

  useEffect(()=> {if (wallet && account && guard)
                    set_data({wallet:wallet, account:account, guard:guard, key:_to_key(guard)});
                  else
                    set_data(null);
                 }, [wallet, account,guard]);

  const setAccount = (a) => {if (account!=a)
                              {setGuard(null);
                               _setAccount(a);
                               get_guard(a).then((g) => {setGuard(g); setKeyError(false);})
                                           .catch(() => setKeyError(true))
                              }}

  return  <>
            <Card.Group itemsPerRow={3}>
              <EckoWalletCard onClick={() => setWallet("Ecko")} selected={wallet==="Ecko"} onAccount={setAccount}/>
              <ChainWeaverCard onClick={() => setWallet("ChainWeaver")} selected={wallet==="ChainWeaver"} />
              <ChainWeaverDesktopCard onClick={() => setWallet("ChainWeaver_Desktop")} selected={wallet==="ChainWeaver_Desktop"}/>
            </Card.Group>

            <Form.Field >
              <label>Account:</label>
              <input placeholder='Account' value={account} onChange={(e) => setAccount(e.target.value)} disabled={!wallet || wallet==="Ecko"} />
            </Form.Field>

            {keyError && <Message negative header="Key Error" content={"Can't retrieve key: Missing account / Unsupported guard" } />}

            <Form.Field error={keyError} >
              <label>PubKey:</label>
              <input placeholder='EDDSA key' value={_to_key(guard)} disabled/>
            </Form.Field>
          </>
}



function TransactionManager({trx, signer})
{
    const [localResult, setLocalResult] = useState(null);
    const [localError, setLocalError] = useState(false);
    const [sigSendError, setSigSendError] = useState(null);
    const [successful, setSuccessful] = useState(false);
    const [signatureModal, setSignatureModal] = useState(false);

    useEffect(() => { setLocalResult(null);
                      setLocalError(false);
                      setSigSendError(null);
                      setSuccessful(false);
                      if(trx)
                      {
                        m_client.local_check(trx, {signatureVerification:false, preflight:false})
                                .then(setLocalResult)
                                .catch((e)=>{setLocalResult(e); setLocalError(true)})
                      }
                    },[trx]);

    const do_sign = () => { setSigSendError(null);
                            setSuccessful(false);
                            if(signer)
                            {
                              signer(trx)
                              .then((t) => m_client.preflight(t))
                              .then((t) => m_client.send(t))
                              .then(() => setSuccessful(true))
                              .catch((x) => setSigSendError(x))
                            }
                            else
                              setSignatureModal(true)
                          }

    return  <>
              <Form.Field>
                <label>Transaction: {trx && <CopyButton value={trx.hash} fontsize={12}/>}</label>
                <input placeholder='hash' value={trx?trx.hash:""} disabled/>
              </Form.Field>
              {localResult && <Message positive={!localError} negative={localError} header='Local Result:' content={localResult.toString()} />}

              <Button primary disabled={!trx} onClick={do_sign}>Sign and Submit</Button>
              <SignatureModal trx={trx} open={signatureModal} onClose={() => setSignatureModal(false)} />
              {sigSendError && <Message negative header='Signature / Submit Error:' content={sigSendError.toString()} />}
              {successful && <Message positive header='Signature / Submit Result:' content="Transaction successfuly signed and submitted" />}
            </>
}

function BuyingForm({sale})
{
  const [userData,setUserData] = useState(null);

  /* Here we only use sale?.['sale-id'] as a dependency, to be sure the transaction is not re-generated when the sale object is updated by SWR */
  const transaction = useMemo(() => (sale && userData?.account && userData?.guard && userData?.key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
                                    ?make_trx(sale, userData.account, userData.guard):null, [sale?.['sale-id'], userData])
  return  <Form>
            <WalletAccountManager set_data={setUserData} />
            <TransactionManager trx={transaction} signer={SIGNERS[userData?.wallet]} />
          </Form>
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
            <Form.Field error={amountError}>
              <label>Bid amount: Min: <Price value={auction_next_price(sale)} curr={sale?.currency} /> </label>
              <input placeholder='BidAmount' value={bidAmount.toString()} onChange={(e) => setBidAmount(e.target.value)}  />
            </Form.Field>
            <TransactionManager trx={transaction} signer={SIGNERS[userData?.wallet]} />
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
                        <TokenCard token_id={sale['token-id']} />
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
