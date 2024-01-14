import {useNFTdata} from "./NFT_data.js"
import {useTokenUri, useSale, useDutchPrice, useTokenSupply, useTokenPolicies, useTokenCollection} from "./SWR_Hooks.js"
import {Link} from 'react-router-dom';
import {Container, Card, Image, Label, Button, Icon} from 'semantic-ui-react';
import {Price} from './Common.jsx';

function FixedSale({sale_id})
{
  const {sale} = useSale(sale_id, "f");
  return  <div style={{display:"flex"}}>
            <Label color="red">For Sale (Fixed) <br/> Price = <Price value={sale?.price} curr={sale?.currency} /> </Label>
            <Button circular primary animated='vertical' as={Link} to={"/buy/f/"+sale_id}>
                                                        <Button.Content visible>Buy</Button.Content>
                                                        <Button.Content hidden> <Icon name='shop' /> </Button.Content>
                                                      </Button>
          </div>
}

function AuctionSale({sale_id})
{
  const {sale} = useSale(sale_id, "a");

  let price;
  if(sale)
    price = sale["current-price"].eq("0.0")?sale["start-price"]:sale["current-price"].mul(sale["increment-ratio"]);
  return <><Label color="blue">For Sale (Auction) <br/> Price = <Price value={price} curr={sale?.currency} /> </Label></>
}

function DutchAuctionSale({sale_id})
{
  const {sale} = useSale(sale_id, "d");
  const {price} = useDutchPrice(sale?sale_id:null)
  return <><Label color="blue">For Sale (Dutch Auction) <br/> Price = <Price value={price} curr={sale?.currency} /> </Label></>
}

function TokenCard({token_id, balance, sale_type, sale_id})
{
  const {uri} = useTokenUri(token_id);
  const {data} = useNFTdata(uri);
  const {supply} = useTokenSupply(balance?token_id:null)
  const {policies} = useTokenPolicies(token_id)

  const {collection} = useTokenCollection(policies.includes("COLLECTION")?token_id:null);

  const {img} = data;

  return  <Card as={Link} to={"/token/"+token_id} raised style={{width:"250px", padding:"2px"}}>
            <Image src={img} />
            <Card.Content header={token_id.substring(0,12)} />
            <Card.Meta>
              <Container size="tiny" style={{overflow: "hidden"}}>{uri}</Container>
            </Card.Meta>
            {(balance && supply)? (<Card.Description >{balance.toFixed(1)} / {supply.toFixed(1)}</Card.Description>):""}
            <Card.Content extra>
              {collection? (<Link to={"/collection/"+collection.c.id} > <Label tag>{collection.c.name}</Label> <Label tag color="teal"># {collection.r.toString()}</Label></Link>):""}
            </Card.Content>

            {sale_type==="f"?(<Card.Content extra><FixedSale sale_id={sale_id} /></Card.Content>):""}
            {sale_type==="a"?(<Card.Content extra><AuctionSale sale_id={sale_id} /></Card.Content>):""}
            {sale_type==="d"?(<Card.Content extra><DutchAuctionSale sale_id={sale_id} /></Card.Content>):""}
          </Card>
}

export {TokenCard}
