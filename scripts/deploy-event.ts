import { Contract, ethers, Provider } from "ethers";
import { createResilientProviders } from "./web-socket-connection";
import { network } from "hardhat";
import { AbiEvent, ContractABI } from "../types";

const providerUrl = process.env.SEPOLIA_PROVIDER_URL!;
const providerUrl2 = process.env.SEPOLIA_PROVIDER_URL_2!;
const contractAddress = process.env.SEPOLIA_LISTEN_CONTRACT_ADDRESS!;
const contractABI: ContractABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

const main = async () => {
  await createWebSocket(
    [providerUrl],
    contractAddress,
    contractABI,
    listenEvent
  );
};

async function createWebSocket(
  webSocketUrls: string[],
  contractAddress: string,
  contractABI: ContractABI,
  func: (...args: any[]) => Promise<void>
) {
  const chainId = network.config.chainId!;

  // Create resilient providers
  const providers = await createResilientProviders(webSocketUrls, chainId);

  // Use Promise.all to handle all providers concurrently
  await Promise.all(
    providers.map(async (provider) => {
      try {
        // Attach a block listener to the provider
        provider.on("block", (blockNumber) =>
          console.log("New Block:", blockNumber)
        );

        // Execute the provided async function
        await func(contractAddress, contractABI, provider);
      } catch (error) {
        console.error("Error with provider:", error);
      }
    })
  );
}

async function listenEvent(
  contractAddress: string,
  contractABI: ContractABI,
  provider: Provider
) {
  // Create contract instance
  const contract = new Contract(contractAddress, contractABI, provider);

  const eventABIs = contractABI.filter(
    (item): item is AbiEvent => item.type === "event"
  );

  await Promise.all(
    eventABIs.map((event) => {
      const { name, inputs } = event;

      // Listen for events
      contract.on(name, (...args) => {
        const [from, to, value] = args;
        console.log(`Event triggered: ${name}`);

        console.log("From:", from);
        console.log("To:", to);
        console.log("Value:", value);
      });
    })
  );
}

main().catch(console.error);
