import {TokenCard} from './TokenCards.jsx'
import {useSales} from "./SWR_Hooks.js"
import {Container, Card, Header, Segment} from 'semantic-ui-react'

const TITLES = {"f": "Fixed Price Sales", "a":"Auction Sales", "d":"Dutch Auction Sales", "all":"All sales"};

function Sales({sale_type})
{
  const {sales} = useSales(null);

  const is_sale_type = (x) => sale_type==x || sale_type=="all";

  return  <Container>
            <Segment color="purple" stacked compact>
              <Header> {TITLES[sale_type]} </Header>
            </Segment>

            <Segment.Inline>
              <Card.Group>
                {is_sale_type("f") && sales.f.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type="f" sale_id={sale_id}/>))}
                {is_sale_type("a") && sales.a.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type="a" sale_id={sale_id}/>))}
                {is_sale_type("d") && sales.d.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type="d" sale_id={sale_id}/>))}
              </Card.Group>
            </Segment.Inline>
          </Container>
}

export {Sales}
