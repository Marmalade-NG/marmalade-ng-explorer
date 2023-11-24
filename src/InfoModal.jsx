import {useState} from 'react'
import { Button, Modal, Table, Icon } from 'semantic-ui-react'
import {useModuleHashes} from "./SWR_Hooks.js"

function InfoModal({trigger})
{
  const [open, setOpen] = useState(false);
  const {hashes} = useModuleHashes(open);

  return <Modal size="small" closeOnDimmerClick={false} onClose={() => setOpen(false)} onOpen={() => setOpen(true)} open={open} trigger={trigger}>
      <Modal.Header>Marmalade NG Modules</Modal.Header>
      <Modal.Content scrolling>
        <Table celled striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan='2'>On-chain modules</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {hashes && hashes.map( ([m,h],i) => <Table.Row key={i}>
                                              <Table.Cell collapsing> <Icon name='folder' /> {m} </Table.Cell>
                                              <Table.Cell collapsing textAlign='right'> {h} </Table.Cell>
                                            </Table.Row>)}
        </Table.Body>
        </Table>
        </Modal.Content>


      <Modal.Actions>
        <Button content="OK" positive labelPosition='right' icon='checkmark' onClick={() => setOpen(false)}>

        </Button>
      </Modal.Actions>
    </Modal>
}

export {InfoModal}
