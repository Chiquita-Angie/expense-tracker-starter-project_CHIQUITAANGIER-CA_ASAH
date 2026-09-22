/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */

let transactions = [];
const RENDER_EVENT = 'transaction:updated';
const STORAGE_KEY = 'EXPENSE_TRACKER_DATA';
let isEditMode = false;
let editingId = null;

function generateId() {
  return +new Date();
}

function generateTransactionObject(id, title, amount, date, type) {
  return { id, title, amount: Number(amount), date, type };
}

function isStorageExist() {
  if (typeof (Storage) === 'undefined') {
    alert('Browser kamu nggak dukung local storage!');
    return false;
  }
  return true;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, parsed);
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const transaction of data) {
      transactions.push(transaction);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

// Elemen ID di HTML 
const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');
const transactionForm = document.getElementById('transactionForm');
const searchForm = document.getElementById('searchTransactionForm');
const searchInput = document.getElementById('searchTransactionFormTitleInput');

function makeTransactionElement(transaction) {
  const { id, title, amount, date, type } = transaction;

  const container = document.createElement('div');
  container.setAttribute('data-testid', 'transactionItem');
  
  // (Opsional) Tambah class untuk styling
  container.classList.add('transaction-card'); 

  const titleElement = document.createElement('h3');
  titleElement.setAttribute('data-testid', 'transactionItemTitle');
  titleElement.innerText = title;

  const amountElement = document.createElement('p');
  amountElement.setAttribute('data-testid', 'transactionItemAmount');
  amountElement.innerText = `Nominal: Rp${amount}`;

  const dateElement = document.createElement('p');
  dateElement.setAttribute('data-testid', 'transactionItemDate');
  dateElement.innerText = `Tanggal: ${date}`;

  const typeElement = document.createElement('p');
  typeElement.setAttribute('data-testid', 'transactionItemType');
  typeElement.innerText = `Tipe: ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

  const btnContainer = document.createElement('div');

  const editTypeBtn = document.createElement('button');
  editTypeBtn.setAttribute('data-testid', 'transactionItemEditTypeButton');
  editTypeBtn.innerText = 'Ubah Tipe';
  editTypeBtn.addEventListener('click', function () {
    transaction.type = transaction.type === 'income' ? 'expense' : 'income';
    saveData();
    document.dispatchEvent(new Event(RENDER_EVENT));
  });

  const editDataBtn = document.createElement('button');
  editDataBtn.innerText = 'Edit Data';
  editDataBtn.addEventListener('click', function () {
    document.getElementById('transactionFormTitleInput').value = transaction.title;
    document.getElementById('transactionFormAmountInput').value = transaction.amount;
    document.getElementById('transactionFormDateInput').value = transaction.date;
    document.getElementById('transactionFormTypeSelect').value = transaction.type;
    
    isEditMode = true;
    editingId = transaction.id;
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteBtn.innerText = 'Hapus';
  deleteBtn.addEventListener('click', function () {
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      transactions.splice(index, 1);
      saveData();
      document.dispatchEvent(new Event(RENDER_EVENT));
    }
  });

  btnContainer.append(editTypeBtn, editDataBtn, deleteBtn);
  container.append(titleElement, amountElement, dateElement, typeElement, btnContainer);

  return container;
}

function updateDashboard() {
  // Di HTML kamu, Dasbor pakai CLASS, bukan ID. Jadi kita pakai querySelector
  const totalBalanceElement = document.querySelector('.tracker-summary__balance-amount');
  const totalIncomeElement = document.querySelector('.tracker-summary__stat-amount--income'); 
  const totalExpenseElement = document.querySelector('.tracker-summary__stat-amount--expense');

  let totalIncome = 0;
  let totalExpense = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }
  }

  const totalBalance = totalIncome - totalExpense;

  if (totalIncomeElement) totalIncomeElement.innerText = `Rp ${totalIncome}`;
  if (totalExpenseElement) totalExpenseElement.innerText = `Rp ${totalExpense}`;
  if (totalBalanceElement) totalBalanceElement.innerText = `Rp ${totalBalance}`;
}

function renderTransactions(filterText = '') {
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  for (const transaction of transactions) {
    if (transaction.title.toLowerCase().includes(filterText.toLowerCase())) {
      const transactionElement = makeTransactionElement(transaction);
      if (transaction.type === 'income') {
        incomeList.append(transactionElement);
      } else {
        expenseList.append(transactionElement);
      }
    }
  }
}

document.addEventListener(RENDER_EVENT, function () {
  const currentSearchTerm = searchInput ? searchInput.value : '';
  renderTransactions(currentSearchTerm);
  updateDashboard(); 
});

transactionForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const titleInput = document.getElementById('transactionFormTitleInput').value; 
  const amountInput = document.getElementById('transactionFormAmountInput').value;
  const dateInput = document.getElementById('transactionFormDateInput').value;
  const typeInput = document.getElementById('transactionFormTypeSelect').value;

  if (titleInput.trim() === '') {
    alert('Judul transaksi tidak boleh kosong!');
    return;
  }
  if (Number(amountInput) < 1) {
    alert('Nominal uang minimal 1 rupiah!');
    return;
  }

  if (isEditMode) {
    const index = transactions.findIndex(t => t.id === editingId);
    if (index !== -1) {
      transactions[index] = generateTransactionObject(editingId, titleInput, amountInput, dateInput, typeInput);
    }
    isEditMode = false;
    editingId = null;
  } else {
    const newTransaction = generateTransactionObject(generateId(), titleInput, amountInput, dateInput, typeInput);
    transactions.push(newTransaction);
  }

  saveData();
  document.dispatchEvent(new Event(RENDER_EVENT));
  transactionForm.reset(); 
});

// Fitur Pencarian
if (searchForm) {
  searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    renderTransactions(searchInput.value);
  });
  
  // Realtime searching pas lagi ngetik
  searchInput.addEventListener('input', function (event) {
    renderTransactions(event.target.value);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (isStorageExist()) {
    loadDataFromStorage();
  }
});