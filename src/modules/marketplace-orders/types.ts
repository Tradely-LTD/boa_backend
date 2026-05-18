export interface CreateOrderBody {
  listingId:       number;
  quantityKg:      number;
  notes?:          string;
  deliveryType?:   'pickup' | 'delivery';
  deliveryState?:  string;
  deliveryLga?:    string;
  deliveryCharge?: number;
  paymentGateway?: 'paystack' | 'bank_transfer' | 'pos_terminal';
}

export interface UpdateOrderStatusBody {
  status: 'processing' | 'completed' | 'cancelled';
}

export interface ConfirmPosBody {
  stan: string;
  rrn:  string;
}
