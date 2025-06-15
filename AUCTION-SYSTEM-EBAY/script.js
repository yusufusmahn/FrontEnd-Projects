const BASE_URL = 'http://localhost:8080';
let currentUserId = null;
let currentUsername = null;
let currentRole = null;
let currentEmail = null;


function showInitialSection() {
    document.getElementById('initialSection').style.display = 'block';
    document.getElementById('loginFormSection').style.display = 'none';
    document.getElementById('registerFormSection').style.display = 'none';
    document.getElementById('loggedInSection').style.display = 'none';
}

window.onload = showInitialSection;


document.getElementById('loginButton').addEventListener('click', function() {
    document.getElementById('initialSection').style.display = 'none';
    document.getElementById('loginFormSection').style.display = 'block';
});


document.getElementById('registerButton').addEventListener('click', function() {
    document.getElementById('initialSection').style.display = 'none';
    document.getElementById('registerFormSection').style.display = 'block';
});


document.getElementById('backToInitial').addEventListener('click', showInitialSection);


document.getElementById('backToInitialReg').addEventListener('click', showInitialSection);


document.getElementById('userForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let user = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value.toUpperCase()
    };
    let response = await fetch(BASE_URL + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    let result = await response.json();
    if (response.status === 201) {
        document.getElementById('userResult').innerHTML = '<div class="result-box">Account Created Successfully for: ' + result.data.username + ' Email: ' + result.data.email + '</div>';
    } else {
        let errorMsg = result.message || JSON.stringify(result);
        if (errorMsg.includes('Email already exists')) {
            document.getElementById('userResult').innerHTML = '<div class="result-box error">Email already exists</div>';
        } else {
            document.getElementById('userResult').innerHTML = '<div class="result-box error">' + errorMsg + '</div>';
        }
    }
});


document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let loginRequest = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    let response = await fetch(BASE_URL + '/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginRequest)
    });
    let result = await response.json();
    if (response.status === 200) {
        currentUserId = result.data.userId;
        currentUsername = result.data.username;
        currentRole = result.data.role ? result.data.role.toUpperCase() : null;
        currentEmail = loginRequest.email;
        document.getElementById('userName').textContent = currentUsername;
        document.getElementById('userRole').textContent = currentRole;
        document.getElementById('sellerId').value = currentUserId;
        document.getElementById('bidderId').value = currentUserId;
        document.getElementById('updateUserId').value = currentUserId;
        document.getElementById('getUserId').value = currentUserId;
        document.getElementById('getEmail').value = currentEmail;
        document.getElementById('loginFormSection').style.display = 'none';
        document.getElementById('loggedInSection').style.display = 'block';
        document.getElementById('loginResult').textContent = '';
        updateViewButtons();
    } else {
        document.getElementById('loginResult').textContent = result.message || 'Login failed';
    }
});


document.getElementById('logoutButton').addEventListener('click', function() {
    currentUserId = null;
    currentUsername = null;
    currentRole = null;
    currentEmail = null;
    document.getElementById('loggedInSection').style.display = 'none';
    showInitialSection();
    clearAllResults();
});


document.getElementById('auctionForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    if (currentUserId === null) {
        document.getElementById('auctionResult').innerHTML = '<div class="result-box error">Please log in first</div>';
        return;
    }
    if (currentRole !== 'SELLER') {
        document.getElementById('auctionResult').innerHTML = '<div class="result-box error">Only sellers can create auctions</div>';
        return;
    }
    let auction = {
        title: document.getElementById('auctionTitle').value,
        description: document.getElementById('auctionDescription').value,
        startingBid: parseFloat(document.getElementById('startingBid').value),
        buyItNowPrice: parseFloat(document.getElementById('buyItNowPrice').value) || null,
        endTime: document.getElementById('endTime').value,
        sellerId: currentUserId
    };
    let endTime = new Date(auction.endTime);
    if (endTime <= new Date()) {
        document.getElementById('auctionResult').innerHTML = '<div class="result-box error">Cannot create auction with a past date. Please select a future date.</div>';
        return;
    }
    let response = await fetch(BASE_URL + '/api/auction-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auction)
    });
    let result = await response.json();
    if (result.data && result.data.title) {
        document.getElementById('auctionResult').innerHTML = '<div class="result-box">Auction "' + result.data.title + '" created</div>';
    } else {
        document.getElementById('auctionResult').innerHTML = '<div class="result-box">Auction created</div>';
    }
});


document.getElementById('bidForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    if (currentUserId === null) {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Please log in first</div>';
        return;
    }
    if (currentRole !== 'BUYER') {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Only buyers can place bids</div>';
        return;
    }
    let bid = {
        bidAmount: parseFloat(document.getElementById('bidAmount').value),
        bidderId: currentUserId,
        auctionItemId: document.getElementById('auctionItemId').value
    };
    let response = await fetch(BASE_URL + '/api/auction-items/' + bid.auctionItemId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    let auctionResult = await response.json();
    if (!auctionResult.data) {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Auction not found</div>';
        return;
    }
    let auctionEndTime = new Date(auctionResult.data.endTime);
    if (auctionEndTime <= new Date()) {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Auction has expired for item ID: ' + bid.auctionItemId + '</div>';
        return;
    }
    if (auctionResult.data.status && auctionResult.data.status.toUpperCase() === 'CLOSED') {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Auction closed for item ID: ' + bid.auctionItemId + '</div>';
        return;
    }
    let currentBid = auctionResult.data.currentBid || auctionResult.data.startingBid;
    if (bid.bidAmount < currentBid) {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Bid amount must be higher than current bid: $' + currentBid + '</div>';
        return;
    }
    let buyItNowPrice = auctionResult.data.buyItNowPrice;
    let bidResponse = await fetch(BASE_URL + '/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bid)
    });
    let bidResult = await bidResponse.json();
    if (bidResult.data && bidResult.data.bidId) {
        if (buyItNowPrice && bid.bidAmount >= buyItNowPrice) {
            await fetch(BASE_URL + '/api/auction-items/' + bid.auctionItemId + '/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            let message = 'Bid placed successfully on auction ' + bid.auctionItemId + ' for $' + bid.bidAmount + '. Auction closed due to Buy It Now price met.';
            document.getElementById('bidResult').innerHTML = '<div class="result-box">' + message + '</div>';
        } else {
            let transactionRequest = {
                auctionItemId: bid.auctionItemId,
                buyerId: currentUserId,
                finalPrice: bid.bidAmount
            };
            let transactionResponse = await fetch(BASE_URL + '/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionRequest)
            });
            let transactionResult = await transactionResponse.json();
            if (transactionResponse.status === 201) {
                let message = 'Bid placed successfully on auction ' + bid.auctionItemId + ' for $' + bid.bidAmount + '. Transaction ' + transactionResult.data.transactionId + ' created';
                document.getElementById('bidResult').innerHTML = '<div class="result-box">' + message + '</div>';
            } else {
                document.getElementById('bidResult').innerHTML = '<div class="result-box error">Bid placed, but transaction failed: ' + (transactionResult.message || 'Unknown error') + '</div>';
            }
        }
    } else {
        document.getElementById('bidResult').innerHTML = '<div class="result-box error">Bid failed: ' + (bidResult.message || 'Invalid bid') + '</div>';
    }
});


document.getElementById('updateRoleForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let newRole = document.getElementById('newRole').value.toUpperCase();
    if (newRole === currentRole) {
        document.getElementById('updateRoleResult').innerHTML = '<div class="result-box error">Cannot change role to the same role</div>';
        return;
    }
    if (newRole !== 'SELLER' && newRole !== 'BUYER') {
        document.getElementById('updateRoleResult').innerHTML = '<div class="result-box error">Role must be either SELLER or BUYER</div>';
        return;
    }
    let request = { newRole: newRole };
    let response = await fetch(BASE_URL + '/api/users/' + document.getElementById('updateUserId').value + '/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
    });
    let result = await response.json();
    if (response.status === 200) {
        currentRole = newRole;
        document.getElementById('userRole').textContent = currentRole;
        document.getElementById('updateRoleResult').innerHTML = '<div class="result-box">Role updated to ' + newRole + ' successfully</div>';
        updateViewButtons();
    } else {
        document.getElementById('updateRoleResult').innerHTML = '<div class="result-box error">' + (result.message || JSON.stringify(result)) + '</div>';
    }
});


document.getElementById('getUserByEmailForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let inputEmail = document.getElementById('getEmail').value;
    if (inputEmail !== currentEmail) {
        document.getElementById('userByEmailDetails').innerHTML = '<div class="list-item error">You can only view your own details.</div>';
        return;
    }
    let response = await fetch(BASE_URL + '/api/users/email/' + encodeURIComponent(inputEmail), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    let result = await response.json();
    let detailsDiv = document.getElementById('userByEmailDetails');
    if (response.status === 200 && result.data) {
        detailsDiv.innerHTML = '<div class="list-item">User: ' + result.data.username + ', ID: ' + result.data.userId + ', Role: ' + result.data.role + '</div>';
    } else {
        detailsDiv.innerHTML = '<div class="list-item error">Status: ' + response.status + ', ' + (result.message || 'User not found') + '</div>';
    }
});


document.getElementById('viewAuctionsButton').addEventListener('click', async function() {
    if (currentRole !== 'SELLER') return;
    try {
        let response = await fetch(BASE_URL + '/api/auction-items/seller/' + currentUserId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let result = await response.json();
        let contentDiv = document.getElementById('sellerAuctionsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Title</th><th>ID</th><th>Starting Bid</th><th>Buy It Now Price</th><th>Current Bid</th><th>End Time</th><th>Status</th></tr></thead><tbody>';
        if (result.data && result.data.length > 0) {
            for (let auction of result.data) {
                htmlContent += '<tr>';
                htmlContent += '<td>' + auction.title + '</td>';
                htmlContent += '<td>' + auction.itemId + '</td>';
                htmlContent += '<td>$' + auction.startingBid + '</td>';
                htmlContent += '<td>' + (auction.buyItNowPrice ? '$' + auction.buyItNowPrice : 'N/A') + '</td>';
                htmlContent += '<td>$' + (auction.currentBid || auction.startingBid) + '</td>';
                htmlContent += '<td>' + new Date(auction.endTime).toLocaleString() + '</td>';
                htmlContent += '<td>' + (auction.status || (new Date(auction.endTime) > new Date() ? 'Active' : 'Closed')) + '</td>';
                htmlContent += '</tr>';
            }
        } else {
            htmlContent += '<tr><td colspan="7"><div class="list-item">No data available</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent; 
        showSection('sellerAuctions');
    } catch (error) {
        document.getElementById('sellerAuctionsContent').innerHTML = '<div class="list-item error">Failed to load auctions</div>';
    }
    showForm('sellerAuctions', 'viewAuctionsButton');
});


document.getElementById('viewActiveAuctionsButton').addEventListener('click', async function() {
    if (currentRole !== 'BUYER') return;
    try {
        let response = await fetch(BASE_URL + '/api/auction-items/active', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let result = await response.json();
        let contentDiv = document.getElementById('activeAuctionsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Title</th><th>ID</th><th>Starting Bid</th><th>Buy It Now Price</th><th>Current Bid</th><th>End Time</th><th>Status</th></tr></thead><tbody>';
        if (result.data && result.data.length > 0) {
            for (let auction of result.data) {
                htmlContent += '<tr>';
                htmlContent += '<td>' + auction.title + '</td>';
                htmlContent += '<td>' + auction.itemId + '</td>';
                htmlContent += '<td>$' + auction.startingBid + '</td>';
                htmlContent += '<td>' + (auction.buyItNowPrice ? '$' + auction.buyItNowPrice : 'N/A') + '</td>';
                htmlContent += '<td>$' + (auction.currentBid || auction.startingBid) + '</td>';
                htmlContent += '<td>' + new Date(auction.endTime).toLocaleString() + '</td>';
                htmlContent += '<td>' + (auction.status || (new Date(auction.endTime) > new Date() ? 'Active' : 'Closed')) + '</td>';
                htmlContent += '</tr>';
            }
        } else {
            htmlContent += '<tr><td colspan="7"><div class="list-item">No data available</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent; 
        showSection('activeAuctions');
    } catch (error) {
        document.getElementById('activeAuctionsContent').innerHTML = '<div class="list-item error">Failed to load active auctions</div>';
    }
    showForm('activeAuctions', 'viewActiveAuctionsButton');
});


document.getElementById('viewActiveBidsButton').addEventListener('click', async function() {
    if (currentRole !== 'BUYER') return;
    try {
        let response = await fetch(BASE_URL + '/api/bids/active?bidderId=' + currentUserId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let result = await response.json();
        let contentDiv = document.getElementById('activeBidsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Auction ID</th><th>Bid Amount</th><th>Status</th><th>Placed Time</th></tr></thead><tbody>';
        if (result.data && result.data.length > 0) {
            for (let bid of result.data) {
                htmlContent += '<tr>';
                htmlContent += '<td>' + bid.auctionItemId + '</td>';
                htmlContent += '<td>$' + bid.bidAmount + '</td>';
                htmlContent += '<td>' + (bid.status || (new Date() < new Date(bid.auctionEndTime || Infinity) ? 'Active' : 'Closed')) + '</td>';
                htmlContent += '<td>' + new Date(bid.bidTime).toLocaleString() + '</td>';
                htmlContent += '</tr>';
            }
        } else {
            htmlContent += '<tr><td colspan="4"><div class="list-item">No data available</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent; 
        showSection('activeBids');
    } catch (error) {
        document.getElementById('activeBidsContent').innerHTML = '<div class="list-item error">Failed to load active bids</div>';
    }
    showForm('activeBids', 'viewActiveBidsButton');
});


document.getElementById('viewTransactionsButton').addEventListener('click', async function() {
    if (currentRole !== 'BUYER') return;
    try {
        let response = await fetch(BASE_URL + '/api/transactions/user/' + currentUserId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let result = await response.json();
        let contentDiv = document.getElementById('transactionsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let uniqueTransactions = {};
        for (let transaction of result.data) {
            if (!uniqueTransactions[transaction.auctionItemId] || new Date(uniqueTransactions[transaction.auctionItemId].transactionTime) < new Date(transaction.transactionTime)) {
                uniqueTransactions[transaction.auctionItemId] = transaction;
            }
        }
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Transaction ID</th><th>Auction ID</th><th>Title</th><th>Final Price</th><th>Transaction Time</th><th>Status</th></tr></thead><tbody>';
        let transactionsArray = Object.values(uniqueTransactions);
        if (transactionsArray.length > 0) {
            for (let transaction of transactionsArray) {
                let auctionResponse = await fetch(BASE_URL + '/api/auction-items/' + transaction.auctionItemId);
                let auctionResult = await auctionResponse.json();
                htmlContent += '<tr>';
                htmlContent += '<td>' + transaction.transactionId + '</td>';
                htmlContent += '<td>' + transaction.auctionItemId + '</td>';
                htmlContent += '<td>' + (auctionResult.data ? auctionResult.data.title : 'N/A') + '</td>';
                htmlContent += '<td>$' + transaction.finalPrice + '</td>';
                htmlContent += '<td>' + new Date(transaction.transactionTime).toLocaleString() + '</td>';
                htmlContent += '<td>' + (auctionResult.data ? auctionResult.data.status : 'N/A') + '</td>';
                htmlContent += '</tr>';
            }
        } else {
            htmlContent += '<tr><td colspan="6"><div class="list-item">No transactions found</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent; 
        showSection('transactions');
    } catch (error) {
        document.getElementById('transactionsContent').innerHTML = '<div class="list-item error">Failed to load transactions</div>';
    }
    showForm('transactions', 'viewTransactionsButton');
});


document.getElementById('viewActiveTransactionsButton').addEventListener('click', async function() {
    if (currentRole !== 'BUYER') return;
    try {
        let bidsResponse = await fetch(BASE_URL + '/api/bids/active?bidderId=' + currentUserId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let bidsResult = await bidsResponse.json();
        let contentDiv = document.getElementById('activeTransactionsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Auction ID</th><th>Title</th><th>Current Bid</th><th>End Time</th><th>Status</th></tr></thead><tbody>';
        if (bidsResult.data && bidsResult.data.length > 0) {
            for (let bid of bidsResult.data) {
                let auctionResponse = await fetch(BASE_URL + '/api/auction-items/' + bid.auctionItemId);
                let auctionResult = await auctionResponse.json();
                if (auctionResult.data) {
                    htmlContent += '<tr>';
                    htmlContent += '<td>' + bid.auctionItemId + '</td>';
                    htmlContent += '<td>' + auctionResult.data.title + '</td>';
                    htmlContent += '<td>$' + (auctionResult.data.currentBid || auctionResult.data.startingBid) + '</td>';
                    htmlContent += '<td>' + new Date(auctionResult.data.endTime).toLocaleString() + '</td>';
                    htmlContent += '<td>' + (auctionResult.data.status || (new Date(auctionResult.data.endTime) > new Date() ? 'Active' : 'Closed')) + '</td>';
                    htmlContent += '</tr>';
                }
            }
        } else {
            htmlContent += '<tr><td colspan="5"><div class="list-item">No active transactions found</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent;
        showSection('activeTransactions');
    } catch (error) {
        document.getElementById('activeTransactionsContent').innerHTML = '<div class="list-item error">Failed to load active transactions</div>';
    }
    showForm('activeTransactions', 'viewActiveTransactionsButton');
});


document.getElementById('viewSellerTransactionsButton').addEventListener('click', async function() {
    if (currentRole !== 'SELLER') return;
    try {
        let response = await fetch(BASE_URL + '/api/transactions/user/' + currentUserId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let result = await response.json();
        let contentDiv = document.getElementById('sellerTransactionsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Transaction ID</th><th>Auction ID</th><th>Title</th><th>Buyer ID</th><th>Final Price</th><th>Transaction Time</th><th>Status</th></tr></thead><tbody>';
        if (result.data && result.data.length > 0) {
            for (let transaction of result.data) {
                let auctionResponse = await fetch(BASE_URL + '/api/auction-items/' + transaction.auctionItemId);
                let auctionResult = await auctionResponse.json();
                htmlContent += '<tr>';
                htmlContent += '<td>' + transaction.transactionId + '</td>';
                htmlContent += '<td>' + transaction.auctionItemId + '</td>';
                htmlContent += '<td>' + (auctionResult.data ? auctionResult.data.title : 'N/A') + '</td>';
                htmlContent += '<td>' + transaction.buyerId + '</td>';
                htmlContent += '<td>$' + transaction.finalPrice + '</td>';
                htmlContent += '<td>' + new Date(transaction.transactionTime).toLocaleString() + '</td>';
                htmlContent += '<td>' + (auctionResult.data ? auctionResult.data.status : 'N/A') + '</td>';
                htmlContent += '</tr>';
            }
        } else {
            htmlContent += '<tr><td colspan="7"><div class="list-item">No transactions found</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent; 
        showSection('sellerTransactions');
    } catch (error) {
        document.getElementById('sellerTransactionsContent').innerHTML = '<div class="list-item error">Failed to load transactions</div>';
    }
    showForm('sellerTransactions', 'viewSellerTransactionsButton');
});


document.getElementById('viewSellerActiveTransactionsButton').addEventListener('click', async function() {
    if (currentRole !== 'SELLER') return;
    try {
        let auctionsResponse = await fetch(BASE_URL + '/api/auction-items/seller/' + currentUserId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        let auctionsResult = await auctionsResponse.json();
        let contentDiv = document.getElementById('sellerActiveTransactionsContent');
        contentDiv.innerHTML = ''; 
        clearAllResults();
        let htmlContent = '<button class="back-button" id="backToMain">Back</button>';
        htmlContent += '<table><thead><tr><th>Auction ID</th><th>Title</th><th>Buyer ID</th><th>Bid Amount</th><th>End Time</th><th>Status</th></tr></thead><tbody>';
        if (auctionsResult.data && auctionsResult.data.length > 0) {
            for (let auction of auctionsResult.data) {
                let bidsResponse = await fetch(BASE_URL + '/api/bids/auction/' + auction.itemId);
                let bidsResult = await bidsResponse.json();
                if (bidsResult.data && bidsResult.data.length > 0 && new Date(auction.endTime) > new Date()) {
                    for (let bid of bidsResult.data) {
                        htmlContent += '<tr>';
                        htmlContent += '<td>' + auction.itemId + '</td>';
                        htmlContent += '<td>' + auction.title + '</td>';
                        htmlContent += '<td>' + bid.bidderId + '</td>';
                        htmlContent += '<td>$' + bid.bidAmount + '</td>';
                        htmlContent += '<td>' + new Date(auction.endTime).toLocaleString() + '</td>';
                        htmlContent += '<td>' + (auction.status || (new Date(auction.endTime) > new Date() ? 'Active' : 'Closed')) + '</td>';
                        htmlContent += '</tr>';
                    }
                }
            }
        } else {
            htmlContent += '<tr><td colspan="6"><div class="list-item">No active transactions found</div></td></tr>';
        }
        htmlContent += '</tbody></table>';
        contentDiv.innerHTML = htmlContent; 
        showSection('sellerActiveTransactions');
    } catch (error) {
        document.getElementById('sellerActiveTransactionsContent').innerHTML = '<div class="list-item error">Failed to load active transactions</div>';
    }
    showForm('sellerActiveTransactions', 'viewSellerActiveTransactionsButton');
});


document.getElementById('createAuctionButton').addEventListener('click', function() {
    if (currentRole !== 'SELLER') return;
    showForm('auctionFormSection', 'createAuctionButton');
});


document.getElementById('placeBidButton').addEventListener('click', function() {
    if (currentRole !== 'BUYER') return;
    showForm('bidFormSection', 'placeBidButton');
});


document.getElementById('personalInfoButton').addEventListener('click', function() {
    showForm('personalInfoSection', 'personalInfoButton');
});


document.addEventListener('click', function(event) {
    if (event.target.id === 'backToMain') {
        showSection(''); 
        updateViewButtons();
        let buttons = document.getElementById('viewButtons').getElementsByClassName('action-button');
        for (let button of buttons) {
            button.classList.remove('active');
        }
    }
});


function showSection(sectionId) {
    let allSections = document.getElementsByClassName('section');
    for (let section of allSections) {
        section.style.display = 'none'; 
    }
    if (sectionId) {
        let section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block'; 
        }
    }
}


function showForm(formId, buttonId) {
    let allSections = document.getElementsByClassName('section');
    for (let section of allSections) {
        section.style.display = 'none';
    }


    let form = document.getElementById(formId);
    if (form) {
        form.style.display = 'block';
        let backButton = form.querySelector('.back-button');
        if (!backButton) {
            let backButtonHTML = '<button class="back-button" id="backToMain">Back</button>';
            form.insertAdjacentHTML('beforeend', backButtonHTML);
        }
    }


    let buttons = document.getElementById('viewButtons').getElementsByClassName('action-button');
    for (let button of buttons) {
        button.classList.remove('active');
    }


    if (buttonId) {
        let activeButton = document.getElementById(buttonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
}


function updateViewButtons() {
    let viewButtons = document.getElementById('viewButtons').getElementsByTagName('button');
    for (let button of viewButtons) {
        button.style.display = 'none';
    }
    if (currentRole === 'SELLER') {
        document.getElementById('viewAuctionsButton').style.display = 'block';
        document.getElementById('viewSellerTransactionsButton').style.display = 'block';
        document.getElementById('viewSellerActiveTransactionsButton').style.display = 'block';
        document.getElementById('createAuctionButton').style.display = 'block';
    } else if (currentRole === 'BUYER') {
        document.getElementById('viewTransactionsButton').style.display = 'block';
        document.getElementById('viewActiveTransactionsButton').style.display = 'block';
        document.getElementById('viewActiveAuctionsButton').style.display = 'block';
        document.getElementById('viewActiveBidsButton').style.display = 'block';
        document.getElementById('placeBidButton').style.display = 'block';
    }
    document.getElementById('personalInfoButton').style.display = 'block';
}


function clearAllResults() {
    document.getElementById('loginResult').textContent = '';
    document.getElementById('userResult').textContent = '';
    document.getElementById('auctionResult').innerHTML = '';
    document.getElementById('bidResult').innerHTML = '';
    document.getElementById('updateRoleResult').innerHTML = '';
    document.getElementById('userByEmailDetails').innerHTML = '';
    document.getElementById('sellerAuctionsContent').innerHTML = '';
    document.getElementById('activeAuctionsContent').innerHTML = '';
    document.getElementById('activeBidsContent').innerHTML = '';
    document.getElementById('transactionsContent').innerHTML = '';
    document.getElementById('activeTransactionsContent').innerHTML = '';
    document.getElementById('sellerTransactionsContent').innerHTML = '';
    document.getElementById('sellerActiveTransactionsContent').innerHTML = '';
}