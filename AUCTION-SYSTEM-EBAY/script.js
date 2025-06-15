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
    