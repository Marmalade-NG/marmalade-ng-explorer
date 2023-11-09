import {usePrecision, useDutchPrice, useRoyalty, useMarketPlace, useAdjustableRoyaltyRate, useTokenPolicies} from "./SWR_Hooks.js"
import {Header, Modal, Table} from 'semantic-ui-react'
import {CopyAccountRef, CopyToken, TransactionLink} from './Common.jsx'
import Decimal from 'decimal.js';

const TITLES = {a:"Auction sale",
                f:"Fixed price sale",
                d:"Dutch auction sale"}

const show_acct = x => x?(x.substring(0,24)+"..."):"/"

const HUNDRED = new Decimal("100")

const to_percent = x => x!=null?(x.mul(HUNDRED).toFixed(2)+ "%"):"/"

function CommonSaleRows({sale})
{
    const {precision} = usePrecision(sale?.["token-id"]);
    return <> <Table.Row active>
                <Table.Cell colSpan={2} textAlign="center" > {TITLES[sale.type]} </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell> ID </Table.Cell><Table.Cell singleLine> <TransactionLink trx={sale["sale-id"]} /> </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell> Token ID </Table.Cell><Table.Cell> <CopyToken token={sale["token-id"]} /> </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell> Amount </Table.Cell><Table.Cell> {sale.amount.toFixed(precision??0)} </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell> Seller </Table.Cell><Table.Cell> <CopyAccountRef account={sale.seller} /> </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell> Escrow </Table.Cell><Table.Cell> <CopyAccountRef account={sale["escrow-account"]} /> </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell> Currency </Table.Cell><Table.Cell> {sale.currency} </Table.Cell>
              </Table.Row>

              <Table.Row>
                <Table.Cell> Recipient </Table.Cell><Table.Cell> {show_acct(sale.recipient)} </Table.Cell>
              </Table.Row>
            </>
}

function FixedSaleRows({sale})
{
  return <> <Table.Row>
              <Table.Cell> Price </Table.Cell><Table.Cell> {sale.price.toFixed(3)} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Timeout (End)</Table.Cell><Table.Cell singleLine> {sale.timeout.toString()} </Table.Cell>
            </Table.Row>
          </>
}

function AuctionSaleRows({sale})
{
  console.log(sale)
  return <> <Table.Row>
              <Table.Cell> Start price </Table.Cell><Table.Cell> {sale["start-price"].toFixed(3)} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Increment ratio </Table.Cell><Table.Cell> {to_percent(sale["increment-ratio"])} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Current bid </Table.Cell><Table.Cell> {sale["current-buyer"]?sale["current-price"].toFixed(3):"/"} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Best bidder </Table.Cell><Table.Cell> {sale["current-buyer"]?(<CopyAccountRef account={sale["current-buyer"]} />):"/"} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Timeout (End) </Table.Cell><Table.Cell singleLine> {sale.timeout.toString()} </Table.Cell>
            </Table.Row>
          </>
}


function DutchAuctionSaleRows({sale})
{
  const {price} = useDutchPrice(sale["sale-id"])

  return <> <Table.Row>
              <Table.Cell> Start price </Table.Cell><Table.Cell> {sale["start-price"].toFixed(3)} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Start time </Table.Cell><Table.Cell singleLine> {sale["start-time"].toString()} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> End price </Table.Cell><Table.Cell> {sale["end-price"].toFixed(3)} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Slope end </Table.Cell><Table.Cell> {sale["end-time"].toString()} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Current price </Table.Cell><Table.Cell style={{backgroundColor:"Orchid"}}> {price?price.toFixed(3):"/"} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Timeout (End) </Table.Cell><Table.Cell singleLine> {sale.timeout.toString()} </Table.Cell>
            </Table.Row>
          </>
}

function RoyaltyRows({sale})
{
  const {royalty} = useRoyalty(sale["token-id"]);
  return <> <Table.Row active>
              <Table.Cell colSpan={2} textAlign="center" > Royalty </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Creator Account </Table.Cell><Table.Cell> {show_acct(royalty?.["creator-account"])} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Rate </Table.Cell><Table.Cell> {to_percent(royalty?.rate)} </Table.Cell>
            </Table.Row>
          </>
}

function AdjustableRoyaltyRows({sale})
{
  const {royalty} = useRoyalty(sale["token-id"], true);
  const {rate} = useAdjustableRoyaltyRate(sale["sale-id"])
  return <> <Table.Row active>
              <Table.Cell colSpan={2} textAlign="center" > Adjustable Royalty </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Creator Account </Table.Cell><Table.Cell> {show_acct(royalty?.["creator-account"])} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Rate </Table.Cell><Table.Cell> {to_percent(royalty?.rate)} </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell> Applied Rate </Table.Cell><Table.Cell> {to_percent(rate)} </Table.Cell>
            </Table.Row>
          </>
}

function MarketPlaceRows({sale})
{
  const {market} = useMarketPlace(sale["sale-id"])
  const fee = market?.["marketplace-fee"]
  return market?(<>
                       <Table.Row active>
                          <Table.Cell colSpan={2} textAlign="center" > MarketPlace </Table.Cell>
                       </Table.Row>
                       <Table.Row>
                          <Table.Cell> MarketPlace </Table.Cell><Table.Cell> {fee["marketplace-name"]} </Table.Cell>
                       </Table.Row>
                       <Table.Row>
                          <Table.Cell> Hash </Table.Cell><Table.Cell> {market["marketplace-hash"]} </Table.Cell>
                       </Table.Row>

                       <Table.Row>
                         <Table.Cell> MarketPlace Account </Table.Cell><Table.Cell> {show_acct(fee["marketplace-account"])} </Table.Cell>
                       </Table.Row>
                       <Table.Row>
                         <Table.Cell> Minimim fee </Table.Cell><Table.Cell> {fee["min-fee"].toFixed(3)} </Table.Cell>
                       </Table.Row>
                       <Table.Row>
                         <Table.Cell> Maximum fee </Table.Cell><Table.Cell> {fee["max-fee"].toFixed(3)} </Table.Cell>
                       </Table.Row>
                       <Table.Row>
                         <Table.Cell> Rate </Table.Cell><Table.Cell> {to_percent(fee["fee-rate"])} </Table.Cell>
                       </Table.Row>

          </>):""
}

function SaleModal({sale, open, onClose})
{
  const _sale = open?sale:null;
  const token_id = _sale?.["token-id"]
  const {policies} = useTokenPolicies(token_id)

  return <Modal onClose={onClose} open={open} size="small" closeIcon>
           <Header icon="exchange" textAlign="center" content={_sale?.["sale-id"]}/>
           <Modal.Content scrolling>
           <Table columns={1} collapsing celled striped>
           {_sale && <CommonSaleRows sale={_sale} />}
           {_sale?.type=="f" && <FixedSaleRows sale={_sale} />}
           {_sale?.type=="d" && <DutchAuctionSaleRows sale={_sale} />}
           {_sale?.type=="a" && <AuctionSaleRows sale={_sale} />}
           {policies.includes("ROYALTY") && <RoyaltyRows sale={_sale} />}
           {policies.includes("ADJUSTABLE-ROYALTY") && <AdjustableRoyaltyRows sale={_sale} />}
           {policies.includes("MARKETPLACE") && <MarketPlaceRows sale={_sale} />}
           </Table>
           </Modal.Content>
         </Modal>
/*  {


}*/

}

export {SaleModal}
