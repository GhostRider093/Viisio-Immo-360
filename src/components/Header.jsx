import React from 'react'

const Header = ({ currentPage, setCurrentPage, isMobile }) => {
  const navItems = [
    { key: 'dashboard', label: 'Accueil' },
    { key: 'clients', label: 'Clients' },
    { key: 'properties', label: 'Biens' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'contracts', label: 'Contrats' }
  ]

  if (isMobile) {
    return (
      <>
        <header className="header mobile-header">
          <div className="container mobile-header-inner">
            <span className="brand-badge brand-badge-wide mobile-brand-badge">Application Immobiliere</span>
          </div>
        </header>

        <nav className="mobile-bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mobile-nav-link ${currentPage === item.key ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </>
    )
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand-block">
          <div className="brand-title-wrap">
            <span className="brand-badge brand-badge-wide">Application Immobiliere</span>
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
