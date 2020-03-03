## Prerequisites
This project requires you to have truffle and node installed! It is also suggested that you use Metamask!  
To install node visit: https://nodejs.org/en/download/.  
After node has been installed run `npm install -g truffle` to install truffle globally.  
To install metamask visit https://metamask.io/download.html
## To get up and running perform the following steps
1. Clone the repo
2. `cd tqdt33` You should be on the development branch already!
3. Run `npm install`
4. Create Infura account at www.infura.io and set up a new project.
5. `cd client`
6. Run `npm install`
7. `cd ../`
8. Create a file called `infura.json` with a json object with key `endpoint`
   pointing to your infura ropsten enpoint.
    ```json
    {
        "endpoint": "https://ropsten.infura.io/v3/YOUR-Project-Endpoint"
    }
    ```
    Make sure you add `https://`
8. Create a file called `.secret` and paste your wallet mneumonic inside it.  
   In metamask you can find your wallet mneumonic under Settings --> Security & Privacy --> Reveal seed words
9. Fund your wallet with eth on the `ropsten` network by visiting https://faucet.ropsten.be/
10. Run `truffle migrate --network ropsten` 
11. Create a file called `address.json` with a json object with the key `address` containing the DeRail contract address.
    ```json
    {
        "address": "Contract address from the latest migration"
    }
    ```
12. `cd client`
13. finally run `npm run dev` to spin up the server and visit http://localhost:3000/
## Testing
Since the front-end is not fully built, testing the contract can be done in one of two ways.
### Running local tests
By running `truffle test` in the root of the project the local tests get run.
### Testing with Remix
- Visit https://remix.ethereum.org/  
- Copy the contents of `DeRail.sol` and `HitchensUnorderedKeySet.sol` and paste them  
into two new files with the same name in remix.  
- Deploy the DeRail contract using `Javascript VM` to test all non-chainlink related functionality  
- Deploy the DeRail contract using `Injected Web3`, making sure you're on the `ropsten` network (switch network in metamask),
to be able to test everything.  
- Remember to fund the contract with LINK to test chainlink functionality.  
Visit https://ropsten.chain.link/ to get some test-LINK!