document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('aplicacion');
    if (!app) {
        console.error('Elemento con id "app" no encontrado en el DOM.');
        return;
    }

    const container = document.createElement('div');
    container.classList.add('container');

    const historyContainer = document.createElement('div');
    historyContainer.classList.add('history-container');
    const historyTitle = document.createElement('h2');
    historyTitle.textContent = 'Últimas 5 conversiones';
    historyContainer.appendChild(historyTitle);
    const historyList = document.createElement('ul');
    historyList.setAttribute('id', 'historyList');
    historyContainer.appendChild(historyList);

    const clearHistoryButton = document.createElement('button');
    clearHistoryButton.textContent = 'Limpiar historial';
    clearHistoryButton.setAttribute('id', 'clearHistoryButton');
    clearHistoryButton.classList.add('clear-history-button');
    historyContainer.appendChild(clearHistoryButton);
    app.appendChild(historyContainer);

    const title = document.createElement('h1');
    title.textContent = 'Convertidor de Monedas';
    container.appendChild(title);

    const converter = document.createElement('div');
    converter.classList.add('converter');

    const amountLabel = document.createElement('label');
    amountLabel.setAttribute('for', 'amount');
    amountLabel.textContent = 'Cantidad:';
    const amountInput = document.createElement('input');
    amountInput.setAttribute('type', 'number');
    amountInput.setAttribute('id', 'amount');
    amountInput.setAttribute('placeholder', 'Ingrese monto a convertir');

    const fromLabel = document.createElement('label');
    fromLabel.setAttribute('for', 'from');
    fromLabel.textContent = 'De:';
    const fromSelect = document.createElement('select');
    fromSelect.setAttribute('id', 'from');
    const currencyOptions = ['ARS', 'USD', 'EUR'];
    currencyOptions.forEach(optionValue => {
        const option = document.createElement('option');
        option.setAttribute('value', optionValue);
        option.textContent = optionValue;
        fromSelect.appendChild(option);
    });

    const toLabel = document.createElement('label');
    toLabel.setAttribute('for', 'to');
    toLabel.textContent = 'A:';
    const toSelect = document.createElement('select');
    toSelect.setAttribute('id', 'to');
    currencyOptions.forEach(optionValue => {
        const option = document.createElement('option');
        option.setAttribute('value', optionValue);
        option.textContent = optionValue;
        toSelect.appendChild(option);
    });

    const convertButton = document.createElement('button');
    convertButton.textContent = 'Convertir';
    convertButton.setAttribute('id', 'convertButton');

    converter.appendChild(amountLabel);
    converter.appendChild(amountInput);
    converter.appendChild(fromLabel);
    converter.appendChild(fromSelect);
    converter.appendChild(toLabel);
    converter.appendChild(toSelect);
    converter.appendChild(convertButton);
    container.appendChild(converter);
    app.appendChild(container);

    let exchangeRates = null;
    fetch('./Json/valores.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar las tasas de cambio');
            }
            return response.json();
        })
        .then(data => {
            exchangeRates = data;
        })
        .catch(error => {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las tasas de cambio. Intente más tarde.'
            });
        });

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        historyList.innerHTML = '';
        history.forEach(item => {
            const listItem = document.createElement('li');
            const currencyIcon = document.createElement('img');
            currencyIcon.style.width = '20px';
            currencyIcon.style.height = '20px';
            currencyIcon.style.marginRight = '5px';
            switch (item.to) {
                case 'USD':
                    currencyIcon.src = 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg';
                    break;
                case 'ARS':
                    currencyIcon.src = 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg';
                    break;
                case 'EUR':
                    currencyIcon.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
                    break;
            }
            listItem.appendChild(currencyIcon);
            const formattedAmount = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(item.amount);
            const formattedConvertedAmount = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(item.convertedAmount);
            listItem.appendChild(document.createTextNode(`${formattedAmount} ${item.from} a ${item.to}: ${formattedConvertedAmount}`));
            historyList.appendChild(listItem);
        });
    }

    function saveToHistory(amount, from, to, convertedAmount) {
        let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        const today = new Date().toISOString().split('T')[0];
        history = history.filter(item => item.date === today);
        history.push({ amount: Number(amount), from, to, convertedAmount: Number(convertedAmount), date: today });
        if (history.length > 5) {
            history.shift();
        }
        localStorage.setItem('conversionHistory', JSON.stringify(history));
        loadHistory();
    }

    function convertCurrency() {
        const amount = parseFloat(amountInput.value);
        const fromCurrency = fromSelect.value;
        const toCurrency = toSelect.value;
        if (isNaN(amount) || amount <= 0) {
            Swal.fire({ icon: 'warning', title: 'Monto inválido', text: 'Por favor ingrese un monto válido.' });
            return;
        }
        if (fromCurrency === toCurrency) {
            Swal.fire({ icon: 'warning', title: 'Monedas iguales', text: 'Las monedas seleccionadas son iguales.' });
            return;
        }
        if (!exchangeRates) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Las tasas de conversión aún no están disponibles.' });
            return;
        }
        if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][toCurrency]) {
            const conversionRate = exchangeRates[fromCurrency][toCurrency];
            const convertedAmount = amount * conversionRate;
            const formattedConvertedAmount = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(convertedAmount);
            Swal.fire({ icon: 'success', title: 'Conversión exitosa', text: `Resultado: ${formattedConvertedAmount} ${toCurrency}` });
            saveToHistory(amount, fromCurrency, toCurrency, convertedAmount);
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo realizar la conversión. Intente más tarde.' });
        }
    }

    clearHistoryButton.addEventListener('click', () => {
        localStorage.removeItem('conversionHistory');
        loadHistory();
        Swal.fire({ icon: 'info', title: 'Historial eliminado', text: 'El historial de conversiones se ha eliminado correctamente.' });
    });

    convertButton.addEventListener('click', convertCurrency);
    loadHistory();
});
