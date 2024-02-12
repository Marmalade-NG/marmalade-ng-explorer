import {useState} from 'react'
import {TokenCard} from './TokenCards.jsx'
import {CopyHeader, Paginator} from './Common.jsx'
import {useTokensFromCollection, useCollection} from "./SWR_Hooks.js"
import {Container, Card, Table, Segment} from 'semantic-ui-react'
import {enabled_token} from './exclude.js'
import {paginate} from './pagination.js'

const ms_to_string = (x) => x==0?"Unlimited":x.toString()

function Collection({collection_id})
{
  const [page, setPage] = useState(1);
  const {collection_data} = useCollection(collection_id);
  const {tokens} = useTokensFromCollection(collection_id);

  const {total_pages, current_page, selected} = paginate(tokens.filter(enabled_token), page)
  const paginator = <Paginator current_page={current_page} total_pages={total_pages} onChange={setPage} />


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
            {paginator}
            <Segment.Inline>
              <Card.Group>
                {selected.map( x => (<TokenCard key={x} token_id={x} />))}
              </Card.Group>
            </Segment.Inline>
            {paginator}
          </Container>
}

export {Collection}
