import Decimal from 'decimal.js';

const PRICE_DIGITS = 2


const auction_next_price = (sale) => sale ?  sale["current-price"].eq("0.0")
                                             ?sale["start-price"]
                                             :sale["current-price"].mul(sale["increment-ratio"]).toDecimalPlaces(PRICE_DIGITS, Decimal.ROUND_UP)
                                          :null;

const pretty_currency = (curr) =>  curr ? curr=="coin"?"KDA":curr
                                        :"";

const pretty_value = (val) =>  val?val.toFixed(PRICE_DIGITS):"...";

const pretty_price = (val, currency) =>  `${pretty_value(val)} ${pretty_currency(currency)}`;


export {auction_next_price, pretty_price, pretty_currency}
