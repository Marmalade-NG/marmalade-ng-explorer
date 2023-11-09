import {useNFTdata} from "./NFT_data.js"
import {Link} from 'react-router-dom';
import {useTokenUri, useTokensFromCollection, useCollection, useAllCollections} from "./SWR_Hooks.js"
import EMPTY_IMG from './assets/empty.png'
import {Container, Card, Header, Image, Segment} from 'semantic-ui-react'

function CollectionCard({collection_id})
{
  const {collection_data} = useCollection(collection_id);
  const {tokens} = useTokensFromCollection(collection_id);
  const {uri:first_uri} = useTokenUri(tokens[0]);
  const {data} = useNFTdata(first_uri);
  const img = data?data.img:EMPTY_IMG;
  //const img = EMPTY_IMG;

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
  const {collections_list} = useAllCollections();

  return <Container>
            <Segment color="purple" stacked compact>
              <Header> Collections List </Header>
            </Segment>

            <Segment.Inline>
              <Card.Group>
                {collections_list.map((cid) => (<CollectionCard key={cid} collection_id={cid} />))}
              </Card.Group>
            </Segment.Inline>
            </Container>
}

export {CollectionCard, CollectionsList}
