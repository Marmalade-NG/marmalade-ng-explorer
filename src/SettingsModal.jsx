import {useState, useEffect} from 'react'
import { useSWRConfig } from "swr"
import { Button, Modal, Form, Message } from 'semantic-ui-react'
import {MarmaladeNGClient, m_client, set_client} from "./chainweb_marmalade_ng"


function SettingsModal({trigger})
{
  const [open, setOpen] = useState(false);
  const [data, _setData] = useState({});
  const [pactError, setPactError] = useState(false)

  const { mutate } = useSWRConfig();

  const setData = x => {setPactError(false);
                        _setData({...data, ...x});}

  const update_client = (new_client) => {set_client(new_client);
                                         mutate( ([k,]) => k !== "/off-chain", undefined,{revalidate:true});
                                         setOpen(false);
                                        }

  const validate = () => { const new_client = new MarmaladeNGClient(data.node, data.network, data.chain, data.ns);
                            new_client.get_modules_hashes()
                                      .then(() => update_client(new_client))
                                      .catch(() => setPactError(true))
                         }

  useEffect( () => {_setData(m_client.settings); setPactError(false)}, [open])


  return  <Modal size="tiny" onClose={() => setOpen(false)} onOpen={() => setOpen(true)} open={open} trigger={trigger}>
            <Modal.Header>Frontend settings</Modal.Header>
            <Modal.Content>
              <Form>
                <Form.Field>
                  <label>Node URL</label>
                  <input value={data.node} onChange ={e => setData({node:e.target.value})} />
                </Form.Field>

                <Form.Group widths='equal'>
                  <Form.Field>
                    <label>Network</label>
                    <input value={data.network} onChange ={e => setData({network:e.target.value})} />
                  </Form.Field>

                  <Form.Field>
                    <label>Chain</label>
                    <input value={data.chain} onChange ={e => setData({chain:e.target.value})} />
                  </Form.Field>
                </Form.Group>

                <Form.Field>
                  <label>Namespace</label>
                  <input value={data.ns} onChange ={e => setData({ns:e.target.value})} />
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
