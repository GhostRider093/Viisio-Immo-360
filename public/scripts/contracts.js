document.addEventListener('DOMContentLoaded', () => {
    const contractForm = document.getElementById('contract-form');
    
    contractForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const contractProperty = document.getElementById('contract-property').value;
        const contractClient = document.getElementById('contract-client').value;
        const contractStart = document.getElementById('contract-start').value;
        const contractEnd = document.getElementById('contract-end').value;
        
        console.log(`Ajout d'un contrat : Bien ${contractProperty}, Client ${contractClient}, Du ${contractStart} au ${contractEnd}`);
        // Logique pour ajouter un contrat (à implémenter)
    });
});