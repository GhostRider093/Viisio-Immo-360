import React, { useEffect, useState } from 'react'

const initialFormData = {
  address: '',
  type: 'appartement',
  price: '',
  area: '',
  rooms: '',
  description: '',
  photo_url: ''
}

function Properties({ focusPropertyId, onFocusHandled }) {
  const [properties, setProperties] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (!focusPropertyId || properties.length === 0) {
      return
    }

    const propertyToOpen = properties.find((property) => property.id === focusPropertyId)

    if (propertyToOpen) {
      setSelectedProperty(propertyToOpen)
    }

    onFocusHandled?.()
  }, [focusPropertyId, properties, onFocusHandled])

  const fetchProperties = async () => {
    try {
      setErrorMessage('')
      const response = await fetch('/api/properties')
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error('Erreur lors du chargement des biens:', error)
      setErrorMessage('Impossible de charger les biens')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setErrorMessage('')
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Erreur lors de la creation du bien')
        return
      }

      setShowForm(false)
      setFormData(initialFormData)
      fetchProperties()
    } catch (error) {
      console.error("Erreur lors de l'ajout du bien:", error)
      setErrorMessage('Erreur lors de la communication avec le serveur')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestion des Biens</h2>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouveau Bien'}
        </button>
      </div>

      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid #e53e3e', color: '#c53030' }}>
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>Ajouter un bien</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="terrain">Terrain</option>
                  <option value="bureau">Bureau</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div className="form-group">
                <label>Prix (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Surface (m²)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pièces</label>
                <input
                  type="number"
                  min={formData.type === 'terrain' ? '0' : '1'}
                  step="1"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
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
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>URL de la photo</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
                {formData.photo_url && (
                  <img
                    src={formData.photo_url}
                    alt="Aperçu"
                    style={{ marginTop: '0.5rem', width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
              </div>
            </div>
            <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Liste des Biens</h3>
        {properties.length === 0 ? (
          <p>Aucun bien enregistre</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Adresse</th>
                <th>Type</th>
                <th>Prix</th>
                <th>Surface</th>
                <th>Pièces</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>
                    {property.photo_url ? (
                      <img
                        src={property.photo_url}
                        alt={property.address}
                        style={{ width: '72px', height: '48px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ width: '72px', height: '48px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#a0aec0' }}>
                        Aucune
                      </div>
                    )}
                  </td>
                  <td>{property.address}</td>
                  <td>{property.type}</td>
                  <td>{Number(property.price).toLocaleString('fr-FR')} €</td>
                  <td>{property.area} m²</td>
                  <td>{property.rooms}</td>
                  <td className="table-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedProperty(property)}
                    >
                      Consulter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img
            src={lightboxUrl}
            alt="Photo agrandie"
            style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {selectedProperty && (
        <div className="modal-backdrop" onClick={() => setSelectedProperty(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="dashboard-kicker">Fiche bien</span>
                <h3 className="modal-title">{selectedProperty.address}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedProperty(null)}>
                Fermer
              </button>
            </div>

            {selectedProperty.photo_url && (
              <img
                src={selectedProperty.photo_url}
                alt={selectedProperty.address}
                onClick={() => setLightboxUrl(selectedProperty.photo_url)}
                style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem', cursor: 'zoom-in' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}

            <div className="client-detail-grid">
              <div className="client-detail-item">
                <span className="client-detail-label">Type</span>
                <strong>{selectedProperty.type}</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Prix</span>
                <strong>{Number(selectedProperty.price).toLocaleString('fr-FR')} €</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Surface</span>
                <strong>{selectedProperty.area} m²</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Pièces</span>
                <strong>{selectedProperty.rooms}</strong>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Description</span>
                <strong>{selectedProperty.description || 'Aucune description'}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setSelectedProperty(null)}>
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Properties
