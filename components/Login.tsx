import React, { useState } from 'react';
import { User } from '../types';
import { Hexagon, Lock, User as UserIcon, ArrowRight, UserPlus, CheckCircle } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLoginMode) {
      // Login Logic
      const loginId = formData.id.trim();
      const user = users.find(u => u.id === loginId);
      
      if (user) {
        // If user has a specific password set (from registration or initial data), use it.
        // Otherwise fallback to '1234' for pre-existing mock users (safety net).
        const isValid = user.password 
          ? user.password === formData.password 
          : formData.password === '1234';

        if (isValid) {
          onLogin(user);
        } else {
          setError('비밀번호가 올바르지 않습니다.');
        }
      } else {
        setError('존재하지 않는 아이디입니다.');
      }
    } else {
      // Registration Logic
      const newId = formData.id.trim();
      if (users.some(u => u.id === newId)) {
        setError('이미 존재하는 아이디입니다.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (formData.password.length < 4) {
        setError('비밀번호는 4자 이상이어야 합니다.');
        return;
      }

      const newUser: User = {
        id: newId,
        name: formData.name,
        role: 'Member', // Default role for new signups
        password: formData.password
      };

      onRegister(newUser);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setFormData({ id: '', name: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-50 p-3 rounded-full mb-4">
            <Hexagon className="text-blue-600 w-10 h-10" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TeamSync</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLoginMode ? '팀 워크스페이스에 로그인하세요' : '새로운 계정을 생성하세요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div className="animate-fade-in-down">
              <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                  placeholder="이름 (예: 홍길동)"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">아이디</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                name="id"
                required
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                placeholder="아이디를 입력하세요"
                value={formData.id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                name="password"
                required
                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {!isLoginMode && (
            <div className="animate-fade-in-down">
              <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 확인</label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg animate-pulse">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoginMode ? (
              <>
                <span>로그인</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>가입하기</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-4">
            {isLoginMode ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          </p>
          <button 
            onClick={toggleMode}
            className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors"
          >
            {isLoginMode ? '회원가입 하러가기' : '로그인 하러가기'}
          </button>
        </div>

        {isLoginMode && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              테스트 계정: <span className="font-mono text-slate-600">admin</span> / <span className="font-mono text-slate-600">u1</span> (PW: 1234)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;