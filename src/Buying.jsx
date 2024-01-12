import {useState, useMemo, useEffect} from 'react'
import YAML from 'yaml'
import {Grid, Card, Label, Message, Form,  TextArea, Loader, Dimmer, Image, Container, Header, Segment, Button, Modal, Table } from 'semantic-ui-react'
import {CopyHeader, CopyButton} from './Common.jsx'
import {TokenCard} from './TokenCards.jsx'
import {useSale, usePrecision, useTokenSupply} from "./SWR_Hooks.js"
import {m_client} from "./chainweb_marmalade_ng"
import {createEckoWalletQuicksign, signWithChainweaver} from '@kadena/client'
import ECKO_LOGO from './assets/ecko-wallet-rounded.png';
import CHAINWEAVER_LOGO from './assets/chainweaver-rounded.png';
import {Pact} from '@kadena/client'

const ecko = createEckoWalletQuicksign()
const cweaver = signWithChainweaver

const SIGNERS = {"Ecko":ecko, "ChainWeaver_Desktop":cweaver, "ChainWeaver":null, "":null}


const ecko_account = (networkId) => window.kadena.request({ method: 'kda_checkStatus', networkId})
                                                 .then((x) => x.account.account)

const get_guard = (x) => m_client.local_pact(`(coin.details "${x}")`)
                                 .then((x)=> x.guard)

const dec = (x) => ({"decimal":x.toString()})


const make_trx = (sale, buyer, buyer_guard) => Pact.builder.continuation({pactId:sale['sale-id'], step:1, rollback:false})
                                                           .setMeta({sender:buyer, chainId:m_client.chain, gasLimit:10000})
                                                           .setNetworkId(m_client.network)
                                                           .addData("buyer",buyer)
                                                           .addData("buyer-guard",buyer_guard)
                                                           .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.GAS')])
                                                           .addSigner(buyer_guard.keys[0], (withCapability) => [withCapability('coin.TRANSFER', buyer, sale['escrow-account'], dec(sale.price))])
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

  return  <Dimmer.Dimmable as={Card} dimmed={!ecko.isInstalled() || isConnecting} raised={selected} onClick={ecko.isInstalled()?_onClick:null} color={selected?"green":""} >
            {selected && <SelectedLabel />}
            <Dimmer inverted active={!ecko.isInstalled() || isConnecting} />
            <Loader active={isConnecting} />
            <Card.Content header='EckoWallet'/>
            <Card.Content >
              <Image src={ECKO_LOGO} />
            </Card.Content>
          </Dimmer.Dimmable>
}

function ChainWeaverCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":""}>
            {selected && <SelectedLabel />}
            <Card.Content header='Chainweaver'/>
            <Card.Content >
              <Image src={CHAINWEAVER_LOGO} />
            </Card.Content>
          </Card>
}

function ChainWeaverDesktopCard({selected, onClick})
{
  return  <Card onClick={onClick} raised={selected} color={selected?"green":""}>
            {selected && <SelectedLabel />}
            <Card.Content header='Chainweaver Desktop'/>
            <Card.Content >
              <Image src={CHAINWEAVER_LOGO} />
            </Card.Content>
          </Card>
}


function TransactionManager({trx, signer})
{
    const [localResult, setLocalResult] = useState(null);
    const [localError, setLocalError] = useState(false);
    const [sigSendError, setSigSendError] = useState(null);
    const [successful, setSuccessful] = useState(false);
    const [signatureModal, setSignatureModal] = useState(false);

    useEffect(() => {console.log("Effect");
                     setLocalResult(null);
                     setLocalError(false);
                     setSigSendError(null);
                     setSuccessful(false);
                     if(trx)
                      {console.log("Launch"); console.log(trx);

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
  const [wallet, setWallet] = useState("")
  const [account, _setAccount] = useState("")
  const [guard, _setGuard] = useState("")
  const [keyError, setKeyError] = useState(false)

  const setGuard = _setGuard;

  const setAccount = (v) => {_setAccount(v); setGuard(null); setKeyError(false); get_guard(v)
                                                                                 .then(setGuard)
                                                                                 .catch(() => setKeyError(true))}

  const key = guard?.keys?.[0] ?? "";
  console.log(keyError)

  const transaction = useMemo(() => (sale && account && guard && key)?make_trx(sale, account, guard):null, [sale?.['sale-id'], account, guard])

  return  <>
            <Card.Group itemsPerRow={3}>
              <EckoWalletCard onClick={() => setWallet("Ecko")} selected={wallet==="Ecko"} onAccount={setAccount}/>
              <ChainWeaverCard onClick={() => setWallet("ChainWeaver")} selected={wallet==="ChainWeaver"} />
              <ChainWeaverDesktopCard onClick={() => setWallet("ChainWeaver_Desktop")} selected={wallet==="ChainWeaver_Desktop"}/>
            </Card.Group>

            <Form>
              <Form.Field >
                <label>Account:</label>
                <input placeholder='Account' value={account} onChange={(e) => setAccount(e.target.value)} disabled={!wallet || wallet==="Ecko"} />
              </Form.Field>

              {keyError && <Message negative header="Key Error" content={"Can't retrieve key: Missing account / Unsupported guard" } />}

              <Form.Field error={keyError} >
                <label>PubKey:</label>
                <input placeholder='EDDSA key' value={key} disabled/>
              </Form.Field>

              <TransactionManager trx={transaction} signer={SIGNERS[wallet]} />
            </Form>
          </>
}



function SaleDetails({sale})
{
  const {precision} = usePrecision(sale['token-id']);
  const {supply} = useTokenSupply(sale['token-id']);

  const currency = sale.currency=="coin"?"KDA":sale.currency;

  return  <Table celled>
            <Table.Body>
              <Table.Row>
                <Table.Cell><Label ribbon>Amount</Label></Table.Cell>
                <Table.Cell>{sale.amount.toFixed(precision)} / {supply.toFixed(precision)} </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell><Label color="blue" ribbon>Price</Label></Table.Cell>
                <Table.Cell>{sale.price.toFixed(3)} {currency} </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
}


function Buying({sale_id})
{
  const {sale} = useSale(sale_id, "f")

  return <Container>
            <Segment color="purple" stacked compact>
              <Header as="h1"> Buy at Fixed Price </Header>
              <CopyHeader>{sale_id}</CopyHeader>
            </Segment>
            {sale && <Grid celled>
                      <Grid.Column width={4}>
                        <TokenCard token_id={sale['token-id']} />
                        <SaleDetails sale={sale} />
                      </Grid.Column>

                      <Grid.Column width={8}>
                        {sale.enabled && <BuyingForm sale={sale}/>}
                        {!sale.enabled && <Message error header="Item already sold or sale expired" />}
                      </Grid.Column>
                    </Grid>}
        </Container>
}

export {Buying}
