
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from './AuthLayout';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { AUTH_API } from '../../helper/api';
import { useNavigate } from 'react-router-dom';
import { LoginPayload, LoginResponse } from '../../interface/loginInterface';
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Vui lòng nhập email hoặc tên đăng nhập')
    .refine((val) => val.includes('@vn.ricoh.com') || val.length > 0, {
      message: 'Vui lòng nhập email Ricoh hợp lệ hoặc tên đăng nhập',
    }),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type LoginFormData = z.infer<typeof loginSchema>;
export function RicohLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      const savedPath = sessionStorage.getItem('redirectPath') || '/board';
      navigate(savedPath);
    }
  }, [navigate]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  try {
    const payload: LoginPayload = {
      email: data.identifier.includes('@') ? data.identifier : null,
      username: data.identifier.includes('@') ? null : data.identifier,
      password: data.password,
    };
    const response = await AUTH_API.login(payload) as unknown as LoginResponse;
    if (response.code !== 200) {
      throw new Error(response.message || 'Đăng nhập thất bại');
    }
    const user = response.user || response.data;
    const token = response.token;
    if (!token) {
      throw new Error('Không nhận được token từ server');
    }
    if (!user) {
      throw new Error('Không nhận được thông tin người dùng từ server');
    }
    localStorage.setItem('access_token', token);
    localStorage.setItem('userIdentifier', data.identifier);
    localStorage.setItem('userId', String(user.id));
    localStorage.setItem('employeeCode', user.employeeCode);
    localStorage.setItem('fullName', user.fullName);
    localStorage.setItem('email', user.email);
    localStorage.setItem('roleName', JSON.stringify(user.roleName || []));
    localStorage.setItem('isActive', String(user.isActive));
    sessionStorage.setItem('session_user', JSON.stringify({
      username: user.username,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleId: user.roleId,
      teamIds: user.teamIds,
    }));
    toast.success('Đăng nhập thành công!');
    navigate('/board');
  } catch (error: any) {
    toast.error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
  } finally {
    setIsLoading(false);
  }
};
  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="text-center">
          <img src="/assets/logo.gif" alt="Ricoh" className="h-16 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-light text-gray-900">Đăng nhập Ricoh Unified ID</h1>
          <p className="text-sm text-gray-600">Đăng nhập bằng tài khoản tổ chức của bạn</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="identifier" className="sr-only">
              Email hoặc tên đăng nhập
            </label>
            <input
              {...register('identifier')}
              id="identifier"
              type="text"
              className={`w-full px-3 py-2 border rounded-md text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.identifier ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Tên đăng nhập hoặc email"
              autoComplete="off"
              disabled={isLoading}
            />
            {errors.identifier && (
              <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Mật khẩu
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              className={`w-full px-3 py-2 border rounded-md text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Mật khẩu"
              autoComplete="off"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>
        <p className="text-xs text-gray-600 text-center leading-relaxed">
          Vui lòng đăng nhập bằng địa chỉ email hoặc tên đăng nhập của bạn. Nếu muốn chọn tổ chức khác, xóa cookie trình duyệt hoặc dùng chế độ ẩn danh.
        </p>
        <div className="text-center text-xs text-gray-500 pt-6">
          <p>© Ricoh Company Ltd.</p>
        </div>
      </div>
    </AuthLayout>
  );
}