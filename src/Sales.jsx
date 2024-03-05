import {useState} from 'react'
import {TokenCard} from './TokenCards.jsx'
import {useAllSales} from "./SWR_Hooks.js"
import {Paginator} from './Common.jsx'
import {Container, Card, Header, Segment} from 'semantic-ui-react'
import {enabled_token} from './exclude.js'
import {paginate} from './pagination.js'

const TITLES = {"f": "Fixed Price Sales", "a":"Auction Sales", "d":"Dutch Auction Sales", "all":"All sales"};

const enabled_token_id = ({"token-id":id}) => enabled_token(id)

function Sales({sale_type})
{
  const [page, setPage] = useState(1);
  const {sales_map} = useAllSales();

  const flt_function = sale_type=="all"?()=>true:x => x.type==sale_type;

  const tokens = Array.from(sales_map.values()).flat().filter(flt_function).filter(enabled_token_id);

  const {total_pages, current_page, selected} = paginate(tokens.filter(enabled_token), page)
  const paginator = <Paginator current_page={current_page} total_pages={total_pages} onChange={setPage} />


  return  <Container>
            <Segment color="purple" stacked compact>
              <Header> {TITLES[sale_type]} </Header>
            </Segment>
            {paginator}
            <Segment.Inline>
              <Card.Group>
                {selected.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_id={sale_id}/>))}

              </Card.Group>
            </Segment.Inline>
          {paginator}
          </Container>
}

export {Sales}
