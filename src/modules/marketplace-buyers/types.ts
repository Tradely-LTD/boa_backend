export interface RegisterBuyerBody {
  fullName: string;
  email:    string;
  phone:    string;
  password: string;
}

export interface LoginBuyerBody {
  email:    string;
  password: string;
}

export interface BuyerJwtPayload {
  buyerId: number;
  email:   string;
}
