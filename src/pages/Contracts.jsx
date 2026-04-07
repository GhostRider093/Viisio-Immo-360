import React, { useEffect, useState } from 'react'

const initialFormData = {
  client_id: '',
  property_id: '',
  type: 'location',
  start_date: '',
  end_date: '',
  amount: '',
  status: 'actif'
}

const toEntityId = (value) => Number.parseInt(value, 10)

const Contracts = ({ navigateTo, isMobile = false }) => {
  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [properties, setProperties] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchContractResources()
  }, [])

  const fetchContractResources = async () => {
    try {
      setErrorMessage('')
      const [contractsResponse, clientsResponse, propertiesResponse] = await Promise.all([
        fetch('/api/contracts'),
        fetch('/api/clients'),
        fetch('/api/properties')
      ])

      const [contractsData, clientsData, propertiesData] = await Promise.all([
        contractsResponse.json(),
        clientsResponse.json(),
        propertiesResponse.json()
      ])

      setContracts(contractsData)
      setClients(clientsData)
      setProperties(propertiesData)
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error)
      setErrorMessage('Impossible de charger les contrats')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setErrorMessage('')
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Erreur lors de la creation du contrat')
        return
      }

      setShowForm(false)
      setFormData(initialFormData)
      fetchContractResources()
    } catch (error) {
      console.error("Erreur lors de l'ajout du contrat:", error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer ce contrat ?')) {
      return
    }

    try {
      setErrorMessage('')
      const response = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Erreur lors de la suppression')
        return
      }

      fetchContractResources()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  const getClientLabel = (clientId) => {
    const client = clients.find((entry) => entry.id === toEntityId(clientId))
    return client ? `${client.firstname} ${client.name}` : `Client #${clientId}`
  }

  const getPropertyLabel = (propertyId) => {
    const property = properties.find((entry) => entry.id === toEntityId(propertyId))
    return property ? property.address : `Bien #${propertyId}`
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredContracts = contracts.filter((contract) => {
    if (!normalizedSearchQuery) {
      return true
    }

    const searchableContent = [
      contract.id,
      contract.type,
      contract.status,
      contract.amount,
      contract.start_date,
      contract.end_date,
      getClientLabel(contract.client_id),
      getPropertyLabel(contract.property_id)
    ].join(' ').toLowerCase()

    return searchableContent.includes(normalizedSearchQuery)
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestion des Contrats</h2>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouveau Contrat'}
        </button>
      </div>

      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid #e53e3e', color: '#c53030' }}>
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>Ajouter un contrat</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>ID Client</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>ID Bien</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="location">Location</option>
                  <option value="vente">Vente</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date de debut</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Montant</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="actif">Actif</option>
                  <option value="termine">Termine</option>
                  <option value="annule">Annule</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn">Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Liste des Contrats</h3>
        <div className="search-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Rechercher un contrat, un client, un bien..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        {filteredContracts.length === 0 ? (
          <p>Aucun contrat enregistre</p>
        ) : isMobile ? (
          <div className="mobile-record-list">
            {filteredContracts.map((contract) => (
              <article key={contract.id} className="mobile-record-card">
                <div className="mobile-record-head">
                  <strong className="mobile-record-title">Contrat #{contract.id}</strong>
                  <span className="mobile-record-meta">{contract.type}</span>
                </div>
                <button
                  type="button"
                  className="inline-link-btn"
                  onClick={() => navigateTo?.('clients', { clientId: toEntityId(contract.client_id) })}
                >
                  {getClientLabel(contract.client_id)}
                </button>
                <button
                  type="button"
                  className="inline-link-btn"
                  onClick={() => navigateTo?.('properties', { propertyId: toEntityId(contract.property_id) })}
                >
                  {getPropertyLabel(contract.property_id)}
                </button>
                <p>{contract.amount} EUR · {contract.status}</p>
                <div className="mobile-record-actions">
                  <button className="btn btn-danger" onClick={() => handleDelete(contract.id)}>Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Bien</th>
                <th>Type</th>
                <th>Date de debut</th>
                <th>Date de fin</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => (
                <tr key={contract.id}>
                  <td>
                    <button
                      type="button"
                      className="inline-link-btn"
                      onClick={() => navigateTo?.('clients', { clientId: toEntityId(contract.client_id) })}
                    >
                      {getClientLabel(contract.client_id)}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="inline-link-btn"
                      onClick={() => navigateTo?.('properties', { propertyId: toEntityId(contract.property_id) })}
                    >
                      {getPropertyLabel(contract.property_id)}
                    </button>
                  </td>
                  <td>{contract.type}</td>
                  <td>{contract.start_date}</td>
                  <td>{contract.end_date}</td>
                  <td>{contract.amount} EUR</td>
                  <td>{contract.status}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(contract.id)}
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
    </div>
  )
}

export default Contracts
