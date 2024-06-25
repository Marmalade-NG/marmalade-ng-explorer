import {useCallback, useReducer} from 'react'
import {m_client} from "./chainweb_marmalade_ng";
import {version} from './version.js';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import {Account} from './Account.jsx';
import {Collection} from './Collections.jsx';
import {InfoModal} from "./InfoModal.jsx"
import {SettingsModal} from "./SettingsModal.jsx"
import {CollectionsList} from './CollectionsLists.jsx';
import {Sales} from './Sales.jsx';
import {TokenView} from './Token.jsx';
import { Link, useNavigate } from 'react-router-dom';
import useLocalStorage from "use-local-storage";
import MARM_LOGO from './assets/marm_logo_shaded.png'
import {set_client_from_data} from "./chainweb_marmalade_ng"
import {DEFAULT_INSTANCE} from './OnChainRefs.js';
import {Buying} from './Buying.jsx';
import {Selling} from './Selling.jsx';
import {Ending} from './Ending.jsx';


import 'fomantic-ui-css/semantic.min.css'
import {Container, Dropdown, Form, Input, Image, Menu, Icon} from 'semantic-ui-react'


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

function ExplorerMenu()
{
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  return <Menu fixed='top' inverted style={{background:"rgb(30, 50, 61)"}}>
      <Menu.Item as={Link} to="/" header>
        <Image size='mini' src={MARM_LOGO} style={{ marginRight: '1.5em' }} />
        Marmalade-NG Explorer
      </Menu.Item>

      <InfoModal trigger={<Menu.Item as="a"> <Icon name="info"/> </Menu.Item> }/>
      <SettingsModal onChange={forceUpdate} trigger={<Menu.Item as="a"> <Icon name="settings"/> </Menu.Item> }/>

      <Menu.Item as={Link} to='/collections' >Collections</Menu.Item>

      <Dropdown item button text='Sales'>
        <Dropdown.Menu >
          <Dropdown.Item as={Link} to='/sales/all'>All</Dropdown.Item>
          <Dropdown.Item as={Link} to='/sales/f'>Fixed price</Dropdown.Item>
          <Dropdown.Item as={Link} to='/sales/a'>Auctions</Dropdown.Item>
          <Dropdown.Item as={Link} to='/sales/d'>Dutch Auctions</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    <Menu.Item style={{ flexGrow: 1  }}>
    <SearchField />
    </Menu.Item>

    <Menu.Item>
    {`v${version}`} /  {m_client.network_refs.substring(0,32)+"..."}
    </Menu.Item>

  </Menu>
}

function AccountFromRoute ()
{
  const {account_ref} = useParams()
  return <Account account={account_ref} />
}

function CollectionFromRoute ()
{
  const {"*":collection_ref} = useParams()
  return <Collection collection_id={collection_ref} />
}

function SalesFromRoute ()
{
  const {sale_type} = useParams()
  return <Sales sale_type={sale_type} />
}

function BuyFromRoute ()
{
  const {sale_id, sale_type} = useParams()
  return <Buying sale_id={sale_id} sale_type={sale_type} />
}

function TokenFromRoute ()
{
  const {token_ref} = useParams()
  return <TokenView token_id={token_ref} />
}

function SellFromRoute ()
{
  const {token_ref} = useParams()
  return (import.meta.env.VITE_SALES_ENABLED == "true")? <Selling token_id={token_ref} />
                                                       : <Navigate to={`/token/${token_ref}`} replace={true} />
}

function EndFromRoute ()
{
  const {sale_id, sale_type} = useParams()
  return <Ending sale_id={sale_id} sale_type={sale_type} />
}


const Root = () => <CollectionsList />

function App ()
{

  const [stored_instace] = useLocalStorage("instance", DEFAULT_INSTANCE);
  set_client_from_data(stored_instace);

  return <div>
    <ExplorerMenu />
    <Container style={{paddingTop:"100px", paddingBottom:"20px"}}>
      <Routes>
        <Route path="account/:account_ref" element={<AccountFromRoute />} />
        <Route path="collection/*" element={<CollectionFromRoute />} />
        <Route path="collections" element={<CollectionsList />} />
        <Route path="sales/:sale_type" element={<SalesFromRoute />} />
        <Route path="buy/:sale_type/:sale_id" element={<BuyFromRoute />} />
        <Route path="sell/:token_ref" element={<SellFromRoute />} />
        <Route path="end/:sale_type/:sale_id" element={<EndFromRoute />} />
        <Route path="token/:token_ref" element={<TokenFromRoute />} />
        <Route path="" element={<Root />} />
      </Routes>
    </Container>
  </div>
}

export default App
