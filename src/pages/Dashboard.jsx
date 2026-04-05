import React, { useEffect, useState } from 'react'

const RECENT_CLIENTS_KEY = 'recently_viewed_clients'

const modules = [
  {
    key: 'clients',
    title: 'Clients',
    label: 'Portefeuille clients',
    description: 'Relations, fiches et suivi administratif.'
  },
  {
    key: 'properties',
    title: 'Biens',
    label: 'Catalogue agence',
    description: 'Inventaire, surfaces et valorisation.'
  },
  {
    key: 'agenda',
    title: 'Agenda',
    label: 'Rendez-vous',
    description: 'Visites, signatures et priorites du jour.'
  },
  {
    key: 'contracts',
    title: 'Contrats',
    label: 'Conformite',
    description: 'Documents actifs, montant et statut.'
  }
]

const emptyCollections = {
  clients: [],
  properties: [],
  events: [],
  contracts: []
}

const emptyWatchPayload = {
  state: {
    running: false,
    lastError: null,
    lastRunAt: null
  },
  latest: null,
  history: []
}

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR')
}

const isToday = (value) => {
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

const byNewestId = (left, right) => Number(right.id || 0) - Number(left.id || 0)
const byNewestDate = (left, right) => new Date(right.start_date).getTime() - new Date(left.start_date).getTime()

const readRecentClients = () => {
  try {
    const rawValue = window.localStorage.getItem(RECENT_CLIENTS_KEY)
    const parsed = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("Erreur lors de la lecture de l'historique clients:", error)
    return []
  }
}

const buildPreviewItems = (collections, recentClients) => ({
  clients: recentClients.slice(0, 5).map((client) => ({
    id: client.id,
    title: `${client.firstname} ${client.name}`,
    meta: client.city || 'Ville non renseignee',
    detail: `Consulte le ${formatDateTime(client.viewedAt)}`
  })),
  properties: [...collections.properties].sort(byNewestId).slice(0, 5).map((property) => ({
    id: property.id,
    title: property.address,
    meta: property.type,
    detail: `${property.price} EUR`
  })),
  agenda: [...collections.events].sort(byNewestDate).slice(0, 5).map((event) => ({
    id: event.id,
    title: event.title,
    meta: formatDateTime(event.start_date),
    detail: event.description || 'Sans description',
    isAlert: isToday(event.start_date)
  })),
  contracts: [...collections.contracts].sort(byNewestId).slice(0, 5).map((contract) => ({
    id: contract.id,
    title: `Contrat #${contract.id}`,
    meta: `${contract.type} · ${contract.status}`,
    detail: `${contract.amount} EUR`
  }))
})

function Dashboard({ setCurrentPage }) {
  const [collections, setCollections] = useState(emptyCollections)
  const [recentClients, setRecentClients] = useState([])
  const [watchPayload, setWatchPayload] = useState(emptyWatchPayload)
  const [loading, setLoading] = useState(true)
  const [captureLoading, setCaptureLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedModule, setSelectedModule] = useState(null)

  const loadDashboard = async () => {
    try {
      setErrorMessage('')
      const [clientsResponse, propertiesResponse, eventsResponse, contractsResponse, watchResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/properties'),
        fetch('/api/events'),
        fetch('/api/contracts'),
        fetch('/api/watch/leboncoin')
      ])

      const [clients, properties, events, contracts, watchData] = await Promise.all([
        clientsResponse.json(),
        propertiesResponse.json(),
        eventsResponse.json(),
        contractsResponse.json(),
        watchResponse.json()
      ])

      setCollections({
        clients,
        properties,
        events,
        contracts
      })
      setWatchPayload(watchData)
      setRecentClients(readRecentClients())
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error)
      setErrorMessage('Impossible de charger le tableau de bord')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const todayEvents = collections.events.filter((event) => isToday(event.start_date))
  const previewItems = buildPreviewItems(collections, recentClients)
  const summaryByModule = {
    clients: `${collections.clients.length} fiches`,
    properties: `${collections.properties.length} actifs`,
    agenda: todayEvents.length > 0 ? `${todayEvents.length} pour aujourd hui` : `${collections.events.length} evenements`,
    contracts: `${collections.contracts.length} dossiers`
  }

  const openModule = (moduleKey) => {
    setSelectedModule(null)
    setCurrentPage(moduleKey)
  }

  const handleCapture = async () => {
    try {
      setCaptureLoading(true)
      setErrorMessage('')
      const response = await fetch('/api/watch/leboncoin/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.details?.join(' ') || data.error || 'Capture Leboncoin impossible')
        return
      }

      setWatchPayload(data.payload)
    } catch (error) {
      console.error('Erreur lors de la capture Leboncoin:', error)
      setErrorMessage('Erreur lors du lancement de la capture Leboncoin')
    } finally {
      setCaptureLoading(false)
    }
  }

  const latestCaptureItems = watchPayload.latest?.items?.slice(0, 3) || []

  return (
    <div className="dashboard-grid">
      <section className="card dashboard-intro">
        <div className="dashboard-intro-head">
          <span className="dashboard-kicker">Suite administrative</span>
          <span className="dashboard-chip">Premium</span>
        </div>
        <h3>Acces directs aux modules</h3>
        <p>
          Les sections sont rassemblees dans une version plus compacte. L accueil donne une lecture plus large: historique des fiches consultees, derniers mouvements, alertes du jour et veille visuelle.
        </p>
      </section>

      <section className="dashboard-modules">
        {modules.map((module) => (
          <article
            key={module.key}
            className={`dashboard-module-card ${module.key === 'agenda' && todayEvents.length > 0 ? 'is-alert' : ''}`}
          >
            <div className="dashboard-module-head">
              <div>
                <span className="dashboard-module-label">{module.label}</span>
                <strong className="dashboard-module-title">{module.title}</strong>
              </div>
              <button
                type="button"
                className="dashboard-open-icon"
                onClick={() => openModule(module.key)}
                aria-label={`Ouvrir ${module.title}`}
                title={`Ouvrir ${module.title}`}
              >
                Ouvrir
              </button>
            </div>

            <span className="dashboard-module-description">{module.description}</span>
            <span className="dashboard-module-meta">{loading ? 'Chargement...' : summaryByModule[module.key]}</span>

            <div className="dashboard-preview-list">
              {previewItems[module.key].length === 0 ? (
                <div className="dashboard-preview-empty">
                  {module.key === 'clients' ? 'Aucune fiche consultee pour le moment.' : 'Aucune entree recente.'}
                </div>
              ) : (
                previewItems[module.key].map((item) => (
                  <div key={`${module.key}-${item.id}-${item.meta}`} className={`dashboard-preview-item ${item.isAlert ? 'is-alert' : ''}`}>
                    <span className="dashboard-preview-title">{item.title}</span>
                    <span className="dashboard-preview-meta">{item.meta}</span>
                    <span className="dashboard-preview-detail">{item.detail}</span>
                  </div>
                ))
              )}
            </div>

            <div className="dashboard-card-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedModule(module.key)}
              >
                Agrandir
              </button>

              {module.key === 'agenda' && !loading && todayEvents.length > 0 && (
                <span className="dashboard-alert-pill">Priorite du jour</span>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="card watch-panel">
        <div className="watch-panel-head">
          <div>
            <span className="dashboard-kicker">Veille visuelle</span>
            <h3>Leboncoin Colombiers</h3>
          </div>

          <div className="watch-panel-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCapture} disabled={captureLoading || watchPayload.state.running}>
              {captureLoading || watchPayload.state.running ? 'Capture en cours' : 'Lancer une capture'}
            </button>
            <a
              className="btn"
              href={watchPayload.latest?.sourceUrl || 'https://www.leboncoin.fr/'}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir la recherche
            </a>
          </div>
        </div>

        <p className="watch-panel-text">
          La recherche est capturee en plusieurs screenshots par scroll. Tu peux donc afficher une veille visuelle sans iframe.
        </p>

        <div className="watch-status-row">
          <span className="dashboard-module-meta">
            Derniere capture: {watchPayload.latest ? formatDateTime(watchPayload.latest.createdAt) : 'Aucune'}
          </span>
          {todayEvents.length > 0 && <span className="dashboard-alert-pill">Agenda du jour actif</span>}
        </div>

        {watchPayload.state.lastError && (
          <div className="watch-error-box">{watchPayload.state.lastError}</div>
        )}

        {latestCaptureItems.length > 0 ? (
          <div className="watch-gallery">
            {latestCaptureItems.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="watch-shot-card">
                <img src={item.url} alt={`Capture Leboncoin ${item.id}`} className="watch-shot-image" />
                <span className="watch-shot-label">Segment {item.id.split('-').slice(-1)[0]}</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="dashboard-preview-empty">Aucune capture disponible pour le moment.</div>
        )}

        {watchPayload.history.length > 0 && (
          <div className="watch-history">
            {watchPayload.history.map((capture) => (
              <div key={capture.id} className="watch-history-row">
                <span className="dashboard-preview-title">{formatDateTime(capture.createdAt)}</span>
                <span className="dashboard-preview-meta">{capture.items.length} segments</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedModule && (
        <div className="modal-backdrop" onClick={() => setSelectedModule(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="dashboard-kicker">
                  {modules.find((module) => module.key === selectedModule)?.label}
                </span>
                <h3 className="modal-title">
                  {modules.find((module) => module.key === selectedModule)?.title}
                </h3>
              </div>

              <button type="button" className="modal-close" onClick={() => setSelectedModule(null)}>
                Fermer
              </button>
            </div>

            <div className="modal-body">
              {previewItems[selectedModule]?.length === 0 ? (
                <p>Aucune information a afficher pour le moment.</p>
              ) : (
                previewItems[selectedModule].map((item) => (
                  <div key={`${selectedModule}-modal-${item.id}-${item.meta}`} className={`modal-preview-row ${item.isAlert ? 'is-alert' : ''}`}>
                    <div>
                      <strong className="dashboard-preview-title">{item.title}</strong>
                      <p className="dashboard-preview-detail">{item.detail}</p>
                    </div>
                    <span className="dashboard-preview-meta">{item.meta}</span>
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedModule(null)}>
                Retour
              </button>
              <button type="button" className="btn" onClick={() => openModule(selectedModule)}>
                Ouvrir le module
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid #9d3d32', color: '#9d3d32' }}>
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default Dashboard
