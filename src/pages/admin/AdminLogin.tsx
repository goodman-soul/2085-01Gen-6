import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { initialAdmin } from '@/utils/mockData';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_NAME_KEY = 'admin_name';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      const from = (location.state as { from?: string })?.from || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location.state]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (username === initialAdmin.username && password === initialAdmin.password) {
        const token = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.setItem(ADMIN_NAME_KEY, initialAdmin.name);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('用户名或密码错误');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue-light via-blue-50 to-medical-blue/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-medical-blue to-medical-blue-dark shadow-lg mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">医院陪护床管理系统</h1>
          <p className="text-gray-500 mt-2">管理员登录</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  prefixIcon={<User size={18} />}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  prefixIcon={<Lock size={18} />}
                  placeholder="请输入密码"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
              >
                登录
              </Button>

              <p className="text-center text-xs text-gray-400">
                默认账号: admin / admin123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
