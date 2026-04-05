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

const Clients = ({ focusClientId, onFocusHandled }) => {
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchClients()
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

  const fetchClients = async () => {
    try {
      setErrorMessage('')
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
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
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Erreur lors de la creation du client')
        return
      }

      setShowForm(false)
      setFormData(initialFormData)
      fetchClients()
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

      fetchClients()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  const handleViewClient = (client) => {
    setSelectedClient(client)
    saveRecentClient(client)
  }

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
        {clients.length === 0 ? (
          <p>Aucun client enregistre</p>
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
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.firstname}</td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
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
                <strong>{selectedClient.email}</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Telephone</span>
                <strong>{selectedClient.phone}</strong>
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
