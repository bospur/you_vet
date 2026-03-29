import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import type { Doctor } from '../../domain/types';

interface DoctorsTableProps {
  data: Doctor[];
  role: 'admin' | 'editor' | 'groomer';
  onEdit: (d: Doctor) => void;
  onDelete: (d: Doctor) => void;
  onPublish: (d: Doctor) => void;
  baseUrl: string;
}

export function DoctorsTable({ data, role, onEdit, onDelete, onPublish, baseUrl }: DoctorsTableProps) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const actions = (d: Doctor) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {role === 'admin' && (
        <Tooltip title={d.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}>
          <IconButton size="small" onClick={() => onPublish(d)}>
            {d.status === 'published' ? <UnpublishedIcon fontSize="small" /> : <PublishIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Редактировать">
        <IconButton size="small" onClick={() => onEdit(d)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {(role === 'admin' || d.status === 'draft') && (
        <Tooltip title="Удалить">
          <IconButton size="small" color="error" onClick={() => onDelete(d)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((d) => (
          <Paper key={d.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={d.photo_url ? `${baseUrl}${d.photo_url}` : undefined}
              sx={{ width: 48, height: 48, flexShrink: 0 }}
            >
              {d.full_name[0]}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography fontWeight={600} noWrap>{d.full_name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" noWrap>{d.specialty || '—'}</Typography>
                <Chip
                  size="small"
                  label={d.status === 'published' ? 'Опубликован' : 'Черновик'}
                  color={d.status === 'published' ? 'success' : 'default'}
                />
              </Box>
            </Box>
            {actions(d)}
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Фото', 'ФИО', 'Специализация', 'Статус', ''].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Avatar src={d.photo_url ? `${baseUrl}${d.photo_url}` : undefined} sx={{ width: 40, height: 40 }}>
                    {d.full_name[0]}
                  </Avatar>
                </TableCell>
                <TableCell>{d.full_name}</TableCell>
                <TableCell>{d.specialty || '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={d.status === 'published' ? 'Опубликован' : 'Черновик'}
                    color={d.status === 'published' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">{actions(d)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
