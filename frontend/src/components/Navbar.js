import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        Go<span>Local</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        
        <Link to="/dashboard" className="nav-link" style={{color: 'var(--accent)', fontWeight: '600'}}>
          + Add Business
        </Link>

        {user ? (
          <>
            <Link to="/profile" className="nav-link">My Account</Link>
            <span className="nav-user">{user.name}</span>
            <button onClick={logout} className="btn-nav-logout">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign in</Link>
            <Link to="/register" className="btn-nav-cta">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;