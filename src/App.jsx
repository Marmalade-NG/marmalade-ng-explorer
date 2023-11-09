import {useCallback} from 'react'
import {m_client} from "./chainweb_marmalade_ng";
import {version} from './version.js';
import { Routes, Route, useParams } from 'react-router-dom';
import {Account} from './Account.jsx';
import {Collection} from './Collections.jsx';
import {CollectionsList} from './CollectionsLists.jsx';
import {Sales} from './Sales.jsx';
import {TokenView} from './Token.jsx';
import { Link, useNavigate } from 'react-router-dom';
import MARM_LOGO from './assets/marm_logo.png'


import 'semantic-ui-css/semantic.min.css'
import {Container, Dropdown, Form, Input, Image, Menu} from 'semantic-ui-react'


function SearchField()
{
  const navigate = useNavigate()

  const do_search = useCallback((ev) => {const v = ev.target[0].value;
                                         if(v.startsWith("c_"))
                                            navigate("/collection/"+v);
                                         else if (v.startsWith("t:"))
                                            navigate("/token/"+v);
                                         else
                                            navigate("/account/"+v);
                                        },[navigate])

  return  <Form onSubmit={do_search} >
            <Input style={{ minWidth: "40em"  }} label='Search' placeholder='Collection, Acount or Token' />
          </Form>
}

const ExplorerMenu = () => (
  <Menu fixed='top' inverted style={{background:"rgb(30, 50, 61)"}}>
      <Menu.Item as={Link} to="/" header>
        <Image size='mini' src={MARM_LOGO} style={{ marginRight: '1.5em' }} />
        Marmalade-NG Explorer
      </Menu.Item>
      <Menu.Item as={Link} to='/collections' >Collections</Menu.Item>

      <Dropdown item button text='Sales'>
        <Dropdown.Menu >
          <Dropdown.Item as={Link} to='/sales/f'>Fixed price</Dropdown.Item>
          <Dropdown.Item as={Link} to='/sales/a'>Auctions</Dropdown.Item>
          <Dropdown.Item as={Link} to='/sales/d'>Dutch Auctions</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    <Menu.Item style={{ flexGrow: 1  }}>
    <SearchField />
    </Menu.Item>

    <Menu.Item>
    {`v${version}`} /  {m_client.network_refs}
    </Menu.Item>

  </Menu>
)

function AccountFromRoute ()
{
  const {account_ref} = useParams()
  return <Account account={account_ref} />
}

function CollectionFromRoute ()
{
  const {collection_ref} = useParams()
  return <Collection collection_id={collection_ref} />
}

function SalesFromRoute ()
{
  const {sale_type} = useParams()
  return <Sales sale_type={sale_type} />
}

function TokenFromRoute ()
{
  const {token_ref} = useParams()
  return <TokenView token_id={token_ref} />
}

const Root = () => <CollectionsList />

const App = () => (
  <div>
    <ExplorerMenu />
    <Container style={{paddingTop:"100px"}}>
      <Routes>
        <Route path="account/:account_ref" element={<AccountFromRoute />} />
        <Route path="collection/:collection_ref" element={<CollectionFromRoute />} />
        <Route path="collections" element={<CollectionsList />} />
        <Route path="sales/:sale_type" element={<SalesFromRoute />} />
        <Route path="token/:token_ref" element={<TokenFromRoute />} />
        <Route path="" element={<Root />} />
      </Routes>
    </Container>
  </div>
  )

export default App
