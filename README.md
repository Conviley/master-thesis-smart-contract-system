To get up and running perform the following steps:
# Prerequiste
This project requires you to have truffle and node installed!
To install node visit: https://nodejs.org/en/download/
After node has been installed run `npm install -g truffle` to install truffle globally.

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
8. Create a file called `.secret` and paste your wallet mneumonic inside it
9. Fund your wallet with eth on the ropsten network by visiting https://faucet.ropsten.be/
10. Run `truffle migrate --network ropsten` 
11. Create a file called `address.json` with a json object with the key `address` pointing to the trip factory
    ```json
    {
        "address": "Contract address from the latest migration"
    }
    ```
12. `cd client`
13. finally run `npm run dev` to spin up the server and visit http://localhost:3000/