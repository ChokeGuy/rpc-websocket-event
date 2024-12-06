import { Contract, ethers, Provider } from "ethers";
import { createResilientProviders, getTopics } from "./web-socket-connection";
import { network } from "hardhat";
import { AbiEvent, ContractABI } from "../types";
import { contractABI } from "../constants";

const providerUrl = process.env.SEPOLIA_PROVIDER_URL!;
const contractAddress = process.env.SEPOLIA_LISTEN_CONTRACT_ADDRESS!;

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
  const iface = new ethers.Interface(contractABI);

  const eventABIs = contractABI.filter(
    (item): item is AbiEvent => item.type === "event"
  );

  const filters = eventABIs.map((event) => {
    const topic0 = iface.getEvent(event.name)?.topicHash!;
    return {
      address: contractAddress,
      topics: [topic0],
    };
  });

  filters.forEach((filter, index) => {
    provider.on(filter, (log) => {
      const event = eventABIs[index];
      const decoded = iface.decodeEventLog(event.name, log.data, log.topics);

      const [from, to, value] = decoded;
      console.log(`Event triggered: ${event.name}`);

      console.log("From:", from);
      console.log("To:", to);
      console.log("value:", value);
    });
  });
}

main().catch(console.error);
