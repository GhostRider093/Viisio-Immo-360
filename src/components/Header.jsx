import React from 'react'

const Header = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { key: 'dashboard', label: 'Accueil' },
    { key: 'clients', label: 'Clients' },
    { key: 'properties', label: 'Biens' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'contracts', label: 'Contrats' }
  ]

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand-block">
          <span className="brand-kicker">Immo Signature</span>
          <div className="brand-title-wrap">
            <h2 className="brand-title">Application Immobiliere</h2>
            <span className="brand-badge">Administratif</span>
          </div>
        </div>

        <nav className="nav">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`nav-link ${currentPage === item.key ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
