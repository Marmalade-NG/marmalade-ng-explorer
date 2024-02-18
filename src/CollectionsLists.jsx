import {useState} from 'react'
import {useNFTdata} from "./NFT_data.js"
import {Link} from 'react-router-dom';
import {useTokenUri, useTokensFromCollection, useCollection, useAllCollections} from "./SWR_Hooks.js"
import EMPTY_IMG from './assets/empty.png'
import REMOVED_IMG from './assets/removed.png'
import {Container, Card, Header, Image, Segment} from 'semantic-ui-react'
import {Paginator} from './Common.jsx'
import {enabled_collection, enabled_image} from './exclude.js'
import {paginate} from './pagination.js'


function CollectionCard({collection_id})
{
  const {collection_data} = useCollection(collection_id);
  const {tokens} = useTokensFromCollection(collection_id);
  const {uri:first_uri} = useTokenUri(tokens[0]);
  const {data} = useNFTdata(first_uri);

  const img = data?(enabled_image(tokens[0])
                    ?data.thumbnail:REMOVED_IMG)
                  :EMPTY_IMG;

  return  <Card raised style={{width:"250px", padding:"2px"}}>
            <Segment stacked> <Link to={"/collection/"+collection_id}> <Image src={img} circular={!data} /> </Link> </Segment>
            <Card.Content>
             {collection_data && <Card.Header  style={{overflow: "hidden"}} > {collection_data.name} </Card.Header>}
             <Card.Description>
              <Container size="tiny" style={{overflow: "hidden"}}>{collection_id}</Container>
            </Card.Description>
            </Card.Content>
          </Card>
}

function CollectionsList()
{
  const [page, setPage] = useState(1);
  const {collections_list} = useAllCollections();
  const {total_pages, current_page, selected} = paginate(collections_list.filter(enabled_collection), page)
  const paginator = <Paginator current_page={current_page} total_pages={total_pages} onChange={setPage} />

  return <Container>
            <Segment color="purple" stacked compact>
              <Header> Collections List </Header>
            </Segment>
            {paginator}

            <Segment.Inline>
              <Card.Group>
                {selected.map((cid) => (<CollectionCard key={cid} collection_id={cid} />))}
              </Card.Group>
            </Segment.Inline>
            {paginator}
            </Container>
}

export {CollectionCard, CollectionsList}
