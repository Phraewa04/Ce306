let transactions = [];
let idCounter = 1;

const form = document.getElementById('transactionForm');
const searchInput = document.getElementById('searchInput');
const transactionList = document.getElementById('transactionList');
const clearBtn = document.getElementById('clearBtn');

function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    document.getElementById('totalIncome').innerText = income.toFixed(1);
    document.getElementById('totalExpense').innerText = expense.toFixed(1);
    document.getElementById('netBalance').innerText = balance.toFixed(1);
}

function renderTransactions(filterText = '') {
    transactionList.innerHTML = '';

    const filtered = transactions.filter(t => 
        t.title.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        transactionList.innerHTML = '<li class="empty-state">ไม่มีข้อมูลรายการ</li>';
        return;
    }

    filtered.forEach(item => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        const isIncome = item.type === 'income';
        const amountSign = isIncome ? '+' : '-';
        const typeClass = isIncome ? 'income' : 'expense';
        const typeLabel = isIncome ? 'รายรับ' : 'รายจ่าย';

        li.innerHTML = `
            <div class="item-info">
                <span class="item-id">#${item.id}</span>
                <span class="badge ${typeClass}">${typeLabel}</span>
                <span class="item-title">${item.title}</span>
                <span class="item-category">(${item.category})</span>
            </div>
            <div class="item-amount ${typeClass}">
                ${amountSign}฿${item.amount.toFixed(1)}
            </div>
        `;
        transactionList.appendChild(li);
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    const newTransaction = {
        id: idCounter++,
        title,
        amount,
        type,
        category
    };

    transactions.push(newTransaction);
    form.reset();
    renderTransactions(searchInput.value);
    updateSummary();
});

searchInput.addEventListener('input', (e) => {
    renderTransactions(e.target.value);
});

clearBtn.addEventListener('click', () => {
    if (transactions.length === 0) return;

    const isConfirmed = confirm('คุณต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?');
    if (isConfirmed) {
        transactions = [];
        idCounter = 1;
        renderTransactions();
        updateSummary();
    }
});

renderTransactions();