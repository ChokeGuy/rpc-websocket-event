# RPC Websocket Event Service

RPC Websocket Event Service is a Node.js-based application that listens for and processes blockchain events emitted by smart contracts via RPC (Remote Procedure Calls) on EVM (Ethereum Virtual Machine) compatible blockchains. The service captures these events, processes them in real-time, and stores them in both a Redis cache and MongoDB database for easy access and long-term storage.

## Features

- **Blockchain Event Capture**: Listens for events from Ethereum, Binance Smart Chain, or any other EVM-compatible blockchain.
- **Event Processing**: Processes events in real-time with minimal latency to react to blockchain activity.
- **Caching with Redis**: Stores the latest blockchain events in Redis for quick access and fast retrieval.
- **Event Persistence**: Captures all blockchain events and stores them in MongoDB for long-term data retention.
- **API Interface**: Provides HTTP endpoints to interact with the service and fetch event data.

## Technologies Used
requests.
- **Ethers.js**: Libraries for interacting with EVM-compatible blockchains.
- **Hardhat**: Development environment for Ethereum software, used for testing and deploying smart contracts.

## Installation

### 1. Clone the repository

```bash
git clone [https://github.com/your-username/rpc-websocket-event.git](https://github.com/ChokeGuy/rpc-websocket-event.git)
```

### 2. **Navigate to the project directory**

```bash
cd rpc-websocket-event
```
### 3. **Install dependencies**
```bash
npm install
```
### 4. **Set up environment variables**
```
PRIVATE_KEY=
BS_API_KEY=
SEPOLIA_API_KEY=
OWNER= 
SEPOLIA_PROVIDER_URL= 
SEPOLIA_CONTRACT_ADDRESS= 
BS_CONTRACT_ADDRESS=
BS_PROVIDER_URLS=
DEFAULT_BLOCK_SCAN=
```
5. **Start the server**
```bash
npx hardhat run scripts/deploy-send.ts
```
