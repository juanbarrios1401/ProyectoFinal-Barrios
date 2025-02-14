document.addEventListener('DOMContentLoaded', () => {
    // sirve para crear el contenido principal
    const app = document.getElementById('aplicacion');
    if (!app) {
        console.error('Elemento con id "app" no encontrado en el DOM.');
        return;
    }
   
    const container = document.createElement('div');
    container.classList.add('container');

    // Historial de connversiones
    const historyContainer = document.createElement('div');
    historyContainer.classList.add('history-container');
    const historyTitle = document.createElement('h2');
    historyTitle.textContent = 'Últimas 5 conversiones';
    historyContainer.appendChild(historyTitle);
    const historyList = document.createElement('ul');
    historyList.setAttribute('id', 'historyList');
    historyContainer.appendChild(historyList);

    // Boton que vacia el LocalStorage de las ultimas 5 conversiones
    const clearHistoryButton = document.createElement('button');
    clearHistoryButton.textContent = 'Limpiar historial';
    clearHistoryButton.setAttribute('id', 'clearHistoryButton');
    clearHistoryButton.classList.add('clear-history-button');
    historyContainer.appendChild(clearHistoryButton);

    app.appendChild(historyContainer);

    // Titulo del convertidor
    const title = document.createElement('h1');
    title.textContent = 'Convertidor de Monedas';
    container.appendChild(title);

    // Formulario
    const converter = document.createElement('div');
    converter.classList.add('converter');
    
    // Inputs
    const amountLabel = document.createElement('label');
    amountLabel.setAttribute('for', 'amount');
    amountLabel.textContent = 'Cantidad:';
    const amountInput = document.createElement('input');
    amountInput.setAttribute('type', 'number');
    amountInput.setAttribute('id', 'amount');
    amountInput.setAttribute('placeholder', 'Ingrese monto a convertir');
    
    // Select con los distintos tipos de monedas (ARG - USD - EUR)
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
    
    // Select para el tipo de moneda de cambio
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
    
    // Boton de conversion
    const convertButton = document.createElement('button');
    convertButton.textContent = 'Convertir';
    convertButton.setAttribute('id', 'convertButton');
    
    // Agrega elementos al formulario
    converter.appendChild(amountLabel);
    converter.appendChild(amountInput);
    converter.appendChild(fromLabel);
    converter.appendChild(fromSelect);
    converter.appendChild(toLabel);
    converter.appendChild(toSelect);
    converter.appendChild(convertButton);
    
    // Al formulario lo agrega al contenedor principal
    container.appendChild(converter);
    app.appendChild(container);

    let exchangeRates = null;
    
    //carga el archivo Json con los valores pre-establecidos
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

    // Carga el historial
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        historyList.innerHTML = ''; // vacia la lista
        history.forEach(item => {
            const listItem = document.createElement('li');
            const currencyIcon = document.createElement('img');
            currencyIcon.style.width = '20px';
            currencyIcon.style.height = '20px';
            currencyIcon.style.marginRight = '5px';

            // agrega imagen según la moneda
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
            listItem.appendChild(document.createTextNode(`${item.amount} ${item.from} a ${item.to}: ${item.convertedAmount}`));
            historyList.appendChild(listItem);
        });
    }

    // Función para guardar en LocalStorage
    function saveToHistory(amount, from, to, convertedAmount) {
        let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
        const today = new Date().toISOString().split('T')[0];

        // certifica que las conversiones sean del dia actual
        history = history.filter(item => item.date === today);

        // agrega nueva conversion
        history.push({ amount, from, to, convertedAmount, date: today });

        // mantiene solo las últimas 5 conversiones
        if (history.length > 5) {
            history.shift();
        }

        localStorage.setItem('conversionHistory', JSON.stringify(history));
        loadHistory();
    }

    // Realizar la conversion
    function convertCurrency() {
        const amount = parseFloat(amountInput.value);
        const fromCurrency = fromSelect.value;
        const toCurrency = toSelect.value;
        
        if (isNaN(amount) || amount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Monto inválido',
                text: 'Por favor ingrese un monto válido.'
            });
            return;
        }

        if (fromCurrency === toCurrency) {
            Swal.fire({
                icon: 'warning',
                title: 'Monedas iguales',
                text: 'Las monedas seleccionadas son iguales.'
            });
            return;
        }

        if (!exchangeRates) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las tasas de conversión aún no están disponibles.'
            });
            return;
        }

        if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][toCurrency]) {
            const conversionRate = exchangeRates[fromCurrency][toCurrency];
            const convertedAmount = amount * conversionRate;
            Swal.fire({
                icon: 'success',
                title: 'Conversión exitosa',
                text: `Resultado: ${convertedAmount.toFixed(2)} ${toCurrency}`
            });
            saveToHistory(amount, fromCurrency, toCurrency, convertedAmount.toFixed(2));
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo realizar la conversión. Intente más tarde.'
            });
        }
    }

    // Limpiar historial
    clearHistoryButton.addEventListener('click', () => {
        localStorage.removeItem('conversionHistory');
        loadHistory();
        Swal.fire({
            icon: 'info',
            title: 'Historial eliminado',
            text: 'El historial de conversiones se ha eliminado correctamente.'
        });
    });

    convertButton.addEventListener('click', convertCurrency);

    // Cargar historial al cargar la página
    loadHistory();
});
