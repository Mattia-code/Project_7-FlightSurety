var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    const timestamp = Math.floor(Date.now() / 1000) + 1000;

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, {from: config.testAddresses[2]});
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSurety.setTestingMode(true);
        } catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });


    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        } catch (e) {

        }
        let result = await config.flightSuretyData.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it("(airlines) First airline is registered when contract is deployed:", async () => {
        let result = await config.flightSuretyData.isAirline.call(config.firstAirline);
        assert.equal(result, true, "First airline should be registered when contract is deployed.");
    });

    it("(airlines) Airline can be registered, but does not participate in contract until it submits funding of 10 ether (1):", async () => {
        let balance = web3.utils.toWei("10", "ether");

        let result = await config.flightSuretyData.isActive.call(config.firstAirline);
        assert.equal(result, false, "The 10 ethereum fee has not been paid.");

        await config.flightSuretyApp.activateAirline(true, {from: config.firstAirline, value: balance, gasPrice: 0});
        result = await config.flightSuretyData.isActive.call(config.firstAirline);
        assert.equal(result, true, "The 10 ethereum fee has not been paid");
    });

    //TODO: Review
    it("(airlines) Only existing airline may register a new airline until there are at least four airlines registered:", async () => {

        let newAirline1 = accounts[2];
        let newAirline2 = accounts[3];
        let newAirline3 = accounts[4];
        let newAirline4 = accounts[5];

        let balance = web3.utils.toWei("1", "ether");

        await config.flightSuretyApp.registerAirline(newAirline1, {
            from: config.firstAirline,
            value: balance,
            gasPrice: 0
        });
        let result = await config.flightSuretyData.isAirline.call(newAirline1);
        assert.equal(result, true, "Existing airline may register a new airline until there are at least four airlines registered.");

        await config.flightSuretyApp.registerAirline(newAirline2, {
            from: config.firstAirline,
            value: balance,
            gasPrice: 0
        });
        result = await config.flightSuretyData.isAirline.call(newAirline2);
        assert.equal(result, true, "Existing airline may register a new airline until there are at least four airlines registered.");

        try {
            await config.flightSuretyApp.registerAirline(newAirline3, {from: newAirline2, value: balance, gasPrice: 0});
        } catch (e) {
        }
        result = await config.flightSuretyData.isAirline.call(newAirline3);
        assert.equal(result, false, "existing airline may register a new airline until there are at least four airlines registered.");

        try {
            await config.flightSuretyApp.registerAirline(newAirline4, {from: newAirline3, value: balance, gasPrice: 0});
        } catch (e) {
        }
        result = await config.flightSuretyData.isAirline.call(newAirline4);
        assert.equal(result, false, "Existing airline may register a new airline until there are at least four airlines registered.");

    });

    it("(airlines) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines.", async () => {
        let newAirline1 = accounts[2];
        let newAirline2 = accounts[3];
        let newAirline3 = accounts[4];
        let newAirline4 = accounts[5];

        let balance1 = web3.utils.toWei("1", "ether");
        let balance10 = web3.utils.toWei("10", "ether");

        await config.flightSuretyApp.activateAirline(true, {from: newAirline1, value: balance10, gasPrice: 0});
        await config.flightSuretyApp.activateAirline(true, {from: newAirline2, value: balance10, gasPrice: 0});

        await config.flightSuretyApp.registerAirline(newAirline3, {from: newAirline2, value: balance1, gasPrice: 0});
        let result = await config.flightSuretyData.isAirline.call(newAirline3);
        assert.equal(result, true, "Existing airline may register a new airline until there are at least four airlines registered.");

        await config.flightSuretyApp.activateAirline(true, {from: newAirline3, value: balance10, gasPrice: 0});

        await config.flightSuretyApp.registerAirline(newAirline4, {
            from: config.firstAirline,
            value: balance1,
            gasPrice: 0
        });
        result = await config.flightSuretyData.isAirline.call(newAirline4);
        assert.equal(result, false, "Existing airline may register a new airline until there are at least four airlines registered.");

        await config.flightSuretyApp.registerAirline(newAirline4, {from: newAirline1, value: balance1, gasPrice: 0});
        result = await config.flightSuretyData.isAirline.call(newAirline4);
        assert.equal(result, true, "Existing airline may register a new airline until there are at least four airlines registered.");

    });

    it("(airlines) Airline can be registered, but does not participate in contract until it submits funding of 10 ether. (2)", async () => {
        let newAirline4 = accounts[5];
        let balance = web3.utils.toWei("10", "ether");

        let result = await config.flightSuretyData.isActive.call(newAirline4);
        assert.equal(result, false, "The 10 ethereum fee has not been paid.");

        await config.flightSuretyApp.activateAirline(true, {from: newAirline4, value: balance, gasPrice: 0});
        result = await config.flightSuretyData.isActive.call(newAirline4);
        assert.equal(result, true, "The 10 ethereum fee has not been paid.");
    });

    it("(airlines) Airlines can register a fligth.", async () => {
        let flight = 'ND1309';
        /**
         * TODO: timestamp in _key
         * @type {number}
         *
         * let timestamp = 1587924461;
         */
        let statusCode = 0;
        let isRegistered = true;

        let result = await config.flightSuretyApp.registerFlight(config.firstAirline, flight, timestamp, {from: config.firstAirline});

        assert.equal(result.logs[0].event, "RegisterFlight"); //asserts that the event has been emitted

        const resultBuffer = await config.flightSuretyApp.fetchFlightBuffer.call(config.firstAirline, flight);

        // Verify the result set
        assert.equal(resultBuffer[0], isRegistered, 'Error: Invalid value isRegistered');
        assert.equal(resultBuffer[1], statusCode, 'Error: Invalid statusCode');
        assert.equal(resultBuffer[2], timestamp, 'Error: Missing or Invalid timestamp');
        assert.equal(resultBuffer[3], config.firstAirline, 'Error: Missing or Invalid airline address');
    });


    it("(passengers) Passengers may pay up to 1 ether for purchasing flight insurance:", async () => {
        let flight = 'ND1309';
        let passeger = accounts[6];
        let insuranceValue = web3.utils.toWei("0.5", "ether");

        await config.flightSuretyApp.buy(config.firstAirline, flight, {
            from: passeger,
            value: insuranceValue,
            gasPrice: 0
        });
        const resultBuffer = await config.flightSuretyData.fetchFlightInsured.call(passeger, config.firstAirline, flight);

        // Verify the result set
        assert.equal(resultBuffer[0], true, 'Error: Invalid value isRegistered');
        assert.equal(resultBuffer[1], insuranceValue, 'Error: Missing or Invalid timestamp');
        assert.equal(resultBuffer[2], 0, 'Error: Missing or Invalid airline address');
    });

    it('(oracles) Oracles can register', async () => {
        let n = 20;
        let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

        try {
            // ACT
            for (let a = 1; a < n; a++) {
                await config.flightSuretyApp.registerOracle({from: accounts[a], value: fee});
                await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
                //console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
            }
        } catch (e) {
            console.log(e.toString())
        }

    });

    it('(oracles) Can request flight status, process it and credit insuree', async () => {
        let flight = 'ND1309';
        let n = 20;
        // Submit a request for oracles to get status information for a flight
        await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);

        /*
        * Since the Index assigned to each test account is opaque by design, loop through all the accounts and for each account, all its Indexes (indices?) and submit a response. The contract will reject a submission if it was not requested so while sub-optimal, it's a good test of that feature
        */
        for (let a = 1; a < n; a++) {

            let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
            for (let idx = 0; idx < 3; idx++) {

                try {
                    // Submit a response...it will only be accepted if there is an Index match
                    await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, 20, {from: accounts[a]});
                } catch (e) {
                    // Enable this when debugging
                    //console.log('Error', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
                }

            }
        }

    });


    it('(oracles) Update Flight StatusCode after adequate answers have been received', async () => {
        let flight = 'ND1309';
        const key = await config.flightSuretyApp.getFlightKey(config.firstAirline, flight);
        const flightStruct = await config.flightSuretyData.flights.call(key);
        assert.equal(flightStruct.statusCode, 20, 'Flight status was not updated correctly');
    });

    it('(passenger) Can withdraw credited insurance amount', async () => {
        let passenger = accounts[6];

        const balance = await web3.eth.getBalance(passenger);
        const balancePassegerBefore = await config.flightSuretyApp.getBalance.call({from: passenger});
        assert.equal(balancePassegerBefore, web3.utils.toWei("0.75", "ether"), "The refund was not paid correctly.");

        try {
            await config.flightSuretyApp.withdrawFunds({from: passenger});
        } catch (error) {
            console.log(error)
        }

        const balanceAfter = await web3.eth.getBalance(passenger);
        const balancePassegerAfter = await config.flightSuretyApp.getBalance.call({from: passenger, gasPrice: 0});
        let difference = Number(balanceAfter) - Number(balance);

        assert.equal(Number(balancePassegerAfter), 0, "The passenger still has money in his balance");
    });

    it("(All) Initial funding for the insurance. Unless there are too many delayed flights resulting in " +
        "insurance payouts, the contract should be self-sustaining", async () => {

        let value = web3.utils.toWei("10", "ether");
        const balanceBeforeContract = await web3.eth.getBalance(config.flightSuretyApp.address);
        const balanceBefore = await web3.eth.getBalance(config.owner);

        let result = await config.flightSuretyApp.fundContract({from: config.owner, value: value, gasPrice: 0});

        let balanceAfterContract = await web3.eth.getBalance(config.flightSuretyApp.address);
        let balanceAfter = await web3.eth.getBalance(config.owner);

        assert.equal(result.logs[0].event, "Fund"); //asserts that the event has been emitted
        assert.equal(balanceAfterContract - balanceBeforeContract, Number(value), "The funds were not donated correctly");
        assert.equal(balanceBefore - balanceAfter, Number(value), "The funds were not donated correctly");
    });

    it("(debug):", async () => {

        const resultBuffer = await config.flightSuretyApp.fetchAirlineStatus.call(config.firstAirline);
        /*
        * console.log("resultBuffer", resultBuffer);
        */
        assert.equal(resultBuffer, true, 'Error: Invalid value isRegistered');
    });

});
