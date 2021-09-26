let ethAddress;
let contract;

function getJson() {
  return new Promise(result => {
    $.getJSON("../PolygonForest.json", (json => {
      result(json);
    }))
  })
}

async function updateBalance() {
  let logBalance = await contract.methods.getLogBalance().call({ from: ethAddress })
  $("#logs").text(`Your logs: ${logBalance}`);

  if (logBalance > 0) {
    $("#btn-sell").attr("disabled", false);
  } else {
    $("#btn-sell").attr("disabled", true);
  }
}

async function updateForest() {
  let forestSize = await contract.methods.getForestSize().call({ from: ethAddress });
  $("#forest-size").text(`Trees in the Polygon Forest: ${forestSize}`);
}

async function chop(e) {
  let forestSize = await contract.methods.getForestSize().call({ from: ethAddress });
  if (forestSize == 0) {
    alert("There are no trees right now! Trees replant after every tool sale");
  } else {
    const id = e.target.getAttribute("data-tool-id");

    contract.methods.chop(id).send({ from: ethAddress, value: "0" }).once("error", err => {
      console.log(err);
    }).then(async receipt => {
      console.log(receipt);
      let tool = await contract.methods.getTool(id).call({ from: ethAddress });
      updateTime($(e.target).parent().parent(), tool.nextReady);
      updateBalance();
      updateForest();
    });
  }
}

function cashout() {
  contract.methods.cashout().send({ from: ethAddress, value: "0" }).once("error", err => {
    console.log(err);
  }).then(async receipt => {
    console.log(receipt);
    updateBalance();
    alert("Successfully sold your logs!");
  });
}

function getRemaining(nextReady) {
  let now = new Date();
  let next = new Date(nextReady * 1000);

  if (now >= next) {
    return "Ready";
  }

  let timeLeft = (next.getTime() - now.getTime())/1000;
  let string = `${Math.floor(timeLeft / 3600).toString().padStart(2, "0")}:${Math.floor(timeLeft % 3600 / 60).toString().padStart(2, "0")}:${Math.floor(timeLeft % 60).toString().padStart(2, "0")}`;
  return string;
}

function updateTime(toolHTML, time) {
  const chop = toolHTML.find(".btn-chop")[0];
  if (time != "Ready" && getRemaining(time) != "Ready") {
    $(chop).attr("disabled", true);
    const readyObject = toolHTML.find(".tool-item-ready")[0];
    $(readyObject).text(`Tool Ready: ${getRemaining(time)}`);

    setTimeout(() => updateTime(toolHTML, time), 1000);
  } else {
    $(chop).attr("disabled", false);
  }
}

async function start() {
  updateForest();
  updateBalance();
  $("#btn-sell").click(cashout);

  let ownedTools = await contract.methods.getOwnedTools(ethAddress).call({ from: ethAddress });

  if (ownedTools.length == 0) {
    $("body").append(`<p>You don't have any tools!<br>Head to the <a href="../market">Market</a> to get one</p>`)
  } else {
    for (tool of ownedTools) {
      let toolName; 
      switch (tool.model) {
        case "0": toolName = "Hatchet"; break;
        case "1": toolName = "Axe"; break;
        case "2": toolName = "Saw"; break;
        case "3": toolName = "Chainsaw"; break;
      }
      const html = $(`
      <div id="tools-container">
        <div class="tool-item">
          <img class="tool-item-img" src="../assets/${toolName}.png">
          <p class="tool-item-name">${toolName}</p>
          <p>Chop Time: ${tool.chopTime / 60} minutes</p>
          <p>Logs per chop: ${tool.logsPerChop}</p>
          <p class="tool-item-ready">Tool Ready: ${getRemaining(tool.nextReady)}</p>
          <button class="btn-chop" disabled="${getRemaining(tool.nextReady) === "Ready"}" data-tool-id="${tool.id}">Chop</button>
        </div>
      </div>
      `);
      $("#tools-container").append(html);
      updateTime(html, tool.nextReady);
    }
    $(".btn-chop").click(chop);
  }
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

$(document).ready(() => {
  $("#btn-sell").attr("disabled", true);
});