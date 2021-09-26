let ethAddress;
let contract;

function getJson() {
  return new Promise(result => {
    $.getJSON("./PolygonForest.json", (json => {
      result(json);
    }))
  })
}

function start() {
  window.location.href = "forest";
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
            "0x061bdf676538e4f10831b3424759e3a7c4f43647"
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


$(document).ready(() => {
  $("#btn-connect").click(connect);
});