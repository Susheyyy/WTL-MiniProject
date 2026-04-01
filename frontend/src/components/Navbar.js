import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '15px 40px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', color: '#000' }}>LocalDistro</Link>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '15px', fontSize: '14px' }}>Hi, {user.name}</span>
            {user.role === 'owner' && <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>}
            <button onClick={logout} style={{ background: 'none', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '15px' }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;