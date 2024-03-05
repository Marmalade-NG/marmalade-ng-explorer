import {TokenCard} from './TokenCards.jsx'
import {CopyHeader} from './Common.jsx'
import {useSalesForAccount, useAccountBalances} from "./SWR_Hooks.js"
import {Container, Card, Segment, Header} from 'semantic-ui-react'

function Account({account})
{
  const {balances} = useAccountBalances(account);
  const {sales} = useSalesForAccount(account);

  return  <Container>
            <Segment color="purple" stacked compact>
              <Header as="h1">Account: </Header>
              <CopyHeader>{account}</CopyHeader>
            </Segment>

            <Segment.Inline>
              <Card.Group>
                {sales.map(({"token-id":id, amount, "sale-id":sale_id}) => (<TokenCard key={id+sale_id} token_id={id} balance={amount} sale_id={sale_id}/>))}
                {balances?balances.map(({id, balance}) => (<TokenCard can_sell={true} key={id} token_id={id} balance={balance} />)):""}
              </Card.Group>
            </Segment.Inline>
          </Container>
}

export {Account}
