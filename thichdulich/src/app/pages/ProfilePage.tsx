"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import api from '@/services/api';
import { getApiErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { User, Mail, Phone, Lock, Camera, Image as ImageIcon, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { TourCard } from '../components/TourCard';
import { useFavorites } from '../contexts/FavoriteContext';
import { isStrongPassword, isVietnamesePhone, normalizePhone, PASSWORD_RULE_MESSAGE, PHONE_RULE_MESSAGE } from '../utils/validation';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { favoriteTours, loading: favoritesLoading } = useFavorites();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone?: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const requestedTab = searchParams.get('tab') || 'profile';
  const profileTab = ['profile', 'favorites', 'password'].includes(requestedTab) ? requestedTab : 'profile';

  useEffect(() => {
    if (requestedTab !== profileTab) {
      setSearchParams({}, { replace: true });
    }
  }, [profileTab, requestedTab, setSearchParams]);

  const handleProfileTabChange = (value: string) => {
    setSearchParams(value === 'profile' ? {} : { tab: value });
  };

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [user]);

  const normalizedName = formData.name.trim();
  const normalizedPhone = normalizePhone(formData.phone);
  const hasProfileChanges =
    normalizedName !== (user?.name || '') ||
    normalizedPhone !== (user?.phone || '') ||
    !!avatarPreview;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode) {
      return;
    }

    if (!hasProfileChanges) {
      toast.info('Bạn chưa thay đổi thông tin nào');
      setIsEditMode(false);
      return;
    }

    const nextErrors = {
      name: normalizedName ? '' : 'Vui lòng nhập họ tên',
      phone: normalizedPhone ? '' : 'Vui lòng nhập số điện thoại',
    };
    if (normalizedPhone && !isVietnamesePhone(normalizedPhone)) {
      nextErrors.phone = PHONE_RULE_MESSAGE;
    }
    setProfileErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await updateUser({
        name: normalizedName,
        phone: normalizedPhone,
        avatar: avatarPreview || user?.avatar,
      });

      if (!updated) {
        toast.error('Không thể cập nhật thông tin cá nhân');
        return;
      }

      toast.success(t('profileUpdated'));
      setAvatarPreview(null);
      setIsEditMode(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật thông tin cá nhân'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      currentPassword: passwordData.currentPassword ? '' : 'Vui lòng nhập mật khẩu hiện tại',
      newPassword: passwordData.newPassword ? '' : 'Vui lòng nhập mật khẩu mới',
      confirmPassword: passwordData.confirmPassword ? '' : 'Vui lòng nhập xác nhận mật khẩu',
    };
    setPasswordErrors(nextErrors);

    if (nextErrors.currentPassword || nextErrors.newPassword || nextErrors.confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!passwordData.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    if (!isStrongPassword(passwordData.newPassword)) {
      setPasswordErrors(prev => ({ ...prev, newPassword: PASSWORD_RULE_MESSAGE }));
      toast.error(PASSWORD_RULE_MESSAGE);
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success(t('passwordChanged'));
      setPasswordErrors({});
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể đổi mật khẩu'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        toast.success('Đã tải ảnh lên! Nhấn Lưu để cập nhật.');
      };
      reader.readAsDataURL(file);
    }
  };

  const currentAvatar = avatarPreview || user?.avatar;

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t('myProfile')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center">
                {/* Avatar with upload */}
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto flex items-center justify-center overflow-hidden">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt={user?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {user?.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                      title="Thay đổi ảnh đại diện"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                
                <h2 className="text-xl font-semibold mb-1">{user?.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  {user?.role === 'admin' ? t('admin') : user?.role === 'provider' ? t('provider') : t('tourist')}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user?.phone}</span>
                </div>
              </div>

              {avatarPreview && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    Ảnh đại diện mới. Nhấn "Lưu" để cập nhật.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="lg:col-span-2">
            <Tabs value={profileTab} onValueChange={handleProfileTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">{t('personalInfo')}</TabsTrigger>
                <TabsTrigger value="favorites">Yêu thích</TabsTrigger>
                <TabsTrigger value="password">{t('changePassword')}</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('personalInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('fullName')}</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({ ...formData, name: e.target.value });
                              if (profileErrors.name) setProfileErrors({ ...profileErrors, name: '' });
                            }}
                            className={`pl-10 ${profileErrors.name ? 'border-red-500 bg-red-50 focus-visible:ring-red-200' : ''}`}
                            disabled={!isEditMode}
                          />
                        </div>
                        {profileErrors.name && <p className="text-xs font-semibold text-red-600">{profileErrors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            className="pl-10"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('phone')}</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData({ ...formData, phone: e.target.value });
                              if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: '' });
                            }}
                            className={`pl-10 ${profileErrors.phone ? 'border-red-500 bg-red-50 focus-visible:ring-red-200' : ''}`}
                            disabled={!isEditMode}
                          />
                        </div>
                        {profileErrors.phone && <p className="text-xs font-semibold text-red-600">{profileErrors.phone}</p>}
                      </div>

                      <div className="flex gap-3 pt-4">
                        {!isEditMode ? (
                          <Button
                            type="button"
                            onClick={() => setIsEditMode(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {t('edit')}
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={isSavingProfile || !hasProfileChanges}
                            >
                              {isSavingProfile ? 'Đang lưu...' : t('save')}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isSavingProfile}
                              onClick={() => {
                                setIsEditMode(false);
                                setAvatarPreview(null);
                                setFormData({
                                  name: user?.name || '',
                                  email: user?.email || '',
                                  phone: user?.phone || ''
                                });
                              }}
                            >
                              {t('cancel')}
                            </Button>
                          </>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Tour yêu thích
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {favoritesLoading ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                        Đang tải danh sách yêu thích...
                      </div>
                    ) : favoriteTours.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                        <Heart className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                        <h3 className="font-bold text-gray-900">Chưa có tour yêu thích</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Nhấn biểu tượng trái tim trên tour để lưu lại và xem nhanh tại đây.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2">
                        {favoriteTours.map(tour => (
                          <TourCard key={tour.id} tour={tour} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('changePassword')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <Alert>
                        <AlertDescription>
                          {t('passwordRequirement')}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="••••••••"
                            value={passwordData.currentPassword}
                            onChange={(e) => {
                              setPasswordData({ ...passwordData, currentPassword: e.target.value });
                              if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                            }}
                            className={`pl-10 ${passwordErrors.currentPassword ? 'border-red-500 bg-red-50 focus-visible:ring-red-200' : ''}`}
                          />
                        </div>
                        {passwordErrors.currentPassword && <p className="text-xs font-semibold text-red-600">{passwordErrors.currentPassword}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">{t('newPassword')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={passwordData.newPassword}
                            onChange={(e) => {
                              setPasswordData({ ...passwordData, newPassword: e.target.value });
                              if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                            }}
                            className={`pl-10 ${passwordErrors.newPassword ? 'border-red-500 bg-red-50 focus-visible:ring-red-200' : ''}`}
                          />
                        </div>
                        {passwordErrors.newPassword && <p className="text-xs font-semibold text-red-600">{passwordErrors.newPassword}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">{t('confirmPassword')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="confirmNewPassword"
                            type="password"
                            placeholder="••••••••"
                            value={passwordData.confirmPassword}
                            onChange={(e) => {
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                              if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                            }}
                            className={`pl-10 ${passwordErrors.confirmPassword ? 'border-red-500 bg-red-50 focus-visible:ring-red-200' : ''}`}
                          />
                        </div>
                        {passwordErrors.confirmPassword && <p className="text-xs font-semibold text-red-600">{passwordErrors.confirmPassword}</p>}
                      </div>

                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isChangingPassword}>
                        {isChangingPassword ? 'Đang đổi...' : t('changePassword')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
