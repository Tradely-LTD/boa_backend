export interface UpdateUserBody {
  name?:     string;
  email?:    string;
  role?:     'admin' | 'super_admin';
  isActive?: boolean;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword:     string;
}
