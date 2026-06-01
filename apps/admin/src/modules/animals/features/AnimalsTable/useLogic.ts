import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
} from '@tanstack/react-table';
import type { Animal } from '../../domain/types';

interface UseAnimalsTableLogicProps {
  data: Animal[];
  onEdit: (animal: Animal) => void;
  onDelete: (animal: Animal) => void;
}

export function useAnimalsTableLogic({ data, onEdit, onDelete }: UseAnimalsTableLogicProps) {
  const columns = useMemo<ColumnDef<Animal>[]>(
    () => [
      {
        accessorKey: 'sort_order',
        header: '№',
        size: 60,
      },
      {
        accessorKey: 'icon',
        header: 'Иконка',
        size: 80,
      },
      {
        accessorKey: 'name',
        header: 'Название',
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        meta: { onEdit, onDelete },
      },
    ],
    [onEdit, onDelete],
  );

  // TanStack Table's useReactTable is not compatible with React Compiler memoization rules.
  // eslint-disable-next-line react-hooks/incompatible-library -- stable table instance API
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: 'sort_order', desc: false }] },
  });

  return { table };
}
