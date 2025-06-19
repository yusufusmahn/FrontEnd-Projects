const BASE_URL = 'http://localhost:1010';
let currentUser = null;

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }
}

function showRegister() {
    try {
        document.getElementById('register-section').classList.remove('hidden');
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('expense-section').classList.add('hidden');
    } catch (error) {
        showMessage('Error displaying register section', 'error');
    }
}

function showLogin() {
    try {
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('expense-section').classList.add('hidden');
    } catch (error) {
        showMessage('Error displaying login section', 'error');
    }
}

function showExpenseSection() {
    try {
        const registerSection = document.getElementById('register-section');
        const loginSection = document.getElementById('login-section');
        const expenseSection = document.getElementById('expense-section');
        const userNameSpan = document.getElementById('user-name');
        if (!expenseSection) {
            showMessage('Error loading expense section', 'error');
            return;
        }
        if (!userNameSpan) {
            showMessage('User name element not found', 'error');
        }
        registerSection.classList.add('hidden');
        loginSection.classList.add('hidden');
        expenseSection.classList.remove('hidden');
        userNameSpan.textContent = currentUser?.username || 'User';
    } catch (error) {
        showMessage('Error displaying expense section', 'error');
    }
}

function toggleAddExpenseForm() {
    const formContainer = document.getElementById('add-expense-form-container');
    if (formContainer) {
        const isHidden = formContainer.classList.contains('hidden');
        formContainer.classList.toggle('hidden');
        const button = document.querySelector('button[onclick="toggleAddExpenseForm()"]');
        if (button) {
            button.textContent = isHidden ? 'Hide Add Expense Form' : 'Show Add Expense Form';
        }
    } else {
        showMessage('Add expense form not found', 'error');
    }
}

function cancelUpdate() {
    try {
        const updateFormContainer = document.getElementById('update-expense-form-container');
        if (updateFormContainer) {
            updateFormContainer.classList.add('hidden');
            document.getElementById('update-expense-form').reset();
        }
    } catch (error) {
        showMessage('Error cancelling update', 'error');
    }
}

function logout() {
    currentUser = null;
    showRegister();
    showMessage('Logged out successfully', 'success');
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const requestBody = { username, email, password };
    try {
        const response = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        const result = await response.json();
        if (result.success) {
            showMessage('Registration successful! Please login.', 'success');
            showLogin();
        } else {
            showMessage(result.data || 'Failed to register user', 'error');
        }
    } catch (error) {
        showMessage(`Error registering user: ${error.message}`, 'error');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const loginResponse = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginResult = await loginResponse.json();
        if (!loginResult.success) {
            showMessage(loginResult.data || 'Login failed', 'error');
            return;
        }
        const userResponse = await fetch(`${BASE_URL}/users/${email}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const userResult = await userResponse.json();
        if (userResult.success) {
            currentUser = {
                email,
                userId: userResult.data.id || 'unknown',
                username: userResult.data.username || 'User'
            };
            showExpenseSection();
            showMessage('Login successful!', 'success');
        } else {
            showMessage(userResult.data || 'Failed to fetch user data', 'error');
        }
    } catch (error) {
        showMessage(`Error logging in: ${error.message}`, 'error');
    }
});

document.getElementById('add-expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value + ':00';
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;
    try {
        const response = await fetch(`${BASE_URL}/users/${currentUser.email}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, date, category, description })
        });
        const result = await response.json();
        if (result.success) {
            showMessage('Expense added successfully!', 'success');
            document.getElementById('add-expense-form').reset();
            toggleAddExpenseForm();
        } else {
            showMessage(result.data || 'Failed to add expense', 'error');
        }
    } catch (error) {
        showMessage('Error adding expense', 'error');
    }
});
