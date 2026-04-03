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
        Local<span>Distro</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-user">Hi, {user.name}</span>
            {/* Added My Reviews Profile Link */}
            <Link to="/profile" className="nav-link">My Reviews</Link>
            
            {user.role === 'owner' && (
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            )}
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