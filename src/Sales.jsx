import {useState} from 'react'
import {TokenCard} from './TokenCards.jsx'
import {useSales} from "./SWR_Hooks.js"
import {Paginator} from './Common.jsx'
import {Container, Card, Header, Segment} from 'semantic-ui-react'
import {enabled_token} from './exclude.js'
import {paginate} from './pagination.js'

const TITLES = {"f": "Fixed Price Sales", "a":"Auction Sales", "d":"Dutch Auction Sales", "all":"All sales"};

const enabled_token_id = ({"token-id":id}) => enabled_token(id)

function Sales({sale_type})
{
  const [page, setPage] = useState(1);
  const {sales} = useSales(null);

  const is_sale_type = (x) => sale_type==x || sale_type=="all";

  const tokens = [].concat( is_sale_type("f")?sales.f.filter(enabled_token_id).map( x => ({t:"f", v:x, })):[],
                            is_sale_type("a")?sales.a.filter(enabled_token_id).map( x => ({t:"a", v:x, })):[],
                            is_sale_type("d")?sales.d.filter(enabled_token_id).map( x => ({t:"d", v:x, })):[])

  const {total_pages, current_page, selected} = paginate(tokens.filter(enabled_token), page)

  const paginator = <Paginator current_page={current_page} total_pages={total_pages} onChange={setPage} />


  return  <Container>
            <Segment color="purple" stacked compact>
              <Header> {TITLES[sale_type]} </Header>
            </Segment>
            {paginator}
            <Segment.Inline>
              <Card.Group>
                {selected.map(({t, v:{"token-id":id, amount, "sale-id":sale_id}}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type={t} sale_id={sale_id}/>))}

              </Card.Group>
            </Segment.Inline>
          {paginator}
          </Container>
}

export {Sales}
