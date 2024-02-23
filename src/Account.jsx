import {TokenCard} from './TokenCards.jsx'
import {CopyHeader} from './Common.jsx'
import {useSales, useAccountBalances} from "./SWR_Hooks.js"
import {Container, Card, Segment} from 'semantic-ui-react'

function Account({account})
{
  const {balances} = useAccountBalances(account);
  const {sales} = useSales(account);

  return  <Container>
            <Segment color="purple" stacked compact>
              <CopyHeader>{account}</CopyHeader>
            </Segment>

            <Segment.Inline>
              <Card.Group>
                {sales.f.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type="f" sale_id={sale_id}/>))}
                {sales.a.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type="a" sale_id={sale_id}/>))}
                {sales.d.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_type="d" sale_id={sale_id}/>))}
                {balances?balances.map(({id, balance}) => (<TokenCard can_sell={true} key={id} token_id={id} balance={balance} />)):""}
              </Card.Group>
            </Segment.Inline>
          </Container>
}

export {Account}
