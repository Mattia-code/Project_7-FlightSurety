
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    //let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        contract.fetchAirlineStatus("0xf17f52151EbEF6C7334FAD080c5704D77216b732", (error, result) => {
            console.log(error,result);
        });

        contract.getMetaskAccountID();
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        DOM.elid('submit-donate').addEventListener('click', () => {
            let fund = DOM.elid('fund').value;
            // Write transaction
            contract.fundContract(fund, (error, result) => {
                console.log("result: ", error, result);
            });
        })

        DOM.elid('submit-Flight').addEventListener('click', () => {
            let airline = DOM.elid('flightOwner').value;
            let flight = DOM.elid('flightNumber').value;
            let departureDate = DOM.elid('departureDate').value;
            departureDate = new Date(departureDate);
            departureDate = departureDate.getTime();
            // Write transaction
            contract.registerFlight(airline, flight, departureDate, (error, result) => {
                console.log("result: ", error, result);
            });
        })

        DOM.elid('submit-fetchFlight').addEventListener('click', () => {
            let airline = DOM.elid('flightOwner').value;
            let flight = DOM.elid('flightNumber').value;
            // Write transaction
            contract.fetchFlightBuffer(airline, flight, (error, result) => {
                console.log("result: ", error, result);
            });
        })

        DOM.elid('submit-activate').addEventListener('click', () => {
            //let airline = DOM.elid('addressAirline').value;
            let fund = DOM.elid('fund').value;
            // Write transaction
            contract.activateAirline(fund, (error, result) => {
                console.log("result: ", error, result);
            });
        })

        DOM.elid('submit-Airline').addEventListener('click', () => {
            let airline = DOM.elid('addressAirline').value;
            // Write transaction
            contract.registerAirline(airline, (error, result) => {
                console.log("result: ", error, result);
            });
        })

        DOM.elid('submit-buy').addEventListener('click', () => {
            //let passenger = DOM.elid('addressPassenger').value;
            let flight = DOM.elid('flightPassenger').value;
            let airline = DOM.elid('airlinePassenger').value;
            let fund = DOM.elid('payment').value;
            // Write transaction
            contract.buy(airline, flight, fund, (error, result) => {
                console.log("result: ", error, result);
            });
        })

        /*DOM.elid('submit-withdraw').addEventListener('click', () => {

        })

        DOM.elid('submit-balance').addEventListener('click', () => {

        })*/
    
    });
    

})();


function display(title, description, results) {
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







