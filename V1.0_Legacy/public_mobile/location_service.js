const LocationService = {
    async getCountries() {
        try {
            const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
            const data = await res.json();
            return data.map(c => c.name.common).sort();
        } catch (err) {
            console.error('Error fetching countries:', err);
            return ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'Brazil'];
        }
    },

    async getStates(country) {
        try {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country })
            });
            const data = await res.json();
            if (!data.data || !data.data.states) return [];
            return data.data.states.map(s => s.name).sort();
        } catch (err) {
            console.error('Error fetching states:', err);
            return [];
        }
    },

    async getCities(country, state) {
        try {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country, state })
            });
            const data = await res.json();
            if (!data.data) return [];
            return data.data.sort();
        } catch (err) {
            console.error('Error fetching cities:', err);
            return [];
        }
    }
};

class CustomDropdown {
    constructor(inputId, options = []) {
        this.input = document.getElementById(inputId);
        this.options = options;
        this.filteredOptions = options;
        this.container = this.input.parentElement;
        this.menu = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        // Wrap input in a container if not already
        this.container.classList.add('custom-dropdown-container');
        this.input.setAttribute('autocomplete', 'off');

        // Create menu
        this.menu = document.createElement('ul');
        this.menu.classList.add('custom-dropdown-menu');
        this.container.appendChild(this.menu);

        // Listeners
        this.input.addEventListener('focus', () => this.open());
        this.input.addEventListener('input', () => {
            this.filter(this.input.value);
            this.open();
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });

        this.render();
    }

    open() {
        this.menu.classList.add('show');
        this.isOpen = true;
    }

    close() {
        this.menu.classList.remove('show');
        this.isOpen = false;
    }

    filter(query) {
        this.filteredOptions = this.options.filter(opt => 
            opt.toLowerCase().includes(query.toLowerCase())
        );
        this.render();
    }

    updateOptions(newOptions) {
        this.options = newOptions;
        this.filteredOptions = newOptions;
        this.render();
    }

    render() {
        this.menu.innerHTML = '';
        if (this.filteredOptions.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No results found';
            li.style.color = 'var(--muted)';
            li.style.padding = '0.5rem 1rem';
            this.menu.appendChild(li);
            return;
        }

        this.filteredOptions.forEach(opt => {
            const li = document.createElement('li');
            li.textContent = opt;
            li.addEventListener('click', () => {
                this.input.value = opt;
                this.input.dispatchEvent(new Event('change'));
                this.close();
            });
            this.menu.appendChild(li);
        });
    }
}

function setupLocationChain(countryId, stateId, cityId) {
    const countryDropdown = new CustomDropdown(countryId);
    const stateDropdown = new CustomDropdown(stateId);
    const cityDropdown = new CustomDropdown(cityId);

    // Initialize Countries
    LocationService.getCountries().then(countries => {
        countryDropdown.updateOptions(countries);
    });

    document.getElementById(countryId).addEventListener('change', async (e) => {
        const country = e.target.value;
        const stateInput = document.getElementById(stateId);
        const cityInput = document.getElementById(cityId);

        stateInput.value = '';
        cityInput.value = '';
        stateDropdown.updateOptions(['Loading states...']);
        
        if (country) {
            const states = await LocationService.getStates(country);
            if (states.length === 0) {
                stateDropdown.updateOptions(['Not Applicable / No States Found']);
                cityDropdown.updateOptions(['Not Applicable / No Cities Found']);
            } else {
                stateDropdown.updateOptions(states);
            }
        }
    });

    document.getElementById(stateId).addEventListener('change', async (e) => {
        const country = document.getElementById(countryId).value;
        const state = e.target.value;
        const cityInput = document.getElementById(cityId);

        cityInput.value = '';
        if (state === 'Not Applicable / No States Found') {
            cityDropdown.updateOptions(['Not Applicable / No Cities Found']);
            return;
        }

        cityDropdown.updateOptions(['Loading cities...']);

        if (country && state) {
            const cities = await LocationService.getCities(country, state);
            if (cities.length === 0) {
                cityDropdown.updateOptions(['Not Applicable / No Cities Found']);
            } else {
                cityDropdown.updateOptions(cities);
            }
        }
    });
}

// Global Modal Behavior (Esc and Outside click)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) activeModal.classList.remove('active');
        
        // Also close all custom dropdowns
        document.querySelectorAll('.custom-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

window.setupLocationChain = setupLocationChain;
