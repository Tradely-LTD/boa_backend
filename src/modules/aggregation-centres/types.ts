export interface UpdateCentreBody {
  centreName?:  string;
  centreType?:  string;
  state?:       string;
  lga?:         string;
  address?:     string;
  capacityMt?:  number;
  managerName?:  string;
  managerPhone?: string;
  managerEmail?: string;
  status?:      'active' | 'suspended' | 'decommissioned';
}

export interface CentreFilters {
  status?: string;
  state?:  string;
  page?:   string;
  limit?:  string;
  search?: string;
}
