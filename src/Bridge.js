/* Functions for bridge analysis */
import {m_client} from "./chainweb_marmalade_ng"

export const TARGET_IS_NULL = ({ledger, token,chain}) => token==="" && ledger==="" && chain===""
export const TARGET_IS_XCHAIN = (token_id, {ledger, token, chain}) => token===token_id && ledger===m_client.ledger && chain!==""
export const TARGET_IS_UPGRADE = (token_id, {ledger, token, chain}) => token!==token_id && ledger===m_client.ledger && chain===""
export const TARGET_IS_MARMALADE_V1 = (token_id, {ledger, token, chain}) => token!==token_id && ledger.startsWith("marmalade.") && chain===""
export const TARGET_IS_MARMALADE_NG = (token_id, {ledger, token, chain}) => token!==token_id && ledger.endsWith(".ledger") && chain===""
export const TARGET_IS_OTHER = (token_id, {ledger, token, chain}) => token!==token_id && !ledger.endsWith(".ledger") && chain===""

export function target_type(token_id, target)
{
  if(!target)
    return ".....";
  if(TARGET_IS_NULL(target))
    return "Disabled";
  if(TARGET_IS_XCHAIN(token_id, target))
    return "X-chain";
  if(TARGET_IS_UPGRADE(token_id, target))
    return "Token upgrade";
  if(TARGET_IS_MARMALADE_V1(token_id, target))
    return "Marmalade V1";
  if(TARGET_IS_MARMALADE_NG(token_id, target))
    return "Private NG Ledger";
  if(TARGET_IS_OTHER(token_id, target))
    return "Generic NFT ledger";
}


export const IS_OUT = (bridging) => bridging && (bridging.startsWith("OUTBOUND") || bridging.startsWith("BIDIR"))
export const IS_IN = (bridging) => bridging && (bridging.startsWith("INBOUND") || bridging.startsWith("BIDIR"))
export const IN_TYPE = (bridging) => IS_IN(bridging)?bridging.split("-")[1]:null

export const BRIDGE_TYPE = (bridging) => bridging === undefined?"....."
                                         :(bridging.startsWith("OUTBOUND")?"Outbound only"
                                         :(bridging.startsWith("INBOUND")?"Inbound only"
                                         :(bridging.startsWith("BIDIR")?"Bidirectional"
                                         :"No bridge capabilities")))
