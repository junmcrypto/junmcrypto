let ethAddress;
let contract;

function getJson() {
  return new Promise(result => {
    $.getJSON("../PolygonForest.json", (json => {
      result(json);
    }))
  })
}

function etherToWei(n) {
  return (n * 10**18).toString();
}

function buyTool(model) {
  let price;
  switch (model) {
    case 0: price = etherToWei(0); break;
    case 1: price = etherToWei(0.001); break;
    case 2: price = etherToWei(0.01); break;
    case 3: price = etherToWei(0.035); break;
  }
  contract.methods.mintTool(model).send({ from: ethAddress, value: price }).once("error", err => {
    console.log(err);
  }).then(receipt => {
    console.log(receipt);
  });
}

function start() {
  $("#btn-buy-hatchet").click(() => buyTool(0));
  $("#btn-buy-axe").click(() => buyTool(1));
  $("#btn-buy-saw").click(() => buyTool(2));
  $("#btn-buy-chainsaw").click(() => buyTool(3));
}

const connect = async () => {
  if (window.ethereum) {
    await window.ethereum.send("eth_requestAccounts");
    let web3 = new Web3(window.ethereum);
    try {
      const accounts = await window.ethereum.request({ // array of accounts loaded in MetaMask
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const contractNetworkData = await getJson();
        if (chainId == 137) {
          contract = new web3.eth.Contract(
            contractNetworkData.abi, // interface to our contract
            // contractNetworkData.networks[0].address // our contract address
            "0xb290dc212bc126627ba4939f7e63c4db41a6ea90"
          );
          ethAddress = accounts[0];

          start();
          // Listeners
          window.ethereum.on("accountsChanged", (accounts) => { // when accounts changed in MetaMask
            ethAddress = accounts[0];
          });
          window.ethereum.on("chainChanged", () => { // when networks are switched
            window.location.reload();
          });
        } else {
          alert("Please change your network to Polygon");
        }
      } else {
        alert("Please sign in to your wallet");
      }
    } catch (err) {
      alert("Something went wrong (Check console for details)", err);
    }
  } else {
    alert("Please install metamask");
  }
};


connect();