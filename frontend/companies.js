document.addEventListener("DOMContentLoaded", () => {
    const companyListContainer = document.getElementById('company-list-container');

    async function loadCompanies() {
        try {
            const res = await fetch(`${API}/profiles/companies/`);
            if (!res.ok) throw new Error('Could not fetch the list of companies.');

            const companies = await res.json();

            if (companies.length === 0) {
                companyListContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No companies have registered yet.</p>';
                return;
            }

            companyListContainer.innerHTML = companies.map(company => `
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow p-5 text-center flex flex-col items-center animate-fade-in">
                    <div class="w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <img src="${company.company_logo_url || 'https://via.placeholder.com/150'}" 
                             alt="${company.company_name} Logo" 
                             class="w-full h-full object-cover rounded-full">
                    </div>
                    <h3 class="text-lg font-bold text-gray-800">${company.company_name}</h3>
                    <p class="text-sm text-gray-600 mt-1">${company.industry || 'Industry not specified'}</p>
                    <p class="text-sm text-gray-500 mt-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                        </svg>
                        ${company.location || 'Location not specified'}
                    </p>
                </div>
            `).join('');

        } catch (error) {
            companyListContainer.innerHTML = '<p class="col-span-full text-center text-red-500">An error occurred while loading the company list.</p>';
            console.error(error);
        }
    }

    loadCompanies();
});