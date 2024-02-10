import {useState} from 'react'
import {useSales, useBridgeDest, useBridgeSrc, useTokenBridging, useFixedIssuance, useRoyalty, useGuards, useCustodians, useTokenExtraBlacklist, useTokenUri, useTokenExtraPolicies, usePrecision, useDutchPrice, useTokenSupply,useOwners, useTokenPolicies, useTokenCollection} from "./SWR_Hooks.js"
import {useNFTdata} from "./NFT_data.js"
import {AccountRef,CopyAccountRef, CopyHeader, CopyLink} from './Common.jsx'
import {IS_IN, IS_OUT, IN_TYPE, TARGET_IS_NULL, BRIDGE_TYPE, target_type } from './Bridge.js'
import {SaleModal} from './SaleModal.jsx'
import { JsonView, collapseAllNested,defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Link } from 'react-router-dom';

import {List, Button, Modal, Container, Label, Grid, Header, Image, Icon, Radio, Table, Segment} from 'semantic-ui-react'
import BRIDGE_ICON from './assets/bridge.svg'
import REMOVED_IMG from './assets/removed.png'
import {enabled_image} from './exclude.js'


const COLLAPSED = () => false;

function OwnersTable({token_id})
{
  const {owners} = useOwners(token_id)
  const {precision} = usePrecision(token_id)

  return  <Segment raised>
            <Label color='blue' ribbon> Owners </Label>
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Account</Table.HeaderCell>
                  <Table.HeaderCell>Balance</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
              {owners.map(({account, balance}) => ( <Table.Row key={account}>
                                                      <Table.Cell style={{wordBreak:"break-all" }}> <CopyAccountRef account={account} /> </Table.Cell>
                                                      <Table.Cell> {balance.toFixed(precision)} </Table.Cell>
                                                    </Table.Row>))}
              </Table.Body>
            </Table>
          </Segment>
}

function FixedSaleRow({sale, prec})
{
  return  <>
          <CommonSaleRow sale={sale} sale_type="f"/>
          <Table.Row>
            <Table.Cell> Fixed price </Table.Cell>
            <Table.Cell> <AccountRef account={sale.seller} /></Table.Cell>
            <Table.Cell> {sale.amount.toFixed(prec)} </Table.Cell>
            <Table.Cell> {sale.price.toFixed(3)} </Table.Cell>
            <Table.Cell> {sale.timeout.toUTCString()} </Table.Cell>
          </Table.Row>
          </>
}

function DutchAuctionSaleRow({sale, prec})
{
  const {price} = useDutchPrice(sale["sale-id"])

  return  <>
          <CommonSaleRow sale={sale} sale_type="d"/>
          <Table.Row>
            <Table.Cell> Dutch Auction </Table.Cell>
            <Table.Cell> <AccountRef account={sale.seller} /></Table.Cell>
            <Table.Cell> {sale.amount.toFixed(prec)} </Table.Cell>
            <Table.Cell> {price?price.toFixed(3):"..."} </Table.Cell>
            <Table.Cell> {sale.timeout.toUTCString()} </Table.Cell>
          </Table.Row>
          </>
}

function AuctionSaleRow({sale, prec})
{
  const price = sale["current-price"].eq("0.0")?sale["start-price"]:sale["current-price"].mul(sale["increment-ratio"]);
  return  <>
          <CommonSaleRow sale={sale} sale_type="a"/>
          <Table.Row>
            <Table.Cell> Auction </Table.Cell>
            <Table.Cell> <AccountRef account={sale.seller} /></Table.Cell>
            <Table.Cell> {sale.amount.toFixed(prec)} </Table.Cell>
            <Table.Cell> {price.toFixed(3)} </Table.Cell>
            <Table.Cell> {sale.timeout.toUTCString()} </Table.Cell>
          </Table.Row>
          </>
}
/**/

function CommonSaleRow({sale, sale_type})
{
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const sale_id = sale["sale-id"]
  const buy_link = ["", "buy", sale_type, sale_id].join("/")

  return <>
          <Table.Row style={{backgroundColor:"MistyRose"}}>
            <Table.Cell colSpan={5} textAlign="center"><b>Sale ID: </b> <CopyLink val={sale_id} onClick={()=>setSaleModalOpen(true)} />
              <Button size="tiny" circular primary as={Link} to={buy_link}> Buy </Button>
            </Table.Cell>
          </Table.Row>
          <SaleModal open={saleModalOpen} onClose={()=>setSaleModalOpen(false)} sale={sale}  />
          </>
}

function SalesTable({token_id})
{
  const {sales} = useSales(token_id)
  const {precision} = usePrecision(token_id)

  return  <Segment raised>
            <Label color='blue' ribbon> Sales </Label>
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Seller</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Current Price</Table.HeaderCell>
                  <Table.HeaderCell>End</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {sales.f.map( x => (<FixedSaleRow key={x} prec={precision} sale={x} />))}
                {sales.a.map( x => (<AuctionSaleRow key={x} prec={precision} sale={x} />))}
                {sales.d.map( x => (<DutchAuctionSaleRow key={x} prec={precision} sale={x} />))}
              </Table.Body>
            </Table>
          </Segment>

}

function SupplySegment({token_id})
{
  const {supply} = useTokenSupply(token_id)
  const {precision} = usePrecision(token_id)

  if(!supply)
  {
    return ""
  }

  return  <Segment>
            <Header as='h3'>
              <Icon name='balance scale' />
                <Header.Content>Total Supply: {supply.toFixed(precision)}</Header.Content>
            </Header>
          </Segment>
}


function BridgeTargetTable({name, target})
{
  return  <Table size="small">
            <Table.Header>
              <Table.Row> <Table.HeaderCell> {name} </Table.HeaderCell> </Table.Row>
            </Table.Header>
            <Table.Body>
            { TARGET_IS_NULL(target)? <Table.Row> <Table.Cell negative>Temporary disabled</Table.Cell> </Table.Row>
                                    : <>
                                       <Table.Row> <Table.Cell positive>Ledger</Table.Cell> </Table.Row>
                                       <Table.Row> <Table.Cell>{target.ledger}</Table.Cell> </Table.Row>
                                       <Table.Row> <Table.Cell positive>Token</Table.Cell> </Table.Row>
                                       <Table.Row> <Table.Cell>{target.token}</Table.Cell> </Table.Row>
                                       <Table.Row> <Table.Cell positive> Chain</Table.Cell> </Table.Row>
                                       <Table.Row> <Table.Cell>{target.chain}</Table.Cell> </Table.Row>
                                     </>}
            </Table.Body>
          </Table>
}


function BridgeTargetsModal({token_id, trigger})
{
  const [open, setOpen] = useState(false)
  const {bridging} = useTokenBridging(token_id)

  const {dest} = useBridgeDest((IS_OUT(bridging) && open)?token_id:null);
  const {src} = useBridgeSrc((IS_IN(bridging) && open)?token_id:null, IN_TYPE(bridging));

  return <Modal closeIcon size="small" closeOnDimmerClick={true} onClose={() => setOpen(false)} onOpen={() => setOpen(true)} open={open} trigger={trigger}>
      <Modal.Header> Bridge Targets</Modal.Header>
      <Modal.Content scrolling>
      {src && <BridgeTargetTable name="Inbound" target={src} /> }
      {dest && <BridgeTargetTable name="Outbound" target={dest} /> }
      </Modal.Content>
      </Modal>
}


function BridgingSegment({token_id})
{
  const {bridging} = useTokenBridging(token_id)

  const {dest} = useBridgeDest(IS_OUT(bridging)?token_id:null);

  const {src} = useBridgeSrc(IS_IN(bridging)?token_id:null, IN_TYPE(bridging));

  const label_color = (x) => target_type(token_id,x)==="....."?"gray"
                            :(target_type(token_id,x)==="Disabled"?"red":
                              "blue")

  return  <Segment>
            <Header as='h3'>
              <Image src={BRIDGE_ICON} />
                <Header.Content>{BRIDGE_TYPE(bridging)}</Header.Content>
            </Header>
            <List divided relaxed>


            {IS_IN(bridging) && <List.Item> <Label size="medium" color={label_color(src)}><Icon name='sign-in' />{target_type(token_id,src)}</Label><Label tag>{IN_TYPE(bridging)} Mint</Label></List.Item>}
            {IS_OUT(bridging) && <List.Item> <Label size="medium" color={label_color(dest)} ><Icon name='sign-out' />{target_type(token_id,dest)}</Label></List.Item>}
            {bridging && <List.Item><BridgeTargetsModal token_id={token_id} trigger={<Button size="tiny">Details</Button>} /></List.Item>}
          </List>
          </Segment>
}

function CollectionSegment({token_id})
{
  const {collection} = useTokenCollection(token_id)
  if(!collection)
    return ""
  return  <Segment>
            <Header as='h3'>
              <Icon name='folder open outline' />
                <Header.Content> <Link to={"/collection/" + collection.c.id}> {collection.c.name} </Link> # {collection.r.toString()} </Header.Content>
            </Header>
          </Segment>
}


function RoyaltyPolicy({token_id, adjustable})
{
  const {royalty} = useRoyalty(token_id, adjustable);
  const to_data = ({rate, ...rest}) => ({rate:rate.toString(), ...rest});

  return  <>
          {royalty && (<JsonView data={to_data(royalty)} shouldExpandNode={COLLAPSED} style={defaultStyles} />) }
          </>
}

function GuardsPolicy({token_id})
{
  const {guards} = useGuards(token_id);
  return  <>
          {guards && (<JsonView data={guards} shouldExpandNode={COLLAPSED} style={defaultStyles} />) }
          </>
}

function TrustedCustodyPolicy({token_id})
{
  const {custodians} = useCustodians(token_id);
  return  <>
          {custodians && (<JsonView data={custodians} shouldExpandNode={COLLAPSED} style={defaultStyles} />) }
          </>
}

function ExtraPoliciesPolicy({token_id})
{
  const {extra_blacklist} = useTokenExtraBlacklist(token_id);
  return  <>
          {extra_blacklist && (<JsonView data={extra_blacklist} shouldExpandNode={COLLAPSED} style={defaultStyles} />) }
          </>
}



function FixedIssuancePolicy({token_id})
{
  const {issuance} = useFixedIssuance(token_id);
  const {precision} = usePrecision(token_id);

  let _issuance
  if(issuance)
  {
    const _prec = Number(precision)
    _issuance = {"max-supply":issuance["max-supply"].toFixed(_prec),
                 "min-mint-amount":issuance["min-mint-amount"].toFixed(_prec),
                 precision: _prec};
  }

  return  <>
          {_issuance && (<JsonView data={_issuance} shouldExpandNode={COLLAPSED} style={defaultStyles} />) }
          </>
}

function PolicySegment({name, enabled, children, is_extra})
{
  return <Segment color={is_extra?"blue":(enabled?"green":"red")}>
          <Grid columns={2}>
            <Grid.Column width={10} floated="left">
              {name} {is_extra?(<i>(Extra Policy)</i>):""}
            </Grid.Column>
            <Grid.Column width={6} floated="right" textAlign="right">
               <Radio toggle disabled checked={enabled} />
            </Grid.Column>
          </Grid>
          {enabled && children}
          </Segment>
}
 /**/


const UnknownPolicySegment = ({name}) => <PolicySegment name={`Unknown: ${name.substring(8)}`} enabled />

const ExtraPolicySegment = ({name}) => <PolicySegment name={name} enabled is_extra />

const to_mod_name = x => x.split(".")[1]


function ExtraPolicies({token_id})
{
  const {extra_policies} = useTokenExtraPolicies(token_id);
  return <>
         {extra_policies.map(to_mod_name).includes("policy-extra-currency-whitelist")?<ExtraPolicySegment name="Currency whitelist" />:""}
         {extra_policies.map(to_mod_name).includes("policy-extra-donation")?<ExtraPolicySegment name="Donation" />:""}
         {extra_policies.map(to_mod_name).includes("policy-extra-multi-sellers")?<ExtraPolicySegment name="Multi Sellers" />:""}
         {extra_policies.map(to_mod_name).includes("policy-extra-lottery")?<ExtraPolicySegment name="Lottery" />:""}
         </>
}

function PoliciesGrid({token_id})
{
  const {policies} = useTokenPolicies(token_id)

  return  <Segment raised>
            <Label color='blue' ribbon> Policies </Label>
            <Grid columns={2} style={{marginTop:"5px"}} >
              <Grid.Column width={8}>
                <Segment.Group stacked>
                  <PolicySegment name="Instant mint" enabled={policies.includes("INSTANT-MINT")} />
                  <PolicySegment name="Non fungible" enabled={policies.includes("NON-FUNGIBLE")} />
                  <PolicySegment name="Fixed issuance" enabled={policies.includes("FIXED-ISSUANCE")}>
                    <FixedIssuancePolicy token_id={token_id} />
                  </PolicySegment>
                  <PolicySegment name="Collection" enabled={policies.includes("COLLECTION")} />
                  <PolicySegment name="Guards" enabled={policies.includes("GUARDS")}>
                    <GuardsPolicy token_id={token_id} />
                  </PolicySegment>
                  <PolicySegment name="Blacklist" enabled={policies.includes("BLACKLIST")} />
                  <PolicySegment name="Royalty" enabled={policies.includes("ROYALTY")} >
                    <RoyaltyPolicy token_id={token_id} adjustable={false} />
                  </PolicySegment>
                  <PolicySegment name="Adjustable royalty" enabled={policies.includes("ADJUSTABLE-ROYALTY")}>
                    <RoyaltyPolicy token_id={token_id} adjustable={true} />
                  </PolicySegment>
                  <PolicySegment name="Disable burn" enabled={policies.includes("DISABLE-BURN")} />
                  <PolicySegment name="Disable transfer" enabled={policies.includes("DISABLE-TRANSFER")} />
                  <PolicySegment name="Trusted Custody" enabled={policies.includes("TRUSTED-CUSTODY")}>
                    <TrustedCustodyPolicy token_id={token_id} />
                  </PolicySegment>
                </Segment.Group>
              </Grid.Column>

              <Grid.Column>
                <Segment.Group stacked>
                  <PolicySegment name="Disable sales" enabled={policies.includes("DISABLE-SALE")} />
                  <PolicySegment name="Fixed price sales" enabled={policies.includes("FIXED-SALE")} />
                  <PolicySegment name="Auction sales" enabled={policies.includes("AUCTION-SALE")} />
                  <PolicySegment name="Dutch Auction sales" enabled={policies.includes("DUTCH-AUCTION-SALE")} />
                  <PolicySegment name="Marketplace fees" enabled={policies.includes("MARKETPLACE")} />
                  <PolicySegment name="Extra policies" enabled={policies.includes("EXTRA-POLICIES")}>
                    <ExtraPoliciesPolicy token_id={token_id} />
                  </PolicySegment>
                  {policies.filter(x=> x.startsWith("UNKNOWN")).map(x => (<UnknownPolicySegment key={x} name={x} />))}
                  {policies.includes("EXTRA-POLICIES")?<ExtraPolicies token_id={token_id} />:""}
                </Segment.Group>
              </Grid.Column>
            </Grid>
          </Segment>
}

function TokenView({token_id})
{
  const {uri} = useTokenUri(token_id);
  const {data} = useNFTdata(uri);
  const {policies} = useTokenPolicies(token_id)
  const img = enabled_image(token_id)?data.img:REMOVED_IMG;

  return  <Segment>
            <CopyHeader as="h1">{token_id}</CopyHeader>
            <Grid relaxed columns={2}>
              <Grid.Column width={5}>
                <Image src={img} />

                <SupplySegment token_id={token_id} />
                {policies.includes("COLLECTION") && <CollectionSegment token_id={token_id} />}

                <Segment>
                  {uri && <Container style={{overflowWrap:"break-word", fontStyle:"italic"}}>{uri}</Container>}
                  <JsonView data={data.meta} shouldExpandNode={collapseAllNested} style={defaultStyles} />
                </Segment>

                <BridgingSegment token_id={token_id} />
              </Grid.Column>
              <Grid.Column width={11}>
                <OwnersTable token_id={token_id} />
                <SalesTable token_id={token_id} />
                <PoliciesGrid token_id={token_id} />
              </Grid.Column>

            </Grid>
          </Segment>
}

export {TokenView}
