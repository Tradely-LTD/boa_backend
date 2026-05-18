export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'super_admin' | 'centre_manager' | 'collector';
  centreId?: number;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  centreId?: number;
}
