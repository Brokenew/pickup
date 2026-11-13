document.addEventListener('DOMContentLoaded', () => {
    
    /* ========================================================
       1. EL LABORATORIO: LÓGICA DE TOPES Y REPARTO
       ======================================================== */
    
    let state = {
        cafe: 25,
        leche: 50,
        jarabe: 10,
        tapioca: 10,
        azucar: 5
    };

    const limits = {
        cafe: { min: 0, max: 40 },
        leche: { min: 0, max: 80 },
        jarabe: { min: 0, max: 20 },
        tapioca: { min: 0, max: 15 },
        azucar: { min: 0, max: 10 }
    };

    const sliders = document.querySelectorAll('.pro-slider:not(.ice-slider)');
    
    function updatePercentages(changedId, newValue) {
        newValue = Math.max(limits[changedId].min, Math.min(newValue, limits[changedId].max));
        state[changedId] = newValue;

        let remainingToFill = 100 - newValue;
        let others = Object.keys(state).filter(id => id !== changedId);

        let needsRedistribution = true;
        
        while (needsRedistribution && others.length > 0) {
            let othersCurrentSum = others.reduce((sum, id) => sum + state[id], 0);
            let excess = 0;
            let nextOthers = [];

            if (othersCurrentSum === 0) {
                let split = remainingToFill / others.length;
                others.forEach(id => {
                    if (split > limits[id].max) {
                        state[id] = limits[id].max;
                        excess += (split - limits[id].max);
                    } else {
                        state[id] = split;
                        nextOthers.push(id);
                    }
                });
            } else {
                others.forEach(id => {
                    let portion = (state[id] / othersCurrentSum) * remainingToFill;
                    if (portion > limits[id].max) {
                        state[id] = limits[id].max;
                        excess += (portion - limits[id].max);
                    } else {
                        state[id] = portion;
                        nextOthers.push(id);
                    }
                });
            }

            if (excess > 0.01 && nextOthers.length > 0) {
                remainingToFill = excess;
                others = nextOthers;
            } else {
                needsRedistribution = false;
            }
        }
        
        updateUI();
    }

    function updateUI() {
        let currentPrice = 50.00;
        
        const milkType = document.getElementById('tipo-leche').value;
        const syrupType = document.getElementById('tipo-jarabe').value;
        
        if (milkType === 'Deslactosada') currentPrice += 5;
        if (milkType === 'Almendra' || milkType === 'Avena') currentPrice += 12;
        
        if (syrupType === 'Vainilla' || syrupType === 'Caramelo') currentPrice += 10;
        if (syrupType === 'Matcha' || syrupType === 'Taro' || syrupType === 'Pumpkin') currentPrice += 15;

        Object.keys(state).forEach(id => {
            const displayValue = Math.round(state[id]); 
            
            document.getElementById(`val-${id}`).textContent = `${displayValue}%`;
            
            const slider = document.getElementById(`slider-${id}`);
            if (slider) slider.value = displayValue;

            const liquid = document.getElementById(`liq-${id}`);
            if (liquid) liquid.style.height = `${displayValue}%`;

            if (id === 'tapioca' && displayValue > 5) currentPrice += (displayValue - 5) * 1.5;
        });

        document.getElementById('dynamic-price').textContent = `$${currentPrice.toFixed(2)}`;
        document.getElementById('add-custom-to-cart').dataset.price = currentPrice.toFixed(2);
    }

    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => updatePercentages(e.target.dataset.id, parseFloat(e.target.value)));
    });

    document.getElementById('tipo-leche').addEventListener('change', updateUI);
    
    document.getElementById('tipo-jarabe').addEventListener('change', (e) => {
        const flavor = e.target.value;
        const liqJarabe = document.getElementById('liq-jarabe');
        
        liqJarabe.className = 'liquid liq-jarabe';
        
        if(flavor === 'Vainilla') liqJarabe.classList.add('liq-jarabe-vainilla');
        else if(flavor === 'Matcha') liqJarabe.classList.add('liq-jarabe-matcha');
        else if(flavor === 'Taro') liqJarabe.classList.add('liq-jarabe-taro');
        else if(flavor === 'Caramelo') liqJarabe.classList.add('liq-jarabe-caramelo');
        else if(flavor === 'Pumpkin') liqJarabe.classList.add('liq-jarabe-pumpkin');
        
        updateUI();
    });

    const tempRadios = document.querySelectorAll('input[name="temperatura"]');
    const iceControl = document.getElementById('ice-control');
    const iceSlider = document.getElementById('slider-hielo');
    const valHielo = document.getElementById('val-hielo');
    const iceLevels = ["Poco", "Normal", "Mucho"];

    tempRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'Fría') {
                iceControl.style.display = 'block';
                iceControl.style.opacity = '0';
                setTimeout(() => iceControl.style.opacity = '1', 50);
            } else {
                iceControl.style.display = 'none';
            }
        });
    });

    iceSlider.addEventListener('input', (e) => {
        valHielo.textContent = iceLevels[e.target.value];
    });

    updateUI();


    /* ========================================================
       2. EL CARRITO Y EL FLUJO DE PAGO
       ======================================================== */
    
    let cart = [];
    const cartModal = document.getElementById('cart-modal');
    
    document.getElementById('cart-open-btn').addEventListener('click', () => {
        cartModal.classList.add('active');
        goToStep(1);
    });
    
    document.querySelectorAll('.cart-close-btn').forEach(btn => {
        btn.addEventListener('click', () => cartModal.classList.remove('active'));
    });

    function renderCart() {
        const container = document.getElementById('cart-items-container');
        container.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío. ¡Elige del menú o arma tu bebida!</p>';
            document.getElementById('btn-to-step-2').style.display = 'none';
        } else {
            document.getElementById('btn-to-step-2').style.display = 'block';
            cart.forEach((item, index) => {
                total += item.price;
                container.innerHTML += `
                    <div class="cart-item">
                        <div>
                            <h4 style="margin:0;">${item.name}</h4>
                            <p style="margin:0; font-size:0.85rem; font-weight:bold; color:var(--color-primary);">$${item.price.toFixed(2)}</p>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${index})">X</button>
                    </div>`;
            });
        }
        document.getElementById('cart-counter').textContent = cart.length;
        document.getElementById('cart-total-price').textContent = `$${total.toFixed(2)}`;
    }

    window.removeItem = function(index) {
        cart.splice(index, 1);
        renderCart();
    }

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cart.push({ name: e.target.dataset.name, price: parseFloat(e.target.dataset.price) });
            renderCart();
            e.target.textContent = '¡Añadido!';
            setTimeout(() => e.target.textContent = 'Agregar', 1000);
        });
    });

    document.getElementById('add-custom-to-cart').addEventListener('click', (e) => {
        const price = parseFloat(e.target.dataset.price);
        const tempSelected = document.querySelector('input[name="temperatura"]:checked').value;
        const customName = `Fórmula Custom (${tempSelected}, ${Math.round(state.cafe)}% Café)`;
        
        cart.push({ name: customName, price: price });
        renderCart();
        
        const btn = e.target;
        btn.textContent = '¡Receta en carrito!';
        btn.style.background = 'var(--color-primary)';
        btn.style.color = '#fff';
        setTimeout(() => {
            btn.textContent = 'Llevar al Carrito';
            btn.style.background = '';
            btn.style.color = '';
        }, 1500);
    });

    function goToStep(stepNumber) {
        document.querySelectorAll('.checkout-step').forEach(step => step.classList.remove('active'));
        document.getElementById(`checkout-step-${stepNumber}`).classList.add('active');
    }

    document.getElementById('btn-to-step-2').addEventListener('click', () => goToStep(2));
    document.getElementById('btn-back-to-step-1').addEventListener('click', () => goToStep(1));

    document.getElementById('btn-submit-order').addEventListener('click', () => {
        const drinkName = document.getElementById('order-drink-name').value || "Bebida Especial";
        const userName = document.getElementById('order-user-name').value || "Cliente Estrella";
        
        document.getElementById('ticket-name').textContent = userName;
        document.getElementById('ticket-drink').textContent = drinkName;
        
        cart = [];
        renderCart();
        goToStep(3);
    });

});