import { Check, RotateCcw } from 'lucide-react';
import type { FilterMode, FilterValues } from '../lib/filterUtils';

type FilterModalProps = {
  mode: FilterMode;
  value: FilterValues;
  onChange: (filters: FilterValues) => void;
  onClose: () => void;
  typeOptions?: string[];
};

type MenuOption = {
  label: string;
  value: string;
};

const paymentSortOptions: MenuOption[] = [
  { label: 'Recently added', value: 'recent' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Highest amount', value: 'amount_high' },
  { label: 'Lowest amount', value: 'amount_low' },
];

const catalogSortOptions: MenuOption[] = [
  { label: 'Recently added', value: 'recent' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Name', value: 'name' },
  { label: 'Highest price', value: 'price_high' },
  { label: 'Lowest price', value: 'price_low' },
];

const statusOptions: MenuOption[] = [
  { label: 'All payments', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Overdue', value: 'overdue' },
];

export function FilterModal({
  mode,
  value,
  onChange,
  onClose,
  typeOptions = [],
}: FilterModalProps) {
  const sortOptions = mode === 'payments' ? paymentSortOptions : catalogSortOptions;
  const typeFilterOptions: MenuOption[] = [
    { label: 'All types', value: 'all' },
    ...typeOptions.map((option) => ({ label: option, value: option })),
  ];
  const filterOptions = mode === 'payments' ? statusOptions : typeFilterOptions;
  const filterField: 'status' | 'type' = mode === 'payments' ? 'status' : 'type';

  const updateValue = (field: 'sortBy' | 'status' | 'type', nextValue: string) => {
    onChange({ ...value, [field]: nextValue });
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close filter menu"
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-stone-100 bg-white py-3 text-sm text-stone-800 shadow-xl">
        <div className="px-5 pb-2 text-xs font-bold text-stone-500">Sort by</div>
        <div className="space-y-1">
          {sortOptions.map((option) => {
            const isSelected = value.sortBy === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateValue('sortBy', option.value)}
                className={`flex w-full items-center justify-between gap-3 px-5 py-2 text-left text-base font-semibold transition ${
                  isSelected ? 'bg-[#FAF5F2] text-[#8B3A1C]' : 'text-stone-700 hover:bg-stone-50 hover:text-stone-950'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-5 w-5" />}
              </button>
            );
          })}
        </div>

        <div className="mt-3 px-5 pb-2 text-xs font-bold text-stone-500">
          {mode === 'payments' ? 'Payment status' : 'Product type'}
        </div>
        <div className="max-h-44 space-y-1 overflow-y-auto">
          {filterOptions.map((option) => {
            const selectedValue = value[filterField];
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateValue(filterField, option.value)}
                className={`flex w-full items-center justify-between gap-3 px-5 py-2 text-left text-base font-semibold transition ${
                  isSelected ? 'bg-[#FAF5F2] text-[#8B3A1C]' : 'text-stone-700 hover:bg-stone-50 hover:text-stone-950'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-5 w-5" />}
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={() => {
              onChange({
                ...value,
                sortBy: 'recent',
                status: 'all',
                type: 'all',
                search: '',
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
              onClose();
            }}
            className="flex w-full items-center gap-3 px-5 py-2 text-left text-base font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-[#8B3A1C]"
          >
            <RotateCcw className="h-5 w-5" />
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
