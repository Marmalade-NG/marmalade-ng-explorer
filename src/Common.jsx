import {Header, Icon, Popup, Segment, Pagination} from 'semantic-ui-react'
import {Link} from 'react-router-dom';
import {useCallback} from 'react';
import {pretty_price} from './marmalade_common.js';
import {m_client} from "./chainweb_marmalade_ng"

const EXPLORERS = {mainnet01: "https://explorer.chainweb.com/mainnet",
                   testnet04: "https://explorer.chainweb.com/testnet",
                  }

const _tx_detail = (network, x) => EXPLORERS[network]?`${EXPLORERS[network]}/txdetail/${x}`:""

const tx_detail = x => _tx_detail(m_client.network, x)

export function CopyButton({value, fontsize=16})
{
  const to_copy = useCallback(() => navigator.clipboard.writeText(value.toString()), [value])
  return  <Popup content="Copied" on='click' hideOnScroll
                 trigger={<Icon bordered link circular name='copy outline' onClick={to_copy} style={{fontSize:fontsize}} />} />
}

function CopyHeader({children, ...other})
{
  return  <Header {...other}>{children}
          &nbsp;<CopyButton value={children} />
          </Header>
}

const CopyLink = ({val, onClick}) => <> <Link onClick={onClick}>{val}</Link> <CopyButton fontsize={13} value={val} /></>

const TransactionLink = ({trx}) => <> <Link rel="noopener noreferrer" target="_blank" to={tx_detail(trx)}>{trx}</Link> <CopyButton fontsize={13} value={trx} /></>

const AccountRef = ({account}) => <Link to={"/account/"+account}>{account.substring(0,24)+"..."} </Link>
const CopyAccountRef = ({account}) => <><AccountRef account={account} /><CopyButton fontsize={13} value={account} /> </>

const TokenRef = ({token}) => <Link to={"/token/"+token}>{token.substring(0,24)+"..."} </Link>
const CopyTokenRef = ({token}) => <><TokenRef token={token} /><CopyButton fontsize={13} value={token} /> </>
const CopyToken = ({token}) => <>{token.substring(0,24)+"..."} <CopyButton fontsize={13} value={token} /> </>

const Price = ({value, curr}) => <> {pretty_price(value, curr)} </>


const Paginator = ({current_page, total_pages, onChange}) => total_pages==1?""
                                                             :(<Segment basic textAlign="center">
                                                                <Pagination activePage={current_page} totalPages={total_pages} onPageChange={(e, target) => onChange(target.activePage)}
                                                                            ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                                                                            firstItem={{ content: <Icon name='angle double left' />, icon: true }}
                                                                            lastItem={{ content: <Icon name='angle double right' />, icon: true }}
                                                                            prevItem={{ content: <Icon name='angle left' />, icon: true }}
                                                                            nextItem={{ content: <Icon name='angle right' />, icon: true }}/>
                                                             </Segment>)

export {CopyHeader, AccountRef, CopyToken, CopyAccountRef, CopyTokenRef, CopyLink, TransactionLink, Price, Paginator}
