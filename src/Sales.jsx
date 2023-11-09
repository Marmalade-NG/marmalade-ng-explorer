import {TokenCard} from './TokenCards.jsx'
import {useSales} from "./SWR_Hooks.js"
import {Container, Card, Header, Segment} from 'semantic-ui-react'

const TITLES = {"f": "Fixed Price Sales", "a":"Auction Sales", "d":"Dutch Auction Sales"};

function Sales({sale_type})
{
  const {sales} = useSales(null);
  const selected_sales = sales[sale_type]

  return  <Container>
            <Segment color="purple" stacked compact>
              <Header> {TITLES[sale_type]} </Header>
            </Segment>

            <Segment.Inline>
              <Card.Group>
                {selected_sales.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type={sale_type} sale_id={sale_id}/>))}
              </Card.Group>
            </Segment.Inline>
          </Container>
}

export {Sales}
