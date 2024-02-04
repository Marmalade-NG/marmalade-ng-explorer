const MAINNET_8 =
{
  name:"Mainnet Chain 8",
  node:"https://api.chainweb.com",
  network:"mainnet01",
  chain:"8",
  ns: "n_4e470a97222514a8662dd1219000a0431451b0ee",
  bridge_ns: "n_4e470b4e150fafd1c50d1f016331142b55dd01db"
}

const MAINNET_1 =
{
  name:"Mainnet Chain 1",
  node:"https://api.chainweb.com",
  network:"mainnet01",
  chain:"1",
  ns: "n_4e470a97222514a8662dd1219000a0431451b0ee",
  bridge_ns: "n_4e470b4e150fafd1c50d1f016331142b55dd01db"
}

const TESTNET_1 =
{
  name:"Testnet Chain 1",
  node:"https://api.testnet.chainweb.com",
  network:"testnet04",
  chain:"1",
  ns: "n_442d3e11cfe0d39859878e5b1520cd8b8c36e5db",
  bridge_ns: "n_a55cdf159bc9fda0a8af03a71bb046942b1e4faf"
}


export const INSTANCES = {"Mainnet Chain 8":MAINNET_8,
                          "Mainnet Chain 1":MAINNET_1,
                          "Testnet Chain 1":TESTNET_1}

export const DEFAULT_INSTANCE = INSTANCES[import.meta.env.VITE_DEFAULT_INSTANCE];
