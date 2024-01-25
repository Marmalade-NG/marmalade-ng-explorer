import {TokenCard} from './TokenCards.jsx'
import {CopyHeader} from './Common.jsx'
import {useTokensFromCollection, useCollection} from "./SWR_Hooks.js"
import {Container, Card, Table, Segment} from 'semantic-ui-react'


const ms_to_string = (x) => x==0?"Unlimited":x.toString()

function Collection({collection_id})
{
  const {collection_data} = useCollection(collection_id);
  const {tokens} = useTokensFromCollection(collection_id);

  return  <Container>
            <Segment color="purple" stacked compact>
              <CopyHeader>{collection_id}</CopyHeader>
              {collection_data?(<Table basic='very' celled collapsing>
                                  <Table.Body>
                                  <Table.Row>
                                    <Table.Cell> Name: </Table.Cell>
                                    <Table.Cell> {collection_data.name} </Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell> Creator: </Table.Cell>
                                    <Table.Cell> {collection_data.creator} </Table.Cell>
                                  </Table.Row>

                                  <Table.Row>
                                    <Table.Cell> Collection current/max size: </Table.Cell>
                                    <Table.Cell> {collection_data.size.toString()} / {ms_to_string(collection_data["max-size"])} </Table.Cell>
                                  </Table.Row>

                                  </Table.Body>
                                </Table>):""}

            </Segment>
            <Segment.Inline>
              <Card.Group>
                {tokens.map( x => (<TokenCard key={x} token_id={x} />))}
              </Card.Group>
            </Segment.Inline>
          </Container>
}

export {Collection}
