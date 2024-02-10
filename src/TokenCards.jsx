import {useNFTdata} from "./NFT_data.js"
import {useTokenUri, useSale, useDutchPrice, useTokenSupply, useTokenPolicies, useTokenCollection} from "./SWR_Hooks.js"
import {Link} from 'react-router-dom';
import {Card, Image, Label, Button, Icon, Segment} from 'semantic-ui-react';
import {Price} from './Common.jsx';
import {auction_next_price} from './marmalade_common.js'

const BuyButton = ({link}) => <Button circular primary animated='vertical' as={Link} to={link}>
                                            <Button.Content visible>Buy</Button.Content>
                                            <Button.Content hidden> <Icon name='shop' /> </Button.Content>
                                          </Button>

function FixedSale({sale_id})
{
  const {sale} = useSale(sale_id, "f");
  return  <div style={{display:"flex"}}>
            <Label color="red">For Sale (Fixed) <br/> Price = <Price value={sale?.price} curr={sale?.currency} /> </Label>
            <BuyButton link={"/buy/f/"+sale_id} />
          </div>
}

function AuctionSale({sale_id})
{
  const {sale} = useSale(sale_id, "a");
  return  <div style={{display:"flex"}}>
            <Label color="blue">For Sale (Auction) <br/> Price = <Price value={auction_next_price(sale)} curr={sale?.currency} /> </Label>
            <BuyButton link={"/buy/a/"+sale_id} />
          </div>
}

function DutchAuctionSale({sale_id})
{
  const {sale} = useSale(sale_id, "d");
  const {price} = useDutchPrice(sale?sale_id:null)
  return  <div style={{display:"flex"}}>
            <Label color="olive">For Sale (Dutch A.) <br/> Price = <Price value={price} curr={sale?.currency} /> </Label>
            <BuyButton link={"/buy/d/"+sale_id} />
          </div>
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
              <Segment basic size="small" style={{overflow: "hidden"}}>{uri}</Segment>
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
