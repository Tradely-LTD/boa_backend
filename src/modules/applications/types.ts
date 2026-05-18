export interface CreateApplicationBody {
  // Identity
  centreName:   string;
  centreType:   'primary' | 'secondary' | 'collection_point';
  regNumber?:   string;
  tinNumber?:   string;
  yearEstablished?: number;

  // Ownership
  ownerName?:   string;
  ownerPhone?:  string;
  ownerNin?:    string;

  // Infrastructure
  commodities?:             string[];
  capacityMt?:              number;
  coldStorageCapacityMt?:   number;
  numBays?:                 number;
  floorAreaSqm?:            number;
  warehouseType?:           'silo' | 'shed' | 'open_yard' | 'cold_storage' | 'mixed';
  facilities?:              string[];
  powerSource?:             'grid' | 'generator' | 'solar' | 'none';
  waterSource?:             'borehole' | 'tap' | 'none';
  hasAccessRoad?:           boolean;
  warehouseReceiptCapable?: boolean;

  // Location
  address?:     string;
  state?:       string;
  lga?:         string;
  gpsLat?:      string;
  gpsLng?:      string;

  // Manager
  managerName?:  string;
  managerPhone?: string;
  managerNin?:   string;
  managerEmail?: string;

  // Banking
  bankName?:      string;
  accountNumber?: string;
  bvn?:           string;
}

export interface UpdateStatusBody {
  status:       'pending' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

export interface ApplicationFilters {
  status?: string;
  state?:  string;
  page?:   string;
  limit?:  string;
  search?: string;
}
