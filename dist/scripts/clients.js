document.addEventListener('DOMContentLoaded', () => {
    const clientForm = document.getElementById('client-form');
    
    clientForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const clientName = document.getElementById('client-name').value;
        const clientFirstname = document.getElementById('client-firstname').value;
        const clientEmail = document.getElementById('client-email').value;
        const clientPhone = document.getElementById('client-phone').value;
        const clientAddress = document.getElementById('client-address').value;
        const clientCity = document.getElementById('client-city').value;
        const clientPostalCode = document.getElementById('client-postal-code').value;
        const clientCountry = document.getElementById('client-country').value;
        
        console.log(`Ajout d'un client : ${clientName} ${clientFirstname} (Email : ${clientEmail}, Téléphone : ${clientPhone})`);
        // Logique pour ajouter un client (à implémenter)
    });
});