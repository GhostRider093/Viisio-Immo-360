document.addEventListener('DOMContentLoaded', () => {
    const propertyForm = document.getElementById('property-form');
    
    propertyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const propertyAddress = document.getElementById('property-address').value;
        const propertyType = document.getElementById('property-type').value;
        const propertyPrice = document.getElementById('property-price').value;
        const propertyArea = document.getElementById('property-area').value;
        const propertyRooms = document.getElementById('property-rooms').value;
        const propertyDescription = document.getElementById('property-description').value;
        
        console.log(`Ajout d'un bien : ${propertyAddress} (Type : ${propertyType}, Prix : ${propertyPrice})`);
        // Logique pour ajouter un bien (à implémenter)
    });
});