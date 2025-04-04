// Global variables
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let currentCustomer = null;

// Entry Page
if (document.getElementById('customerForm')) {
    // Set today's date
    const today = new Date();
    document.getElementById('todayDate').value = today.toLocaleDateString();
    
    // Form submission
    document.getElementById('customerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        currentCustomer = {
            entityName: document.getElementById('entityName').value,
            date: document.getElementById('todayDate').value,
            name: document.getElementById('customerName').value,
            number: document.getElementById('phoneNumber').value,
            address: document.getElementById('address').value,
            services: [],
            total: 0
        };
        
        // Store in session to pass to next page
        sessionStorage.setItem('currentCustomer', JSON.stringify(currentCustomer));
        
        // Redirect to details page
        window.location.href = 'details.html';
    });
}

// Details Page
if (document.getElementById('displayName')) {
    // Get customer from session
    currentCustomer = JSON.parse(sessionStorage.getItem('currentCustomer'));
    
    if (currentCustomer) {
        // Display customer info
        document.getElementById('displayName').textContent = currentCustomer.name;
        document.getElementById('displayNumber').textContent = currentCustomer.number;
        document.getElementById('displayAddress').textContent = currentCustomer.address;
        
        // Calculate total button
        document.getElementById('calculateBtn').addEventListener('click', calculateTotal);
        
        // Save customer button
        document.getElementById('saveCustomerBtn').addEventListener('click', saveCustomer);
        
        // Print button
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
        
        // Save as PDF button
        document.getElementById('saveBtn').addEventListener('click', function() {
            alert('PDF would be generated in a real application');
        });
    } else {
        alert('No customer data found. Please start from the entry page.');
        window.location.href = 'index.html';
    }
}

function calculateTotal() {
    const serviceInputs = document.querySelectorAll('.service-name');
    const chargeInputs = document.querySelectorAll('.service-charge');
    let grandTotal = 0;
    
    currentCustomer.services = [];
    
    for (let i = 0; i < serviceInputs.length; i++) {
        const serviceName = serviceInputs[i].value;
        const charge = parseFloat(chargeInputs[i].value) || 0;
        
        if (serviceName && charge > 0) {
            currentCustomer.services.push({
                name: serviceName,
                charge: charge
            });
            grandTotal += charge;
        }
    }
    
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const finalTotal = grandTotal - discount;
    
    document.getElementById('grandTotal').value = grandTotal.toFixed(2);
    document.getElementById('finalTotal').value = finalTotal.toFixed(2);
    
    currentCustomer.total = finalTotal;
    currentCustomer.grandTotal = grandTotal;
    currentCustomer.discount = discount;
}

function saveCustomer() {
    if (!currentCustomer.total) {
        alert('Please calculate the total first.');
        return;
    }
    
    // Add to customers array
    currentCustomer.id = customers.length + 1;
    customers.push(currentCustomer);
    
    // Save to local storage
    localStorage.setItem('customers', JSON.stringify(customers));
    
    alert('Customer data saved successfully!');
    window.location.href = 'index.html';
}

// Income Summary Page
if (document.getElementById('incomeChart')) {
    // Initialize chart
    const ctx = document.getElementById('incomeChart').getContext('2d');
    let incomeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Income',
                data: [],
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Load data
    loadIncomeData('daily');
    
    // Filter button
    document.getElementById('applyFilter').addEventListener('click', function() {
        const filter = document.getElementById('timeFilter').value;
        loadIncomeData(filter);
    });
    
    // Export CSV button
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
}

function loadIncomeData(timeFrame) {
    const reportBody = document.getElementById('reportBody');
    reportBody.innerHTML = '';
    
    if (customers.length === 0) {
        alert('No customer data available.');
        return;
    }
    
    // Group data by time frame
    let groupedData = {};
    let labels = [];
    let data = [];
    
    customers.forEach(customer => {
        const date = new Date(customer.date);
        let key;
        
        switch (timeFrame) {
            case 'daily':
                key = customer.date;
                break;
            case 'monthly':
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                break;
            case 'yearly':
                key = date.getFullYear();
                break;
        }
        
        if (!groupedData[key]) {
            groupedData[key] = 0;
            labels.push(key);
        }
        
        groupedData[key] += customer.total;
        
        // Add to report table
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.date}</td>
            <td>${customer.name}</td>
            <td>₹${customer.total.toFixed(2)}</td>
        `;
        reportBody.appendChild(row);
    });
    
    // Sort labels
    labels.sort();
    
    // Prepare data for chart
    labels.forEach(label => {
        data.push(groupedData[label]);
    });
    
    // Update chart
    const chart = Chart.getChart('incomeChart');
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

function exportToCSV() {
    if (customers.length === 0) {
        alert('No data to export.');
        return;
    }
    
    let csv = 'Date,Customer Name,Amount\n';
    
    customers.forEach(customer => {
        csv += `"${customer.date}","${customer.name}",${customer.total}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'income_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Database Page
if (document.getElementById('customerTable')) {
    displayCustomers();
    
    // Search button
    document.getElementById('searchBtn').addEventListener('click', searchCustomers);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        displayCustomers();
    });
}

function displayCustomers(filteredCustomers = null) {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = '';
    
    const customersToDisplay = filteredCustomers || customers;
    
    if (customersToDisplay.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No customer data available.</td>';
        customerTableBody.appendChild(row);
        return;
    }
    
    customersToDisplay.forEach((customer, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.name}</td>
            <td>${customer.number}</td>
            <td>${customer.address}</td>
            <td>${customer.date}</td>
            <td>
                <button class="btn small" onclick="editCustomer(${index})">Edit</button>
                <button class="btn small" onclick="deleteCustomer(${index})">Delete</button>
            </td>
        `;
        customerTableBody.appendChild(row);
    });
}

function searchCustomers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayCustomers();
        return;
    }
    
    const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.number.includes(searchTerm) ||
        customer.date.includes(searchTerm)
    );
    
    displayCustomers(filtered);
}

function editCustomer(index) {
    alert('Edit functionality would open the customer details in edit mode in a real implementation.');
}

function deleteCustomer(index) {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers.splice(index, 1);
        localStorage.setItem('customers', JSON.stringify(customers));
        displayCustomers();
    }
}
