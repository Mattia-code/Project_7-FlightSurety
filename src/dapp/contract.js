import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        let config = Config[network];

        if (window.ethereum) {
            // use metamask's providers
            // modern browsers
            console.log("Modern Browser");
            this.web3 = new Web3(window.ethereum)
            // Request accounts access
            try {
                window.ethereum.enable()
            } catch (error) {
                console.error('User denied access to accounts')
            }
        } else if (window.web3) {
            // legacy browsers
            console.log("Legacy Browsers");
            this.web3 = new Web3(web3.currentProvider)
        } else {
            // fallback for non dapp browsers
            this.web3 = new Web3(new Web3.providers.HttpProvider(config.url))
        }

        // Load contract
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress)
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress)
        this.initialize(callback)
        this.account = null


        console.log("The appAddress is: "+config.appAddress);
        //this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        //this.initialize(callback);
        //this.account = null;
        this.airlines = {};
        this.passengers = {};
        this.airlineNames = ['AirAB1','AirAB2','AirAB3','AirAB4','AirAB5'];
        this.passengerNames = ['PAB1','PAB2','PAb3','PAB4','PAb5'];
        this.flights = {
            'AirAB1':['FL1','FL2','FL3'],
            'AirAB2':['AL1','AL2','AL3'],
            'AirAB3':['BL1','BL2','BL3'],
            'AirAB4':['CL1','CL2','CL3'],
            'AirAB5':['DL1','DL2','DL3'],
        }
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            if (!error) {
                this.account = accts[0]
                console.log("This account is: "+this.account)

                callback()
            } else {
                console.error(error)
            }
        })

    }

    getMetaskAccountID() {
        this.web3.eth.getAccounts(function (err, res) {
            if (err) {
                console.log('Error:', err);
                return err;
            }
            console.log('getMetaskID[0]:', res[0]);
            this.account = res[0];
        })
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.account}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.account}, (error, result) => {
                callback(error, payload);
            });
    }

    fundContract(value, callback){
        let self = this;
        let eth = self.web3.utils.toWei(value, "ether");
        self.getMetaskAccountID()
        self.flightSuretyApp.methods
            .fundContract()
            .send({ from: self.account, value: eth, gasPrice: 0}, (error, result) => {
                console.log(error, result);
                callback(error, result);
            });
    }

    registerAirline(airline, callback){
        let self = this;
        const AIRLINE_REGISTRATION_FEE = self.web3.utils.toWei("1", "ether");
        console.log("airline", airline)
        self.flightSuretyApp.methods.registerAirline(airline)
            .send({ from: self.account, value: AIRLINE_REGISTRATION_FEE, gasPrice: 0}, (error, result) => {
                console.log(error, result)
                callback(error, result);
            })
    }

    registerFlight( airline, flight, timestamp, callback){
        let self = this;
        console.log("airline", airline);
        console.log("flight", flight);
        console.log("timestamp", timestamp);
        console.log("self.airlines[0]", self.airlines[0])
        self.flightSuretyApp.methods.registerFlight(airline, flight, timestamp)
            .send({ from: self.account }, (error, result) => {
                console.log(error, result)
                callback(error, result);
            })
    }

    activateAirline(value, callback){
        let self = this;
        let eth = self.web3.utils.toWei(value, "ether");
        self.flightSuretyApp.methods.activateAirline(true)
            .send({ from: self.account, value: eth, gasPrice: 0}, (error, result) => {
                console.log(error, result)
                callback(error, result)
            })
    }

    buy(airline, flight, value, callback){
        let self = this;
        let eth = self.web3.utils.toWei(value, "ether");
        self.flightSuretyApp.methods.activateAirline(true)
            .send({ from: self.account, value: eth, gasPrice: 0}, (error, result) => {
                console.log(error, result)
                callback(error, result)
            })
    }

    creditInsurees(){

    }

    fetchFlightBuffer(airline, flight, callback){
        let self = this;
        self.flightSuretyApp.methods
            .fetchFlightBuffer(airline, flight)
            .call({ from: self.account}, callback);
    }

    fetchAirlineStatus(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fetchAirlineStatus(airline)
            .call({ from: self.account}, callback);
    }

    authorizeCaller(app, callback){
        let self = this;
        self.flightSuretyData.methods.authorizeCaller(app)
            .send({ from: self.account }, (error, result) => {
                console.log(error, result)
                callback(error, result)
            })
    }

}