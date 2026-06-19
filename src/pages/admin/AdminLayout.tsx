import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListOrdered,
  AlertOctagon,
  LogOut,
  BedDouble,
  ChevronRight,
  User,
} from 'lucide-react';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_NAME_KEY = 'admin_name';

interface MenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '数据概览', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
  { key: 'orders', label: '订单管理', icon: <ListOrdered size={20} />, path: '/admin/orders' },
  { key: 'records', label: '异常记录', icon: <AlertOctagon size={20} />, path: '/admin/records' },
];

const breadcrumbMap: Record<string, string> = {
  '/admin/dashboard': '数据概览',
  '/admin/orders': '订单管理',
  '/admin/records': '异常记录',
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const adminName = localStorage.getItem(ADMIN_NAME_KEY) || '管理员';

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      navigate('/admin', { replace: true, state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_NAME_KEY);
    navigate('/admin', { replace: true });
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const currentBreadcrumb = breadcrumbMap[location.pathname] || '';
  const activeKey = menuItems.find((item) => location.pathname.startsWith(item.path))?.key || '';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-gradient-to-b from-medical-blue to-medical-blue-dark flex flex-col shrink-0">
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BedDouble className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">陪护床管理</div>
              <div className="text-blue-200 text-xs mt-0.5">管理后台</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => handleMenuClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-medical-blue-dark shadow-lg font-semibold'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-medical-blue' : ''}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight size={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="text-sm">退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">管理后台</span>
            {currentBreadcrumb && (
              <>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="text-gray-700 font-medium">{currentBreadcrumb}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
              <div className="w-7 h-7 rounded-full bg-medical-blue-light flex items-center justify-center">
                <User size={14} className="text-medical-blue-dark" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{adminName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
