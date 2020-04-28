import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.account = null;
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

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
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
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    fundContract(value, callback){
        let self = this;
        let eth = self.web3.utils.toWei(value, "ether");
        self.flightSuretyApp.methods
            .fundContract()
            .send({ from: self.owner, value: eth, gasPrice: 0}, (error, result) => {
                console.log(error, result);
                callback(error, result);
            });
    }

    registerAirline(airline, callback){
        let self = this;
        const AIRLINE_REGISTRATION_FEE = self.web3.utils.toWei("1", "ether");
        console.log("airline", airline)
        self.flightSuretyApp.methods.registerAirline(airline)
            .send({ from: self.airlines[0], value: AIRLINE_REGISTRATION_FEE, gasPrice: 0}, (error, result) => {
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
            .send({ from: self.airlines[0] }, (error, result) => {
                console.log(error, result)
                callback(error, result);
            })
    }

    activateAirline(value, callback){
        let self = this;
        let eth = self.web3.utils.toWei(value, "ether");
        self.flightSuretyApp.methods.activateAirline(true)
            .send({ from: self.airlines[0], value: eth, gasPrice: 0}, (error, result) => {
                console.log(error, result)
                callback(error, result)
            })
    }

    buy(airline, flight, value, callback){
        let self = this;
        let eth = self.web3.utils.toWei(value, "ether");
        self.flightSuretyApp.methods.activateAirline(true)
            .send({ from: self.passengers[1], value: eth, gasPrice: 0}, (error, result) => {
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
            .call({ from: self.owner}, callback);
    }

    fetchAirlineStatus(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fetchAirlineStatus(airline)
            .call({ from: self.owner}, callback);
    }

}