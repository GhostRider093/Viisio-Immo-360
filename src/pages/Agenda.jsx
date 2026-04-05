import React, { useEffect, useState } from 'react'

const initialFormData = {
  title: '',
  start_date: '',
  end_date: '',
  description: '',
  client_id: '',
  property_id: ''
}

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR')
}

const isTodayEvent = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const now = new Date()

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function Agenda({ navigateTo }) {
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [properties, setProperties] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchAgendaResources()
  }, [])

  const fetchAgendaResources = async () => {
    try {
      setErrorMessage('')
      const [eventsResponse, clientsResponse, propertiesResponse] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/clients'),
        fetch('/api/properties')
      ])

      const [eventsData, clientsData, propertiesData] = await Promise.all([
        eventsResponse.json(),
        clientsResponse.json(),
        propertiesResponse.json()
      ])

      setEvents(eventsData)
      setClients(clientsData)
      setProperties(propertiesData)
    } catch (error) {
      console.error('Erreur lors du chargement des evenements:', error)
      setErrorMessage("Impossible de charger l'agenda")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setErrorMessage('')
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || "Erreur lors de la creation de l'evenement")
        return
      }

      setShowForm(false)
      setFormData(initialFormData)
      fetchAgendaResources()
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'evenement:", error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Agenda</h2>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouvel Evenement'}
        </button>
      </div>

      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid #e53e3e', color: '#c53030' }}>
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>Ajouter un evenement</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de debut</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Client lie</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                >
                  <option value="">Aucun client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstname} {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Bien lie</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                >
                  <option value="">Aucun bien</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn">Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Liste des Evenements</h3>
        {events.length === 0 ? (
          <p>Aucun evenement enregistre</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Debut</th>
                <th>Fin</th>
                <th>Client</th>
                <th>Bien</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className={isTodayEvent(event.start_date) ? 'is-today-row' : ''}>
                  <td>{event.title}</td>
                  <td>{formatDateTime(event.start_date)}</td>
                  <td>{formatDateTime(event.end_date)}</td>
                  <td>
                    {event.client_id ? (
                      <button
                        type="button"
                        className="inline-link-btn"
                        onClick={() => navigateTo('clients', { clientId: event.client_id })}
                      >
                        {event.client_firstname} {event.client_name}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {event.property_id ? (
                      <button
                        type="button"
                        className="inline-link-btn"
                        onClick={() => navigateTo('properties', { propertyId: event.property_id })}
                      >
                        {event.property_address}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {event.description || '-'}
                    {isTodayEvent(event.start_date) && <span className="today-pill">Aujourd hui</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Agenda
