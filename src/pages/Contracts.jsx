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

const Contracts = () => {
  const [contracts, setContracts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      setErrorMessage('')
      const response = await fetch('/api/contracts')
      const data = await response.json()
      setContracts(data)
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
      fetchContracts()
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

      fetchContracts()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
        {contracts.length === 0 ? (
          <p>Aucun contrat enregistre</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID Client</th>
                <th>ID Bien</th>
                <th>Type</th>
                <th>Date de debut</th>
                <th>Date de fin</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.client_id}</td>
                  <td>{contract.property_id}</td>
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
