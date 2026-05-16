export type FilterMode = 'payments' | 'catalog';

export type FilterValues = {
  sortBy: string;
  search: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  priceMin: string;
  priceMax: string;
  makingCostMin: string;
  makingCostMax: string;
  quantityMin: string;
  quantityMax: string;
};

export const createEmptyFilterValues = (): FilterValues => ({
  sortBy: 'recent',
  search: '',
  status: 'all',
  type: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
  priceMin: '',
  priceMax: '',
  makingCostMin: '',
  makingCostMax: '',
  quantityMin: '',
  quantityMax: '',
});

export const countActiveFilters = (
  filters: FilterValues,
  mode: FilterMode,
  includeMakingCost = true
) => {
  const active = [
    filters.sortBy === 'recent' ? '' : filters.sortBy,
    filters.search.trim(),
    filters.dateFrom,
    filters.dateTo,
  ];

  if (mode === 'payments') {
    active.push(filters.status === 'all' ? '' : filters.status);
    active.push(filters.amountMin, filters.amountMax);
  } else {
    active.push(filters.type === 'all' ? '' : filters.type);
    active.push(filters.quantityMin, filters.quantityMax, filters.priceMin, filters.priceMax);
  }

  if (includeMakingCost) {
    active.push(filters.makingCostMin, filters.makingCostMax);
  }

  return active.filter(Boolean).length;
};
