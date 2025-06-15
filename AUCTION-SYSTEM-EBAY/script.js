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

// user registration
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

//login
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

//logout
document.getElementById('logoutButton').addEventListener('click', function() {
    currentUserId = null;
    currentUsername = null;
    currentRole = null;
    currentEmail = null;
    document.getElementById('loggedInSection').style.display = 'none';
    showInitialSection();
    clearAllResults();
});

//auction creation
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

// bid placement
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

// role update
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
