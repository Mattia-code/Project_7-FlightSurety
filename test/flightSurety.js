var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
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

    it("First airline is registered when contract is deployed.", async () => {
        let result = await config.flightSuretyData.isAirline.call(config.firstAirline);
        assert.equal(result, true, "First airline should be registered when contract is deployed.");
    });

    it("Airline can be registered, but does not participate in contract until it submits funding of 10 ether. (1)", async () => {
        let balance = web3.utils.toWei("10", "ether");

        let result = await config.flightSuretyData.isActive.call(config.firstAirline);
        assert.equal(result, false, "No submits funding of 10 ether.");

        await config.flightSuretyApp.activateAirline(true, {from: config.firstAirline, value: balance, gasPrice:0});
        result = await config.flightSuretyData.isActive.call(config.firstAirline);
        assert.equal(result, true, "No submits funding of 10 ether.");
    });

    it("Only existing airline may register a new airline until there are at least four airlines registered.", async () => {

        let newAirline1 = accounts[2];
        let newAirline2 = accounts[3];
        let newAirline3 = accounts[4];
        let newAirline4 = accounts[5];

        let balance = web3.utils.toWei("1", "ether");

        await config.flightSuretyApp.registerAirline(newAirline1, {from: config.firstAirline, value: balance, gasPrice:0});
        let result = await config.flightSuretyData.isAirline.call(newAirline1);
        assert.equal(result, true, "existing airline may register a new airline until there are at least four airlines registered.");

        await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline, value: balance, gasPrice:0});
        result = await config.flightSuretyData.isAirline.call(newAirline2);
        assert.equal(result, true, "existing airline may register a new airline until there are at least four airlines registered.");

        try {
            await config.flightSuretyApp.registerAirline(newAirline3, {from: newAirline2, value: balance, gasPrice:0});
        }catch (e) { }
        result = await config.flightSuretyData.isAirline.call(newAirline3);
        assert.equal(result, false, "existing airline may register a new airline until there are at least four airlines registered.");

        try {
            await config.flightSuretyApp.registerAirline(newAirline4, {from: newAirline3, value: balance, gasPrice:0});
        }catch (e) { }
        result = await config.flightSuretyData.isAirline.call(newAirline4);
        assert.equal(result, false, "existing airline may register a new airline until there are at least four airlines registered.");

    });

    it("Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines.", async () => {
        let newAirline1 = accounts[2];
        let newAirline2 = accounts[3];
        let newAirline3 = accounts[4];
        let newAirline4 = accounts[5];

        let balance1 = web3.utils.toWei("1", "ether");
        let balance10 = web3.utils.toWei("10", "ether");

        await config.flightSuretyApp.activateAirline(true, {from: newAirline1, value: balance10, gasPrice:0});
        await config.flightSuretyApp.activateAirline(true, {from: newAirline2, value: balance10, gasPrice:0});

        await config.flightSuretyApp.registerAirline(newAirline3, {from: newAirline2, value: balance1, gasPrice:0});
        let result = await config.flightSuretyData.isAirline.call(newAirline3);
        assert.equal(result, true, "existing airline may register a new airline until there are at least four airlines registered.");

        await config.flightSuretyApp.activateAirline(true, {from: newAirline3, value: balance10, gasPrice:0});

        await config.flightSuretyApp.registerAirline(newAirline4, {from: config.firstAirline, value: balance1, gasPrice:0});
        result = await config.flightSuretyData.isAirline.call(newAirline4);
        assert.equal(result, false, "existing airline may register a new airline until there are at least four airlines registered.");

        await config.flightSuretyApp.registerAirline(newAirline4, {from: newAirline1, value: balance1, gasPrice:0});
        result = await config.flightSuretyData.isAirline.call(newAirline4);
        assert.equal(result, true, "existing airline may register a new airline until there are at least four airlines registered.");

    });

    it("Airline can be registered, but does not participate in contract until it submits funding of 10 ether. (2)", async () => {
        let newAirline4 = accounts[5];
        let balance = web3.utils.toWei("10", "ether");

        let result = await config.flightSuretyData.isActive.call(newAirline4);
        assert.equal(result, false, "No submits funding of 10 ether.");

        await config.flightSuretyApp.activateAirline(true, {from: newAirline4, value: balance, gasPrice:0});
        result = await config.flightSuretyData.isActive.call(newAirline4);
        assert.equal(result, true, "No submits funding of 10 ether.");
    });

    it("Airlines can register a fligth.", async () => {
        let flight = 'ND1309';
        let timestamp = 1587924461;
        let statusCode = 0;
        let isRegistered = true;

        let result = await config.flightSuretyApp.registerFlight(config.firstAirline, flight, timestamp, {from: config.firstAirline});

        //console.log(result);
        assert.equal(result.logs[0].event, "RegisterFlight"); //asserts that the event has been emitted

        const resultBuffer = await config.flightSuretyApp.fetchFlightBuffer.call(config.firstAirline, flight);

        // Verify the result set
        assert.equal(resultBuffer[0], isRegistered, 'Error: Invalid value isRegistered');
        assert.equal(resultBuffer[1], statusCode, 'Error: Invalid statusCode');
        assert.equal(resultBuffer[2], timestamp, 'Error: Missing or Invalid timestamp');
        assert.equal(resultBuffer[3], config.firstAirline, 'Error: Missing or Invalid airline address');
    });

    it("Passengers may pay up to 1 ether for purchasing flight insurance.", async () => {
        let flight = 'ND1309';
        let passeger = accounts[6];
        let insuranceValue = web3.utils.toWei("0.5", "ether");

        await config.flightSuretyApp.buy(config.firstAirline, flight, {from: passeger, value: insuranceValue, gasPrice:0});
        const resultBuffer = await config.flightSuretyData.fetchFlightInsured.call(passeger, config.firstAirline, flight);

        // Verify the result set
        assert.equal(resultBuffer[0], true, 'Error: Invalid value isRegistered');
        assert.equal(resultBuffer[1], insuranceValue, 'Error: Missing or Invalid timestamp');
        assert.equal(resultBuffer[2], 0, 'Error: Missing or Invalid airline address');
    });

    it("Initial funding for the insurance. Unless there are too many delayed flights resulting in " +
        "insurance payouts, the contract should be self-sustaining", async () => {

        let value = web3.utils.toWei("10", "ether");

        let result = await config.flightSuretyApp.fundContract({from: config.owner, value: value, gasPrice:0});

        assert.equal(result.logs[0].event, "Fund"); //asserts that the event has been emitted
    });

    it("For debug", async () => {

        const resultBuffer = await config.flightSuretyApp.fetchAirlineStatus.call(config.firstAirline);
        console.log("resultBuffer", resultBuffer);
        assert.equal(resultBuffer, true, 'Error: Invalid value isRegistered');
    });


    /*it("If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid.", async () => {
        /!*let flight = 'ND1309';
        let passeger = accounts[5];
        let balance = web3.utils.toWei("0.5", "ether");

        let result = await config.flightSuretyApp.fetchFlightStatus();

        assert.equal(result.logs[0].event, "RegisterFlight")*!/

    });

    it("Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout.", async () => {


    });

    it("Insurance payouts are not sent directly to passenger’s wallet.", async () => {


    });*/

});
