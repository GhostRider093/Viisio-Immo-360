import React, { useEffect, useState } from 'react'

const RECENT_CLIENTS_KEY = 'recently_viewed_clients'

const initialFormData = {
  name: '',
  firstname: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  country: ''
}

const prospectDefaults = {
  address: 'A completer',
  city: 'A completer',
  postal_code: '00000',
  country: 'France'
}

const normalizePhoneHref = (value) => `tel:${value.replace(/[^+\d]/g, '')}`
const normalizeEmail = (value) => value.trim()
const sortClientsByLastname = (clientList) => [...clientList].sort((left, right) => {
  const leftValue = `${left.name || ''} ${left.firstname || ''}`.trim()
  const rightValue = `${right.name || ''} ${right.firstname || ''}`.trim()
  return leftValue.localeCompare(rightValue, 'fr', { sensitivity: 'base' })
})

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR')
}

const saveRecentClient = (client) => {
  try {
    const currentHistory = JSON.parse(window.localStorage.getItem(RECENT_CLIENTS_KEY) || '[]')
    const sanitizedHistory = Array.isArray(currentHistory) ? currentHistory : []
    const nextEntry = {
      id: client.id,
      name: client.name,
      firstname: client.firstname,
      city: client.city,
      viewedAt: new Date().toISOString()
    }

    const nextHistory = [nextEntry, ...sanitizedHistory.filter((entry) => entry.id !== client.id)].slice(0, 8)
    window.localStorage.setItem(RECENT_CLIENTS_KEY, JSON.stringify(nextHistory))
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'historique client:", error)
  }
}

const Clients = ({ focusClientId, onFocusHandled, isMobile = false }) => {
  const [clients, setClients] = useState([])
  const [events, setEvents] = useState([])
  const [contracts, setContracts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchClientResources()
  }, [])

  useEffect(() => {
    if (!focusClientId || clients.length === 0) {
      return
    }

    const clientToOpen = clients.find((client) => client.id === focusClientId)

    if (clientToOpen) {
      setSelectedClient(clientToOpen)
      saveRecentClient(clientToOpen)
    }

    onFocusHandled?.()
  }, [focusClientId, clients, onFocusHandled])

  const fetchClientResources = async () => {
    try {
      setErrorMessage('')
      const [clientsResponse, eventsResponse, contractsResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/events'),
        fetch('/api/contracts')
      ])

      const [clientsData, eventsData, contractsData] = await Promise.all([
        clientsResponse.json(),
        eventsResponse.json(),
        contractsResponse.json()
      ])

      setClients(sortClientsByLastname(clientsData))
      setEvents(eventsData)
      setContracts(contractsData)
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      setErrorMessage('Impossible de charger les clients')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setErrorMessage('')
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prospectDefaults,
          ...formData
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Erreur lors de la creation du client')
        return
      }

      setShowForm(false)
      setFormData(initialFormData)
      fetchClientResources()
    } catch (error) {
      console.error("Erreur lors de l'ajout du client:", error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer ce client ?')) {
      return
    }

    try {
      setErrorMessage('')
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Erreur lors de la suppression')
        return
      }

      fetchClientResources()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  const handleViewClient = (client) => {
    setSelectedClient(client)
    saveRecentClient(client)
    setFeedbackMessage('')
  }

  const handleCopyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email)
      setFeedbackMessage('Email copie dans le presse-papiers')
    } catch (error) {
      console.error("Erreur lors de la copie de l'email:", error)
      setFeedbackMessage('Copie impossible sur cet appareil')
    }
  }

  const selectedClientEvents = selectedClient
    ? events.filter((event) => Number(event.client_id) === selectedClient.id)
    : []

  const selectedClientContracts = selectedClient
    ? contracts.filter((contract) => Number(contract.client_id) === selectedClient.id)
    : []

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredClients = clients.filter((client) => {
    if (!normalizedSearchQuery) {
      return true
    }

    const searchableContent = [
      client.firstname,
      client.name,
      client.email,
      client.phone,
      client.address,
      client.city,
      client.postal_code,
      client.country
    ].join(' ').toLowerCase()

    return searchableContent.includes(normalizedSearchQuery)
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestion des Clients</h2>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouveau Client'}
        </button>
      </div>

      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid #e53e3e', color: '#c53030' }}>
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>Ajouter un client</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prenom</label>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Telephone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ville</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Code postal</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn">Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Liste des Clients</h3>
        <div className="search-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Rechercher un client, un mail, une ville..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        {filteredClients.length === 0 ? (
          <p>Aucun client enregistre</p>
        ) : isMobile ? (
          <div className="mobile-record-list">
            {filteredClients.map((client) => (
              <article key={client.id} className="mobile-record-card">
                <div className="mobile-record-head">
                  <strong className="mobile-record-title">{client.firstname} {client.name}</strong>
                  <span className="mobile-record-meta">{client.city}</span>
                </div>
                <a className="contact-link" href={`mailto:${normalizeEmail(client.email)}`}>{client.email}</a>
                <a className="contact-link" href={normalizePhoneHref(client.phone)}>{client.phone}</a>
                <div className="mobile-record-actions">
                  <button className="btn btn-secondary" onClick={() => handleViewClient(client)}>Consulter</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(client.id)}>Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prenom</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Ville</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.firstname}</td>
                  <td>
                    <a className="contact-link" href={`mailto:${normalizeEmail(client.email)}`}>
                      {client.email}
                    </a>
                  </td>
                  <td>
                    <a className="contact-link" href={normalizePhoneHref(client.phone)}>
                      {client.phone}
                    </a>
                  </td>
                  <td>{client.city}</td>
                  <td className="table-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleViewClient(client)}
                    >
                      Consulter
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(client.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedClient && (
        <div className="modal-backdrop" onClick={() => setSelectedClient(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="dashboard-kicker">Fiche client</span>
                <h3 className="modal-title">{selectedClient.firstname} {selectedClient.name}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedClient(null)}>
                Fermer
              </button>
            </div>

            <div className="client-detail-grid">
              <div className="client-detail-item">
                <span className="client-detail-label">Email</span>
                <div className="client-detail-stack">
                  <a className="contact-link contact-link-strong" href={`mailto:${normalizeEmail(selectedClient.email)}`}>
                    {selectedClient.email}
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleCopyEmail(selectedClient.email)}
                  >
                    Copier le mail
                  </button>
                </div>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Telephone</span>
                <a className="contact-link contact-link-strong" href={normalizePhoneHref(selectedClient.phone)}>
                  {selectedClient.phone}
                </a>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Adresse</span>
                <strong>{selectedClient.address}</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Ville</span>
                <strong>{selectedClient.city}</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Code postal</span>
                <strong>{selectedClient.postal_code}</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Pays</span>
                <strong>{selectedClient.country}</strong>
              </div>
            </div>

            <div className="client-related-panel">
              <div className="client-related-card">
                <span className="client-detail-label">Agenda lie</span>
                {selectedClientEvents.length > 0 ? (
                  selectedClientEvents.map((event) => (
                    <div key={`event-${event.id}`} className="client-related-row">
                      <strong>{event.title}</strong>
                      <span>{formatDateTime(event.start_date)}</span>
                    </div>
                  ))
                ) : (
                  <p>Aucun evenement lie pour le moment.</p>
                )}
              </div>

              <div className="client-related-card">
                <span className="client-detail-label">Contrats lies</span>
                {selectedClientContracts.length > 0 ? (
                  selectedClientContracts.map((contract) => (
                    <div key={`contract-${contract.id}`} className="client-related-row">
                      <strong>Contrat #{contract.id}</strong>
                      <span>{contract.type} · {contract.status}</span>
                    </div>
                  ))
                ) : (
                  <p>Aucun contrat lie pour le moment.</p>
                )}
              </div>
            </div>

            {feedbackMessage && (
              <div className="client-feedback-box">{feedbackMessage}</div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setSelectedClient(null)}>
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clients
