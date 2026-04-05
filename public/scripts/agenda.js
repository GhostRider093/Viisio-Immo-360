document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('event-form');
    
    eventForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const eventTitle = document.getElementById('event-title').value;
        const eventStart = document.getElementById('event-start').value;
        const eventEnd = document.getElementById('event-end').value;
        const eventDescription = document.getElementById('event-description').value;
        
        console.log(`Ajout d'un événement : ${eventTitle} (Du ${eventStart} au ${eventEnd})`);
        // Logique pour ajouter un événement (à implémenter)
    });
});