
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    //let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            displayOracle('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });


        /*contract.getMetaskAccountID();*/
        /**
         * Flight
         */

        DOM.elid('submit-Flight').addEventListener('click', () => {
            let airline = DOM.elid('flightOwner').value;
            let flight = DOM.elid('flightNumber').value;
            let departureDate = DOM.elid('departureDate').value;
            departureDate = new Date(departureDate);
            departureDate = departureDate.getTime();
            // Write transaction
            contract.registerFlight(airline, flight, departureDate, (error, result) => {
                console.log("result:", error, result);
                flightConsole('Flight registration result:', [ { label: 'Flight', error: error, value: result} ]);
            });
        })

        DOM.elid('submit-fetchFlight').addEventListener('click', () => {
            let airline = DOM.elid('flightOwner').value;
            let flight = DOM.elid('flightNumber').value;
            // Write transaction
            contract.fetchFlightBuffer(airline, flight, (error, result) => {
                console.log("result:", error, result);
                flightConsole('Fetch Flight result:', [ { label: 'Fetch Flight', error: error, value: result} ]);
            });
        })

        /**
         * Airlines
         */
        DOM.elid('submit-Airline').addEventListener('click', () => {
            let airline = DOM.elid('addressAirline').value;
            contract.registerAirline(airline, (error, result) => {
                console.log("result:", error, result);
                airlineConsole("Register airline result:", [{label: 'Result', error: error, value: result}]);
            });
        })

        DOM.elid('submit-activate').addEventListener('click', () => {
            let fund = DOM.elid('fund').value;
            contract.activateAirline(fund, (error, result) => {
                console.log("result:", error, result);
                airlineConsole("Activate airline result:", [{label: 'Result', error: error, value: result}]);
            });
        })

        DOM.elid('submit-donate').addEventListener('click', () => {
            let fund = DOM.elid('fund').value;
            contract.fundContract(fund, (error, result) => {
                console.log("result:", error, result);
                airlineConsole("Donate result:", [{label: 'Result', error: error, value: result}]);
            });
        })

        /**
         * Passenger
         */
        DOM.elid('submit-buy').addEventListener('click', () => {
            let flight = DOM.elid('flightPassenger').value;
            let airline = DOM.elid('airlinePassenger').value;
            let fund = DOM.elid('payment').value;
            // Write transaction
            contract.buy(airline, flight, fund, (error, result) => {
                console.log("result:", error, result);
                passengerConsole("Buy Result:", [{label: "Result", error: error, value: result}])
            });
        })

        DOM.elid('submit-withdraw').addEventListener('click', () => {
            contract.withdrawFunds((error, result) => {
                console.log("result:", error, result);
                passengerConsole("Withdraw Result:", [{label: "Withdraw", error: error, value: result}])
            });
        })

        DOM.elid('submit-balance').addEventListener('click', () => {
            contract.getBalance((error, result) => {
                console.log("result:", error, result);
                passengerConsole("Balance Result:", [{label: "Balance", error: error, value: result}])
            });
        })

        /**
         * Operational
         */
        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let airline = DOM.elid('airline-oracle').value;
            // Write transaction
            contract.fetchFlightStatus(airline, flight, (error, result) => {
                displayOracle('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        DOM.elid('submit-contract').addEventListener('click', () => {
            let app_contract = DOM.elid('app-contract').value;
            // Write transaction
            contract.authorizeCaller(app_contract, (error, result) => {
                console.log("result: ", error, result);
            });
        })

    });
    

})();


function displayOracle(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function passengerConsole(command, results) {
    let displayDiv = DOM.elid("passenger-console");
    let section = DOM.section();
    section.appendChild(DOM.h5(command));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function airlineConsole(description, results) {
    let displayDiv = DOM.elid("airline-console");
    let section = DOM.section();
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function flightConsole(description, results) {
    let displayDiv = DOM.elid("flight-console");
    let section = DOM.section();
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







