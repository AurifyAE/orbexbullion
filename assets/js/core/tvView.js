import { readSpreadValues } from '../core/spotrateDB.js';
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { app } from '../../../config/db.js';

const firestore = getFirestore(app)


document.addEventListener('DOMContentLoaded', function () {
    setInterval(() => {
        fetchData()
    }, 1000)

    showTable();
});


let askSpread, bidSpread, goldValue;

// Gold API KEY
const API_KEY = 'goldapi-fbqpmirloto20zi-io'

// Function to Fetch Gold API Data
async function fetchData() {
    var myHeaders = new Headers();
    myHeaders.append("x-access-token", API_KEY);
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    try {
        const responseGold = await fetch("https://www.goldapi.io/api/XAU/USD", requestOptions);
        const responseSilver = await fetch("https://www.goldapi.io/api/XAG/USD", requestOptions);

        if (!responseGold.ok && !responseSilver.ok) {
            throw new Error('One or more network responses were not OK');
        }

        const resultGold = await responseGold.json();
        const resultSilver = await responseSilver.json();

        // Adjust based on the actual API response structure
        var goldValueUSD = parseFloat(resultGold.price);
        var GoldUSDResult = (goldValueUSD / 31.1035).toFixed(4);
        goldValue = (GoldUSDResult * 3.67).toFixed(4);

        var goldLowValue = parseFloat(resultGold.low_price);
        var goldHighValue = parseFloat(resultGold.high_price);
        var silverLowValue = parseFloat(resultSilver.low_price);
        var silverHighValue = parseFloat(resultSilver.high_price);

        console.log(goldLowValue);

        document.getElementById("goldInputLow").innerHTML = goldLowValue;
        document.getElementById("goldInputHigh").innerHTML = goldHighValue;
        document.getElementById("silverInputLow").innerHTML = silverLowValue;
        document.getElementById("silverInputHigh").innerHTML = silverHighValue;


    } catch (error) {
        console.error('Error fetching gold and silver values:', error);
    }
}

// Function to Display Spread Values from Firebase
function displaySpreadValues() {
    return readSpreadValues() // Return the promise to allow further chaining
        .then((spreadDataArray) => {
            // Process the data if needed
            spreadDataArray.map((spreadData) => {
                askSpread = spreadData.data.editedAskSpreadValue;
                bidSpread = spreadData.data.editedBidSpreadValue;
            });
        })
        .catch((error) => {
            console.error('Error reading spread values: ', error);
            throw error; // Rethrow the error to indicate a problem
        });
}

// Function to read data from the Firestore collection
async function readData() {
    // Get the UID of the authenticated user
    const uid = 'BKm70mfv8BMQuJJUO4tiM3f0t6X2';

    if (!uid) {
        console.error('User not authenticated');
        return Promise.reject('User not authenticated');
    }

    const querySnapshot = await getDocs(collection(firestore, `users/${uid}/commodities`));
    const result = [];
    querySnapshot.forEach((doc) => {
        result.push({
            id: doc.id,
            data: doc.data()
        });
    });
    return result;
}

// Show Table from Database
async function showTable() {
    console.log("Tv");
    try {
        const tableData = await readData();
        // console.log('Data read successfully:', tableData);

        const tableBody = document.getElementById('tableBodyTV');

        // Loop through the tableData
        for (const data of tableData) {
            // Assign values from data to variables
            const metalInput = data.data.metal;
            const purityInput = data.data.purity;
            const unitInput = data.data.unit;
            const weightInput = data.data.weight;
            const sellAEDInput = data.data.sellAED;
            const buyAEDInput = data.data.buyAED;
            const sellPremiumInputAED = data.data.sellPremiumAED;
            const buyPremiumInputAED = data.data.buyPremiumAED;


            // Create a new table row
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
            <td>${metalInput}</td>
            <td>${purityInput}</td>
            <td>${unitInput} ${weightInput}</td>
            <td id="sellAED">0</td>
            <td id="buyAED">0</td>
            `;

            // Append the new row to the table body
            tableBody.appendChild(newRow);

            displaySpreadValues();

            setInterval(async () => {
                let weight = weightInput;
                let unitMultiplier = 1;

                // Adjust unit multiplier based on the selected unit
                if (weight === "GM") {
                    unitMultiplier = 1;
                } else if (weight === "KG") {
                    unitMultiplier = 1000;
                } else if (weight === "TTB") {
                    unitMultiplier = 116.6400;
                } else if (weight === "TOLA") {
                    unitMultiplier = 11.664;
                } else if (weight === "OZ") {
                    unitMultiplier = 31.1034768;
                }

                let sellPremium = sellPremiumInputAED || 0;
                let buyPremium = buyPremiumInputAED || 0;
                let askSpreadValue = askSpread || 0;
                let bidSpreadValue = bidSpread || 0;

                // Update the sellAED and buyAED values for the current 
                newRow.querySelector("#sellAED").innerText = ((parseFloat(goldValue) + parseFloat(sellPremium) + parseFloat(askSpreadValue)) * unitInput * unitMultiplier * (purityInput / Math.pow(10, purityInput.length))).toFixed(4);
                newRow.querySelector("#buyAED").innerText = ((parseFloat(goldValue) + parseFloat(buyPremium) + parseFloat(bidSpreadValue)) * unitInput * unitMultiplier * (purityInput / Math.pow(10, purityInput.length))).toFixed(4);
            }, 1000)
        }
    } catch (error) {
        console.error('Error reading data:', error);
    }
}