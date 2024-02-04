import {useState, useEffect} from 'react'
import { useSWRConfig } from "swr"
import { Button, Modal, Form, Message } from 'semantic-ui-react'
import useLocalStorage from "use-local-storage";
import {CopyButton} from './Common.jsx';
import {MarmaladeNGClient, m_client, set_client} from "./chainweb_marmalade_ng"
import {INSTANCES} from './OnChainRefs.js'


function SettingsModal({trigger, onChange})
{
  const [open, setOpen] = useState(false);
  const [data, _setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pactError, setPactError] = useState(false)
  const [, setStored_instance] = useLocalStorage("instance");


  const { mutate } = useSWRConfig();

  const setData = x => {setPactError(false);
                        _setData({...data, ...x});}

  const setInstance = x => {if (x!="Custom")
                              setData(INSTANCES[x]);
                            else
                              setData({name:"Custom"})

                            }

  const update_client = (new_client) => {set_client(new_client);
                                         setStored_instance(data);
                                         mutate(([k,]) => k=="/allCollections" || k=="/ListSales", undefined, {revalidate:true})
                                         setTimeout(() =>  mutate( ([k,]) => (k != "/off-chain" && k !="/allCollections" && k!="/ListSales"), undefined,{revalidate:true}), 50)
                                         setOpen(false);
                                         onChange();
                                        }

  const validate = () => { setIsLoading(true);
                            const new_client = new MarmaladeNGClient(data.name, data.node, data.network, data.chain, data.ns, data.bridge_ns);
                            new_client.get_modules_hashes()
                                      .then(() => update_client(new_client))
                                      .catch(() => setPactError(true))
                                      .finally(() => setIsLoading(false));
                         }

  useEffect( () => {_setData(m_client.settings); setPactError(false);setIsLoading(false)}, [open])


  const selectOptions = Object.keys(INSTANCES).map((x)=> ({text:x, value:x}))
  selectOptions.push({text:"Custom", value:"Custom"})

  return  <Modal size="tiny" onClose={() => setOpen(false)} onOpen={() => setOpen(true)} open={open} trigger={trigger}>
            <Modal.Header>Frontend settings</Modal.Header>
            <Modal.Content>
              <Form loading={isLoading}>
                <Form.Select value={data.name} fluid label='Instance' options={selectOptions}
                             onChange={(_, e) => {setInstance(e.value)}}/>

                <Form.Field>
                  <label>Node URL</label>
                  <input value={data.node} onChange ={e => setData({node:e.target.value})} disabled={data.name!="Custom"} />
                </Form.Field>

                <Form.Group widths='equal'>
                  <Form.Field>
                    <label>Network</label>
                    <input value={data.network} onChange ={e => setData({network:e.target.value})} disabled={data.name!="Custom"} />
                  </Form.Field>

                  <Form.Field>
                    <label>Chain</label>
                    <input value={data.chain} onChange ={e => setData({chain:e.target.value})} disabled={data.name!="Custom"} />
                  </Form.Field>
                </Form.Group>

                <Form.Field>
                  <label>Namespace <CopyButton value={data.ns} fontsize={10}/></label>

                  <input value={data.ns} onChange ={e => setData({ns:e.target.value})} disabled={data.name!="Custom"} />

                </Form.Field>



                <Form.Field>
                  <label>Bridge_Namespace <CopyButton value={data.bridge_ns} fontsize={10}/></label>
                  <input value={data.bridge_ns} onChange ={e => setData({bridge_ns:e.target.value})} disabled={data.name!="Custom"} />
                </Form.Field>

              </Form>

            {pactError && <Message error header='Marmalade NG Error' content='Modules not found' />}

            </Modal.Content>

            <Modal.Actions>
              <Button content="Cancel" color='black' onClick={() => setOpen(false)} />
              <Button content="OK" labelPosition='right' icon='checkmark' onClick={validate} positive />
            </Modal.Actions>
          </ Modal>
}

export {SettingsModal}
