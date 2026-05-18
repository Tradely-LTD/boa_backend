export interface DeliveryZone {
  state:   string;
  lga?:    string;
  charge:  number;
}

export interface PackagingInfo {
  packageType:     string;   // 'PP Woven Bag' | 'Jute Sack' | 'Sisal Bag' | 'Nylon Bag' | 'Drum' | 'Bulk (Loose)'
  packageWeightKg: number;   // net weight per package, e.g. 50
  labelType:       string;   // 'BOA Label' | 'Custom Label' | 'Unlabeled'
  moqKg:           number;   // minimum order in kg; 0 = no minimum
  notes?:          string;
}

export interface CreateListingBody {
  commodity:           string;
  gradeQuality?:       string;
  description?:        string;
  quantityAvailableKg: number;
  pricePerKg:          number;
  images?:             string[];
  centreState:         string;
  centreLga?:          string;
  isReceiptBacked?:    boolean;
  expiresAt?:          string;
  deliveryAvailable?:  boolean;
  deliveryZones?:      DeliveryZone[];
  specs?:              Record<string, string>;
  packaging?:          PackagingInfo;
  bankName?:           string;
  bankAccountNumber?:  string;
  bankAccountName?:    string;
}

export interface UpdateListingBody extends Partial<CreateListingBody> {
  status?: 'active' | 'paused' | 'sold_out' | 'expired';
}

export interface ManualSaleBody {
  quantityKg:    number;
  buyerName?:    string;
  buyerPhone?:   string;
  notes?:        string;
}
