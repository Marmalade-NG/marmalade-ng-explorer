export function make_nonce()
{
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return "ng_expl:" + Array.from(a, (x)=>x.toString(16)).join('');
}
