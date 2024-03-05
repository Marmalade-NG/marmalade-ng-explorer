import YAML from 'yaml'
import {useState, useEffect} from 'react'
import {Icon, Card, Label, Message, Form,  TextArea, Loader, Dimmer, Image, Container, Button, Modal} from 'semantic-ui-react'
import {CopyButton, TransactionLink} from './Common'
import {m_client} from "./chainweb_marmalade_ng"
import {pretty_currency} from './marmalade_common'
import {createEckoWalletQuicksign, signWithChainweaver} from '@kadena/client'
import ECKO_LOGO from './assets/ecko-wallet-rounded.png';
import CHAINWEAVER_LOGO from './assets/chainweaver-rounded.png';


const ecko_account = (networkId) => window.kadena.request({ method: 'kda_checkStatus', networkId})
                                                 .then((x) => x.account.account)

const get_guard = (x) => m_client.local_pact(`(coin.details "${x}")`)
                                 .then((x)=> x.guard)



const ecko = createEckoWalletQuicksign()

const cweaver = signWithChainweaver


const SIGNERS = {"Ecko":ecko, "ChainWeaver_Desktop":cweaver, "ChainWeaver":null, "":null, null:null}



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

function WalletAccountManager({set_data, currency})
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

            {keyError && <Message negative header="Key Error" list={["Can't retrieve key: Missing account or Unsupported guard",
                                                                     `Make sure yout have a ${pretty_currency(currency)} account on Chain ${m_client.settings.chain} (${m_client.settings.network})`] } />}

            <Form.Field error={keyError} >
              <label>PubKey:</label>
              <input placeholder='EDDSA key' value={_to_key(guard)} disabled/>
            </Form.Field>
          </>
}


function TransactionResult({result, hash})
{

  const make_content = x => <Message.Content>
                              <Message.Header>On chain result</Message.Header>
                              {x}
                            </Message.Content>

  if(!result)
    return <Message icon> <Icon name='circle notched' loading /> {make_content("Waiting for transaction confirmation")} </Message>
  if(result.status == "success")
    return  <Message icon positive > <Icon name='thumbs up outline'/>
              <Message.Content>
                <Message.Header> On chain result </Message.Header>
                  <Message.List>
                    <Message.Item> Transaction Result: {JSON.stringify(result)} </Message.Item>
                    <Message.Item> <TransactionLink trx={hash} /> </Message.Item>
                  </Message.List>
              </Message.Content>
            </Message>
  else
    return <Message icon negative > <Icon name='thumbs down outline'/> {make_content(JSON.stringify(result))} </Message>
}



function TransactionManager({trx, wallet, onConfirm})
{
    const [localResult, setLocalResult] = useState(null);
    const [localError, setLocalError] = useState(false);
    const [sigSendError, setSigSendError] = useState(null);
    const [successful, setSuccessful] = useState(false);
    const [statusResult, setStatusResult] = useState(null);
    const [signatureModal, setSignatureModal] = useState(false);

    const signer = SIGNERS[wallet];

    useEffect(() => { setLocalResult(null);
                      setLocalError(false);
                      setSigSendError(null);
                      setSuccessful(false);
                      setStatusResult(null);
                      if(trx)
                      {
                        m_client.local_check(trx, {signatureVerification:false, preflight:false})
                                .then((e) =>{setLocalResult(e); setLocalError(false)})
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
                              .then(() => {setSuccessful(true), setStatusResult(null); return m_client.status(trx).then((x) => {setStatusResult(x.result);
                                                                                                                                if(onConfirm)
                                                                                                                                  onConfirm();})})
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
              {successful && <TransactionResult result={statusResult} hash={trx?.hash} />}
            </>
}

export {TransactionManager, WalletAccountManager}
