import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const activeLink = 'bg-gray-900 text-white';
  const normalLink = 'text-gray-300 hover:bg-gray-700 hover:text-white';

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <NavLink to="/" className={({ isActive }) => `${isActive ? activeLink : normalLink} rounded-md px-3 py-2 text-sm font-medium`}>
                  Student Dashboard
                </NavLink>
                <NavLink to="/institute" className={({ isActive }) => `${isActive ? activeLink : normalLink} rounded-md px-3 py-2 text-sm font-medium`}>
                  Institute Dashboard
                </NavLink>
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <NavLink to="/login" className={({ isActive }) => `${isActive ? activeLink : normalLink} rounded-md px-3 py-2 text-sm font-medium`}>
              Login
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
